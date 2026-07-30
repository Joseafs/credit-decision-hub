# Project Tasks

## 1. Propósito

Este documento é o router operacional do **Credit Decision Hub**. Ele informa o que está ativo, o que vem depois e quais entregas foram confirmadas.

As decisões de produto pertencem ao [`README.md`](./README.md). As decisões técnicas pertencem ao [`SDD.md`](./SDD.md).

## 2. Regras operacionais

1. Deve existir no máximo uma tarefa `ACTIVE`.
2. A expressão “próximo” significa continuar a tarefa `ACTIVE`; se ela estiver concluída, promover a primeira tarefa `NEXT`.
3. Executar uma tarefa por commit.
4. Usar Conventional Commits em PT-BR, com corpo que explique as mudanças relevantes.
5. Não implementar itens `PLANNED` enquanto houver uma tarefa anterior ativa.
6. Não promover tarefa bloqueada sem registrar a decisão ou dependência que a desbloqueia.
7. Marcar como `DONE` somente com evidência confirmada por comandos, testes ou inspeção do comportamento.
8. Atualizar este router no mesmo commit que conclui ou reorganiza uma tarefa.
9. Não fazer push sem solicitação explícita.
10. Preservar o escopo das fases definido no `README.md`.

## 3. Estados

| Estado | Significado |
| --- | --- |
| `ACTIVE` | Única tarefa autorizada para implementação |
| `NEXT` | Próxima tarefa após a conclusão da ativa |
| `PLANNED` | Trabalho futuro, ainda fora do escopo |
| `BLOCKED` | Depende de decisão ou condição externa registrada |
| `DONE` | Concluída e acompanhada de evidência |

## 4. Router atual

| Ordem | ID | Fase | Estado | Entrega |
| --- | --- | --- | --- | --- |
| 1 | `CDH-017` | Complemento | `ACTIVE` | Demonstrar Terraform sobre a infraestrutura existente |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

`CDH-016` foi priorizada e concluída por solicitação explícita para estabelecer o design system durante a Fase 3. A ordem e os identificadores das tarefas já planejadas foram preservados.

## 5. Registros detalhados recentes

### `CDH-014` — Etapa analítica com Databricks

Entregas:

- [x] definir o contrato versionado de exportação do dataset fictício;
- [x] criar o comando local, reproduzível e validado de exportação em NDJSON;
- [x] confirmar duas exportações reais e idênticas das 1.000 propostas do Atlas;
- [x] enviar manualmente o NDJSON ao volume `workspace.credit_decision_hub.analytics_raw`;
- [x] criar o processamento PySpark e as tabelas Delta;
- [x] gerar KPIs, distribuições e evolução mensal;
- [x] integrar resultados analíticos somente depois de definir o contrato de consumo pela aplicação.

Evidência da primeira subetapa:

- `pnpm analytics:export` gera `artifacts/analytics/proposals.ndjson`;
- 1.000 linhas reais foram validadas individualmente pelo contrato Zod;
- duas exportações produziram o mesmo SHA-256:
  `ec97c490f1bbc34d0ceb5126d316dd979d4fe1f7a8f103e02cf81d166063b5f9`;
- dados pessoais diretos e metadados internos não fazem parte do contrato;
- `lint`, `typecheck`, 168 testes e `build` foram aprovados.

Comandos executados:

- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `pnpm analytics:export`, incluindo duas saídas independentes para comparação.

Testes adicionados:

- quatro casos do contrato analítico: linha válida, propriedades extras e dados
  pessoais, enums canônicos e renda zero;
- sete casos do exportador: NDJSON e contagem, conteúdo reproduzível, ordenação
  no MongoDB, fechamento no sucesso, falhas de leitura e escrita com limpeza e
  rejeição de linha inválida.

Evidência da segunda subetapa:

- upload manual confirmado em
  `/Volumes/workspace/credit_decision_hub/analytics_raw/proposals.ndjson`;
- notebook source-format importado e executado no Databricks Serverless;
- validação de JSON, chaves, schema, limites, enums e unicidade antes da
  materialização;
- tabelas Bronze e Silver com as 1.000 propostas da carga;
- tabelas Gold para KPIs gerais, 13 distribuições categóricas e 13 competências
  mensais;
- total de 1.000 propostas, 200 aprovadas e taxa de aprovação de 20%;
- incompatibilidade de `cache()/persist()` com Serverless identificada na
  execução real e removida sem adicionar dependências.

Validação da segunda subetapa:

- compilação sintática do notebook com Python;
- execução completa confirmada no Databricks Serverless;
- nenhuma credencial, output do notebook ou dado analítico versionado.

Evidência da terceira subetapa:

- contrato `analyticsSummarySchema` compartilhado entre API e front-end;
- endpoint autenticado `GET /analytics/summary`;
- consulta somente de leitura à tabela Gold pela Statement Execution API;
- token restrito ao ambiente da API e configuração validada como conjunto;
- estados independentes para dashboard operacional e seção analítica;
- smoke test real com 1.000 propostas, 200 aprovadas, taxa de 20%, valor total
  de 70.816.365,76, valor médio de 70.816,37 e comprometimento médio de 11,09%;
- `pnpm analytics:check` reproduz a validação sem iniciar servidor ou imprimir
  credenciais.

Validação da terceira subetapa:

- contratos: 33 testes aprovados;
- API: 98 testes aprovados;
- web: 43 testes aprovados;
- pacote de UI: 5 testes aprovados;
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` aprovados.

## 6. Tarefa ativa

### `CDH-017` — Terraform como complemento de infraestrutura

Objetivo:

Demonstrar, depois da conclusão funcional da POC, como Terraform descreve
infraestrutura, associa código a recursos existentes, antecipa mudanças por
meio do plano e identifica drift. A tarefa não faz parte do caminho necessário
para executar ou apresentar a aplicação.

Escopo:

- projeto do front-end na Vercel;
- recursos compatíveis do projeto existente no MongoDB Atlas;
- providers e versões fixados;
- variáveis tipadas, sensíveis quando aplicável, e outputs úteis;
- arquivos de state e planos protegidos contra versionamento;
- importação dos recursos existentes;
- validação estática e plano real revisado.

Fora do escopo:

- recriar a POC em uma nova conta;
- mover segredos para o código ou para arquivos versionados;
- substituir o `render.yaml`;
- controlar o mesmo serviço do Render por Blueprint e Terraform;
- executar `apply` destrutivo;
- adicionar Terraform ao fluxo de inicialização local da aplicação;
- automatizar `apply` pela CI nesta primeira adoção.

Entregas:

- [ ] definir a matriz de propriedade entre Terraform, Blueprint e painéis;
- [ ] criar `infrastructure/terraform` sem novos arquivos Markdown;
- [ ] configurar e fixar as versões do Terraform e dos providers;
- [ ] modelar Vercel e Atlas sem duplicar segredos;
- [ ] fornecer exemplo seguro de variáveis locais;
- [ ] ignorar state, planos e arquivos locais sensíveis;
- [ ] executar `terraform fmt -check`;
- [ ] executar `terraform init` e `terraform validate`;
- [ ] importar os recursos existentes de forma controlada;
- [ ] executar e revisar um `terraform plan` real sem destruição ou recriação
  não intencional;
- [ ] registrar no SDD o que o exercício demonstrou e seus limites.

Critérios de conclusão:

- a configuração é legível, pequena e separada por responsabilidade;
- nenhuma credencial ou state é versionado;
- o plano associa código aos recursos reais existentes;
- nenhuma alteração destrutiva é aplicada;
- os gates do monorepo continuam aprovados;
- comandos e evidências reais são registrados neste router.

Pré-requisitos externos para a validação real:

- Terraform CLI instalado localmente;
- token da Vercel configurado somente no ambiente local;
- credencial de Service Account do Atlas configurada somente no ambiente local;
- identificadores dos projetos e recursos existentes.

## 7. Tarefa concluída mais recente

### `CDH-015` — Infraestrutura, CI/CD e deploy

Entregas:

- [x] preparar URL pública, CORS restrito e cookie seguro para a comunicação
  entre Vercel e Render;
- [x] versionar o workflow de validações automatizadas no GitHub;
- [x] confirmar a primeira execução verde no GitHub Actions;
- [x] preparar Vercel, Render e MongoDB Atlas conforme a arquitetura aprovada;
- [x] validar os deploys e o estado de inicialização da demonstração;
- [x] avaliar Terraform para os recursos suportados pelos provedores escolhidos.

Evidência da primeira subetapa:

- `VITE_API_URL` validada e resolvida em uma única fronteira do front-end;
- desenvolvimento preservado pelo proxy `/api` do Vite;
- requisições autenticadas usando `credentials: "include"`;
- `WEB_ORIGIN` validada como origem exata e CORS com credenciais;
- cookie local `SameSite=Lax` e cookie hospedado `SameSite=None; Secure`;
- Docker avaliado e dispensado por não existir necessidade no runtime nativo
  da Vercel ou do Render;
- 102 testes da API e 46 testes do front-end aprovados na validação focada;
- `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, 186 testes e
  `pnpm build` com `VITE_API_URL` de produção aprovados;
- origem pública confirmada no bundle estático gerado pelo Vite.

Evidência da segunda subetapa:

- workflow acionado por pull requests e pushes na `main`;
- actions fixadas por SHA completo e token limitado a `contents: read`;
- pnpm obtido de `packageManager`, Node.js 22 e cache pelo lockfile;
- instalação congelada, lint, tipos, testes e build executados em um único job;
- concorrência cancelável, timeout de 15 minutos e nenhuma etapa de deploy;
- YAML validado localmente e 186 testes aprovados;
- execução `#1` confirmada no GitHub Actions após o push do commit `e9416de`;
- job completo concluído com status `Success` em 1 minuto e 4 segundos;
- relatórios confirmaram 48 arquivos de teste e 186 testes aprovados nos quatro
  workspaces testados.

Preparação da terceira subetapa:

- Blueprint do Render versionado na raiz do monorepo;
- API configurada como Web Service Node.js no plano Free, sem Docker;
- build executado da raiz para preservar acesso aos pacotes compartilhados;
- deploy automático condicionado aos checks aprovados no GitHub;
- `/health` definido como health check;
- segredos ausentes do Git, com JWT gerado pelo Render e credenciais externas
  solicitadas somente no primeiro cadastro;
- `WEB_ORIGIN` postergada até a Vercel fornecer a origem pública real;
- instalação congelada e build filtrado da API aprovados com Node.js 22 e pnpm
  10;
- artefato compilado iniciado localmente pelo comando de produção e `/health`
  confirmado com status `200` e o contrato esperado;
- `lint`, `typecheck`, 186 testes e build completo aprovados.

Evidência do deploy da API:

- Blueprint sincronizado no Render a partir do commit `bb43d2a`;
- build hospedado concluiu a compilação da API e de `packages/contracts`;
- primeira inicialização identificou corretamente o bloqueio de rede do Atlas;
- intervalos de saída do serviço foram autorizados no Atlas sem liberar acesso
  irrestrito;
- Web Service iniciou com o comando de produção e conectou ao MongoDB;
- `GET https://credit-decision-api.onrender.com/health` respondeu `200` com
  `{"status":"ok","service":"credit-decision-api"}`.

Preparação da Vercel:

- `apps/web` definido como raiz esperada do projeto Vite no monorepo;
- fallback da SPA versionado para preservar rotas diretas do React Router;
- `VITE_API_URL` incluída no hash específico do build do web;
- Vitest isolado de uma `VITE_API_URL` herdada para preservar expectativas do
  proxy local;
- origem pública do Render definida como valor esperado na Vercel;
- nenhuma dependência ou função serverless adicionada;
- `WEB_ORIGIN` permanece pendente até existir uma URL pública real da Vercel;
- build filtrado confirmou a origem do Render no bundle e no hash do
  Turborepo;
- suíte completa permaneceu determinística mesmo herdando a variável de
  produção;
- `lint`, `typecheck`, 186 testes e build completo aprovados.

Evidência do deploy completo:

- front-end público em `https://credit-decision-hub-web.vercel.app`;
- página inicial, `/login` e `/customers` responderam `200` em acesso direto;
- API pública em `https://credit-decision-api.onrender.com`;
- `GET /health` respondeu `200` com o contrato compartilhado esperado;
- preflight respondeu `204` com a origem exata da Vercel e credenciais
  habilitadas;
- login hospedado confirmado pelo usuário, validando cookie, CORS, API e Atlas
  no fluxo real;
- carregamento prolongado agora informa que a API de demonstração pode estar
  iniciando, em PT-BR e inglês;
- comportamento de cold start coberto por teste com temporizador controlado.

Avaliação do Terraform:

- Render, Vercel e MongoDB Atlas possuem providers compatíveis;
- o Blueprint do Render permanece como fonte declarativa recomendada para o
  único serviço da plataforma;
- Vercel e Atlas permanecem conectados e administrados pelos respectivos
  painéis, preservando os recursos existentes;
- Terraform foi dispensado nesta POC para evitar dupla propriedade, estado
  local com dados sensíveis e risco de recriação de recursos com dados;
- adoção futura exige importação controlada, estado remoto protegido e revisão
  do `plan` antes de qualquer alteração.

## 8. Entregas concluídas

| ID | Entrega | Commit | Evidência |
| --- | --- | --- | --- |
| `CDH-001` | Fundação do monorepo | `723929e` | `lint`, `typecheck`, `test`, `build` e execução conjunta pelo Turborepo |
| `CDH-002` | Conexão com MongoDB Atlas | `eeaae88` | configuração validada, testes automatizados e conexão real confirmada |
| `CDH-003` | Módulo de clientes | `25a797d` | contratos, service, repository, rotas, 28 testes e smoke test de listagem no Atlas |
| `CDH-004` | Regras objetivas de propostas | `docs: definir regras de decisão de propostas` | limites, precedência, fronteiras, histórico e evolução de juros aprovados |
| `CDH-005` | Contratos e persistência de propostas | `feat(api): criar contratos e persistência de propostas` | 43 testes, contratos estritos, histórico coerente, model validado e gates aprovados |
| `CDH-006` | Motor e endpoints de propostas | `feat(api): implementar fluxo automático de propostas (CDH-006)` | 75 testes, precedência completa, `Fastify.inject()`, gates e smoke test read-only no Atlas |
| `CDH-007` | Seed fictício | `feat(api): criar seed fictício e seguro (CDH-007)` | 88 testes, 500 clientes, 1.000 propostas, cinco cenários, reexecução idempotente e validação real no Atlas |
| `CDH-008` | Swagger / OpenAPI | `feat(api): documentar endpoints com OpenAPI (CDH-008)` | 94 testes, sete operações documentadas, Swagger UI validado no navegador e gates aprovados |
| `CDH-009` | Fluxo front-end de clientes | `feat(web): implementar fluxo de clientes (CDH-009)` | 108 testes, cadastro, listagem, detalhe, paginação, temas, dois idiomas, acesso direto e integração real validados |
| `CDH-010` | Fluxo front-end de propostas | `feat(web): implementar fluxo de propostas (CDH-010)` | 122 testes, criação, listagem, detalhe, histórico, paginação, dois idiomas, temas e integração read-only com o Atlas validados |
| `CDH-011` | Filtros e estados de navegação | `feat(web): implementar filtros de propostas (CDH-011)` | 132 testes, parâmetros compartilhados, URL navegável, paginação preservada, estados vazios e inspeção real em dois idiomas e temas |
| `CDH-012` | Autenticação e permissões | `feat(auth): implementar autenticação e permissões (CDH-012)` | 144 testes, JWT HttpOnly, scrypt, papéis, bootstrap, rotas protegidas, gestão de analistas e decisões manuais validados |
| `CDH-013` | Dashboard e auditoria | `feat(dashboard): implementar indicadores e auditoria (CDH-013)` | 157 testes, agregações sobre 1.000 propostas no Atlas, visão por papel, auditoria paginada, contratos estritos e gates aprovados |
| `CDH-014` | Etapa analítica com Databricks | `feat(analytics): integrar resultados ao dashboard (CDH-014)` | exportação reproduzível, notebook PySpark, tabelas Delta, endpoint protegido, 179 testes e smoke test real aprovados |
| `CDH-015` | Infraestrutura, CI/CD e deploy | `feat(infra): concluir deploy demonstrativo (CDH-015)` | GitHub Actions verde, Vercel, Render e Atlas integrados, login hospedado, cold start tratado e Terraform avaliado |
| `CDH-016` | Design system e Storybook | `feat(ui): criar design system com Storybook (CDH-016)` | 127 testes, três componentes compartilhados, temas centralizados, catálogo estático e inspeção visual aprovados |

## 9. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-015`;
- tarefa ativa: `CDH-017`;
- subetapas concluídas: prontidão cross-origin, workflow de qualidade, deploy
  da API no Render, deploy do front-end na Vercel, integração com Atlas,
  validação autenticada, tratamento do cold start e avaliação do Terraform;
- próxima ação: criar a configuração Terraform complementar e validar sua
  estrutura antes de solicitar credenciais;
- bloqueio para a configuração estática: nenhum;
- dependências da validação real: Terraform CLI e credenciais locais da Vercel
  e do Atlas;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
