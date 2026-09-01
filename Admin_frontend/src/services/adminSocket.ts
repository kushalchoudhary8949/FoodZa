import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const getAdminSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
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
