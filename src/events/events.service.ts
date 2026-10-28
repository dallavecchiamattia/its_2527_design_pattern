import { Injectable } from '@nestjs/common';
import { EventsRepository } from '../data/events.repository';
import { OrdersRepository } from '../data/orders.repository';
import type { EventRecord } from '../data/types';
import { earlyBirdPrice, earlyBirdRemaining } from '../shared/early-bird';

@Injectable()
export class EventsService {
  constructor(
    private readonly events: EventsRepository,
    private readonly orders: OrdersRepository,
  ) {}

  listOnSale(): EventRecord[] {
    return this.events.findAll().filter((e) => e.status === 'on_sale');
  }

  // prezzo "a partire da" mostrato in vetrina, commissione inclusa
  priceFrom(event: EventRecord): string {
    let min = 0;
    switch (event.pricingType) {
      case 'standard':
        min = Math.min(...Object.values(event.sectorPrices));
        break;
      case 'flat':
        min = event.flatPrice ?? 0;
        break;
      case 'free':
        min = 0;
        break;
    }
    const sold = this.orders.countSoldTickets(event.id);
    if (earlyBirdRemaining(event, sold) > 0) {
      min = earlyBirdPrice(event, min);
    }
    return (min * 1.12).toFixed(2);
  }
}
