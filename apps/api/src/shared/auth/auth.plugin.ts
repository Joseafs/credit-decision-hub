import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import type { User, UserRole } from "@credit-decision-hub/contracts";
import type { FastifyInstance, FastifyReply } from "fastify";

import type { UserService } from "../../modules/users/user.service.js";

declare module "fastify" {
  interface FastifyRequest {
    currentUser: User;
  }
  interface FastifyInstance {
    authenticate(
      request: import("fastify").FastifyRequest,
      reply: FastifyReply,
    ): Promise<void>;
    authorize(
      roles: readonly UserRole[],
    ): (
      request: import("fastify").FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export const SESSION_COOKIE_NAME = "cdh_session";

export const registerAuthentication = async (
  app: FastifyInstance,
  options: {
    secret: string;
    userService: UserService;
  },
): Promise<void> => {
  await app.register(cookie);
  await app.register(jwt, {
    secret: options.secret,
    cookie: { cookieName: SESSION_COOKIE_NAME, signed: false },
    sign: { expiresIn: "8h" },
  });

  app.decorateRequest("currentUser");
  app.decorate("authenticate", async (request, reply) => {
    try {
      const token = await request.jwtVerify<{ sub: string }>();
      const user = await options.userService.getActiveById(token.sub);
      if (!user) throw new Error("Inactive user");
      request.currentUser = user;
    } catch {
      await reply.status(401).send({ message: "Autenticação necessária" });
    }
  });
  app.decorate("authorize", (roles) => async (request, reply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (!roles.includes(request.currentUser.role)) {
      await reply.status(403).send({ message: "Permissão insuficiente" });
    }
  });
};
