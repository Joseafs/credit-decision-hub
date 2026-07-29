import {
  apiErrorResponseSchema,
  authSessionSchema,
  loginSchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { SESSION_COOKIE_NAME } from "../../shared/auth/auth.plugin.js";
import { InvalidCredentialsError } from "./user.errors.js";
import type { UserService } from "./user.service.js";

type AuthRoutesOptions = {
  secureCookie: boolean;
  userService: UserService;
};

export const authRoutes: FastifyPluginAsyncZod<AuthRoutesOptions> = async (
  app,
  { secureCookie, userService },
) => {
  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Autenticar usuário",
        operationId: "login",
        body: loginSchema,
        response: { 200: authSessionSchema, 401: apiErrorResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const user = await userService.authenticate(request.body);
        const token = await reply.jwtSign({ sub: user.id });
        reply.setCookie(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: secureCookie,
          path: "/",
          maxAge: 8 * 60 * 60,
        });
        return reply.status(200).send({ user });
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.status(401).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  app.get(
    "/auth/session",
    {
      onRequest: app.authenticate,
      schema: {
        tags: ["Autenticação"],
        summary: "Consultar sessão",
        operationId: "getSession",
        response: { 200: authSessionSchema, 401: apiErrorResponseSchema },
      },
    },
    async (request, reply) =>
      reply.status(200).send({ user: request.currentUser }),
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Encerrar sessão",
        operationId: "logout",
      },
    },
    async (_request, reply) => {
      reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
      return reply.status(204).send();
    },
  );
};
