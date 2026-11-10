import { AlphaPayClient, AlphaTimeoutError } from '../../vendor/alpha-pay';
import type { PaymentProvider, PaymentRequest, PaymentResult } from './payment-provider';
import { PaymentUnavailableError } from './payment-provider';

export class AlphaPaymentProvider implements PaymentProvider {
  private readonly apiKey: string;

  constructor(apiKey = process.env.ALPHA_API_KEY ?? 'sk_test_tickethub') {
    this.apiKey = apiKey;
  }

  async charge({ amountCents, reference, card }: PaymentRequest): Promise<PaymentResult> {
    const client = new AlphaPayClient(this.apiKey);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[alpha] addebito tentativo ${attempt} ${reference} ${amountCents}`);
        const charge = await client.charge({
          amountCents,
          currency: 'EUR',
          reference,
          card: card ?? '',
        });
        console.log(`[alpha] esito ${charge.status} ${charge.chargeId}`);
        return {
          paymentId: charge.chargeId,
          status: charge.status === 'succeeded' ? 'succeeded' : 'declined',
        };
      } catch (err) {
        if (err instanceof AlphaTimeoutError && attempt < 3) {
          console.log('[alpha] timeout, riprovo');
          continue;
        }
        console.log('[alpha] errore', err);
        throw new PaymentUnavailableError('servizio di pagamento non disponibile');
      }
    }
    throw new PaymentUnavailableError('servizio di pagamento non disponibile');
  }

  async refund(paymentId: string, amountCents: number): Promise<void> {
    const client = new AlphaPayClient(this.apiKey);
    let done = false;
    for (let attempt = 1; attempt <= 2 && !done; attempt++) {
      try {
        console.log(`[alpha] rimborso tentativo ${attempt} ${paymentId}`);
        await client.refund(paymentId, amountCents);
        done = true;
      } catch (err) {
        if (err instanceof AlphaTimeoutError) {
          console.log('[alpha] timeout rimborso');
          continue;
        }
        throw new PaymentUnavailableError('rimborso non riuscito');
      }
    }
    if (!done) throw new PaymentUnavailableError('rimborso non riuscito');
  }
}
