import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const getManagerSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const joinStoreRoom = (storeId: string) => {
  const s = getManagerSocket();
  s.emit('join:store', { storeId });
};

export const subscribeToNewOrders = (callback: (order: any) => void) => {
  const s = getManagerSocket();
  s.on('order:new', callback);
  return () => {
    s.off('order:new', callback);
  };
};

export const subscribeToOrderUpdates = (callback: (data: { orderId: string; status: string; payload: any }) => void) => {
  const s = getManagerSocket();
  s.on('order:updated', callback);
  return () => {
    s.off('order:updated', callback);
  };
};
