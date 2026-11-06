declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal";
    values?: Record<string, unknown>;
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<void | unknown>;
  }

  export function load(options: {
    mode: "sandbox" | "production";
  }): Promise<CashfreeInstance | null>;
}
