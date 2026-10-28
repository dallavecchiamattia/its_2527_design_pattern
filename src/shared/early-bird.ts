import type { EventRecord } from '../data/types';
import { round2 } from './money';

// Quanti biglietti restano al prezzo early bird.
// sold = biglietti già venduti per l'evento, promozione inclusa.
export function earlyBirdRemaining(event: EventRecord, sold: number): number {
  if (!event.earlyBird) return 0;
  return Math.max(0, event.earlyBird.tickets - sold);
}

// Prezzo early bird a partire dal prezzo di listino del settore.
// Senza promozione restituisce il prezzo di listino invariato.
export function earlyBirdPrice(event: EventRecord, listPrice: number): number {
  if (!event.earlyBird) return listPrice;
  return round2(listPrice * (1 - event.earlyBird.discountRate));
}
