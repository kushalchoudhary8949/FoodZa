export type UserRole = 'ADMIN' | 'MANAGER' | 'DELIVERY_PARTNER' | 'CUSTOMER';

export interface AdminUser {
  id: string;
  adminId: string;
  name: string;
  email: string;
  role: 'ADMIN';
  avatarUrl?: string;
  lastLogin?: string;
}

export type StoreStatus = 'Active' | 'Inactive';

export interface Store {
  id: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  contactNumber: string;
  openingTime: string; // e.g. "09:00 AM"
  closingTime: string; // e.g. "11:00 PM"
  status: StoreStatus;
  managerId?: string;
  managerName?: string;
  rating?: number;
  totalOrders?: number;
  totalSales?: number;
  createdAt: string;
}

export type AccountStatus = 'Active' | 'Inactive';

export interface StoreManager {
  id: string;
  name: string;
  phoneNumber: string;
  phone?: string;
  email: string;
  loginId: string;
  assignedStoreId?: string;
  assignedStoreName?: string;
  status: AccountStatus;
  accountStatus?: AccountStatus;
  joinedDate: string;
  createdAt?: string;
  totalOrdersManaged?: number;
}

export type PartnerOnlineStatus = 'Online' | 'Offline';

export interface DeliveryPartner {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  loginId: string;
  accountStatus: AccountStatus;
  onlineStatus: PartnerOnlineStatus;
  totalDeliveries: number;
  totalEarnings: number; // in INR
  currentOrderId?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  rating?: number;
  joinedDate: string;
}

export type ManagerAccountStatus = AccountStatus;
export type PartnerAccountStatus = AccountStatus;

export interface MenuCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface MenuItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  image: string;
  price: number; // in INR
  categoryId: string;
  categoryName?: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes?: number;
}

export type OrderStatus =
  | 'Waiting for Manager'
  | 'Manager Accepted'
  | 'Manager Rejected'
  | 'Manager Timeout'
  | 'Waiting for Admin'
  | 'Admin Accepted'
  | 'Admin Rejected'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Waiting for Delivery Partner'
  | 'Delivery Assigned'
  | 'Picked Up'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'Cash on Delivery' | 'UPI / Online' | 'Card' | 'Wallet';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  actor: 'CUSTOMER' | 'MANAGER' | 'ADMIN' | 'DELIVERY_PARTNER' | 'SYSTEM';
  actorName?: string;
  note?: string;
}

export interface OrderDeliveryAddress {
  hostelOrPgName: string;
  roomNumber: string;
  landmark?: string;
  fullAddress: string;
}

export interface Order {
  id: string; // e.g. "FC1024"
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  assignedPartnerPhone?: string;
  orderStatus: OrderStatus;
  orderDateTime: string; // ISO string or formatted
  deliveryAddress: OrderDeliveryAddress;
  timeline: OrderTimelineEvent[];
  isTimeoutInterventionRequired?: boolean;
  timeoutAt?: string;
  cancellationReason?: string;
}

export type TargetAudience =
  | 'All Customers'
  | 'Selected Customers'
  | 'All Delivery Partners'
  | 'Selected Delivery Partners'
  | 'All Store Owners/Managers'
  | 'Selected Store Owners/Managers'
  | 'Customers of a Selected Store';

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  targetAudience: TargetAudience;
  storeId?: string;
  storeName?: string;
  selectedRecipientsCount?: number;
  sentAt: string;
  sentBy: string;
  status: 'Sent' | 'Failed';
}

export type DiscountType = 'Percentage' | 'Fixed Amount';

export interface Offer {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number; // percentage (e.g. 20 for 20%) or amount in INR (e.g. 50)
  minOrderValue: number;
  maxDiscount?: number; // for percentage discounts
  applicableStoreIds: string[]; // ['ALL'] or specific store IDs
  applicableStoreNames?: string[];
  startDate: string;
  endDate: string;
  status?: 'Active' | 'Inactive';
  isActive?: boolean;
  usageCount?: number;
  totalSavingsGiven?: number;
}

export interface SalesSummary {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalSales: number;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayActiveOrders: number;
  todayCompletedOrders: number;
  todayCancelledOrders: number;
}

export interface StoreSalesMetric {
  storeId: string;
  storeName: string;
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface TopSellingItem {
  itemId: string;
  itemName: string;
  storeName: string;
  price: number;
  unitsSold: number;
  revenue: number;
  isVeg: boolean;
}

export interface SalesTrendPoint {
  label: string;
  sales: number;
  orders: number;
}

export type SalesTimeframe = 'today' | 'week' | 'month' | 'year' | 'Today' | 'Last 7 days' | 'This month' | 'Custom date range';

export interface SystemSettings {
  managerOrderAcceptanceTimeoutMinutes: number;
  adminInterventionTimeoutMinutes: number;
  deliveryFeeBase: number;
  deliveryFeePerKm: number;
  freeDeliveryAbove: number;
  platformCommissionPercentage: number;
  systemNotifications: {
    notifyOnNewOrder: boolean;
    notifyOnTimeout: boolean;
    notifyOnCancellation: boolean;
    notifyOnPartnerOffline: boolean;
  };
}

export type NotificationTargetAudience =
  | 'All customers'
  | 'Selected customers'
  | 'All delivery partners'
  | 'Selected delivery partners'
  | 'All store owners/managers'
  | 'Selected store owners/managers'
  | 'Customers of a selected store';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: NotificationTargetAudience;
  targetStoreId?: string;
  targetStoreName?: string;
  sentAt: string;
  status: 'Sent' | 'Scheduled' | 'Failed';
}

export type StoreSalesBreakdown = StoreSalesMetric;
