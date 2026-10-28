import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, GOOD_CARD } from './helpers';

describe('Early bird', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  function buy(body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/orders')
      .send({ card: GOOD_CARD, holderName: 'Giulia Rossi', email: 'giulia@example.com', ...body });
  }

  it('vende un posto PIT al prezzo scontato', async () => {
    const res = await buy({ eventId: 'e-1', seats: [{ seatId: 'PIT', quantity: 1 }] }).expect(201);
    expect(res.body.order.total).toBe(44.71);
    expect(res.body.order.items[0].unitPrice).toBe(39.92);
    expect(res.body.order.items[0].fee).toBe(4.79);
    expect(res.body.tickets.map((t: { price: number }) => t.price)).toEqual([44.71]);
  });

  it('vende tre posti numerati in A al prezzo scontato', async () => {
    const res = await buy({
      eventId: 'e-1',
      seats: [{ seatId: 'A-1-1' }, { seatId: 'A-1-2' }, { seatId: 'A-1-3' }],
    }).expect(201);
    expect(res.body.order.total).toBe(187.89);
    expect(res.body.order.items.map((i: { unitPrice: number }) => i.unitPrice)).toEqual([55.92, 55.92, 55.92]);
    expect(res.body.order.items.map((i: { fee: number }) => i.fee)).toEqual([6.71, 6.71, 6.71]);
    expect(res.body.tickets.map((t: { price: number }) => t.price)).toEqual([62.63, 62.63, 62.63]);
  });
});
