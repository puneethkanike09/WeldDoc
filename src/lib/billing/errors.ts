/**
 * Thrown by write chokepoints when an org is read-only (trial/subscription
 * lapsed) or has hit a plan limit. Server actions let this propagate; forms
 * surface `error.message` to the user.
 */
export class BillingError extends Error {
  readonly code: "read_only" | "welder_limit" | "operator_limit";

  constructor(code: BillingError["code"], message: string) {
    super(message);
    this.name = "BillingError";
    this.code = code;
  }
}

export class ReadOnlyError extends BillingError {
  constructor(message: string) {
    super("read_only", message);
    this.name = "ReadOnlyError";
  }
}
