import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers';

// Con PAYMENT_PROVIDER=beta i pagamenti salgono su BetaPayments.
describe('Ordini con provider Beta', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.PAYMENT_PROVIDER = 'beta';
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.PAYMENT_PROVIDER;
  });

  const buy = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/orders')
      .send({ card: 'tok_ok', holderName: 'Giulia Rossi', email: 'giulia@example.com', ...body });

  it('vende un posto in PLATEA per e-2 a 50,40 € e paga con Beta', async () => {
    const res = await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-1-1' }] }).expect(201);
    expect(res.body.order.total).toBe(50.4);
    expect(res.body.order.status).toBe('paid');
    expect(res.body.order.paymentId).toMatch(/^BP-/);
  });

  it('risponde 402 se il pagamento è rifiutato e lascia il posto libero', async () => {
    await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-2-1' }], card: 'tok_refuse' }).expect(402);
    await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-2-1' }] }).expect(201);
  });

  it('annulla un ordine pagato con Beta, rimborsa con Beta e lo porta a refunded', async () => {
    const bought = await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-3-1' }] }).expect(201);
    const orderId = bought.body.order.id;
    const cancelled = await request(app.getHttpServer()).post(`/orders/${orderId}/cancel`).expect(201);
    expect(cancelled.body.order.status).toBe('refunded');
    await buy({ eventId: 'e-2', seats: [{ seatId: 'PLATEA-3-1' }] }).expect(201);
  });
});
