import { load, type CashfreeInstance } from "@cashfreepayments/cashfree-js";

export interface CashfreeCheckoutResponse {
  order_id: string;
  order_number: string;
  payment_id: string;
  merchant_order_id: string;
  cf_order_id?: string | null;
  payment_session_id: string;
  environment: string;
  amount: number;
  currency: string;
}

let cashfreeInstance: CashfreeInstance | null = null;

/**
 * Initializes and caches the Cashfree JavaScript SDK instance client-side.
 * Resolves to null during SSR.
 */
export async function getCashfree(
  environment?: string
): Promise<CashfreeInstance | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const mode =
    environment === "production" ||
    process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
      ? "production"
      : "sandbox";

  if (!cashfreeInstance) {
    cashfreeInstance = await load({ mode });
  }

  return cashfreeInstance;
}
