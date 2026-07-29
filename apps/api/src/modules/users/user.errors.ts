export class InvalidCredentialsError extends Error {
  constructor() {
    super("E-mail ou senha inválidos");
  }
}

export class UserConflictError extends Error {
  constructor() {
    super("Já existe um usuário com este e-mail");
  }
}
