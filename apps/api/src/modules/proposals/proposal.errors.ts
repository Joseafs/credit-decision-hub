export class ProposalNotFoundError extends Error {
  constructor() {
    super("Proposta não encontrada");
    this.name = "ProposalNotFoundError";
  }
}

export class InvalidProposalTransitionError extends Error {
  constructor() {
    super("A transição de status solicitada não é permitida");
  }
}

export class ProposalCustomerNotFoundError extends Error {
  constructor() {
    super("Cliente não encontrado");
    this.name = "ProposalCustomerNotFoundError";
  }
}
