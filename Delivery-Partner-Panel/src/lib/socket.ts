import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const getPartnerSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['polling', 'websocket'],
    });
  }
  return socket;
};

export const joinPartnerRoom = (partnerUserId: string) => {
  const s = getPartnerSocket();
  s.emit('join:user', { userId: partnerUserId });
};

export const subscribeToDeliveryRequests = (callback: (data: any) => void) => {
  const s = getPartnerSocket();
  s.on('delivery:request', callback);
  return () => {
    s.off('delivery:request', callback);
  };
};
