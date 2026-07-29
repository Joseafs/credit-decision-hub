# Databricks notebook source
# MAGIC %md
# MAGIC # Credit Decision Hub — processamento analítico de propostas
# MAGIC
# MAGIC Este notebook lê o contrato analítico `v1` enviado ao Unity Catalog
# MAGIC Volume, valida a qualidade do dataset e materializa tabelas Delta
# MAGIC gerenciadas nas camadas Bronze, Silver e Gold.
# MAGIC
# MAGIC O MongoDB continua sendo a fonte operacional. As tabelas criadas aqui são
# MAGIC exclusivamente analíticas e usam somente dados fictícios.

# COMMAND ----------

from functools import reduce

from pyspark.sql import Column, DataFrame, Window
from pyspark.sql import functions as F
from pyspark.sql import types as T

CATALOG = "workspace"
SCHEMA = "credit_decision_hub"
INPUT_PATH = (
    "/Volumes/workspace/credit_decision_hub/analytics_raw/proposals.ndjson"
)
EXPORT_VERSION = "1"

BRONZE_TABLE = f"{CATALOG}.{SCHEMA}.analytics_proposals_bronze"
SILVER_TABLE = f"{CATALOG}.{SCHEMA}.analytics_proposals_silver"
KPI_TABLE = f"{CATALOG}.{SCHEMA}.analytics_proposal_kpis"
DISTRIBUTION_TABLE = (
    f"{CATALOG}.{SCHEMA}.analytics_proposal_distribution"
)
MONTHLY_TABLE = f"{CATALOG}.{SCHEMA}.analytics_proposal_monthly"

EXPECTED_FIELDS = (
    "exportVersion",
    "proposalId",
    "customerId",
    "createdAt",
    "updatedAt",
    "requestedAmount",
    "installments",
    "estimatedInstallment",
    "monthlyIncome",
    "occupation",
    "score",
    "incomeCommitment",
    "risk",
    "status",
    "decisionReason",
)

RISK_VALUES = ("low", "medium", "high")
STATUS_VALUES = (
    "pending",
    "approved",
    "rejected",
    "manual_review",
    "pending_documents",
    "fraud_suspected",
)
DECISION_REASON_VALUES = (
    "proposal_created",
    "fraud_signal_detected",
    "documents_incomplete",
    "income_unavailable",
    "high_risk",
    "high_amount",
    "medium_risk",
    "eligible",
    "manual_approval",
    "manual_rejection",
    "manual_review_requested",
)

raw_schema = T.StructType(
    [
        T.StructField("exportVersion", T.StringType(), False),
        T.StructField("proposalId", T.StringType(), False),
        T.StructField("customerId", T.StringType(), False),
        T.StructField("createdAt", T.StringType(), False),
        T.StructField("updatedAt", T.StringType(), False),
        T.StructField("requestedAmount", T.DoubleType(), False),
        T.StructField("installments", T.IntegerType(), False),
        T.StructField("estimatedInstallment", T.DoubleType(), False),
        T.StructField("monthlyIncome", T.DoubleType(), False),
        T.StructField("occupation", T.StringType(), False),
        T.StructField("score", T.IntegerType(), False),
        T.StructField("incomeCommitment", T.DoubleType(), True),
        T.StructField("risk", T.StringType(), False),
        T.StructField("status", T.StringType(), False),
        T.StructField("decisionReason", T.StringType(), False),
    ]
)

# COMMAND ----------
# MAGIC %md
# MAGIC ## 1. Leitura e validação das chaves do contrato
# MAGIC
# MAGIC A leitura começa como texto para verificar JSON inválido, propriedades
# MAGIC ausentes e propriedades inesperadas antes de aplicar o schema tipado.

# COMMAND ----------


def require_quality(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(f"Falha de qualidade: {message}")


def count_where(dataframe: DataFrame, condition: Column) -> int:
    return dataframe.filter(condition).count()


raw_lines = (
    spark.read.text(INPUT_PATH)
    .filter(F.length(F.trim(F.col("value"))) > 0)
)

record_count = raw_lines.count()
require_quality(record_count > 0, "o arquivo não possui registros")

json_map_schema = T.MapType(T.StringType(), T.StringType(), True)
expected_keys = F.array(*[F.lit(field) for field in EXPECTED_FIELDS])

raw_with_keys = raw_lines.withColumn(
    "_json_map",
    F.from_json(F.col("value"), json_map_schema),
)

key_quality = (
    raw_with_keys.select(
        F.sum(F.col("_json_map").isNull().cast("long")).alias(
            "invalid_json"
        ),
        F.sum(
            (
                F.size(
                    F.array_except(
                        F.map_keys(F.col("_json_map")),
                        expected_keys,
                    )
                )
                > 0
            ).cast("long")
        ).alias("unexpected_fields"),
        F.sum(
            (
                F.size(
                    F.array_except(
                        expected_keys,
                        F.map_keys(F.col("_json_map")),
                    )
                )
                > 0
            ).cast("long")
        ).alias("missing_fields"),
    )
    .first()
    .asDict()
)

require_quality(key_quality["invalid_json"] == 0, "há JSON inválido")
require_quality(
    key_quality["unexpected_fields"] == 0,
    "há propriedades fora do contrato v1",
)
require_quality(
    key_quality["missing_fields"] == 0,
    "há propriedades obrigatórias ausentes",
)

# COMMAND ----------
# MAGIC %md
# MAGIC ## 2. Bronze — contrato v1 tipado
# MAGIC
# MAGIC A camada Bronze preserva os nomes e valores recebidos no NDJSON. Antes da
# MAGIC escrita, todas as invariantes estruturais do contrato são verificadas.

# COMMAND ----------

bronze = (
    raw_lines.select(
        F.from_json(
            F.col("value"),
            raw_schema,
            {"mode": "FAILFAST"},
        ).alias("proposal")
    )
    .select("proposal.*")
)

required_columns = [
    field.name for field in raw_schema.fields if not field.nullable
]
has_required_null = reduce(
    lambda current, column: current | F.col(column).isNull(),
    required_columns[1:],
    F.col(required_columns[0]).isNull(),
)

created_at = F.to_timestamp(F.col("createdAt"))
updated_at = F.to_timestamp(F.col("updatedAt"))
object_id_pattern = r"^[a-fA-F0-9]{24}$"

quality_rules = {
    "campos obrigatórios nulos": has_required_null,
    "versão de exportação incompatível": F.col("exportVersion")
    != EXPORT_VERSION,
    "proposalId inválido": ~F.col("proposalId").rlike(object_id_pattern),
    "customerId inválido": ~F.col("customerId").rlike(object_id_pattern),
    "createdAt inválido": created_at.isNull(),
    "updatedAt inválido": updated_at.isNull(),
    "updatedAt anterior a createdAt": updated_at < created_at,
    "valor solicitado inválido": F.col("requestedAmount") <= 0,
    "quantidade de parcelas inválida": ~F.col("installments").between(1, 60),
    "parcela estimada inválida": F.col("estimatedInstallment") <= 0,
    "renda mensal inválida": F.col("monthlyIncome") < 0,
    "score inválido": ~F.col("score").between(0, 1000),
    "comprometimento de renda inválido": F.col("incomeCommitment") < 0,
    "comprometimento presente com renda zero": (
        (F.col("monthlyIncome") == 0)
        & F.col("incomeCommitment").isNotNull()
    ),
    "ocupação vazia": F.length(F.trim(F.col("occupation"))) == 0,
    "ocupação acima de 100 caracteres": F.length(F.col("occupation")) > 100,
    "risco desconhecido": ~F.col("risk").isin(*RISK_VALUES),
    "status desconhecido": ~F.col("status").isin(*STATUS_VALUES),
    "motivo desconhecido": ~F.col("decisionReason").isin(
        *DECISION_REASON_VALUES
    ),
}

for description, invalid_condition in quality_rules.items():
    invalid_count = count_where(bronze, invalid_condition)
    require_quality(invalid_count == 0, f"{description}: {invalid_count}")

duplicate_proposal_count = (
    bronze.groupBy("proposalId")
    .count()
    .filter(F.col("count") > 1)
    .count()
)
require_quality(
    duplicate_proposal_count == 0,
    f"proposalId duplicado: {duplicate_proposal_count}",
)

bronze_count = bronze.count()
require_quality(
    bronze_count == record_count,
    "a quantidade tipada diverge da quantidade de linhas",
)

# COMMAND ----------


def overwrite_delta_table(
    dataframe: DataFrame,
    table_name: str,
) -> None:
    (
        dataframe.write.format("delta")
        .mode("overwrite")
        .option("overwriteSchema", "true")
        .saveAsTable(table_name)
    )


overwrite_delta_table(bronze, BRONZE_TABLE)

# COMMAND ----------
# MAGIC %md
# MAGIC ## 3. Silver — modelo analítico normalizado
# MAGIC
# MAGIC A camada Silver usa `snake_case`, converte datas e acrescenta apenas a
# MAGIC competência mensal necessária às agregações.

# COMMAND ----------

silver = bronze.select(
    F.col("exportVersion").alias("export_version"),
    F.col("proposalId").alias("proposal_id"),
    F.col("customerId").alias("customer_id"),
    created_at.alias("created_at"),
    updated_at.alias("updated_at"),
    F.to_date(F.date_trunc("month", created_at)).alias("proposal_month"),
    F.col("requestedAmount").alias("requested_amount"),
    F.col("installments"),
    F.col("estimatedInstallment").alias("estimated_installment"),
    F.col("monthlyIncome").alias("monthly_income"),
    F.col("occupation"),
    F.col("score"),
    F.col("incomeCommitment").alias("income_commitment"),
    F.col("risk"),
    F.col("status"),
    F.col("decisionReason").alias("decision_reason"),
)

overwrite_delta_table(silver, SILVER_TABLE)

# COMMAND ----------
# MAGIC %md
# MAGIC ## 4. Gold — indicadores analíticos
# MAGIC
# MAGIC As tabelas Gold apresentam KPIs gerais, distribuições categóricas e
# MAGIC evolução mensal. Percentuais são expressos de `0` a `100`.

# COMMAND ----------

kpis = (
    silver.agg(
        F.count("*").alias("total_proposals"),
        F.sum(
            F.when(F.col("status") == "approved", 1).otherwise(0)
        ).alias("approved_proposals"),
        F.round(F.sum("requested_amount"), 2).alias(
            "total_requested_amount"
        ),
        F.round(F.avg("requested_amount"), 2).alias(
            "average_requested_amount"
        ),
        F.round(F.avg("income_commitment"), 2).alias(
            "average_income_commitment"
        ),
    )
    .withColumn(
        "approval_rate",
        F.round(
            F.col("approved_proposals")
            / F.col("total_proposals")
            * 100,
            2,
        ),
    )
    .select(
        "total_proposals",
        "approved_proposals",
        "approval_rate",
        "total_requested_amount",
        "average_requested_amount",
        "average_income_commitment",
    )
)


def create_distribution(
    dataframe: DataFrame,
    dimension: str,
    source_column: str,
) -> DataFrame:
    dimension_window = Window.partitionBy()

    return (
        dataframe.groupBy(
            F.col(source_column).alias("dimension_value")
        )
        .agg(F.count("*").alias("proposal_count"))
        .withColumn(
            "share_percentage",
            F.round(
                F.col("proposal_count")
                / F.sum("proposal_count").over(dimension_window)
                * 100,
                2,
            ),
        )
        .withColumn("dimension", F.lit(dimension))
        .select(
            "dimension",
            "dimension_value",
            "proposal_count",
            "share_percentage",
        )
    )


distribution = (
    create_distribution(silver, "risk", "risk")
    .unionByName(create_distribution(silver, "status", "status"))
    .unionByName(
        create_distribution(
            silver,
            "decision_reason",
            "decision_reason",
        )
    )
)

monthly = (
    silver.groupBy("proposal_month")
    .agg(
        F.count("*").alias("total_proposals"),
        F.sum(
            F.when(F.col("status") == "approved", 1).otherwise(0)
        ).alias("approved_proposals"),
        F.round(F.sum("requested_amount"), 2).alias(
            "total_requested_amount"
        ),
        F.round(F.avg("requested_amount"), 2).alias(
            "average_requested_amount"
        ),
    )
    .withColumn(
        "approval_rate",
        F.round(
            F.col("approved_proposals")
            / F.col("total_proposals")
            * 100,
            2,
        ),
    )
    .select(
        "proposal_month",
        "total_proposals",
        "approved_proposals",
        "approval_rate",
        "total_requested_amount",
        "average_requested_amount",
    )
    .orderBy("proposal_month")
)

overwrite_delta_table(kpis, KPI_TABLE)
overwrite_delta_table(distribution, DISTRIBUTION_TABLE)
overwrite_delta_table(monthly, MONTHLY_TABLE)

# COMMAND ----------
# MAGIC %md
# MAGIC ## 5. Evidência da execução
# MAGIC
# MAGIC A última célula apresenta a contagem materializada em cada camada e os
# MAGIC KPIs gerais. Ela não altera o dashboard da aplicação.

# COMMAND ----------

materialized_tables = (
    BRONZE_TABLE,
    SILVER_TABLE,
    KPI_TABLE,
    DISTRIBUTION_TABLE,
    MONTHLY_TABLE,
)

table_counts = [
    (table_name, spark.table(table_name).count())
    for table_name in materialized_tables
]

display(
    spark.createDataFrame(
        table_counts,
        schema="table_name string, record_count long",
    )
)
display(spark.table(KPI_TABLE))
