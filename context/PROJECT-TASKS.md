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
| 1 | `CDH-010` | 3 | `ACTIVE` | Implementar fluxo front-end de propostas |
| 2 | `CDH-011` | 3 | `NEXT` | Implementar filtros e estados de navegação |
| 3 | `CDH-012` | 4 | `PLANNED` | Definir e implementar autenticação e permissões |
| 4 | `CDH-013` | 4 | `PLANNED` | Implementar dashboard e auditoria |
| 5 | `CDH-014` | 5 | `PLANNED` | Implementar etapa analítica com Databricks |
| 6 | `CDH-015` | 6 | `PLANNED` | Implementar infraestrutura, CI/CD e deploy |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

## 5. Tarefa ativa

### `CDH-010` — Fluxo front-end de propostas

Objetivo: permitir criar, listar e consultar propostas pela aplicação React usando os contratos, clientes e endpoints existentes.

Entregas:

- criar navegação para o domínio de propostas;
- implementar listagem paginada;
- implementar formulário de cadastro com Formik e Zod;
- permitir selecionar um cliente fictício existente;
- implementar consulta dos dados e histórico de uma proposta;
- tratar carregamento, vazio, sucesso e erro;
- manter chamadas HTTP fora dos componentes visuais.

Critérios de aceite:

- contratos compartilhados reutilizados sem tipos manuais duplicados;
- status, risco e motivo apresentados de forma legível nos dois idiomas;
- resultado automático exibido sem permitir decisão manual;
- comportamento principal coberto com React Testing Library;
- interface responsiva e acessível;
- nenhum dado real nos exemplos ou testes;
- `lint`, `typecheck`, `test` e `build` aprovados.

Fora do escopo:

- filtros avançados, dashboard ou edição de uma proposta decidida;
- alterar endpoints, regras de decisão ou cálculo de parcelas;
- adicionar autenticação.

## 6. Próxima tarefa

### `CDH-011` — Filtros e estados de navegação

- detalhar filtros somente após a conclusão das telas de propostas;
- reutilizar os filtros compartilhados já suportados pela API;
- não antecipar dashboard, autenticação ou persistência global de estado.

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

## 8. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-009`;
- tarefa ativa: `CDH-010`;
- próxima implementação: fluxo front-end de propostas;
- bloqueios: nenhum;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
