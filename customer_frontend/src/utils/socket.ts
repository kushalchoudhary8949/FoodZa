import { io, Socket } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:4000' : 'https://foodza-bckend.onrender.com');
const SOCKET_URL = rawSocketUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
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
  }
  return socket;
};

export const joinOrderRoom = (orderId: string) => {
  const s = getSocket();
  s.emit('join:order', { orderId });
};

export const subscribeToOrderUpdates = (callback: (data: { orderId: string; status: string; payload: any }) => void) => {
  const s = getSocket();
  s.on('order:updated', callback);

  return () => {
    s.off('order:updated', callback);
  };
};
