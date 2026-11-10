import { Module } from '@nestjs/common';
import { AlphaWebhookController } from './alpha-webhook.controller';
import { AlphaPaymentProvider } from './alpha-payment.provider';
import { BetaPaymentProvider } from './beta-payment.provider';
import { PAYMENT_PROVIDER } from './payment-provider';
import type { PaymentProvider } from './payment-provider';

const paymentProvider = {
  provide: PAYMENT_PROVIDER,
  useFactory: (): PaymentProvider => {
    const provider = process.env.PAYMENT_PROVIDER ?? 'alpha';
    switch (provider) {
      case 'alpha':
        return new AlphaPaymentProvider();
      case 'beta':
        return new BetaPaymentProvider();
      default:
        throw new Error(`PAYMENT_PROVIDER non valido: ${provider}`);
    }
  },
};

@Module({
  controllers: [AlphaWebhookController],
  providers: [paymentProvider],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
