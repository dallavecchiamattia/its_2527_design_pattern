import { Injectable } from '@nestjs/common';
import type { Order } from './types';

@Injectable()
export class OrdersRepository {
  private readonly orders = new Map<string, Order>();
  private seq = 0;

  nextId(): string {
    this.seq++;
    return `o-${this.seq}`;
  }

  save(order: Order): void {
    this.orders.set(order.id, order);
  }

  findById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  findByEvent(eventId: string): Order[] {
    return [...this.orders.values()].filter((o) => o.eventId === eventId);
  }

  // Biglietti venduti per l'evento, compresi gli ordini annullati:
  // la soglia early bird non torna indietro quando un ordine viene rimborsato.
  countSoldTickets(eventId: string): number {
    return this.findByEvent(eventId).reduce(
      (sold, order) => sold + order.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );
  }

  findByAlphaChargeId(chargeId: string): Order | undefined {
    return [...this.orders.values()].find((o) => o.alphaChargeId === chargeId);
  }
}
