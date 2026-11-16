import type { Payment, PaymentGateway } from "./payment-gateway";

// Base Decorator: conserva il gateway avvolto e delega a lui le chiamate.
export abstract class PaymentGatewayDecorator implements PaymentGateway {
    protected constructor(protected readonly wrappee: PaymentGateway) {}

    charge(amount: number, reference: string, card: string): Promise<Payment> {
        return this.wrappee.charge(amount, reference, card);
    }

    refund(paymentId: string, amount: number): Promise<void> {
        return this.wrappee.refund(paymentId, amount);
    }
}
