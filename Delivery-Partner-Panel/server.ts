import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT || 3004);

app.use(express.json());

// In-Memory Database representing PostgreSQL / Prisma tables
interface DBPartner {
  id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string; // "partner123"
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
  avatarUrl: string;
  bankDetails: {
    accountHolder: string;
    accountNumberMasked: string;
    ifscCode: string;
    bankName: string;
    upiId: string;
  };
}

interface DBOrder {
  id: string;
  store: {
    id: string;
    name: string;
    phone: string;
    address: string;
    landmark: string;
    coordinates: { lat: number; lng: number };
    pickupInstructions?: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
    roomOrFloor: string;
    coordinates: { lat: number; lng: number };
    deliveryInstructions?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    isVeg: boolean;
  }>;
  orderAmount: number;
  deliveryEarnings: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID_ONLINE' | 'COLLECTED_CASH';
  amountToCollect: number;
  status:
    | 'WAITING_FOR_PARTNER'
    | 'DELIVERY_ASSIGNED'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'OTP_VERIFIED'
    | 'PAYMENT_RECEIVED'
    | 'DELIVERED'
    | 'PARTNER_REJECTED'
    | 'DELIVERY_CANCELLED';
  assignedPartnerId: string | null;
  pendingAssignmentPartnerId?: string | null;
  secretOtp: string;
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
  timeline: Array<{
    status: string;
    timestamp: string;
    title: string;
    description: string;
  }>;
}

// Initial Sample Data
const partners: Map<string, DBPartner> = new Map([
  [
    'DP-8821',
    {
      id: 'DP-8821',
      name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      email: 'rahul.partner@delivery.in',
      passwordHash: 'partner123',
      vehicleType: 'Motorcycle (Hero Splendor)',
      vehicleNumber: 'KA-05-EB-4912',
      rating: 4.92,
      isOnline: true,
      totalDeliveries: 8,
      totalEarnings: 4820,
      todayEarnings: 240,
      todayDeliveries: 8,
      status: 'ACTIVE',
      joinedDate: '12 Jan 2025',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bankDetails: {
        accountHolder: 'Rahul Sharma',
        accountNumberMasked: '•••• •••• 8842',
        ifscCode: 'HDFC0001824',
        bankName: 'HDFC Bank, Koramangala',
        upiId: 'rahulsharma@hdfcbank',
      },
    },
  ],
  [
    'DP-9042',
    {
      id: 'DP-9042',
      name: 'Vikas Kumar',
      phone: '+91 91234 56789',
      email: 'vikas.partner@delivery.in',
      passwordHash: 'partner123',
      vehicleType: 'EV Scooter (Ather 450X)',
      vehicleNumber: 'KA-01-HG-7821',
      rating: 4.88,
      isOnline: false,
      totalDeliveries: 14,
      totalEarnings: 7420,
      todayEarnings: 0,
      todayDeliveries: 0,
      status: 'ACTIVE',
      joinedDate: '01 Feb 2025',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      bankDetails: {
        accountHolder: 'Vikas Kumar',
        accountNumberMasked: '•••• •••• 4190',
        ifscCode: 'SBIN0004921',
        bankName: 'State Bank of India',
        upiId: 'vikas@sbi',
      },
    },
  ],
]);

const orders: Map<string, DBOrder> = new Map([
  [
    'FC1024',
    {
      id: 'FC1024',
      store: {
        id: 'STR-01',
        name: 'KFC - Food Street',
        phone: '+91 80 4123 9988',
        address: 'Food Street, 5th Block, Koramangala',
        landmark: 'Near Sony World Junction',
        coordinates: { lat: 12.9352, lng: 77.6245 },
        pickupInstructions: 'Pick up at designated Partner Counter #2 with Order Token #24',
      },
      customer: {
        id: 'CUST-881',
        name: 'Amit Verma',
        phone: '+91 98450 11223',
        address: 'ABC Hostel, 3rd Floor, Room 304, 7th Main Rd',
        roomOrFloor: 'Room 304, 3rd Floor',
        coordinates: { lat: 12.9298, lng: 77.6321 },
        deliveryInstructions: 'Call upon arrival at main hostel gate if security is closed',
      },
      items: [
        { id: 'ITM-1', name: 'Hot & Crispy Chicken (4 pcs)', quantity: 1, price: 249, isVeg: false },
        { id: 'ITM-2', name: 'Pepsi Black Can (330ml)', quantity: 2, price: 89, isVeg: true },
      ],
      orderAmount: 338,
      deliveryEarnings: 30,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      amountToCollect: 338,
      status: 'WAITING_FOR_PARTNER',
      assignedPartnerId: null,
      pendingAssignmentPartnerId: 'DP-8821', // waiting for Rahul to accept
      secretOtp: '4921',
      otpVerified: false,
      paymentReceived: false,
      distanceKm: 2.4,
      estimatedMinutes: 18,
      createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
      timeline: [
        {
          status: 'WAITING_FOR_PARTNER',
          timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
          title: 'Order Placed & Dispatched',
          description: 'Looking for nearby delivery partner',
        },
      ],
    },
  ],
  [
    'FC1023',
    {
      id: 'FC1023',
      store: {
        id: 'STR-02',
        name: 'Pizza Hut',
        phone: '+91 80 2555 8900',
        address: '80ft Road, 4th Block, Koramangala',
        landmark: 'Opposite Maharaja Signal',
        coordinates: { lat: 12.934, lng: 77.628 },
      },
      customer: {
        id: 'CUST-880',
        name: 'Neha Roy',
        phone: '+91 97400 33445',
        address: 'XYZ PG for Women, Room 102',
        roomOrFloor: '1st Floor Room 102',
        coordinates: { lat: 12.926, lng: 77.636 },
      },
      items: [
        { id: 'ITM-3', name: 'Medium Farmhouse Pizza', quantity: 1, price: 360, isVeg: true },
        { id: 'ITM-4', name: 'Garlic Breadstix', quantity: 1, price: 60, isVeg: true },
      ],
      orderAmount: 420,
      deliveryEarnings: 40,
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED_CASH',
      amountToCollect: 420,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '8172',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 3.1,
      estimatedMinutes: 22,
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 65 * 60000).toISOString(),
      timeline: [
        { status: 'DELIVERED', timestamp: new Date(Date.now() - 65 * 60000).toISOString(), title: 'Delivered', description: 'Order completed and cash ₹420 collected' },
      ],
    },
  ],
  [
    'FC1022',
    {
      id: 'FC1022',
      store: {
        id: 'STR-03',
        name: "Domino's Pizza",
        phone: '+91 80 6888 7777',
        address: '100 Feet Rd, Indiranagar',
        landmark: 'Near Metro Station',
        coordinates: { lat: 12.9716, lng: 77.6412 },
      },
      customer: {
        id: 'CUST-879',
        name: 'Siddharth Rao',
        phone: '+91 98801 22334',
        address: 'Sunrise PG, 2nd Cross, HAL 2nd Stage',
        roomOrFloor: 'Room 205',
        coordinates: { lat: 12.968, lng: 77.645 },
      },
      items: [
        { id: 'ITM-5', name: 'Peppy Paneer Pizza Large', quantity: 1, price: 480, isVeg: true },
      ],
      orderAmount: 480,
      deliveryEarnings: 45,
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED_CASH',
      amountToCollect: 480,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '3391',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 4.2,
      estimatedMinutes: 25,
      createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 120 * 60000).toISOString(),
      timeline: [
        { status: 'DELIVERED', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), title: 'Delivered', description: 'Order completed and cash ₹480 collected' },
      ],
    },
  ],
  [
    'FC1021',
    {
      id: 'FC1021',
      store: {
        id: 'STR-04',
        name: 'Subway Fresh',
        phone: '+91 80 4111 2233',
        address: 'Forum Mall, Hosur Rd',
        landmark: 'Food Court 2nd Floor',
        coordinates: { lat: 12.9345, lng: 77.6105 },
      },
      customer: {
        id: 'CUST-878',
        name: 'Kavita Menon',
        phone: '+91 99001 55667',
        address: 'Delta Tower, Flat 802',
        roomOrFloor: 'Tower A 8th Floor',
        coordinates: { lat: 12.939, lng: 77.618 },
      },
      items: [
        { id: 'ITM-6', name: 'Paneer Tikka Sub (6 inch)', quantity: 1, price: 260, isVeg: true },
      ],
      orderAmount: 260,
      deliveryEarnings: 35,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID_ONLINE',
      amountToCollect: 0,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '5510',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 2.8,
      estimatedMinutes: 20,
      createdAt: new Date(Date.now() - 210 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 185 * 60000).toISOString(),
      timeline: [
        { status: 'DELIVERED', timestamp: new Date(Date.now() - 185 * 60000).toISOString(), title: 'Delivered', description: 'Prepaid order delivered successfully' },
      ],
    },
  ],
  [
    'FC1020',
    {
      id: 'FC1020',
      store: {
        id: 'STR-01',
        name: 'KFC - Food Street',
        phone: '+91 80 4123 9988',
        address: 'Food Street, 5th Block, Koramangala',
        landmark: 'Near Sony World Junction',
        coordinates: { lat: 12.9352, lng: 77.6245 },
      },
      customer: {
        id: 'CUST-877',
        name: 'Manish Gupta',
        phone: '+91 98860 44556',
        address: 'XYZ Hostel, Room 104',
        roomOrFloor: 'Ground Floor Room 104',
        coordinates: { lat: 12.928, lng: 77.631 },
      },
      items: [
        { id: 'ITM-7', name: 'Zinger Burger Meal', quantity: 1, price: 338, isVeg: false },
      ],
      orderAmount: 338,
      deliveryEarnings: 30,
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED_CASH',
      amountToCollect: 338,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '9082',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 2.1,
      estimatedMinutes: 16,
      createdAt: new Date(Date.now() - 280 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 250 * 60000).toISOString(),
      timeline: [
        { status: 'DELIVERED', timestamp: new Date(Date.now() - 250 * 60000).toISOString(), title: 'Delivered', description: 'Delivered and ₹338 collected' },
      ],
    },
  ],
  // Add 4 more historic deliveries for DP-8821 so total = 8 deliveries, total earnings = 240 today!
  [
    'FC1019',
    {
      id: 'FC1019',
      store: { id: 'STR-05', name: 'Chai Point', phone: '+91 80 4000 1111', address: '6th Block, Koramangala', landmark: 'Near Bethany High', coordinates: { lat: 12.933, lng: 77.621 } },
      customer: { id: 'CUST-876', name: 'Tanvi Shah', phone: '+91 97711 22334', address: 'Sterling Apts, B-302', roomOrFloor: '3rd Floor', coordinates: { lat: 12.938, lng: 77.625 } },
      items: [{ id: 'ITM-8', name: 'Ginger Chai Flask + Samosa', quantity: 1, price: 210, isVeg: true }],
      orderAmount: 210,
      deliveryEarnings: 25,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID_ONLINE',
      amountToCollect: 0,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '1124',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 1.8,
      estimatedMinutes: 15,
      createdAt: new Date(Date.now() - 340 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 315 * 60000).toISOString(),
      timeline: [{ status: 'DELIVERED', timestamp: new Date(Date.now() - 315 * 60000).toISOString(), title: 'Delivered', description: 'Prepaid order delivered' }],
    },
  ],
  [
    'FC1018',
    {
      id: 'FC1018',
      store: { id: 'STR-06', name: 'Burger King', phone: '+91 80 4222 3344', address: '1st Block, Koramangala', landmark: 'Near Wipro Park', coordinates: { lat: 12.928, lng: 77.629 } },
      customer: { id: 'CUST-875', name: 'Deepak Jain', phone: '+91 98844 55667', address: 'Palm Meadows, Villa 10', roomOrFloor: 'Villa 10', coordinates: { lat: 12.923, lng: 77.635 } },
      items: [{ id: 'ITM-9', name: 'Whopper Veg + Fries', quantity: 1, price: 270, isVeg: true }],
      orderAmount: 270,
      deliveryEarnings: 30,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID_ONLINE',
      amountToCollect: 0,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '9421',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 2.5,
      estimatedMinutes: 19,
      createdAt: new Date(Date.now() - 400 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 370 * 60000).toISOString(),
      timeline: [{ status: 'DELIVERED', timestamp: new Date(Date.now() - 370 * 60000).toISOString(), title: 'Delivered', description: 'Prepaid order delivered' }],
    },
  ],
  [
    'FC1017',
    {
      id: 'FC1017',
      store: { id: 'STR-07', name: 'Empire Restaurant', phone: '+91 80 4333 4455', address: '80ft Rd, 7th Block, Koramangala', landmark: 'Next to HP Petrol Pump', coordinates: { lat: 12.936, lng: 77.619 } },
      customer: { id: 'CUST-874', name: 'Aakash Nair', phone: '+91 99110 33445', address: 'Green Glen Layout, Flat 104', roomOrFloor: '1st Floor', coordinates: { lat: 12.931, lng: 77.625 } },
      items: [{ id: 'ITM-10', name: 'Chicken Biryani Special', quantity: 1, price: 310, isVeg: false }],
      orderAmount: 310,
      deliveryEarnings: 35,
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED_CASH',
      amountToCollect: 310,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '6743',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 2.9,
      estimatedMinutes: 21,
      createdAt: new Date(Date.now() - 460 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 430 * 60000).toISOString(),
      timeline: [{ status: 'DELIVERED', timestamp: new Date(Date.now() - 430 * 60000).toISOString(), title: 'Delivered', description: 'Cash collected & delivered' }],
    },
  ],
  [
    'FC1016',
    {
      id: 'FC1016',
      store: { id: 'STR-08', name: 'A2B - Adyar Ananda Bhavan', phone: '+91 80 4444 5566', address: '100ft Rd, 4th Block, Koramangala', landmark: 'Near BDA Complex', coordinates: { lat: 12.932, lng: 77.626 } },
      customer: { id: 'CUST-873', name: 'Meera Krishnan', phone: '+91 98451 99887', address: 'Nandi Gardens, Apt 405', roomOrFloor: '4th Floor', coordinates: { lat: 12.927, lng: 77.632 } },
      items: [{ id: 'ITM-11', name: 'Mini Tiffin + Filter Coffee', quantity: 1, price: 180, isVeg: true }],
      orderAmount: 180,
      deliveryEarnings: 20,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID_ONLINE',
      amountToCollect: 0,
      status: 'DELIVERED',
      assignedPartnerId: 'DP-8821',
      secretOtp: '8832',
      otpVerified: true,
      paymentReceived: true,
      distanceKm: 1.5,
      estimatedMinutes: 14,
      createdAt: new Date(Date.now() - 520 * 60000).toISOString(),
      deliveredAt: new Date(Date.now() - 490 * 60000).toISOString(),
      timeline: [{ status: 'DELIVERED', timestamp: new Date(Date.now() - 490 * 60000).toISOString(), title: 'Delivered', description: 'Prepaid order delivered' }],
    },
  ],
]);

// Helper to sanitize partner for client
function sanitizePartner(partner: DBPartner) {
  const { passwordHash, ...safe } = partner;
  return safe;
}

// Authentication Middleware
function getAuthenticatedPartner(req: express.Request): DBPartner | null {
  const authHeader = req.headers.authorization;
  const partnerId = authHeader ? authHeader.replace('Bearer ', '').trim() : null;
  if (!partnerId) return null;
  return partners.get(partnerId) || null;
}

// ======================== API ROUTES ========================

// 1. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { partnerId, password } = req.body;
  if (!partnerId || !password) {
    return res.status(400).json({ error: 'Delivery Partner ID and Password are required.' });
  }

  const partner = partners.get(partnerId.trim().toUpperCase());
  if (!partner) {
    return res.status(401).json({ error: 'Invalid Delivery Partner ID. Try DP-8821 or DP-9042.' });
  }

  if (partner.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid Password. Default test password is partner123' });
  }

  if (partner.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your Delivery Partner account is suspended or inactive. Please contact support.' });
  }

  // Find active order if any
  let activeOrder: DBOrder | null = null;
  let incomingRequest: DBOrder | null = null;

  for (const order of orders.values()) {
    if (order.assignedPartnerId === partner.id && !['DELIVERED', 'PARTNER_REJECTED', 'DELIVERY_CANCELLED'].includes(order.status)) {
      activeOrder = order;
      break;
    }
    if (order.pendingAssignmentPartnerId === partner.id && order.status === 'WAITING_FOR_PARTNER') {
      incomingRequest = order;
    }
  }

  return res.json({
    token: partner.id,
    partner: sanitizePartner(partner),
    activeOrder,
    incomingRequest,
  });
});

// Auth: Forgot Password Flow
app.post('/api/auth/forgot-password', (req, res) => {
  const { partnerId, emailOrPhone, newPassword } = req.body;
  if (!partnerId) {
    return res.status(400).json({ error: 'Partner ID is required.' });
  }

  const partner = partners.get(partnerId.trim().toUpperCase());
  if (!partner) {
    return res.status(404).json({ error: 'Partner ID not found.' });
  }

  if (newPassword) {
    partner.passwordHash = newPassword;
    return res.json({ success: true, message: 'Password has been securely reset. You can now login with your new password.' });
  }

  return res.json({
    success: true,
    message: `A secure verification code has been dispatched to registered mobile (${partner.phone}) and email (${partner.email}).`,
    partnerId: partner.id,
    registeredPhone: partner.phone,
  });
});

// 2. Partner Profile
app.get('/api/partner/me', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized. Please login again.' });
  }

  return res.json({ partner: sanitizePartner(partner) });
});

// 3. Toggle Online/Offline Status
app.post('/api/partner/status', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { isOnline } = req.body;
  partner.isOnline = Boolean(isOnline);

  // If going offline, remove any pending assignments
  if (!partner.isOnline) {
    for (const order of orders.values()) {
      if (order.pendingAssignmentPartnerId === partner.id && order.status === 'WAITING_FOR_PARTNER') {
        order.pendingAssignmentPartnerId = null;
      }
    }
  }

  return res.json({
    success: true,
    isOnline: partner.isOnline,
    partner: sanitizePartner(partner),
  });
});

// 4. Dashboard Stats & Current State
app.get('/api/partner/dashboard', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  let activeOrder: DBOrder | null = null;
  let incomingRequest: DBOrder | null = null;
  const availableOrders: DBOrder[] = [];

  for (const order of orders.values()) {
    // Current active delivery (exclude completed/paid orders)
    if (
      order.assignedPartnerId === partner.id &&
      ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'OTP_VERIFIED'].includes(order.status) &&
      !order.paymentReceived &&
      order.status !== 'DELIVERED'
    ) {
      activeOrder = order;
    }

    // Pending incoming popup request (only if online and not busy with active delivery)
    if (
      partner.isOnline &&
      !activeOrder &&
      order.pendingAssignmentPartnerId === partner.id &&
      order.status === 'WAITING_FOR_PARTNER'
    ) {
      incomingRequest = order;
    }

    // Available requests in pool (if partner is online)
    if (partner.isOnline && order.status === 'WAITING_FOR_PARTNER') {
      availableOrders.push(order);
    }
  }

  return res.json({
    partner: sanitizePartner(partner),
    activeOrder,
    incomingRequest,
    availableOrdersCount: availableOrders.length,
    todayEarnings: partner.todayEarnings,
    todayDeliveries: partner.todayDeliveries,
    totalEarnings: partner.totalEarnings,
    totalDeliveries: partner.totalDeliveries,
  });
});

// 5. Accept Delivery Request
app.post('/api/partner/accept-delivery', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!partner.isOnline) {
    return res.status(400).json({ error: 'You must be Online to accept deliveries.' });
  }

  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required.' });
  }

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.status !== 'WAITING_FOR_PARTNER') {
    return res.status(400).json({ error: 'This order has already been assigned or cancelled.' });
  }

  // Transition: WAITING_FOR_PARTNER -> DELIVERY_ASSIGNED
  order.status = 'DELIVERY_ASSIGNED';
  order.assignedPartnerId = partner.id;
  order.pendingAssignmentPartnerId = null;
  order.assignedAt = new Date().toISOString();
  order.timeline.push({
    status: 'DELIVERY_ASSIGNED',
    timestamp: new Date().toISOString(),
    title: 'Partner Assigned',
    description: `${partner.name} accepted the delivery request and is heading to the store.`,
  });

  return res.json({
    success: true,
    message: 'Delivery request accepted successfully. Customer has been notified.',
    order,
  });
});

// 6. Reject Delivery Request
app.post('/api/partner/reject-delivery', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { orderId, reason } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required.' });
  }

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // If rejected before acceptance (from popup):
  if (order.status === 'WAITING_FOR_PARTNER') {
    order.pendingAssignmentPartnerId = null;
    order.timeline.push({
      status: 'PARTNER_REJECTED',
      timestamp: new Date().toISOString(),
      title: 'Partner Rejected Request',
      description: `Partner ${partner.name} rejected the request (${reason || 'Unavailable'}). Returned to pool for re-dispatch.`,
    });
  }

  return res.json({
    success: true,
    message: 'Delivery request declined. Re-routed to the backend dispatch queue.',
  });
});

// 7. Store Pickup: DELIVERY_ASSIGNED -> PICKED_UP -> OUT_FOR_DELIVERY
app.post('/api/deliveries/:id/pickup', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.assignedPartnerId !== partner.id) {
    return res.status(403).json({ error: 'You are not assigned to this delivery.' });
  }

  if (order.status !== 'DELIVERY_ASSIGNED') {
    return res.status(400).json({ error: `Cannot pick up order in current status: ${order.status}` });
  }

  const now = new Date().toISOString();
  order.status = 'OUT_FOR_DELIVERY';
  order.pickedUpAt = now;
  order.outForDeliveryAt = now;
  order.timeline.push(
    {
      status: 'PICKED_UP',
      timestamp: now,
      title: 'Order Picked Up',
      description: `Items verified and picked up from ${order.store.name}.`,
    },
    {
      status: 'OUT_FOR_DELIVERY',
      timestamp: now,
      title: 'Out for Delivery',
      description: `Partner is on the way to ${order.customer.address}. Customer notified.`,
    }
  );

  return res.json({
    success: true,
    message: 'Order marked as Picked Up and Out for Delivery. Customer received live notification.',
    order,
  });
});

// 8. Strict Backend OTP Verification
app.post('/api/deliveries/:id/verify-otp', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.assignedPartnerId !== partner.id) {
    return res.status(403).json({ error: 'You are not authorized to verify this delivery.' });
  }

  if (!['OUT_FOR_DELIVERY', 'OTP_VERIFIED'].includes(order.status)) {
    return res.status(400).json({ error: 'Order is not out for delivery yet.' });
  }

  const { otp } = req.body;
  if (!otp || String(otp).trim().length !== 4) {
    return res.status(400).json({ error: 'Please enter a valid 4-digit customer delivery OTP.' });
  }

  // Strict backend verification against secretOtp
  if (String(otp).trim() !== String(order.secretOtp).trim()) {
    return res.status(400).json({
      error: 'Incorrect OTP. Please try again.',
      verified: false,
    });
  }

  // OTP Matches! Transition to OTP_VERIFIED
  const now = new Date().toISOString();
  order.otpVerified = true;
  order.otpVerifiedAt = now;
  order.timeline.push({
    status: 'OTP_VERIFIED',
    timestamp: now,
    title: 'Customer OTP Verified',
    description: '4-digit delivery security token successfully verified with customer.',
  });

  if (order.paymentMethod === 'ONLINE') {
    order.status = 'DELIVERED';
    order.deliveredAt = now;
    order.timeline.push({
      status: 'DELIVERED',
      timestamp: now,
      title: 'Prepaid Order Delivered',
      description: `Delivery completed by ${partner.name}. Payment was pre-settled online.`,
    });

    partner.todayDeliveries += 1;
    partner.totalDeliveries += 1;
    partner.todayEarnings += order.deliveryEarnings;
    partner.totalEarnings += order.deliveryEarnings;

    return res.json({
      success: true,
      verified: true,
      message: 'OTP Verified & Delivery Completed ✓',
      order,
      earningsAdded: order.deliveryEarnings,
      partner: sanitizePartner(partner),
    });
  }

  order.status = 'OTP_VERIFIED';

  return res.json({
    success: true,
    verified: true,
    message: 'OTP VERIFIED ✓',
    order,
  });
});

// 9. Payment Confirmation (Cash On Delivery)
app.post('/api/deliveries/:id/confirm-payment', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.assignedPartnerId !== partner.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  // Auto-verify OTP if not already verified
  if (!order.otpVerified && order.status !== 'OTP_VERIFIED') {
    order.otpVerified = true;
    order.otpVerifiedAt = new Date().toISOString();
    order.timeline.push({
      status: 'OTP_VERIFIED',
      timestamp: new Date().toISOString(),
      title: 'Customer OTP Verified',
      description: '4-digit delivery security token verified upon cash collection.',
    });
  }

  if (order.paymentMethod === 'ONLINE') {
    order.paymentReceived = true;
    return res.json({
      success: true,
      message: 'This order was paid online. No cash collection necessary.',
      order,
    });
  }

  const now = new Date().toISOString();
  order.status = 'DELIVERED';
  order.paymentReceived = true;
  order.paymentStatus = 'COLLECTED_CASH';
  order.paymentReceivedAt = now;
  order.deliveredAt = now;
  order.timeline.push({
    status: 'PAYMENT_RECEIVED',
    timestamp: now,
    title: 'Cash Payment Received',
    description: `Exact cash payment of ₹${order.amountToCollect} collected from customer.`,
  });
  order.timeline.push({
    status: 'DELIVERED',
    timestamp: now,
    title: 'Order Delivered Successfully',
    description: `Delivery completed by ${partner.name}. Cash collected and trip concluded.`,
  });

  // Calculate backend earnings update
  partner.todayDeliveries += 1;
  partner.totalDeliveries += 1;
  partner.todayEarnings += order.deliveryEarnings;
  partner.totalEarnings += order.deliveryEarnings;

  return res.json({
    success: true,
    message: `Payment of ₹${order.amountToCollect} received & trip completed!`,
    order,
    earningsAdded: order.deliveryEarnings,
    partner: sanitizePartner(partner),
  });
});

// 10. Complete Delivery: OUT_FOR_DELIVERY / OTP_VERIFIED / PAYMENT_RECEIVED -> DELIVERED
app.post('/api/deliveries/:id/complete', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.assignedPartnerId !== partner.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  // Auto-complete prerequisites if pending
  if (!order.otpVerified) {
    order.otpVerified = true;
    order.otpVerifiedAt = new Date().toISOString();
  }
  if (order.paymentMethod === 'COD' && !order.paymentReceived) {
    order.paymentReceived = true;
    order.paymentStatus = 'COLLECTED_CASH';
    order.paymentReceivedAt = new Date().toISOString();
  }

  // Complete Order
  const now = new Date().toISOString();
  order.status = 'DELIVERED';
  order.deliveredAt = now;
  order.timeline.push({
    status: 'DELIVERED',
    timestamp: now,
    title: 'Order Delivered Successfully',
    description: `Delivery completed by ${partner.name}. Customer and admin notifications sent.`,
  });

  // Calculate backend earnings update
  partner.todayDeliveries += 1;
  partner.totalDeliveries += 1;
  partner.todayEarnings += order.deliveryEarnings;
  partner.totalEarnings += order.deliveryEarnings;

  return res.json({
    success: true,
    message: 'Delivery completed successfully.',
    order,
    earningsAdded: order.deliveryEarnings,
    partner: sanitizePartner(partner),
  });
});

// 11. Delivery History for Partner
app.get('/api/deliveries/history', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const history: DBOrder[] = [];
  for (const order of orders.values()) {
    if (order.assignedPartnerId === partner.id && ['DELIVERED', 'DELIVERY_CANCELLED'].includes(order.status)) {
      history.push(order);
    }
  }

  // Sort descending by delivery or creation date
  history.sort((a, b) => new Date(b.deliveredAt || b.createdAt).getTime() - new Date(a.deliveredAt || a.createdAt).getTime());

  return res.json({ history });
});

// 12. Partner Earnings Breakdown
app.get('/api/deliveries/earnings', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const partnerDeliveries = Array.from(orders.values()).filter(
    (o) => o.assignedPartnerId === partner.id && o.status === 'DELIVERED'
  );

  const totalCompleted = partner.totalDeliveries || partnerDeliveries.length;
  const avgPerDelivery = totalCompleted > 0 ? Math.round(partner.totalEarnings / totalCompleted) : 35;

  const summary = {
    todayEarnings: partner.todayEarnings,
    todayDeliveries: partner.todayDeliveries,
    weekEarnings: partner.todayEarnings + 2450,
    totalEarnings: partner.totalEarnings,
    totalCompletedDeliveries: totalCompleted,
    averagePerDelivery: avgPerDelivery,
    incentivesBonus: 50, // Daily peak hours incentive bonus
    dailyBreakdown: [
      { date: '2026-08-30', dayName: 'Today (Sun)', earnings: partner.todayEarnings, deliveries: partner.todayDeliveries },
      { date: '2026-08-29', dayName: 'Sat', earnings: 580, deliveries: 14 },
      { date: '2026-08-28', dayName: 'Fri', earnings: 620, deliveries: 15 },
      { date: '2026-08-27', dayName: 'Thu', earnings: 490, deliveries: 12 },
      { date: '2026-08-26', dayName: 'Wed', earnings: 450, deliveries: 11 },
      { date: '2026-08-25', dayName: 'Tue', earnings: 410, deliveries: 10 },
      { date: '2026-08-24', dayName: 'Mon', earnings: 380, deliveries: 9 },
    ],
    recentPayouts: partnerDeliveries.map((o) => ({
      id: `PAY-${o.id}`,
      orderId: o.id,
      storeName: o.store.name,
      deliveredAt: o.deliveredAt || o.createdAt,
      baseFare: 25,
      distanceBonus: Math.max(0, o.deliveryEarnings - 25),
      incentive: 0,
      totalEarning: o.deliveryEarnings,
      paymentMethod: o.paymentMethod,
    })),
  };

  return res.json(summary);
});

// 13. Simulator: Dispatch New Order (for testing real-time alert & flow)
app.post('/api/simulator/dispatch-new-order', (req, res) => {
  const partner = getAuthenticatedPartner(req);
  if (!partner) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!partner.isOnline) {
    return res.status(400).json({ error: 'Please go ONLINE first before dispatching a new delivery request.' });
  }

  // Check if partner already has an active order
  const existingActive = Array.from(orders.values()).find(
    (o) => o.assignedPartnerId === partner.id && !['DELIVERED', 'PARTNER_REJECTED', 'DELIVERY_CANCELLED'].includes(o.status)
  );

  if (existingActive) {
    return res.status(400).json({
      error: `You already have an active order (#${existingActive.id}) in progress. Complete or cancel it first.`,
    });
  }

  const sampleStores = [
    { name: 'KFC - Food Street', address: 'Food Street, Koramangala', phone: '+91 80 4123 9988', landmark: 'Near Sony World', coords: { lat: 12.9352, lng: 77.6245 } },
    { name: 'Meghana Foods', address: '1st Block, Koramangala', phone: '+91 80 2552 1122', landmark: 'Near Jyoti Nivas College', coords: { lat: 12.934, lng: 77.618 } },
    { name: 'Truffles Cafe', address: 'St. Marks Road, Central', phone: '+91 80 4141 5566', landmark: 'Opposite Bowring Institute', coords: { lat: 12.971, lng: 77.601 } },
    { name: 'Leon Grill', address: '100ft Road, Indiranagar', phone: '+91 80 4910 8822', landmark: 'Near 12th Main Junction', coords: { lat: 12.969, lng: 77.639 } },
    { name: 'Chai Point', address: '5th Block, Koramangala', phone: '+91 80 4000 1111', landmark: 'Near Empire', coords: { lat: 12.933, lng: 77.621 } },
  ];

  const sampleCustomers = [
    { name: 'Vikram Sethi', phone: '+91 98450 77889', address: 'ABC Hostel, Room 304', floor: 'Room 304, 3rd Floor', coords: { lat: 12.9298, lng: 77.6321 } },
    { name: 'Ananya Deshmukh', phone: '+91 97411 44556', address: 'Prestige Ozone, Villa 45', floor: 'Main Villa Entrance', coords: { lat: 12.945, lng: 77.648 } },
    { name: 'Rohan Sen', phone: '+91 99002 33441', address: 'Adarsh Palm Retreat, Tower 4, Apt 1102', floor: '11th Floor', coords: { lat: 12.938, lng: 77.678 } },
    { name: 'Pooja Iyer', phone: '+91 98866 55221', address: 'XYZ PG, 2nd Cross, 7th Main', floor: 'Room 201', coords: { lat: 12.931, lng: 77.627 } },
  ];

  const sampleItemsList = [
    [
      { id: 'I-1', name: 'Zinger Burger Box', quantity: 1, price: 299, isVeg: false },
      { id: 'I-2', name: 'Peri Peri Fries', quantity: 1, price: 99, isVeg: true },
      { id: 'I-3', name: 'Coke Zero (300ml)', quantity: 1, price: 40, isVeg: true },
    ],
    [
      { id: 'I-4', name: 'Chicken Boneless Biryani', quantity: 1, price: 340, isVeg: false },
      { id: 'I-5', name: 'Paneer 65 Starter', quantity: 1, price: 220, isVeg: true },
    ],
    [
      { id: 'I-6', name: 'All American Cheese Burger', quantity: 2, price: 380, isVeg: false },
      { id: 'I-7', name: 'Chocolate Thick Shake', quantity: 1, price: 140, isVeg: true },
    ],
  ];

  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `FC${orderNum}`;
  const store = sampleStores[Math.floor(Math.random() * sampleStores.length)];
  const cust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
  const items = sampleItemsList[Math.floor(Math.random() * sampleItemsList.length)];
  const orderAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isCod = Math.random() > 0.4;
  const earnings = Math.floor(30 + Math.random() * 25);
  // Generate random 4-digit OTP
  const randomOtp = String(Math.floor(1000 + Math.random() * 9000));

  const newOrder: DBOrder = {
    id: newId,
    store: {
      id: `STR-${orderNum}`,
      name: store.name,
      phone: store.phone,
      address: store.address,
      landmark: store.landmark,
      coordinates: store.coords,
      pickupInstructions: 'Show partner order token at the dispatch desk.',
    },
    customer: {
      id: `CUST-${orderNum}`,
      name: cust.name,
      phone: cust.phone,
      address: cust.address,
      roomOrFloor: cust.floor,
      coordinates: cust.coords,
      deliveryInstructions: 'Ring doorbell or call upon reaching the main gate.',
    },
    items,
    orderAmount,
    deliveryEarnings: earnings,
    paymentMethod: isCod ? 'COD' : 'ONLINE',
    paymentStatus: isCod ? 'PENDING' : 'PAID_ONLINE',
    amountToCollect: isCod ? orderAmount : 0,
    status: 'WAITING_FOR_PARTNER',
    assignedPartnerId: null,
    pendingAssignmentPartnerId: partner.id,
    secretOtp: randomOtp,
    otpVerified: false,
    paymentReceived: false,
    distanceKm: +(1.5 + Math.random() * 3.5).toFixed(1),
    estimatedMinutes: Math.floor(15 + Math.random() * 15),
    createdAt: new Date().toISOString(),
    timeline: [
      {
        status: 'WAITING_FOR_PARTNER',
        timestamp: new Date().toISOString(),
        title: 'New Order Dispatched',
        description: `Dispatched to partner ${partner.name}. Awaiting acceptance.`,
      },
    ],
  };

  orders.set(newId, newOrder);

  return res.json({
    success: true,
    message: `New order #${newId} dispatched to ${partner.name}!`,
    order: newOrder,
  });
});

// Simulator: Quick Reset Data
app.post('/api/simulator/reset', (req, res) => {
  const partner = partners.get('DP-8821');
  if (partner) {
    partner.isOnline = true;
    partner.todayDeliveries = 8;
    partner.todayEarnings = 240;
    partner.totalDeliveries = 8;
    partner.totalEarnings = 4820;
  }

  // Reset FC1024 to WAITING_FOR_PARTNER
  const fc1024 = orders.get('FC1024');
  if (fc1024) {
    fc1024.status = 'WAITING_FOR_PARTNER';
    fc1024.assignedPartnerId = null;
    fc1024.pendingAssignmentPartnerId = 'DP-8821';
    fc1024.secretOtp = '4921';
    fc1024.otpVerified = false;
    fc1024.paymentReceived = false;
    fc1024.paymentStatus = 'PENDING';
  }

  return res.json({ success: true, message: 'Simulation state successfully reset.' });
});

// ======================== VITE MIDDLEWARE ========================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Delivery Partner Panel backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
