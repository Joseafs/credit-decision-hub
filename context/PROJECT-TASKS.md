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
| 1 | `CDH-014` | 5 | `ACTIVE` | Implementar etapa analítica com Databricks |
| 2 | `CDH-015` | 6 | `NEXT` | Implementar infraestrutura, CI/CD e deploy |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

`CDH-016` foi priorizada e concluída por solicitação explícita para estabelecer o design system durante a Fase 3. A ordem e os identificadores das tarefas já planejadas foram preservados.

## 5. Tarefa ativa

### `CDH-014` — Etapa analítica com Databricks

Entregas:

- [x] definir o contrato versionado de exportação do dataset fictício;
- [x] criar o comando local, reproduzível e validado de exportação em NDJSON;
- [x] confirmar duas exportações reais e idênticas das 1.000 propostas do Atlas;
- [ ] enviar manualmente o NDJSON ao volume `workspace.credit_decision_hub.analytics_raw`;
- [ ] criar o processamento PySpark e as tabelas Delta;
- integrar resultados somente depois de existir uma saída reproduzível.

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

## 6. Próxima tarefa

### `CDH-015` — Infraestrutura, CI/CD e deploy

- adicionar Docker somente para os serviços que realmente precisarem;
- configurar validações automatizadas no GitHub;
- preparar Vercel, Render e MongoDB Atlas conforme a arquitetura aprovada;
- avaliar Terraform para os recursos suportados pelos provedores escolhidos.

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
| `CDH-016` | Design system e Storybook | `feat(ui): criar design system com Storybook (CDH-016)` | 127 testes, três componentes compartilhados, temas centralizados, catálogo estático e inspeção visual aprovados |

## 8. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-013`;
- tarefa ativa: `CDH-014`;
- subetapa concluída: contrato e exportação analítica local em NDJSON;
- próxima implementação: upload manual do artefato validado para o volume do Databricks e posterior notebook PySpark;
- bloqueios: nenhum;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
