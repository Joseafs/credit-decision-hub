export class ProposalNotFoundError extends Error {
  constructor() {
    super("Proposta não encontrada");
    this.name = "ProposalNotFoundError";
  }
}

export class ProposalCustomerNotFoundError extends Error {
  constructor() {
    super("Cliente não encontrado");
    this.name = "ProposalCustomerNotFoundError";
  }
}
