import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, GOOD_CARD } from './helpers';

// Un blocco = un'app sola, così la soglia dei 500 biglietti resta ferma tra i test.
// SeatInventory invece è un singleton e non si azzera tra un'app e l'altra:
// posti numerati e quantità PIT sono scelti per non scontrarsi
// (499 + 3, 499 + 3, 500 su una capienza PIT di 2000).
jest.setTimeout(15000);

function buy(app: INestApplication, body: Record<string, unknown>) {
  return request(app.getHttpServer())
    .post('/orders')
    .send({ card: GOOD_CARD, holderName: 'Giulia Rossi', email: 'giulia@example.com', ...body });
}

describe('Early bird: ordine di posti numerati a cavallo della soglia', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('vende 499 PIT al prezzo scontato', async () => {
    const res = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'PIT', quantity: 499 }] }).expect(201);
    expect(res.body.order.status).toBe('paid');
  });

  it('sconta solo i biglietti dentro i primi 500', async () => {
    const res = await buy(app, {
      eventId: 'e-1',
      seats: [{ seatId: 'A-1-1' }, { seatId: 'A-1-2' }, { seatId: 'A-1-3' }],
    }).expect(201);
    expect(res.body.order.total).toBe(219.21);
    expect(res.body.order.items.map((i: { unitPrice: number }) => i.unitPrice)).toEqual([55.92, 69.9, 69.9]);
    expect(res.body.tickets.map((t: { price: number }) => t.price)).toEqual([62.63, 78.29, 78.29]);
  });

  it('torna al prezzo pieno dopo il 500° biglietto', async () => {
    const res = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'A-1-4' }] }).expect(201);
    expect(res.body.order.total).toBe(78.29);
  });
});

describe('Early bird: quantità in piedi a cavallo della soglia', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('vende 499 PIT al prezzo scontato', async () => {
    const res = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'PIT', quantity: 499 }] }).expect(201);
    expect(res.body.order.status).toBe('paid');
  });

  it('divide la riga tra prezzo scontato e prezzo pieno', async () => {
    const res = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'PIT', quantity: 3 }] }).expect(201);
    expect(res.body.order.items).toHaveLength(2);
    expect(res.body.order.items[0]).toMatchObject({
      quantity: 1,
      unitPrice: 39.92,
      fee: 4.79,
      lineTotal: 44.71,
    });
    expect(res.body.order.items[1]).toMatchObject({
      quantity: 2,
      unitPrice: 49.9,
      fee: 5.99,
      lineTotal: 111.78,
    });
    expect(res.body.order.total).toBe(156.49);
    expect(res.body.tickets.map((t: { price: number }) => t.price)).toEqual([44.71, 55.89, 55.89]);
  });
});

describe('Early bird: soglia raggiunta e ordine annullato', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('vende 500 PIT al prezzo scontato', async () => {
    const res = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'PIT', quantity: 500 }] }).expect(201);
    expect(res.body.order.status).toBe('paid');
  });

  it('vende il 501° biglietto a prezzo pieno e non libera lo slot se l\'ordine si annulla', async () => {
    const full = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'A-2-1' }] }).expect(201);
    expect(full.body.order.total).toBe(78.29);

    const list = await request(app.getHttpServer()).get('/events').expect(200);
    const event = list.body.find((e: { id: string }) => e.id === 'e-1');
    expect(event.priceFrom).toBe('44.69');

    await request(app.getHttpServer()).post(`/orders/${full.body.order.id}/cancel`).expect(201);
    const afterCancel = await buy(app, { eventId: 'e-1', seats: [{ seatId: 'A-2-2' }] }).expect(201);
    expect(afterCancel.body.order.total).toBe(78.29);
  });
});
