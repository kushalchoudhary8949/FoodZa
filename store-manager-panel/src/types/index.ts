export type OrderStatus =
  | 'WAITING_FOR_MANAGER'
  | 'MANAGER_ACCEPTED'
  | 'ADMIN_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'WAITING_FOR_PARTNER'
  | 'DELIVERY_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'MANAGER_REJECTED'
  | 'ORDER_CANCELLED'
  | 'MANAGER_TIMEOUT';

export type DeliveryPartnerStatus =
  | 'UNASSIGNED'
  | 'SEARCHING'
  | 'ASSIGNED'
  | 'ARRIVING_AT_STORE'
  | 'REACHED_STORE'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED';

export type PaymentMethod = 'UPI' | 'CASH_ON_DELIVERY' | 'CARD' | 'NET_BANKING';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  notes?: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  deliveryAddress: string;
  hostelOrPg?: string;
  roomNumber?: string;
  coordinates?: { lat: number; lng: number };
}

export interface DeliveryPartnerInfo {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  estimatedArrivalMinutes?: number;
  status: DeliveryPartnerStatus;
}

export interface Order {
  id: string; // e.g. "FC1024"
  storeId: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  platformDiscount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
  timeoutSeconds: number; // e.g. 60
  timeRemainingSeconds?: number;
  deliveryPartner?: DeliveryPartnerInfo;
  prepTimeMinutes?: number;
  rejectionReason?: string;
  adminEscalated?: boolean;
}

export interface FoodItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Store {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  bannerImage: string;
  contactNumber: string;
  email: string;
  address: string;
  locationArea: string;
  city: string;
  openingTime: string; // "10:00"
  closingTime: string; // "23:30"
  isOpen: boolean;
  defaultTimeoutSeconds: number; // 60
  defaultPrepTimeMinutes: number; // 20
  rating: number;
  totalReviews: number;
  // Locked Admin Fields:
  ownerName: string;
  storeOwnerId: string;
  commissionPercentage: number; // 18.5%
  gstin: string;
  fssaiLicense: string;
}

export interface StoreManager {
  id: string; // Manager ID e.g. "MGR-KFC-101"
  storeId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  role: 'STORE_MANAGER';
  lastLogin: string;
}

export type IssueCategory =
  | 'DELIVERY_PARTNER_ISSUE'
  | 'ORDER_ISSUE'
  | 'PAYMENT_ISSUE'
  | 'SYSTEM_APP_ISSUE'
  | 'OTHER'
  | 'Order issue'
  | 'Payment issue'
  | 'Delivery issue'
  | 'Menu issue'
  | 'Store issue'
  | 'Technical issue';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface IssueMessage {
  id: string;
  sender?: 'MANAGER' | 'ADMIN';
  senderRole?: 'MANAGER' | 'ADMIN';
  senderName: string;
  message: string;
  timestamp?: string;
  createdAt?: string;
}

export interface IssueTicket {
  id: string; // e.g. "ISSUE-101"
  storeId: string;
  managerId: string;
  category: IssueCategory;
  orderId?: string;
  relatedOrderId?: string;
  deliveryPartnerId?: string;
  subject: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  attachments?: string[];
  messages: IssueMessage[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_ACCEPTED'
  | 'ORDER_CANCELLED'
  | 'DELIVERY_PARTNER_ASSIGNED'
  | 'DELIVERY_PARTNER_ARRIVED'
  | 'DELIVERY_PARTNER_REJECTED'
  | 'DELIVERY_ISSUE'
  | 'ADMIN_MESSAGE'
  | 'ISSUE_UPDATE'
  | 'PLATFORM_ANNOUNCEMENT';

export interface AppNotification {
  id: string;
  storeId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  relatedOrderId?: string;
  issueId?: string;
  actionUrl?: string;
  timestamp?: string;
  createdAt?: string;
  isRead: boolean;
}

export type NotificationItem = AppNotification;
