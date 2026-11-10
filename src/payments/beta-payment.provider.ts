import { BetaPayments } from '../../vendor/beta-pay';
import type { PaymentProvider, PaymentRequest, PaymentResult } from './payment-provider';
import { PaymentUnavailableError } from './payment-provider';

export class BetaPaymentProvider implements PaymentProvider {
  private readonly merchantId: string;

  constructor(merchantId = process.env.BETA_MERCHANT_ID ?? 'tickethub') {
    this.merchantId = merchantId;
  }

  async charge({ amountCents, reference, card }: PaymentRequest): Promise<PaymentResult> {
    const client = new BetaPayments(this.merchantId);
    try {
      const payment = await client.createPayment({
        amount: (amountCents / 100).toFixed(2),
        currencyCode: 'EUR',
        orderRef: reference,
        cardToken: card ?? '',
      });
      return {
        paymentId: payment.id,
        status: payment.outcome === 'APPROVED' ? 'succeeded' : 'declined',
      };
    } catch {
      throw new PaymentUnavailableError('servizio di pagamento non disponibile');
    }
  }

  async refund(paymentId: string, amountCents: number): Promise<void> {
    const client = new BetaPayments(this.merchantId);
    try {
      await client.reverse(paymentId, { amount: (amountCents / 100).toFixed(2) });
    } catch {
      throw new PaymentUnavailableError('rimborso non riuscito');
    }
  }
}
