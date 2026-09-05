import { io, Socket } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:3000' : 'https://foodza-bckend.onrender.com');
const SOCKET_URL = rawSocketUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

let socket: Socket | null = null;

export const getAdminSocket = (): Socket => {
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

export const joinAdminRoom = () => {
  const s = getAdminSocket();
  s.emit('join:admin');
};

export const subscribeToAdminTimeouts = (callback: (order: any) => void) => {
  const s = getAdminSocket();
  s.on('order:timeout', callback);
  return () => {
    s.off('order:timeout', callback);
  };
};

export const subscribeToAdminOrderUpdates = (callback: (data: { orderId: string; status: string; payload: any }) => void) => {
  const s = getAdminSocket();
  s.on('order:updated', callback);
  return () => {
    s.off('order:updated', callback);
  };
};
