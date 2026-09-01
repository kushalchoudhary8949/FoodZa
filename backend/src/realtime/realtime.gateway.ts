import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Room Subscriptions ──

  @SubscribeMessage('join:order')
  handleJoinOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.join(`order:${data.orderId}`);
    this.logger.log(`Client ${client.id} joined room: order:${data.orderId}`);
    return { event: 'joined', room: `order:${data.orderId}` };
  }

  @SubscribeMessage('join:store')
  handleJoinStore(@ConnectedSocket() client: Socket, @MessageBody() data: { storeId: string }) {
    client.join(`store:${data.storeId}`);
    this.logger.log(`Client ${client.id} joined room: store:${data.storeId}`);
    return { event: 'joined', room: `store:${data.storeId}` };
  }

  @SubscribeMessage('join:admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    this.logger.log(`Client ${client.id} joined room: admin`);
    return { event: 'joined', room: 'admin' };
  }

  @SubscribeMessage('join:user')
  handleJoinUser(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    client.join(`user:${data.userId}`);
    this.logger.log(`Client ${client.id} joined room: user:${data.userId}`);
    return { event: 'joined', room: `user:${data.userId}` };
  }

  // ── Broadcast Helpers ──

  /**
   * Broadcast order status update to order room, store room, and admin room
   */
  emitOrderUpdate(orderId: string, storeId: string, status: string, payload: any) {
    const data = { orderId, status, payload, timestamp: new Date() };
    this.server.to(`order:${orderId}`).emit('order:updated', data);
    this.server.to(`store:${storeId}`).emit('order:updated', data);
    this.server.to('admin').emit('order:updated', data);
    this.logger.log(`Emitted order:updated for ${orderId} (${status})`);
  }

  /**
   * Emit new order alert to store manager room
   */
  emitNewOrderToStore(storeId: string, orderData: any) {
    this.server.to(`store:${storeId}`).emit('order:new', orderData);
    this.logger.log(`Emitted order:new to store:${storeId}`);
  }

  /**
   * Emit manager timeout alert to admin room
   */
  emitManagerTimeoutToAdmin(orderData: any) {
    this.server.to('admin').emit('order:timeout', orderData);
    this.logger.log(`Emitted order:timeout to admin`);
  }

  /**
   * Emit real-time issue message
   */
  emitIssueMessage(issueId: string, storeId: string, messageData: any) {
    this.server.to(`issue:${issueId}`).emit('issue:message', messageData);
    this.server.to(`store:${storeId}`).emit('issue:message', messageData);
    this.server.to('admin').emit('issue:message', messageData);
  }
}
