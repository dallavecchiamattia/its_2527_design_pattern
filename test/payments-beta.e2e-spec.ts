import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers';

describe('Pagamenti con BetaPayments', () => {
  let app: INestApplication;
  const previousProvider = process.env.PAYMENT_PROVIDER;

  beforeEach(async () => {
    process.env.PAYMENT_PROVIDER = 'beta';
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
    if (previousProvider === undefined) {
      delete process.env.PAYMENT_PROVIDER;
    } else {
      process.env.PAYMENT_PROVIDER = previousProvider;
    }
  });

  function buy(body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/orders')
      .send({ card: 'tok_ok', holderName: 'Giulia Rossi', email: 'giulia@example.com', ...body });
  }

  it('vende un posto in PLATEA a 50,40 e registra il pagamento Beta', async () => {
    const res = await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-1-1' }] }).expect(201);
    expect(res.body.order.total).toBe(50.4);
    expect(res.body.order.status).toBe('paid');
    expect(res.body.order.paymentId).toMatch(/^BP-/);
  });

  it('risponde 402 con tok_refuse e lascia il posto libero', async () => {
    await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-1-2' }], card: 'tok_refuse' }).expect(402);
    await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-1-2' }] }).expect(201);
  });

  it('annulla un ordine pagato con Beta rimborsando con Beta', async () => {
    const bought = await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-1-3' }] }).expect(201);
    const cancelled = await request(app.getHttpServer())
      .post(`/orders/${bought.body.order.id}/cancel`)
      .expect(201);
    expect(cancelled.body.order.status).toBe('refunded');
    await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-1-3' }] }).expect(201);
  });
});
