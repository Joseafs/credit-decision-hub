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
| 1 | `CDH-005` | 2 | `ACTIVE` | Criar contratos e persistência de propostas |
| 2 | `CDH-006` | 2 | `NEXT` | Implementar regras, endpoints e histórico de propostas |
| 3 | `CDH-007` | 2 | `PLANNED` | Criar seed de dados fictícios |
| 4 | `CDH-008` | 2 | `PLANNED` | Documentar API com Swagger / OpenAPI |
| 5 | `CDH-009` | 3 | `PLANNED` | Implementar fluxo front-end de clientes |
| 6 | `CDH-010` | 3 | `PLANNED` | Implementar fluxo front-end de propostas |
| 7 | `CDH-011` | 3 | `PLANNED` | Implementar filtros e estados de navegação |
| 8 | `CDH-012` | 4 | `PLANNED` | Definir e implementar autenticação e permissões |
| 9 | `CDH-013` | 4 | `PLANNED` | Implementar dashboard e auditoria |
| 10 | `CDH-014` | 5 | `PLANNED` | Implementar etapa analítica com Databricks |
| 11 | `CDH-015` | 6 | `PLANNED` | Implementar infraestrutura, CI/CD e deploy |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

## 5. Tarefa ativa

### `CDH-005` — Contratos e persistência de propostas

Objetivo: representar as regras aprovadas em contratos Zod compartilhados e no modelo de persistência, sem implementar ainda o motor de decisão ou endpoints.

Entregas:

- schemas e tipos de proposta, status, risco, indícios de fraude e histórico;
- entrada de criação sem campos calculados;
- resposta completa com campos calculados e histórico;
- parâmetros de consulta e paginação;
- model Mongoose com índices necessários;
- testes dos contratos e da definição de persistência.

Critérios de aceite:

- tipos inferidos exclusivamente com `z.infer`;
- front-end e API podem importar os mesmos contratos;
- comprometimento, risco, status, motivo e histórico não são aceitos como entrada de criação;
- persistência representa os estados e o histórico definidos no SDD;
- nenhuma resposta expõe documento Mongoose;
- testes cobrem valores válidos, limites e rejeições relevantes;
- `lint`, `typecheck`, `test` e `build` aprovados.

Fora do escopo:

- implementar cálculo de comprometimento ou classificação de risco;
- criar service, repository ou endpoints;
- executar decisões automáticas ou manuais;
- criar seed, Swagger, telas ou autenticação;
- adicionar taxa de juros.

## 6. Próximas tarefas da Fase 2

### `CDH-006` — Regras, endpoints e histórico de propostas

- implementar service e repository;
- expor criação, listagem e detalhe;
- implementar decisão automática e seu histórico;
- preservar transições manuais para a fase de autenticação;
- testar regras e rotas com `Fastify.inject()`.

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

## 8. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-004`;
- tarefa ativa: `CDH-005`;
- próxima implementação: contratos compartilhados e modelo Mongoose de propostas;
- bloqueios: nenhum;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
