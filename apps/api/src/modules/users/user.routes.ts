import {
  apiErrorResponseSchema,
  createUserSchema,
  userListResponseSchema,
  userSchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { UserConflictError } from "./user.errors.js";
import type { UserService } from "./user.service.js";

export const userRoutes: FastifyPluginAsyncZod<{
  userService: UserService;
}> = async (app, { userService }) => {
  app.get(
    "/users",
    {
      onRequest: app.authorize(["admin"]),
      schema: {
        tags: ["Usuários"],
        summary: "Listar usuários",
        operationId: "listUsers",
        response: {
          200: userListResponseSchema,
          401: apiErrorResponseSchema,
          403: apiErrorResponseSchema,
        },
      },
    },
    async (_request, reply) => reply.status(200).send(await userService.list()),
  );

  app.post(
    "/users",
    {
      onRequest: app.authorize(["admin"]),
      schema: {
        tags: ["Usuários"],
        summary: "Cadastrar analista",
        operationId: "createAnalyst",
        body: createUserSchema,
        response: {
          201: userSchema,
          400: apiErrorResponseSchema,
          401: apiErrorResponseSchema,
          403: apiErrorResponseSchema,
          409: apiErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return reply
          .status(201)
          .send(await userService.createAnalyst(request.body));
      } catch (error) {
        if (error instanceof UserConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  );
};
