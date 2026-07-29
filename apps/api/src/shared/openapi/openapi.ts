import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export const registerOpenApi = (app: FastifyInstance): void => {
  app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Credit Decision Hub API",
        description:
          "API didática para cadastro de clientes e avaliação automática de propostas fictícias.",
        version: "1.0.0",
      },
      servers: [
        {
          url: "/",
          description: "Servidor atual",
        },
      ],
      tags: [
        {
          name: "Health",
          description: "Estado operacional da API",
        },
        {
          name: "Clientes",
          description: "Cadastro e consulta de clientes fictícios",
        },
        {
          name: "Propostas",
          description: "Criação, avaliação automática e consulta de propostas",
        },
      ],
    },
    hideUntagged: true,
    transform: jsonSchemaTransform,
  });

  app.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
    staticCSP: true,
    uiConfig: {
      deepLinking: true,
      docExpansion: "list",
    },
  });
};
