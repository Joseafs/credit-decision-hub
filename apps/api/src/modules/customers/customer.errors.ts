export class CustomerConflictError extends Error {
  constructor() {
    super("Já existe um cliente com este documento ou e-mail");
    this.name = "CustomerConflictError";
  }
}

export class CustomerNotFoundError extends Error {
  constructor() {
    super("Cliente não encontrado");
    this.name = "CustomerNotFoundError";
  }
}
