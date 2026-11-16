import type { Payment, PaymentGateway } from "./payment-gateway";
import { PaymentTimeoutError } from "./payment-gateway";
import { PaymentGatewayDecorator } from "./payment-gateway-decorator";

const MAX_ATTEMPTS = 3;

// Decorator: ripete la chiamata al gateway solo quando il provider va in timeout.
export class RetryingGateway extends PaymentGatewayDecorator {
    constructor(wrappee: PaymentGateway) {
        super(wrappee);
    }

    async charge(amount: number, reference: string, card: string): Promise<Payment> {
        return this.retry(() => super.charge(amount, reference, card));
    }

    async refund(paymentId: string, amount: number): Promise<void> {
        return this.retry(() => super.refund(paymentId, amount));
    }

    private async retry<T>(call: () => Promise<T>): Promise<T> {
        for (let attempt = 1; ; attempt++) {
            try {
                return await call();
            } catch (err) {
                if (!(err instanceof PaymentTimeoutError) || attempt === MAX_ATTEMPTS) {
                    throw err;
                }
            }
        }
    }

}
