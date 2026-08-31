export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  hostelOrPg?: string;
  roomNumber?: string;
  email?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  image: string;
  logo: string;
  cuisine: string;
  rating: number;
  totalRatings: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  isVegOnly: boolean;
  isOpen: boolean;
  location: string;
  tagline: string;
}

export interface MenuItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  image: string;
  category: string;
  isPopular?: boolean;
  isAvailable: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface CartState {
  storeId: string | null;
  items: CartItem[];
}

export type OrderStatus =
  | 'WAITING_FOR_MANAGER'
  | 'MANAGER_ACCEPTED'
  | 'MANAGER_REJECTED'
  | 'MANAGER_TIMEOUT'
  | 'WAITING_FOR_ADMIN'
  | 'ADMIN_ACCEPTED'
  | 'ADMIN_REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'WAITING_FOR_PARTNER'
  | 'DELIVERY_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CustomerDeliveryDetails {
  name: string;
  phone: string;
  address: string;
  hostelOrPg?: string;
  roomNumber?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

export interface Order {
  id: string; // e.g. "FC1024"
  customerId: string;
  storeId: string;
  storeName: string;
  storeImage: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'Cash on Delivery' | 'UPI / Online (Upcoming)';
  customerDeliveryDetails: CustomerDeliveryDetails;
  createdAt: string;
  status: OrderStatus;
  statusUpdatedAt: string;
  estimatedDeliveryMinutes?: number;
  deliveryPartner?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  rejectionReason?: string;
  refundInfo?: string;
}

export type NavigationTab = 'home' | 'orders' | 'cart' | 'profile';
