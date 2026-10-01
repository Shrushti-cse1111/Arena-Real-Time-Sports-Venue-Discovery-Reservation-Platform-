import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BookingEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(BookingEventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Arena Realtime Gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Arena Realtime Gateway: ${client.id}`);
  }

  @SubscribeMessage('join_venue_room')
  handleJoinVenue(client: Socket, venueId: string) {
    client.join(`venue_${venueId}`);
    return { status: 'joined', room: `venue_${venueId}` };
  }

  @SubscribeMessage('join_owner_room')
  handleJoinOwner(client: Socket, ownerId: string) {
    client.join(`owner_${ownerId}`);
    return { status: 'joined', room: `owner_${ownerId}` };
  }

  @SubscribeMessage('join_admin_room')
  handleJoinAdmin(client: Socket) {
    client.join('admin_global');
    return { status: 'joined', room: 'admin_global' };
  }

  // Broadcast slot state change (available -> held -> booked)
  broadcastSlotUpdate(venueId: string, slotData: any) {
    if (this.server) {
      this.server.to(`venue_${venueId}`).emit('slot_state_changed', slotData);
      this.server.to('admin_global').emit('admin_slot_update', slotData);
    }
  }

  // Broadcast new booking to owner and admin
  broadcastNewBooking(ownerId: string, booking: any) {
    if (this.server) {
      this.server.to(`owner_${ownerId}`).emit('new_booking_received', booking);
      this.server.to('admin_global').emit('admin_new_booking', booking);
    }
  }
}
