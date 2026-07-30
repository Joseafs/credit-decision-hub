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
| 1 | `CDH-015` | 6 | `ACTIVE` | Implementar infraestrutura, CI/CD e deploy |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

`CDH-016` foi priorizada e concluída por solicitação explícita para estabelecer o design system durante a Fase 3. A ordem e os identificadores das tarefas já planejadas foram preservados.

## 5. Última tarefa concluída

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

### `CDH-015` — Infraestrutura, CI/CD e deploy

Entregas:

- [x] preparar URL pública, CORS restrito e cookie seguro para a comunicação
  entre Vercel e Render;
- [x] versionar o workflow de validações automatizadas no GitHub;
- [x] confirmar a primeira execução verde no GitHub Actions;
- [ ] preparar Vercel, Render e MongoDB Atlas conforme a arquitetura aprovada;
- [ ] validar os deploys e o estado de inicialização da demonstração;
- [ ] avaliar Terraform para os recursos suportados pelos provedores escolhidos.

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

## 7. Entregas concluídas

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
| `CDH-016` | Design system e Storybook | `feat(ui): criar design system com Storybook (CDH-016)` | 127 testes, três componentes compartilhados, temas centralizados, catálogo estático e inspeção visual aprovados |

## 8. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-014`;
- tarefa ativa: `CDH-015`;
- subetapas concluídas: prontidão cross-origin, workflow de qualidade e primeira
  execução verde no GitHub Actions, Blueprint e primeiro deploy da API no
  Render;
- próxima ação: preparar e publicar o front-end na Vercel;
- bloqueio: a URL pública da Vercel ainda não existe para configurar
  `WEB_ORIGIN` na API;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
