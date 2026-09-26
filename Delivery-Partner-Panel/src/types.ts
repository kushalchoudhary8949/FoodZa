export type DeliveryStatus =
  | 'WAITING_FOR_PARTNER'
  | 'DELIVERY_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'OTP_VERIFIED'
  | 'PAYMENT_RECEIVED'
  | 'DELIVERED'
  | 'PARTNER_REJECTED'
  | 'DELIVERY_CANCELLED';

export type PaymentMethod = 'COD' | 'ONLINE';

export type PaymentStatus = 'PENDING' | 'PAID_ONLINE' | 'COLLECTED_CASH';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isVeg: boolean;
}

export interface StoreDetails {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  pickupInstructions?: string;
}

export interface CustomerDetails {
  id: string;
  name: string;
  phone: string;
  address: string;
  roomOrFloor: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  deliveryInstructions?: string;
}

export interface TimelineEvent {
  status: DeliveryStatus;
  timestamp: string;
  title: string;
  description: string;
}

export interface Order {
  id: string;
  store: StoreDetails;
  customer: CustomerDetails;
  items: OrderItem[];
  orderAmount: number;
  deliveryEarnings: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountToCollect: number;
  status: DeliveryStatus;
  assignedPartnerId: string | null;
  secretOtp: string; // 4-digit code stored in backend
  otpVerified: boolean;
  paymentReceived: boolean;
  distanceKm: number;
  estimatedMinutes: number;
  createdAt: string;
  assignedAt?: string;
  pickedUpAt?: string;
  outForDeliveryAt?: string;
  otpVerifiedAt?: string;
  paymentReceivedAt?: string;
  deliveredAt?: string;
  timeline: TimelineEvent[];
}

export interface PartnerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  isOnline: boolean;
  totalDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
  todayDeliveries: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  joinedDate: string;
  avatarUrl?: string;
  bankDetails: {
    accountHolder: string;
    accountNumberMasked: string;
    ifscCode: string;
    bankName: string;
    upiId: string;
  };
}

export interface EarningsSummary {
  todayEarnings: number;
  todayDeliveries: number;
  weekEarnings: number;
  totalEarnings: number;
  totalCompletedDeliveries: number;
  averagePerDelivery: number;
  incentivesBonus: number;
  dailyBreakdown: Array<{
    date: string;
    dayName: string;
    earnings: number;
    deliveries: number;
  }>;
  recentPayouts: Array<{
    id: string;
    orderId: string;
    storeName: string;
    deliveredAt: string;
    baseFare: number;
    distanceBonus: number;
    incentive: number;
    totalEarning: number;
    paymentMethod: PaymentMethod;
  }>;
}

export type ActiveTab =
  | 'dashboard'
  | 'deliveries'
  | 'current_delivery'
  | 'history'
  | 'earnings'
  | 'profile';
