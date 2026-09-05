import { io, Socket } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:3000' : 'https://foodza-bckend.onrender.com');

let socket: Socket | null = null;

export const getPartnerSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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
