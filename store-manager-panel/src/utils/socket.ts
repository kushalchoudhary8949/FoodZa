import { io, Socket } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || (isLocal ? 'http://localhost:3000' : 'https://foodza-bckend.onrender.com');
const SOCKET_URL = rawSocketUrl.replace('foodza-backend.onrender.com', 'foodza-bckend.onrender.com');

let socket: Socket | null = null;

// Track joined rooms so we can re-join on reconnect
const joinedStoreRooms = new Set<string>();
let joinedAdminRoom = false;

export const getManagerSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket?.id);
      // Re-join all store rooms on every (re)connect
      joinedStoreRooms.forEach((storeId) => {
        socket?.emit('join:store', { storeId });
        console.log('[Socket.IO] Re-joined store room:', storeId);
      });
      if (joinedAdminRoom) {
        socket?.emit('join:admin');
        console.log('[Socket.IO] Re-joined admin room as fallback');
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });
  }
  return socket;
};

export const joinStoreRoom = (storeId: string) => {
  if (!storeId) return;
  joinedStoreRooms.add(storeId);
  const s = getManagerSocket();
  if (s.connected) {
    s.emit('join:store', { storeId });
    console.log('[Socket.IO] Joined store room:', storeId);
  }
  // If not connected yet, the 'connect' handler above will join automatically
};

export const subscribeToNewOrders = (callback: (order: any) => void) => {
  const s = getManagerSocket();
  s.on('order:new', callback);
  return () => {
    s.off('order:new', callback);
  };
};

export const joinAdminRoom = () => {
  joinedAdminRoom = true;
  const s = getManagerSocket();
  if (s.connected) {
    s.emit('join:admin');
    console.log('[Socket.IO] Joined admin room as fallback');
  }
};

export const subscribeToOrderUpdates = (callback: (data: { orderId: string; status: string; payload: any }) => void) => {
  const s = getManagerSocket();
  s.on('order:updated', callback);
  return () => {
    s.off('order:updated', callback);
  };
};
