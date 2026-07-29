# Software Design Document

## 1. Propósito

Este documento descreve como o **Credit Decision Hub** é construído e quais decisões técnicas orientam sua evolução.

Ele complementa:

- o [`README.md`](./README.md), fonte das decisões de produto, domínio, stack e fases;
- o [`PROJECT-TASKS.md`](./PROJECT-TASKS.md), fonte do estado operacional e da ordem de execução.

Este SDD registra somente o que já foi decidido ou implementado. Uma ideia futura não deve ser apresentada como arquitetura atual.

Neste arquivo, SDD significa **Software Design Document**. O fluxo formado por especificação, tarefa, implementação e evidência também adota uma abordagem de **Spec-Driven Development**: decisões relevantes são explicitadas e aprovadas antes do código.

## 2. Estado atual

Data de referência: 29 de julho de 2026.

Implementado:

- fundação do monorepo;
- aplicação React com integração ao `GET /health`;
- API Fastify;
- contratos compartilhados de health e clientes;
- conexão configurável com MongoDB Atlas;
- criação, listagem paginada e consulta de clientes;
- contratos compartilhados e persistência de propostas;
- motor de decisão, criação, listagem e consulta de propostas;
- seed fictício de clientes e propostas;
- documentação OpenAPI navegável;
- fluxo front-end de criação, listagem paginada e consulta de clientes;
- fluxo front-end de criação, listagem paginada e consulta de propostas;
- biblioteca de componentes genéricos e catálogo Storybook;
- filtros de propostas e paginação de listagens sincronizados com a URL;
- temas claro e escuro e interface em PT-BR e inglês.

Em execução:

- definição de autenticação e permissões.

Não implementado:

- autenticação;
- dashboard;
- Databricks;
- infraestrutura e CI/CD.

## 3. Visão da arquitetura

```mermaid
flowchart LR
  Browser["Navegador"] --> Web["apps/web<br/>React + Vite"]
  Web --> Api["apps/api<br/>Fastify"]
  Api --> Mongo["MongoDB Atlas"]
  Contracts["packages/contracts<br/>Zod + tipos inferidos"] --> Web
  Contracts --> Api
  Ui["packages/ui<br/>componentes + tema"] --> Web
  Ui --> Storybook["apps/storybook<br/>catálogo visual"]
```

O front-end acessa dados apenas pela API. O pacote de contratos é reutilizado pelos dois lados e não conhece detalhes de interface, Fastify, Mongoose ou banco de dados.

## 4. Organização do monorepo

### `apps/web`

Responsável por:

- rotas e interface;
- estado e validação de formulários;
- consumo da API;
- feedback de carregamento, sucesso e erro;
- testes de comportamento da interface.

### `apps/api`

Responsável por:

- configuração do Fastify;
- endpoints HTTP;
- regras de negócio;
- persistência no MongoDB;
- configuração do ambiente;
- testes de services e endpoints.

### `packages/contracts`

Responsável por:

- schemas Zod de entrada e saída;
- parâmetros de rota e query;
- enums compartilhados;
- tipos TypeScript inferidos com `z.infer`.

Um tipo de contrato não deve ser escrito manualmente em outra aplicação.

### `packages/ui`

Responsável por:

- componentes React genéricos;
- tipos públicos das propriedades;
- tokens semânticos e paletas dos temas;
- testes de comportamento dos componentes.

Não depende de contratos, API, Router ou domínios da aplicação.

### `apps/storybook`

Responsável por:

- documentar os componentes exportados por `packages/ui`;
- demonstrar variantes e estados isolados;
- permitir inspeção nos temas claro e escuro;
- gerar um catálogo estático pelo build do monorepo.

O Storybook é uma aplicação consumidora. Componentes não são implementados dentro dela.

### Pacotes de configuração

- `packages/typescript-config` centraliza configurações TypeScript;
- `packages/eslint-config` centraliza regras do ESLint;
- Turborepo coordena `dev`, `build`, `test`, `lint` e `typecheck`.

## 5. Fluxo do back-end

Para módulos com regra de negócio e persistência, o fluxo adotado é:

```mermaid
flowchart LR
  Request["Requisição HTTP"] --> Route["Route"]
  Route --> Contract["Schema Zod"]
  Route --> Service["Service"]
  Service --> Repository["Repository"]
  Repository --> Model["Model Mongoose"]
  Model --> Database["MongoDB"]
```

Responsabilidades:

- **route:** valida o contrato HTTP, traduz erros conhecidos e monta a resposta;
- **service:** aplica regras de negócio sem depender diretamente do Mongoose;
- **repository:** consulta e persiste dados, convertendo documentos para contratos da aplicação;
- **model:** define a forma de persistência e os índices da collection.

Controller separado só deve existir quando houver responsabilidade própria. Para uma simples delegação entre route e service, ele adicionaria uma camada sem comportamento.

O service recebe o repository por dependência, permitindo testes isolados e mantendo a regra de negócio desacoplada da persistência.

## 6. Contratos e persistência

Zod e Mongoose têm responsabilidades diferentes:

- Zod é a fonte do contrato da aplicação e dos tipos compartilhados;
- Mongoose define o documento persistido, restrições e consultas do MongoDB.

O repository faz a conversão explícita entre essas fronteiras e valida sua saída com o schema compartilhado quando necessário. Essa duplicação estrutural entre contrato e persistência é intencional: cada camada protege uma fronteira diferente.

Regras:

- inferir tipos de contratos com `z.infer`;
- não usar `any`;
- normalizar dados na entrada quando isso fizer parte do contrato;
- nunca expor documentos Mongoose diretamente;
- respostas externas devem respeitar os contratos compartilhados.

## 7. Inicialização da API

O processo de inicialização segue esta ordem:

1. criar a instância Fastify;
2. carregar `.env` e `.env.local`, quando existirem;
3. validar as variáveis com Zod;
4. configurar servidores DNS opcionais;
5. conectar ao MongoDB;
6. iniciar o servidor HTTP.

`app.ts` constrói a aplicação sem abrir porta ou conectar ao banco. `server.ts` coordena recursos externos. Essa separação permite testar endpoints com `Fastify.inject()` sem subir servidor real.

Configuração atual:

- `PORT`, padrão `3333`;
- `MONGODB_URI`, obrigatória;
- `MONGODB_DATABASE`, padrão `credit-decision-hub`;
- `MONGODB_DNS_SERVERS`, opcional e destinado a ambientes com problema de resolução DNS.

Segredos ficam somente em arquivos locais ignorados pelo Git. O repositório contém apenas `.env.example`.

## 8. Módulo de clientes

### Contratos

Campos atuais:

- `id`;
- `name`;
- `document`;
- `email`;
- `phone`;
- `monthlyIncome`;
- `occupation`;
- `createdAt`.

Documento e e-mail são únicos na persistência. A entrada é normalizada pelo schema Zod.

### Endpoints

| Método | Rota | Comportamento |
| --- | --- | --- |
| `POST` | `/customers` | Cria um cliente |
| `GET` | `/customers?page=1&limit=20` | Lista clientes com paginação |
| `GET` | `/customers/:id` | Consulta um cliente |

A listagem ordena os registros mais recentes primeiro. O limite máximo por página é `100`.

### Erros conhecidos

| Status | Situação |
| --- | --- |
| `400` | Corpo, query ou parâmetro inválido |
| `404` | Cliente não encontrado |
| `409` | Documento ou e-mail já cadastrado |

Erros inesperados são delegados ao tratamento padrão do Fastify. Um contrato global de erros ainda não foi definido.

## 9. Módulo de propostas

As regras abaixo foram aprovadas em 29 de julho de 2026. São exclusivamente didáticas e não representam política real de crédito.

### 9.1 Dados da avaliação

A criação de uma proposta recebe:

- cliente;
- valor solicitado, maior que zero;
- quantidade de parcelas, entre `1` e `60`;
- score fictício, entre `0` e `1000`;
- indicador de documentação completa;
- lista de indícios de fraude.

Os indícios aceitos inicialmente são:

- `document_mismatch`;
- `identity_mismatch`;
- `duplicate_application`.

O front-end não informa o comprometimento de renda. A API o calcula usando a renda mensal persistida do cliente, evitando divergência entre um valor informado e os dados usados na decisão.

### 9.2 Parcela e comprometimento

Nesta fase, a parcela é uma estimativa didática sem juros:

```txt
parcela estimada = valor solicitado / quantidade de parcelas
comprometimento (%) = parcela estimada / renda mensal * 100
```

A parcela e o percentual são arredondados para duas casas decimais. O percentual arredondado é usado na classificação.

Quando a renda mensal for zero:

- a parcela estimada ainda pode ser calculada;
- o comprometimento será `null`, porque a divisão não possui resultado representável;
- o risco será `high`;
- a proposta será reprovada com o motivo de renda indisponível.

Quantidade de parcelas e valor solicitado são imutáveis após a decisão automática. Uma alteração futura deve criar uma nova simulação ou reavaliação e gerar histórico; não deve sobrescrever silenciosamente a decisão original.

Taxa de juros, CET e sistemas de amortização não fazem parte da Fase 2. A fórmula deve ficar em uma função pura e testável para permitir evolução posterior. A inclusão de juros exigirá uma nova decisão de domínio, pois altera parcela, comprometimento, risco e resultado.

### 9.3 Classificação de risco

Risco por score:

| Score | Risco |
| ---: | --- |
| `700` a `1000` | `low` |
| `500` a `699` | `medium` |
| `0` a `499` | `high` |

Risco por comprometimento:

| Comprometimento | Risco |
| ---: | --- |
| até `30%` | `low` |
| acima de `30%` até `40%` | `medium` |
| acima de `40%` | `high` |
| indisponível por renda zero | `high` |

O risco final é sempre o pior nível encontrado entre score e comprometimento. O valor solicitado não muda o risco; ele pode mudar o fluxo operacional para análise manual.

### 9.4 Precedência da decisão

As condições são avaliadas nesta ordem e a primeira correspondência define o resultado:

| Ordem | Condição | Status | Motivo |
| ---: | --- | --- | --- |
| 1 | Existe ao menos um indício de fraude | `fraud_suspected` | `fraud_signal_detected` |
| 2 | Documentação está incompleta | `pending_documents` | `documents_incomplete` |
| 3 | Renda mensal é zero | `rejected` | `income_unavailable` |
| 4 | Risco final é alto | `rejected` | `high_risk` |
| 5 | Valor solicitado é maior que R$ 100.000,00 | `manual_review` | `high_amount` |
| 6 | Risco final é médio | `manual_review` | `medium_risk` |
| 7 | Risco final é baixo | `approved` | `eligible` |

R$ 100.000,00 exatos não são considerados valor elevado. Indício de fraude prevalece sobre documentação incompleta e todas as regras de risco.

### 9.5 Ciclo de status e histórico

Toda proposta inicia logicamente como `pending`. A avaliação automática registra a criação e a transição para o status calculado.

Conteúdo mínimo de cada evento de histórico:

- identificador;
- status anterior, nulo somente no evento de criação;
- novo status;
- código do motivo;
- descrição legível;
- tipo do responsável: `system` ou `analyst`;
- identificador do responsável, obrigatório para `analyst`;
- data e hora.

Transições previstas:

- `pending` pode ir para qualquer resultado da avaliação automática;
- `pending_documents` pode voltar para `pending` após atualização documental e nova avaliação;
- `manual_review` pode ir para `approved` ou `rejected`;
- `fraud_suspected` pode ir para `manual_review` ou `rejected`;
- `approved` e `rejected` são estados finais.

Na Fase 2 será implementada somente a decisão automática inicial. Transições manuais dependem de um usuário autenticado e ficam para a fase de autenticação e permissões. Isso impede aceitar uma identidade de analista não verificada apenas para antecipar funcionalidade.

### 9.6 Exemplos e fronteiras

| Cenário | Resultado |
| --- | --- |
| Score `700`, comprometimento `30%` e R$ 100.000,00 | `approved` |
| Score `699` e comprometimento `30%` | `manual_review` |
| Score `700` e comprometimento `30,01%` | `manual_review` |
| Score `500` e comprometimento `40%` | `manual_review` |
| Score `499` ou comprometimento `40,01%` | `rejected` |
| Baixo risco e R$ 100.000,01 | `manual_review` |
| Documentação incompleta e alto risco | `pending_documents` |
| Fraude e documentação incompleta | `fraud_suspected` |
| Renda mensal zero, sem fraude e com documentos completos | `rejected` |

### 9.7 Contratos e persistência

Os contratos de propostas são divididos por responsabilidade:

- `proposal.values.ts` mantém os valores canônicos dos enums;
- `proposal-history.schema.ts` define status, motivos, responsáveis e eventos;
- `proposal.schema.ts` define entrada, resposta, parâmetros e filtros;
- `index.ts` expõe a API pública do domínio.

Todos os tipos públicos são inferidos dos schemas Zod. Os arrays canônicos de status, risco, motivos, indícios e responsáveis também são consumidos pelo Mongoose, evitando listas de valores duplicadas entre contrato e persistência.

O contrato de criação é estrito e recebe somente dados informados pelo usuário. Ele rejeita comprometimento, risco, status, decisão e histórico, pois esses campos pertencem ao motor de decisão.

O contrato de resposta:

- exige ao menos um evento de histórico;
- exige que o primeiro evento represente a criação;
- exige que status e motivo atuais correspondam ao último evento;
- exige histórico em ordem cronológica;
- diferencia por tipo o responsável `system` do `analyst`;
- exige `actorId` quando o responsável for um analista;
- rejeita propriedades externas ao contrato.

Os filtros compartilhados suportam cliente, status, risco, período, faixa de valor e paginação. Intervalos invertidos são rejeitados no contrato.

O model Mongoose:

- mantém valor, parcelas e score imutáveis;
- representa histórico como subdocumentos;
- reutiliza os valores canônicos exportados pelos contratos;
- valida valores positivos, inteiros, enums e indícios sem duplicação;
- cria índices compostos para cliente, status e risco por data;
- cria índice para faixa de valor;
- infere `ProposalPersistence` com `InferSchemaType`.

O model não é exportado pelo pacote de contratos e documentos Mongoose não fazem parte das respostas da API. A conversão explícita será responsabilidade do repository.

### 9.8 Motor de decisão e endpoints

O motor de decisão está isolado em funções puras:

- cálculo da parcela estimada;
- cálculo do comprometimento de renda;
- classificação do pior risco entre score e comprometimento;
- aplicação sequencial da precedência aprovada;
- associação entre código e descrição do motivo.

Essas funções recebem apenas valores validados e não conhecem Fastify, Mongoose ou variáveis de ambiente.

O service de propostas:

- depende estruturalmente de um leitor de clientes e de um repository;
- consulta a renda mensal do cliente;
- rejeita clientes inexistentes;
- executa a avaliação automática;
- cria os eventos de histórico `pending` e decisão final;
- delega a persistência;
- monta e valida a paginação.

O repository:

- converte documentos e subdocumentos Mongoose para o contrato Zod;
- nunca retorna `_id`, `__v` ou objetos Mongoose;
- traduz filtros compartilhados para consultas;
- ordena propostas mais recentes primeiro;
- pagina dados e total em paralelo.

Endpoints implementados:

| Método | Rota | Comportamento |
| --- | --- | --- |
| `POST` | `/proposals` | Cria e avalia automaticamente uma proposta |
| `GET` | `/proposals` | Lista com paginação e filtros compartilhados |
| `GET` | `/proposals/:id` | Consulta proposta e histórico |

Erros conhecidos:

| Status | Situação |
| --- | --- |
| `400` | Corpo, query ou identificador inválido |
| `404` | Cliente ou proposta não encontrado |

A tradução de erros Zod para a resposta HTTP é compartilhada pelas rotas de clientes e propostas. Não existe controller separado porque as rotas apenas validam o contrato, delegam ao service e traduzem erros conhecidos.

Decisões manuais, edição de propostas decididas e juros continuam fora deste fluxo.

### 9.9 Seed de demonstração

O comando `pnpm seed` gera uma carga integralmente fictícia com Faker no locale `pt_BR`:

- 500 clientes com documentos iniciados por `FAKE-` e e-mails no domínio reservado `example.test`;
- 1.000 propostas distribuídas nos 12 meses anteriores à data de referência;
- 200 propostas para cada cenário final: aprovada, reprovada, análise manual, suspeita de fraude e documentos pendentes;
- nenhum usuário, analista ou decisão manual.

A mesma seed numérica e a mesma data de referência reproduzem os mesmos registros, inclusive identificadores, valores e datas. Os cinco primeiros identificadores de proposta são estáveis e representam, nessa ordem, os cinco cenários obrigatórios:

| Identificador | Status |
| --- | --- |
| `660000000000000000000001` | `approved` |
| `660000000000000000000002` | `rejected` |
| `660000000000000000000003` | `manual_review` |
| `660000000000000000000004` | `fraud_suspected` |
| `660000000000000000000005` | `pending_documents` |

O gerador valida entradas pelos contratos compartilhados e chama o mesmo motor puro usado pelo service. Status, risco, comprometimento e motivos não são definidos por uma segunda implementação.

A execução exige duas confirmações independentes:

- `SEED_ALLOW_WRITE=true`;
- `SEED_DATABASE_CONFIRMATION` exatamente igual a `MONGODB_DATABASE`.

Bancos cujo nome identifica produção são rejeitados. Cada documento gerado recebe o metadado interno `seedKey`, oculto das consultas comuns e ausente dos contratos públicos. Uma nova execução remove somente documentos com a mesma chave e substitui clientes e propostas em uma transação. Assim, dados sem o marcador não são apagados e uma falha não deixa carga parcial.

### 9.10 OpenAPI e Swagger UI

A API gera uma especificação OpenAPI `3.1.0` a partir dos mesmos schemas Zod usados pelos contratos e pelas rotas.

Endereços disponíveis:

| Rota | Conteúdo |
| --- | --- |
| `/documentation/` | Interface navegável do Swagger UI |
| `/documentation/json` | Especificação OpenAPI em JSON |
| `/documentation/yaml` | Especificação OpenAPI em YAML |

As sete operações de negócio existentes estão documentadas:

- consulta de health;
- criação, listagem e consulta de clientes;
- criação, listagem e consulta de propostas.

O adaptador Zod do Fastify é responsável por:

- inferir `body`, `query` e `params` nos handlers;
- validar as requisições com os contratos compartilhados;
- serializar respostas conforme os schemas declarados;
- transformar os schemas das rotas em OpenAPI.

O parsing manual foi removido das rotas para evitar executar o mesmo contrato duas vezes. Um error handler compartilhado mantém o formato público de validação com `message` e `issues`.

Respostas de sucesso e erros conhecidos são declarados nas próprias rotas. Exemplos OpenAPI são tipados pelos contratos e usam somente identificadores `FAKE-`, ObjectIds determinísticos e o domínio reservado `example.test`.

O plugin OpenAPI é registrado antes das rotas, condição necessária para descobri-las. Rotas sem tag são ocultadas da especificação para impedir que endpoints internos do Swagger UI sejam apresentados como operações de negócio.

## 9.11 Front-end de clientes e preferências visuais

O fluxo de clientes possui rotas próprias para listagem paginada, cadastro e detalhes. As chamadas HTTP permanecem em `src/api`, fora das páginas e componentes visuais.

As respostas são validadas no front-end pelos mesmos schemas Zod publicados em `packages/contracts`. O formulário usa Formik para estado e interação, enquanto o schema compartilhado de criação:

- valida os campos;
- normaliza valores textuais e e-mail;
- transforma a representação textual da renda em número antes da requisição;
- define o tipo enviado à API sem duplicar o contrato.

Erros HTTP conhecidos são convertidos em um erro de aplicação tipado. A interface diferencia carregamento, lista vazia, falha de consulta, conflito no cadastro e confirmação de sucesso.

Durante o desenvolvimento, chamadas HTTP usam o prefixo `/api`. O proxy do Vite remove somente esse prefixo antes de encaminhar a requisição para a API. Rotas de interface como `/customers/new` não compartilham mais o namespace do proxy, permitindo acesso direto e recarregamento pelo React Router.

As preferências globais são limitadas a tema e idioma e usam Context API:

- PT-BR é o idioma padrão;
- inglês pode ser selecionado sem recarregar a página;
- o tema inicial respeita a preferência salva ou o esquema de cores do sistema;
- idioma e tema são persistidos no `localStorage`;
- a moeda do domínio permanece BRL em ambos os idiomas.

Os catálogos de tradução são objetos TypeScript com as mesmas chaves. Uma tradução ausente falha no `typecheck`, sem exigir uma biblioteca de internacionalização nesta etapa.

A paleta não é codificada diretamente nos componentes. `index.css` define tokens semânticos do Tailwind para canvas, superfícies, textos, bordas, cor primária e feedbacks. Cada tema fornece somente os valores desses tokens. Assim, uma mudança futura de paleta fica concentrada no tema e não exige alterar as classes de cada componente.

## 9.12 Front-end de propostas

O fluxo de propostas possui rotas próprias para listagem paginada, criação e detalhes. As chamadas HTTP ficam em `src/api`, e cada resposta é validada pelos schemas Zod compartilhados antes de chegar às páginas.

O formulário usa Formik para estado e interação. Sua validação reutiliza os tipos do contrato compartilhado e converte somente a representação textual dos campos numéricos antes do envio. O seletor consulta o endpoint paginado de clientes com o limite máximo de 100 opções já suportado pela API, sem introduzir busca ou estado global antes da tarefa de filtros.

A API permanece como fonte única para parcela estimada, comprometimento de renda, risco, status, motivo e histórico. O front-end não recalcula nem permite substituir a decisão automática. Após a criação, a interface apresenta o resultado persistido e sua trilha de eventos em modo somente leitura.

Status, risco, motivos, indícios de fraude e responsáveis são recebidos como valores canônicos do contrato. Mapas tipados os associam às chaves dos catálogos PT-BR e inglês, mantendo o domínio independente do idioma e fazendo novos valores falharem no `typecheck` quando ainda não tiverem apresentação definida.

Os componentes de lista e indicador de status são separados das páginas por terem responsabilidade visual reutilizável. Estados de carregamento, lista vazia, erro, sucesso e paginação seguem os mesmos padrões do fluxo de clientes e usam os tokens semânticos dos temas.

## 9.13 Design system e Storybook

`packages/ui` estabelece a fronteira dos componentes compartilhados. Sua primeira versão exporta:

- `Button`, baseado nos atributos nativos e em variantes semânticas;
- `FeedbackState`, extraído do front-end por já ser usado em diferentes domínios;
- `StatusBadge`, indicador genérico consumido pelo adaptador de status de propostas.

`ProposalStatusBadge` permanece em `apps/web`: ele conhece o contrato e traduz cada status para texto e tom. `StatusBadge` conhece apenas apresentação. Essa composição impede que o design system dependa do domínio de crédito.

O tema e as paletas foram movidos para `packages/ui/src/theme.css`. O web e o Storybook importam a mesma fonte e registram explicitamente os arquivos do pacote para a detecção de classes do Tailwind no monorepo. Alterar uma paleta continua exigindo mudança em um único lugar.

`apps/storybook` usa o framework React com Vite e contém somente configuração e stories. O catálogo oferece documentação automática, controles e seleção global de tema. Seu build gera `storybook-static`, tratado como artefato do Turborepo e ignorado pelo Git.

Novos componentes só devem ser adicionados ao pacote quando forem independentes do domínio e tiverem reutilização concreta ou estados isolados que justifiquem documentação. Páginas, chamadas HTTP, navegação, traduções específicas e regras de negócio permanecem no web.

## 9.14 Filtros e estado de navegação

As listagens usam a URL como fonte do estado compartilhável de paginação e filtros. Os parâmetros são lidos, validados e serializados na camada de API do front-end pelos schemas Zod de `packages/contracts`; os componentes visuais recebem consultas tipadas e não montam URLs.

A listagem de clientes sincroniza somente `page` e `limit`, pois esses são os únicos parâmetros atualmente aceitos por seu contrato. Não foi criada busca local ou filtro sem suporte no back-end.

A listagem de propostas oferece status, risco, período de criação e faixa de valor. O contrato também aceita `customerId`, mantido disponível para consumo programático, mas não exposto como campo textual porque um identificador técnico não oferece uma interação amigável. Um seletor por cliente exigirá uma decisão própria sobre busca e paginação das opções.

Regras de navegação:

- a aplicação de um filtro retorna à página `1`;
- a troca de página preserva os filtros ativos;
- parâmetros inválidos são descartados e a URL volta à consulta padrão;
- a ausência total de propostas oferece a criação do primeiro registro;
- um resultado vazio com filtros oferece a limpeza da consulta;
- datas informadas na interface representam o início e o fim do dia em UTC no contrato HTTP.

## 10. Estratégia de testes

### Contratos

- validar entradas aceitas e rejeitadas;
- confirmar normalização e coerção;
- validar formatos de resposta.

### API

- testar services com dependências substituídas por mocks tipados;
- testar rotas com `Fastify.inject()`;
- não abrir porta nem exigir banco real em testes unitários;
- testar conexão e configuração externa por mocks;
- usar integração real apenas como smoke test explícito e sem persistir segredos.

### Front-end

- usar Vitest e React Testing Library;
- consultar a interface com `screen`;
- testar comportamento e estados visíveis;
- evitar snapshots;
- usar descrições iniciadas por `should`.

## 11. Requisitos não funcionais

- TypeScript estrito;
- funções pequenas e responsabilidades únicas;
- composição e injeção de dependência quando resolvem acoplamento real;
- imports e nomes claros;
- nenhuma dependência sem necessidade concreta;
- dados exclusivamente fictícios;
- segredos fora do Git;
- paginação em coleções;
- mudanças pequenas, testáveis e revisáveis;
- nenhuma tecnologia de fase futura antecipada.

## 12. Registro de decisões

| Data | Decisão | Motivo |
| --- | --- | --- |
| 2026-07-29 | Usar pnpm workspaces e Turborepo | Coordenar aplicações e pacotes com scripts compartilhados |
| 2026-07-29 | Usar Zod como fonte dos contratos compartilhados | Evitar tipos manuais divergentes entre front-end e API |
| 2026-07-29 | Separar contrato Zod de persistência Mongoose | Proteger as fronteiras da aplicação e do banco |
| 2026-07-29 | Separar `app.ts` de `server.ts` | Permitir testes sem porta e controlar recursos externos |
| 2026-07-29 | Organizar módulos com route, service, repository e model quando necessário | Manter responsabilidades claras sem abstrações genéricas |
| 2026-07-29 | Não criar controller de passagem | Evitar uma camada sem responsabilidade própria |
| 2026-07-29 | Usar injeção estrutural do repository no service | Aplicar inversão de dependência e facilitar testes |
| 2026-07-29 | Manter segredos em arquivos locais ignorados | Evitar exposição de credenciais |
| 2026-07-29 | Manter decisões, desenho e execução em três documentos canônicos | Evitar mistura entre produto, arquitetura e estado operacional |
| 2026-07-29 | Adotar regras determinísticas e didáticas para propostas | Permitir implementação testável sem representar um motor financeiro real |
| 2026-07-29 | Calcular comprometimento na API com parcela sem juros nesta fase | Manter uma única fonte para o cálculo e postergar complexidade financeira não especificada |
| 2026-07-29 | Adiar transições manuais até existir identidade autenticada | Preservar a responsabilidade e a integridade do histórico |
| 2026-07-29 | Separar valores, histórico e schemas de propostas dentro do domínio de contratos | Melhorar leitura e coesão sem criar abstrações genéricas |
| 2026-07-29 | Reutilizar no Mongoose os valores canônicos exportados pelos contratos | Impedir divergência entre enums de aplicação e persistência |
| 2026-07-29 | Validar coerência entre a proposta e seu último evento no contrato de resposta | Evitar estado atual incompatível com a trilha de decisão |
| 2026-07-29 | Manter o motor de decisão em funções puras | Testar cálculos, fronteiras e precedência sem infraestrutura |
| 2026-07-29 | Fazer o service depender de interfaces estruturais mínimas | Aplicar inversão de dependência sem criar classes ou adapters genéricos |
| 2026-07-29 | Compartilhar somente a tradução de erros Zod para HTTP | Remover duplicação real entre rotas sem centralizar comportamentos de domínio |
| 2026-07-29 | Reutilizar contratos e motor de decisão no seed | Manter os dados demonstrativos coerentes com o comportamento real da API |
| 2026-07-29 | Marcar e substituir o seed em transação com autorização explícita | Permitir reexecução segura sem excluir dados externos à carga |
| 2026-07-29 | Usar schemas Zod nas rotas como fonte da validação, tipagem e OpenAPI | Evitar contratos JSON duplicados e manter documentação alinhada ao comportamento |
| 2026-07-29 | Documentar somente rotas explicitamente marcadas por domínio | Não expor endpoints internos do Swagger UI como operações da aplicação |
| 2026-07-29 | Usar tokens semânticos do Tailwind para temas claro e escuro | Permitir mudar a paleta em um único ponto sem acoplar componentes a cores concretas |
| 2026-07-29 | Manter catálogos PT-BR e inglês tipados sem biblioteca adicional | Garantir consistência das traduções com uma solução proporcional ao escopo atual |
| 2026-07-29 | Reservar `/api` para o proxy HTTP do front-end em desenvolvimento | Evitar colisão entre endpoints da API e acessos diretos às rotas do React Router |
| 2026-07-29 | Manter a API como fonte única da avaliação exibida no fluxo de propostas | Evitar divergência entre cálculos, decisão persistida e apresentação |
| 2026-07-29 | Traduzir valores canônicos de propostas por mapas tipados no front-end | Oferecer dois idiomas sem duplicar ou localizar o contrato de domínio |
| 2026-07-29 | Manter componentes genéricos em `packages/ui` e o Storybook como consumidor | Reutilizar apresentação sem levar domínio ou regras da aplicação ao design system |
| 2026-07-29 | Centralizar tokens e paletas em `packages/ui` | Garantir que web e Storybook renderizem os mesmos temas a partir de uma única fonte |
| 2026-07-29 | Adicionar componentes ao design system somente com reuso concreto | Evitar transformar toda implementação visual em abstração compartilhada |
| 2026-07-29 | Usar a URL como fonte do estado de paginação e filtros | Preservar consultas na navegação, permitir compartilhamento e evitar estado global desnecessário |
| 2026-07-29 | Expor na interface somente filtros suportados e amigáveis | Reutilizar os contratos sem criar busca local ou apresentar identificadores técnicos como experiência final |

## 13. Atualização deste documento

Atualizar o SDD quando uma decisão técnica:

- alterar uma fronteira ou fluxo;
- estabelecer um novo padrão reutilizável;
- substituir uma decisão registrada;
- resolver uma questão técnica aberta.

Não usar o SDD como diário de implementação ou lista de tarefas. O histórico operacional pertence ao `PROJECT-TASKS.md` e ao Git.
