export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentRequest {
  amountCents: number;
  reference: string;
  card?: string;
}

export interface PaymentResult {
  paymentId: string;
  status: 'succeeded' | 'declined';
}

export interface PaymentProvider {
  charge(request: PaymentRequest): Promise<PaymentResult>;
  refund(paymentId: string, amountCents: number): Promise<void>;
}

export class PaymentUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentUnavailableError';
  }
}
