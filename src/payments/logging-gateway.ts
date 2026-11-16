import type { Payment, PaymentGateway } from "./payment-gateway";
import { PaymentGatewayDecorator } from "./payment-gateway-decorator";

// Decorator: aggiunge al gateway la scrittura delle righe di richiesta ed esito.
export class LoggingGateway extends PaymentGatewayDecorator {
    constructor(
        wrappee: PaymentGateway,
        private readonly log: (line: string) => void = console.log
    ) {
        super(wrappee);
    }

    async charge(amount: number, reference: string, card: string): Promise<Payment> {
        const startedAt = performance.now();
        this.log(`[pagamenti] addebito ${this.money(amount)} ${reference}`);
        try {
            const payment = await super.charge(amount, reference, card);
            const outcome = payment.approved ? 'approvato' : 'rifiutato';
            this.log(`[pagamenti] addebito ${outcome} ${payment.id} in ${this.elapsed(startedAt)} ms`);
            return payment;
        } catch (err) {
            this.log(`[pagamenti] addebito errore ${this.errorName(err)} in ${this.elapsed(startedAt)} ms`);
            throw err;
        }
    }

    async refund(paymentId: string, amount: number): Promise<void> {
        const startedAt = performance.now();
        this.log(`[pagamenti] rimborso ${this.money(amount)} ${paymentId}`);
        try {
            await super.refund(paymentId, amount);
            this.log(`[pagamenti] rimborso ok in ${this.elapsed(startedAt)} ms`);
        } catch (err) {
            this.log(`[pagamenti] rimborso errore ${this.errorName(err)} in ${this.elapsed(startedAt)} ms`);
            throw err;
        }
    }

    private money(amount: number): string {
        return amount.toFixed(2);
    }

    private elapsed(startedAt: number): number {
        return Math.round(performance.now() - startedAt);
    }

    private errorName(err: unknown): string {
        return err instanceof Error ? err.name : String(err);
    }
}
