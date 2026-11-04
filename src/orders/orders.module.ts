import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsModule } from '../tickets/tickets.module';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TicketsModule, NotificationsModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
