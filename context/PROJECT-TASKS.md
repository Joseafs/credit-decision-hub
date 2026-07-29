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
| 1 | `CDH-006` | 2 | `ACTIVE` | Implementar regras, endpoints e histórico de propostas |
| 2 | `CDH-007` | 2 | `NEXT` | Criar seed de dados fictícios |
| 3 | `CDH-008` | 2 | `PLANNED` | Documentar API com Swagger / OpenAPI |
| 4 | `CDH-009` | 3 | `PLANNED` | Implementar fluxo front-end de clientes |
| 5 | `CDH-010` | 3 | `PLANNED` | Implementar fluxo front-end de propostas |
| 6 | `CDH-011` | 3 | `PLANNED` | Implementar filtros e estados de navegação |
| 7 | `CDH-012` | 4 | `PLANNED` | Definir e implementar autenticação e permissões |
| 8 | `CDH-013` | 4 | `PLANNED` | Implementar dashboard e auditoria |
| 9 | `CDH-014` | 5 | `PLANNED` | Implementar etapa analítica com Databricks |
| 10 | `CDH-015` | 6 | `PLANNED` | Implementar infraestrutura, CI/CD e deploy |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

## 5. Tarefa ativa

### `CDH-006` — Regras, endpoints e histórico de propostas

Objetivo: implementar a decisão automática aprovada e disponibilizar criação, listagem e consulta de propostas sem antecipar decisões manuais.

Entregas:

- funções puras para parcela, comprometimento, risco e decisão;
- repository com conversão explícita para o contrato compartilhado;
- service com consulta do cliente e orquestração da decisão;
- histórico de criação e decisão automática;
- `POST /proposals`;
- `GET /proposals`;
- `GET /proposals/:id`;
- testes unitários e de rotas com `Fastify.inject()`.

Critérios de aceite:

- cálculo arredondado e fronteiras seguem integralmente o SDD;
- precedência da decisão é coberta por testes;
- cliente e proposta inexistentes retornam erro esperado;
- listagem aplica filtros e paginação validados;
- repository não expõe documentos Mongoose;
- resposta é validada pelo contrato compartilhado;
- testes não abrem servidor real;
- `lint`, `typecheck`, `test` e `build` aprovados.

Fora do escopo:

- executar decisões manuais;
- editar propostas decididas;
- criar seed, Swagger, telas, usuários ou autenticação;
- adicionar taxa de juros.

## 6. Próximas tarefas da Fase 2

### `CDH-007` — Seed fictício

- usar Faker com locale `pt_BR`;
- gerar os volumes definidos no contexto;
- manter cenários determinísticos;
- não usar dados pessoais reais.

### `CDH-008` — Swagger / OpenAPI

- documentar apenas endpoints existentes;
- manter exemplos fictícios;
- não introduzir funcionalidades novas.

## 7. Entregas concluídas

| ID | Entrega | Commit | Evidência |
| --- | --- | --- | --- |
| `CDH-001` | Fundação do monorepo | `723929e` | `lint`, `typecheck`, `test`, `build` e execução conjunta pelo Turborepo |
| `CDH-002` | Conexão com MongoDB Atlas | `eeaae88` | configuração validada, testes automatizados e conexão real confirmada |
| `CDH-003` | Módulo de clientes | `25a797d` | contratos, service, repository, rotas, 28 testes e smoke test de listagem no Atlas |
| `CDH-004` | Regras objetivas de propostas | `docs: definir regras de decisão de propostas` | limites, precedência, fronteiras, histórico e evolução de juros aprovados |
| `CDH-005` | Contratos e persistência de propostas | `feat(api): criar contratos e persistência de propostas` | 43 testes, contratos estritos, histórico coerente, model validado e gates aprovados |

## 8. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-005`;
- tarefa ativa: `CDH-006`;
- próxima implementação: motor de decisão e endpoints de propostas;
- bloqueios: nenhum;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
