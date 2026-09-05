import { io, Socket } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:3000' : 'https://foodza-bckend.onrender.com');
const SOCKET_URL = rawSocketUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

let socket: Socket | null = null;

export const getPartnerSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Delivery partner connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }
  return socket;
};

export const joinPartnerRoom = (partnerId: string) => {
  const s = getPartnerSocket();

  // Join partner room, user room, and general delivery-partners broadcast room
  s.emit('join:user', { userId: partnerId });
  s.emit('join:delivery-partner', { partnerId });
  s.emit('join:delivery-partners');

  // Re-join rooms on reconnect
  s.off('connect'); // Remove previous listeners to avoid duplicates
  s.on('connect', () => {
    console.log('[Socket.IO] Reconnected, re-joining partner rooms');
    s.emit('join:user', { userId: partnerId });
    s.emit('join:delivery-partner', { partnerId });
    s.emit('join:delivery-partners');
  });
};

export const subscribeToDeliveryRequests = (callback: (data: any) => void) => {
  const s = getPartnerSocket();
  s.on('delivery:request', callback);
  return () => {
    s.off('delivery:request', callback);
  };
};

export const subscribeToOrderUpdates = (callback: (data: any) => void) => {
  const s = getPartnerSocket();
  s.on('order:updated', callback);
  return () => {
    s.off('order:updated', callback);
  };
};
