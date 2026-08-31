// ════════════════════════════════════════════════════════════════════════
// FoodConnect — Seed Data
// ════════════════════════════════════════════════════════════════════════
// Creates realistic development data covering all models and order states.
// Run with: npx prisma db seed
// ════════════════════════════════════════════════════════════════════════

import { PrismaClient, UserRole, FoodType, OrderStatus, PaymentMethod, PaymentStatus, DeliveryRequestStatus, DiscountType, OnlineStatus, NotificationType, IssueCategory, IssueStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function generateOrderNumber(index: number): string {
  const dateStr = '20260831';
  return `FC-${dateStr}-${String(index).padStart(4, '0')}`;
}

async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// ──────────────────────────────────────────────────────────
// Main seed function
// ──────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting FoodConnect seed...\n');

  // ──────────────────────────────────────────────────────
  // 1. USERS
  // ──────────────────────────────────────────────────────
  console.log('👤 Creating users...');

  const adminUser = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_admin_001',
      name: 'Rahul Sharma',
      phone: '+919876543210',
      email: 'admin@foodconnect.dev',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const managerUser1 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_manager_001',
      name: 'Priya Patel',
      phone: '+919876543211',
      email: 'priya.kfc@foodconnect.dev',
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  const managerUser2 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_manager_002',
      name: 'Amit Verma',
      phone: '+919876543212',
      email: 'amit.pizzahut@foodconnect.dev',
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  const managerUser3 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_manager_003',
      name: 'Sneha Gupta',
      phone: '+919876543213',
      email: 'sneha.subway@foodconnect.dev',
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  const customerUser1 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_customer_001',
      name: 'Arjun Mehta',
      phone: '+919876543214',
      email: 'arjun@example.com',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  const customerUser2 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_customer_002',
      name: 'Kavya Nair',
      phone: '+919876543215',
      email: 'kavya@example.com',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  const customerUser3 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_customer_003',
      name: 'Rohan Singh',
      phone: '+919876543216',
      email: 'rohan@example.com',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  const partnerUser1 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_partner_001',
      name: 'Vikram Yadav',
      phone: '+919876543217',
      email: 'vikram.delivery@example.com',
      role: UserRole.DELIVERY_PARTNER,
      isActive: true,
    },
  });

  const partnerUser2 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_partner_002',
      name: 'Suresh Kumar',
      phone: '+919876543218',
      email: 'suresh.delivery@example.com',
      role: UserRole.DELIVERY_PARTNER,
      isActive: true,
    },
  });

  const partnerUser3 = await prisma.user.create({
    data: {
      firebaseUid: 'firebase_partner_003',
      name: 'Deepak Joshi',
      phone: '+919876543219',
      email: 'deepak.delivery@example.com',
      role: UserRole.DELIVERY_PARTNER,
      isActive: true,
    },
  });

  console.log(`  ✅ Created ${10} users`);

  // ──────────────────────────────────────────────────────
  // 2. CUSTOMERS
  // ──────────────────────────────────────────────────────
  console.log('🛒 Creating customers...');

  const customer1 = await prisma.customer.create({
    data: {
      userId: customerUser1.id,
      name: 'Arjun Mehta',
      phone: '+919876543214',
      hostelOrPgName: 'Sunrise Hostel',
      roomNumber: 'A-204',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: customerUser2.id,
      name: 'Kavya Nair',
      phone: '+919876543215',
      hostelOrPgName: 'Green Valley PG',
      roomNumber: 'B-112',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: customerUser3.id,
      name: 'Rohan Singh',
      phone: '+919876543216',
      hostelOrPgName: 'Blue Residency',
      roomNumber: 'C-301',
    },
  });

  console.log(`  ✅ Created 3 customers`);

  // ──────────────────────────────────────────────────────
  // 3. ADDRESSES
  // ──────────────────────────────────────────────────────
  console.log('📍 Creating addresses...');

  const address1 = await prisma.address.create({
    data: {
      customerId: customer1.id,
      label: 'Hostel',
      addressLine: 'Sunrise Hostel, Near Main Gate, University Road',
      hostelOrPgName: 'Sunrise Hostel',
      roomNumber: 'A-204',
      landmark: 'Near University Main Gate',
      latitude: new Decimal('12.9716'),
      longitude: new Decimal('77.5946'),
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      customerId: customer1.id,
      label: 'Home',
      addressLine: '42, MG Road, Koramangala',
      landmark: 'Near Forum Mall',
      latitude: new Decimal('12.9352'),
      longitude: new Decimal('77.6245'),
      isDefault: false,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      customerId: customer2.id,
      label: 'PG',
      addressLine: 'Green Valley PG, 3rd Cross, Indiranagar',
      hostelOrPgName: 'Green Valley PG',
      roomNumber: 'B-112',
      landmark: 'Near Metro Station',
      latitude: new Decimal('12.9784'),
      longitude: new Decimal('77.6408'),
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      customerId: customer2.id,
      label: 'Office',
      addressLine: 'Tech Park, Whitefield',
      landmark: 'Near ITPB Main Gate',
      latitude: new Decimal('12.9698'),
      longitude: new Decimal('77.7500'),
      isDefault: false,
    },
  });

  const address3 = await prisma.address.create({
    data: {
      customerId: customer3.id,
      label: 'Hostel',
      addressLine: 'Blue Residency, HSR Layout',
      hostelOrPgName: 'Blue Residency',
      roomNumber: 'C-301',
      landmark: 'Near Agara Lake',
      latitude: new Decimal('12.9121'),
      longitude: new Decimal('77.6446'),
      isDefault: true,
    },
  });

  console.log(`  ✅ Created 5 addresses`);

  // ──────────────────────────────────────────────────────
  // 4. RESTAURANTS
  // ──────────────────────────────────────────────────────
  console.log('🍽️  Creating restaurants...');

  const kfc = await prisma.restaurant.create({
    data: {
      name: 'KFC',
      slug: 'kfc',
      description: 'Finger Lickin\' Good — Kentucky Fried Chicken',
      imageUrl: 'https://placeholder.dev/kfc-logo.png',
      phone: '+918001234567',
      address: 'MG Road, Bengaluru',
      latitude: new Decimal('12.9750'),
      longitude: new Decimal('77.6066'),
      openingTime: '10:00',
      closingTime: '23:00',
      isOpen: true,
      isActive: true,
    },
  });

  const pizzaHut = await prisma.restaurant.create({
    data: {
      name: 'Pizza Hut',
      slug: 'pizza-hut',
      description: 'Make it great — freshly baked pizzas and more',
      imageUrl: 'https://placeholder.dev/pizzahut-logo.png',
      phone: '+918001234568',
      address: 'Indiranagar, Bengaluru',
      latitude: new Decimal('12.9784'),
      longitude: new Decimal('77.6408'),
      openingTime: '11:00',
      closingTime: '23:30',
      isOpen: true,
      isActive: true,
    },
  });

  const subway = await prisma.restaurant.create({
    data: {
      name: 'Subway',
      slug: 'subway',
      description: 'Eat Fresh — freshly made subs, wraps, and salads',
      imageUrl: 'https://placeholder.dev/subway-logo.png',
      phone: '+918001234569',
      address: 'HSR Layout, Bengaluru',
      latitude: new Decimal('12.9121'),
      longitude: new Decimal('77.6446'),
      openingTime: '09:00',
      closingTime: '22:00',
      isOpen: true,
      isActive: true,
    },
  });

  console.log(`  ✅ Created 3 restaurants`);

  // ──────────────────────────────────────────────────────
  // 5. MANAGERS
  // ──────────────────────────────────────────────────────
  console.log('👔 Creating managers...');

  await prisma.manager.create({
    data: { userId: managerUser1.id, restaurantId: kfc.id, isActive: true },
  });

  await prisma.manager.create({
    data: { userId: managerUser2.id, restaurantId: pizzaHut.id, isActive: true },
  });

  await prisma.manager.create({
    data: { userId: managerUser3.id, restaurantId: subway.id, isActive: true },
  });

  console.log(`  ✅ Created 3 managers`);

  // ──────────────────────────────────────────────────────
  // 6. MENU CATEGORIES
  // ──────────────────────────────────────────────────────
  console.log('📂 Creating menu categories...');

  // KFC categories
  const kfcBurgers = await prisma.menuCategory.create({
    data: { restaurantId: kfc.id, name: 'Burgers', description: 'Crispy chicken burgers', displayOrder: 1 },
  });
  const kfcChicken = await prisma.menuCategory.create({
    data: { restaurantId: kfc.id, name: 'Chicken', description: 'Fried & grilled chicken', displayOrder: 2 },
  });
  const kfcSides = await prisma.menuCategory.create({
    data: { restaurantId: kfc.id, name: 'Sides & Snacks', description: 'Fries, coleslaw, and more', displayOrder: 3 },
  });
  const kfcDrinks = await prisma.menuCategory.create({
    data: { restaurantId: kfc.id, name: 'Beverages', description: 'Cold drinks and shakes', displayOrder: 4 },
  });

  // Pizza Hut categories
  const phPizzas = await prisma.menuCategory.create({
    data: { restaurantId: pizzaHut.id, name: 'Pizzas', description: 'Hand-tossed and pan pizzas', displayOrder: 1 },
  });
  const phSides = await prisma.menuCategory.create({
    data: { restaurantId: pizzaHut.id, name: 'Sides', description: 'Garlic bread, wedges, and more', displayOrder: 2 },
  });
  const phDesserts = await prisma.menuCategory.create({
    data: { restaurantId: pizzaHut.id, name: 'Desserts', description: 'Sweet treats', displayOrder: 3 },
  });
  const phDrinks = await prisma.menuCategory.create({
    data: { restaurantId: pizzaHut.id, name: 'Beverages', description: 'Drinks and smoothies', displayOrder: 4 },
  });

  // Subway categories
  const subSubs = await prisma.menuCategory.create({
    data: { restaurantId: subway.id, name: 'Subs', description: 'Freshly made submarine sandwiches', displayOrder: 1 },
  });
  const subWraps = await prisma.menuCategory.create({
    data: { restaurantId: subway.id, name: 'Wraps', description: 'Tortilla-wrapped goodness', displayOrder: 2 },
  });
  const subSalads = await prisma.menuCategory.create({
    data: { restaurantId: subway.id, name: 'Salads', description: 'Fresh salads', displayOrder: 3 },
  });
  const subDrinks = await prisma.menuCategory.create({
    data: { restaurantId: subway.id, name: 'Beverages', description: 'Drinks and cookies', displayOrder: 4 },
  });

  console.log(`  ✅ Created 12 menu categories`);

  // ──────────────────────────────────────────────────────
  // 7. MENU ITEMS
  // ──────────────────────────────────────────────────────
  console.log('🍔 Creating menu items...');

  // KFC items
  const kfcItem1 = await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcBurgers.id, name: 'Classic Chicken Burger', description: 'Crispy chicken fillet with mayo and lettuce', price: new Decimal('129.00'), foodType: FoodType.NON_VEG },
  });
  const kfcItem2 = await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcBurgers.id, name: 'Zinger Burger', description: 'Spicy crispy chicken with jalapeno mayo', price: new Decimal('199.00'), foodType: FoodType.NON_VEG },
  });
  const kfcItem3 = await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcBurgers.id, name: 'Veg Zinger', description: 'Crispy veg patty with spicy mayo', price: new Decimal('169.00'), foodType: FoodType.VEG },
  });
  const kfcItem4 = await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcChicken.id, name: 'Hot Wings (6 pcs)', description: '6 pieces of spicy hot wings', price: new Decimal('249.00'), foodType: FoodType.NON_VEG },
  });
  const kfcItem5 = await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcChicken.id, name: 'Popcorn Chicken', description: 'Bite-sized crispy chicken pieces', price: new Decimal('179.00'), foodType: FoodType.NON_VEG },
  });
  const kfcItem6 = await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcSides.id, name: 'French Fries (Regular)', description: 'Crispy golden fries', price: new Decimal('99.00'), foodType: FoodType.VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcSides.id, name: 'Coleslaw', description: 'Fresh creamy coleslaw', price: new Decimal('79.00'), foodType: FoodType.VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: kfc.id, categoryId: kfcDrinks.id, name: 'Pepsi (Regular)', description: '300ml Pepsi', price: new Decimal('59.00'), foodType: FoodType.VEG },
  });

  // Pizza Hut items
  const phItem1 = await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phPizzas.id, name: 'Margherita Pizza', description: 'Classic cheese pizza with tomato sauce', price: new Decimal('249.00'), foodType: FoodType.VEG },
  });
  const phItem2 = await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phPizzas.id, name: 'Chicken Supreme', description: 'Loaded with chicken tikka, peppers, onions', price: new Decimal('449.00'), foodType: FoodType.NON_VEG },
  });
  const phItem3 = await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phPizzas.id, name: 'Farm House', description: 'Bell peppers, mushrooms, onions, tomatoes', price: new Decimal('349.00'), foodType: FoodType.VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phPizzas.id, name: 'Pepperoni Feast', description: 'Loaded with pepperoni slices', price: new Decimal('499.00'), foodType: FoodType.NON_VEG },
  });
  const phItem5 = await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phSides.id, name: 'Garlic Breadsticks', description: '4 pieces of buttery garlic bread', price: new Decimal('129.00'), foodType: FoodType.VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phDesserts.id, name: 'Choco Lava Cake', description: 'Warm chocolate cake with molten center', price: new Decimal('109.00'), foodType: FoodType.VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: pizzaHut.id, categoryId: phDrinks.id, name: 'Mojito', description: 'Refreshing mint lime mojito', price: new Decimal('89.00'), foodType: FoodType.VEG },
  });

  // Subway items
  const subItem1 = await prisma.menuItem.create({
    data: { restaurantId: subway.id, categoryId: subSubs.id, name: 'Chicken Teriyaki Sub', description: 'Teriyaki glazed chicken with fresh veggies', price: new Decimal('299.00'), foodType: FoodType.NON_VEG },
  });
  const subItem2 = await prisma.menuItem.create({
    data: { restaurantId: subway.id, categoryId: subSubs.id, name: 'Veggie Delight', description: 'Fresh vegetables with your choice of sauce', price: new Decimal('199.00'), foodType: FoodType.VEG },
  });
  const subItem3 = await prisma.menuItem.create({
    data: { restaurantId: subway.id, categoryId: subSubs.id, name: 'Italian BMT', description: 'Pepperoni, salami, and ham', price: new Decimal('349.00'), foodType: FoodType.NON_VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: subway.id, categoryId: subWraps.id, name: 'Chicken Tikka Wrap', description: 'Spicy chicken tikka in a tortilla wrap', price: new Decimal('249.00'), foodType: FoodType.NON_VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: subway.id, categoryId: subSalads.id, name: 'Caesar Salad', description: 'Romaine lettuce with caesar dressing', price: new Decimal('179.00'), foodType: FoodType.VEG },
  });
  await prisma.menuItem.create({
    data: { restaurantId: subway.id, categoryId: subDrinks.id, name: 'Cookie (Chocolate Chip)', description: 'Freshly baked chocolate chip cookie', price: new Decimal('49.00'), foodType: FoodType.VEG },
  });

  console.log(`  ✅ Created 22 menu items`);

  // ──────────────────────────────────────────────────────
  // 8. DELIVERY PARTNERS
  // ──────────────────────────────────────────────────────
  console.log('🛵 Creating delivery partners...');

  const partner1 = await prisma.deliveryPartner.create({
    data: { userId: partnerUser1.id, phone: '+919876543217', onlineStatus: OnlineStatus.ONLINE, isActive: true, totalDeliveries: 152, totalEarnings: new Decimal('15200.00') },
  });

  const partner2 = await prisma.deliveryPartner.create({
    data: { userId: partnerUser2.id, phone: '+919876543218', onlineStatus: OnlineStatus.ONLINE, isActive: true, totalDeliveries: 89, totalEarnings: new Decimal('8900.00') },
  });

  const partner3 = await prisma.deliveryPartner.create({
    data: { userId: partnerUser3.id, phone: '+919876543219', onlineStatus: OnlineStatus.OFFLINE, isActive: true, totalDeliveries: 45, totalEarnings: new Decimal('4500.00') },
  });

  console.log(`  ✅ Created 3 delivery partners`);

  // ──────────────────────────────────────────────────────
  // 9. OFFERS
  // ──────────────────────────────────────────────────────
  console.log('🎫 Creating offers...');

  const offer1 = await prisma.offer.create({
    data: {
      name: 'Welcome Offer',
      description: 'Get 20% off on your first order!',
      code: 'WELCOME20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: new Decimal('20.00'),
      minimumOrderAmount: new Decimal('200.00'),
      maximumDiscount: new Decimal('100.00'),
      restaurantId: null, // Platform-wide
      startAt: new Date('2026-01-01'),
      endAt: new Date('2027-12-31'),
      isActive: true,
    },
  });

  await prisma.offer.create({
    data: {
      name: 'KFC Special',
      description: 'Flat ₹50 off on KFC orders',
      code: 'KFC50',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: new Decimal('50.00'),
      minimumOrderAmount: new Decimal('300.00'),
      maximumDiscount: null,
      restaurantId: kfc.id,
      startAt: new Date('2026-08-01'),
      endAt: new Date('2026-09-30'),
      isActive: true,
    },
  });

  await prisma.offer.create({
    data: {
      name: 'Pizza Party',
      description: '15% off on Pizza Hut orders above ₹500',
      code: 'PIZZA15',
      discountType: DiscountType.PERCENTAGE,
      discountValue: new Decimal('15.00'),
      minimumOrderAmount: new Decimal('500.00'),
      maximumDiscount: new Decimal('150.00'),
      restaurantId: pizzaHut.id,
      startAt: new Date('2026-08-01'),
      endAt: new Date('2026-10-31'),
      isActive: true,
    },
  });

  console.log(`  ✅ Created 3 offers`);

  // ──────────────────────────────────────────────────────
  // 10. ORDERS (covering all statuses)
  // ──────────────────────────────────────────────────────
  console.log('📦 Creating orders...');

  // Helper to create order + items + payment + events
  async function createOrder(params: {
    orderNumber: string;
    customerId: string;
    restaurantId: string;
    deliveryPartnerId?: string;
    addressId?: string;
    deliveryAddress: string;
    hostelOrPgName?: string;
    roomNumber?: string;
    items: { menuItemId: string; name: string; price: number; qty: number }[];
    deliveryFee: number;
    discountAmount?: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
    managerResponseDeadline?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    preparedAt?: Date;
    readyAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    events: { type: string; prevStatus?: OrderStatus; newStatus?: OrderStatus; actorId?: string; createdAt?: Date }[];
    offerId?: string;
  }) {
    const subtotal = params.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const discount = params.discountAmount ?? 0;
    const total = subtotal + params.deliveryFee - discount;

    const order = await prisma.order.create({
      data: {
        orderNumber: params.orderNumber,
        customerId: params.customerId,
        restaurantId: params.restaurantId,
        deliveryPartnerId: params.deliveryPartnerId,
        addressId: params.addressId,
        deliveryAddress: params.deliveryAddress,
        hostelOrPgName: params.hostelOrPgName,
        roomNumber: params.roomNumber,
        subtotal: new Decimal(subtotal.toFixed(2)),
        deliveryFee: new Decimal(params.deliveryFee.toFixed(2)),
        discountAmount: new Decimal(discount.toFixed(2)),
        totalAmount: new Decimal(total.toFixed(2)),
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentStatus,
        status: params.status,
        managerResponseDeadline: params.managerResponseDeadline,
        acceptedAt: params.acceptedAt,
        rejectedAt: params.rejectedAt,
        preparedAt: params.preparedAt,
        readyAt: params.readyAt,
        pickedUpAt: params.pickedUpAt,
        deliveredAt: params.deliveredAt,
        cancelledAt: params.cancelledAt,
      },
    });

    // Order items
    for (const item of params.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          itemNameSnapshot: item.name,
          unitPrice: new Decimal(item.price.toFixed(2)),
          quantity: item.qty,
          totalPrice: new Decimal((item.price * item.qty).toFixed(2)),
        },
      });
    }

    // Payment
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: params.paymentMethod,
        status: params.paymentStatus,
        amount: new Decimal(total.toFixed(2)),
        paidAt: params.paymentStatus === PaymentStatus.PAID ? params.deliveredAt ?? new Date() : null,
      },
    });

    // Order events
    for (const event of params.events) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          actorUserId: event.actorId,
          eventType: event.type,
          previousStatus: event.prevStatus,
          newStatus: event.newStatus,
          createdAt: event.createdAt ?? new Date(),
        },
      });
    }

    // Offer usage
    if (params.offerId && discount > 0) {
      await prisma.offerUsage.create({
        data: {
          offerId: params.offerId,
          customerId: params.customerId,
          orderId: order.id,
          discountAmount: new Decimal(discount.toFixed(2)),
        },
      });
    }

    return order;
  }

  // ── ORDER 1: DELIVERED (full lifecycle) ──
  const order1 = await createOrder({
    orderNumber: generateOrderNumber(1),
    customerId: customer1.id,
    restaurantId: kfc.id,
    deliveryPartnerId: partner1.id,
    addressId: address1.id,
    deliveryAddress: 'Sunrise Hostel, Near Main Gate, University Road',
    hostelOrPgName: 'Sunrise Hostel',
    roomNumber: 'A-204',
    items: [
      { menuItemId: kfcItem1.id, name: 'Classic Chicken Burger', price: 129, qty: 2 },
      { menuItemId: kfcItem4.id, name: 'Hot Wings (6 pcs)', price: 249, qty: 1 },
      { menuItemId: kfcItem6.id, name: 'French Fries (Regular)', price: 99, qty: 1 },
    ],
    deliveryFee: 30,
    discountAmount: 50,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PAID,
    status: OrderStatus.DELIVERED,
    acceptedAt: minutesAgo(90),
    preparedAt: minutesAgo(70),
    readyAt: minutesAgo(60),
    pickedUpAt: minutesAgo(45),
    deliveredAt: minutesAgo(30),
    offerId: offer1.id,
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser1.id, createdAt: minutesAgo(95) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser1.id, createdAt: minutesAgo(90) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser1.id, createdAt: minutesAgo(88) },
      { type: 'ORDER_READY', prevStatus: OrderStatus.PREPARING, newStatus: OrderStatus.READY_FOR_PICKUP, actorId: managerUser1.id, createdAt: minutesAgo(60) },
      { type: 'PARTNER_ASSIGNED', prevStatus: OrderStatus.READY_FOR_PICKUP, newStatus: OrderStatus.DELIVERY_ASSIGNED, actorId: adminUser.id, createdAt: minutesAgo(55) },
      { type: 'ORDER_PICKED_UP', prevStatus: OrderStatus.DELIVERY_ASSIGNED, newStatus: OrderStatus.PICKED_UP, actorId: partnerUser1.id, createdAt: minutesAgo(45) },
      { type: 'ORDER_OUT_FOR_DELIVERY', prevStatus: OrderStatus.PICKED_UP, newStatus: OrderStatus.OUT_FOR_DELIVERY, actorId: partnerUser1.id, createdAt: minutesAgo(44) },
      { type: 'OTP_VERIFIED', prevStatus: OrderStatus.OUT_FOR_DELIVERY, newStatus: OrderStatus.DELIVERED, actorId: partnerUser1.id, createdAt: minutesAgo(30) },
      { type: 'ORDER_DELIVERED', prevStatus: OrderStatus.OUT_FOR_DELIVERY, newStatus: OrderStatus.DELIVERED, actorId: partnerUser1.id, createdAt: minutesAgo(30) },
    ],
  });

  // ── ORDER 2: WAITING_FOR_MANAGER ──
  await createOrder({
    orderNumber: generateOrderNumber(2),
    customerId: customer2.id,
    restaurantId: pizzaHut.id,
    addressId: address2.id,
    deliveryAddress: 'Green Valley PG, 3rd Cross, Indiranagar',
    hostelOrPgName: 'Green Valley PG',
    roomNumber: 'B-112',
    items: [
      { menuItemId: phItem1.id, name: 'Margherita Pizza', price: 249, qty: 1 },
      { menuItemId: phItem5.id, name: 'Garlic Breadsticks', price: 129, qty: 1 },
    ],
    deliveryFee: 25,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.WAITING_FOR_MANAGER,
    managerResponseDeadline: minutesFromNow(5),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser2.id },
    ],
  });

  // ── ORDER 3: MANAGER_ACCEPTED ──
  await createOrder({
    orderNumber: generateOrderNumber(3),
    customerId: customer1.id,
    restaurantId: subway.id,
    addressId: address1.id,
    deliveryAddress: 'Sunrise Hostel, Near Main Gate, University Road',
    hostelOrPgName: 'Sunrise Hostel',
    roomNumber: 'A-204',
    items: [
      { menuItemId: subItem1.id, name: 'Chicken Teriyaki Sub', price: 299, qty: 1 },
      { menuItemId: subItem2.id, name: 'Veggie Delight', price: 199, qty: 1 },
    ],
    deliveryFee: 20,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.MANAGER_ACCEPTED,
    acceptedAt: minutesAgo(5),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser1.id, createdAt: minutesAgo(10) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser3.id, createdAt: minutesAgo(5) },
    ],
  });

  // ── ORDER 4: PREPARING ──
  await createOrder({
    orderNumber: generateOrderNumber(4),
    customerId: customer3.id,
    restaurantId: kfc.id,
    addressId: address3.id,
    deliveryAddress: 'Blue Residency, HSR Layout',
    hostelOrPgName: 'Blue Residency',
    roomNumber: 'C-301',
    items: [
      { menuItemId: kfcItem2.id, name: 'Zinger Burger', price: 199, qty: 2 },
      { menuItemId: kfcItem5.id, name: 'Popcorn Chicken', price: 179, qty: 1 },
    ],
    deliveryFee: 30,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PREPARING,
    acceptedAt: minutesAgo(15),
    preparedAt: undefined,
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser3.id, createdAt: minutesAgo(20) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser1.id, createdAt: minutesAgo(15) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser1.id, createdAt: minutesAgo(14) },
    ],
  });

  // ── ORDER 5: READY_FOR_PICKUP ──
  await createOrder({
    orderNumber: generateOrderNumber(5),
    customerId: customer2.id,
    restaurantId: pizzaHut.id,
    addressId: address2.id,
    deliveryAddress: 'Green Valley PG, 3rd Cross, Indiranagar',
    hostelOrPgName: 'Green Valley PG',
    roomNumber: 'B-112',
    items: [
      { menuItemId: phItem2.id, name: 'Chicken Supreme', price: 449, qty: 1 },
      { menuItemId: phItem3.id, name: 'Farm House', price: 349, qty: 1 },
    ],
    deliveryFee: 25,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.READY_FOR_PICKUP,
    acceptedAt: minutesAgo(40),
    preparedAt: minutesAgo(20),
    readyAt: minutesAgo(10),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser2.id, createdAt: minutesAgo(45) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser2.id, createdAt: minutesAgo(40) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser2.id, createdAt: minutesAgo(38) },
      { type: 'ORDER_READY', prevStatus: OrderStatus.PREPARING, newStatus: OrderStatus.READY_FOR_PICKUP, actorId: managerUser2.id, createdAt: minutesAgo(10) },
    ],
  });

  // ── ORDER 6: WAITING_FOR_PARTNER ──
  const order6 = await createOrder({
    orderNumber: generateOrderNumber(6),
    customerId: customer1.id,
    restaurantId: kfc.id,
    addressId: address1.id,
    deliveryAddress: 'Sunrise Hostel, Near Main Gate, University Road',
    hostelOrPgName: 'Sunrise Hostel',
    roomNumber: 'A-204',
    items: [
      { menuItemId: kfcItem3.id, name: 'Veg Zinger', price: 169, qty: 1 },
    ],
    deliveryFee: 30,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.WAITING_FOR_PARTNER,
    acceptedAt: minutesAgo(35),
    preparedAt: minutesAgo(20),
    readyAt: minutesAgo(8),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser1.id, createdAt: minutesAgo(40) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser1.id, createdAt: minutesAgo(35) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser1.id, createdAt: minutesAgo(33) },
      { type: 'ORDER_READY', prevStatus: OrderStatus.PREPARING, newStatus: OrderStatus.READY_FOR_PICKUP, actorId: managerUser1.id, createdAt: minutesAgo(8) },
      { type: 'WAITING_FOR_PARTNER', prevStatus: OrderStatus.READY_FOR_PICKUP, newStatus: OrderStatus.WAITING_FOR_PARTNER, createdAt: minutesAgo(7) },
    ],
  });

  // ── ORDER 7: DELIVERY_ASSIGNED ──
  await createOrder({
    orderNumber: generateOrderNumber(7),
    customerId: customer3.id,
    restaurantId: subway.id,
    deliveryPartnerId: partner2.id,
    addressId: address3.id,
    deliveryAddress: 'Blue Residency, HSR Layout',
    hostelOrPgName: 'Blue Residency',
    roomNumber: 'C-301',
    items: [
      { menuItemId: subItem3.id, name: 'Italian BMT', price: 349, qty: 1 },
    ],
    deliveryFee: 20,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.DELIVERY_ASSIGNED,
    acceptedAt: minutesAgo(30),
    preparedAt: minutesAgo(15),
    readyAt: minutesAgo(8),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser3.id, createdAt: minutesAgo(35) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser3.id, createdAt: minutesAgo(30) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser3.id, createdAt: minutesAgo(28) },
      { type: 'ORDER_READY', prevStatus: OrderStatus.PREPARING, newStatus: OrderStatus.READY_FOR_PICKUP, actorId: managerUser3.id, createdAt: minutesAgo(8) },
      { type: 'PARTNER_ASSIGNED', prevStatus: OrderStatus.WAITING_FOR_PARTNER, newStatus: OrderStatus.DELIVERY_ASSIGNED, actorId: adminUser.id, createdAt: minutesAgo(5) },
      { type: 'PARTNER_ACCEPTED', prevStatus: OrderStatus.DELIVERY_ASSIGNED, newStatus: OrderStatus.DELIVERY_ASSIGNED, actorId: partnerUser2.id, createdAt: minutesAgo(4) },
    ],
  });

  // ── ORDER 8: PICKED_UP ──
  await createOrder({
    orderNumber: generateOrderNumber(8),
    customerId: customer2.id,
    restaurantId: kfc.id,
    deliveryPartnerId: partner1.id,
    addressId: address2.id,
    deliveryAddress: 'Green Valley PG, 3rd Cross, Indiranagar',
    hostelOrPgName: 'Green Valley PG',
    roomNumber: 'B-112',
    items: [
      { menuItemId: kfcItem1.id, name: 'Classic Chicken Burger', price: 129, qty: 1 },
      { menuItemId: kfcItem6.id, name: 'French Fries (Regular)', price: 99, qty: 2 },
    ],
    deliveryFee: 30,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PICKED_UP,
    acceptedAt: minutesAgo(50),
    preparedAt: minutesAgo(30),
    readyAt: minutesAgo(20),
    pickedUpAt: minutesAgo(10),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser2.id, createdAt: minutesAgo(55) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser1.id, createdAt: minutesAgo(50) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser1.id, createdAt: minutesAgo(48) },
      { type: 'ORDER_READY', prevStatus: OrderStatus.PREPARING, newStatus: OrderStatus.READY_FOR_PICKUP, actorId: managerUser1.id, createdAt: minutesAgo(20) },
      { type: 'PARTNER_ASSIGNED', prevStatus: OrderStatus.WAITING_FOR_PARTNER, newStatus: OrderStatus.DELIVERY_ASSIGNED, createdAt: minutesAgo(15) },
      { type: 'ORDER_PICKED_UP', prevStatus: OrderStatus.DELIVERY_ASSIGNED, newStatus: OrderStatus.PICKED_UP, actorId: partnerUser1.id, createdAt: minutesAgo(10) },
    ],
  });

  // ── ORDER 9: OUT_FOR_DELIVERY ──
  await createOrder({
    orderNumber: generateOrderNumber(9),
    customerId: customer1.id,
    restaurantId: pizzaHut.id,
    deliveryPartnerId: partner2.id,
    addressId: address1.id,
    deliveryAddress: 'Sunrise Hostel, Near Main Gate, University Road',
    hostelOrPgName: 'Sunrise Hostel',
    roomNumber: 'A-204',
    items: [
      { menuItemId: phItem1.id, name: 'Margherita Pizza', price: 249, qty: 2 },
    ],
    deliveryFee: 25,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.OUT_FOR_DELIVERY,
    acceptedAt: minutesAgo(55),
    preparedAt: minutesAgo(35),
    readyAt: minutesAgo(25),
    pickedUpAt: minutesAgo(12),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser1.id, createdAt: minutesAgo(60) },
      { type: 'MANAGER_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_ACCEPTED, actorId: managerUser2.id, createdAt: minutesAgo(55) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.MANAGER_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser2.id, createdAt: minutesAgo(53) },
      { type: 'ORDER_READY', prevStatus: OrderStatus.PREPARING, newStatus: OrderStatus.READY_FOR_PICKUP, actorId: managerUser2.id, createdAt: minutesAgo(25) },
      { type: 'PARTNER_ASSIGNED', prevStatus: OrderStatus.WAITING_FOR_PARTNER, newStatus: OrderStatus.DELIVERY_ASSIGNED, createdAt: minutesAgo(18) },
      { type: 'ORDER_PICKED_UP', prevStatus: OrderStatus.DELIVERY_ASSIGNED, newStatus: OrderStatus.PICKED_UP, actorId: partnerUser2.id, createdAt: minutesAgo(12) },
      { type: 'ORDER_OUT_FOR_DELIVERY', prevStatus: OrderStatus.PICKED_UP, newStatus: OrderStatus.OUT_FOR_DELIVERY, actorId: partnerUser2.id, createdAt: minutesAgo(11) },
    ],
  });

  // ── ORDER 10: MANAGER_REJECTED → CANCELLED ──
  await createOrder({
    orderNumber: generateOrderNumber(10),
    customerId: customer3.id,
    restaurantId: pizzaHut.id,
    addressId: address3.id,
    deliveryAddress: 'Blue Residency, HSR Layout',
    hostelOrPgName: 'Blue Residency',
    roomNumber: 'C-301',
    items: [
      { menuItemId: phItem2.id, name: 'Chicken Supreme', price: 449, qty: 1 },
    ],
    deliveryFee: 25,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.REFUNDED,
    status: OrderStatus.CANCELLED,
    rejectedAt: minutesAgo(55),
    cancelledAt: minutesAgo(55),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser3.id, createdAt: minutesAgo(60) },
      { type: 'MANAGER_REJECTED', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_REJECTED, actorId: managerUser2.id, createdAt: minutesAgo(55) },
      { type: 'ORDER_CANCELLED', prevStatus: OrderStatus.MANAGER_REJECTED, newStatus: OrderStatus.CANCELLED, createdAt: minutesAgo(55) },
    ],
  });

  // ── ORDER 11: MANAGER_TIMEOUT → WAITING_FOR_ADMIN ──
  await createOrder({
    orderNumber: generateOrderNumber(11),
    customerId: customer1.id,
    restaurantId: subway.id,
    addressId: address1.id,
    deliveryAddress: 'Sunrise Hostel, Near Main Gate, University Road',
    hostelOrPgName: 'Sunrise Hostel',
    roomNumber: 'A-204',
    items: [
      { menuItemId: subItem1.id, name: 'Chicken Teriyaki Sub', price: 299, qty: 1 },
    ],
    deliveryFee: 20,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.WAITING_FOR_ADMIN,
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser1.id, createdAt: minutesAgo(20) },
      { type: 'MANAGER_TIMEOUT', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_TIMEOUT, createdAt: minutesAgo(10) },
      { type: 'ESCALATED_TO_ADMIN', prevStatus: OrderStatus.MANAGER_TIMEOUT, newStatus: OrderStatus.WAITING_FOR_ADMIN, createdAt: minutesAgo(10) },
    ],
  });

  // ── ORDER 12: ADMIN_REJECTED → CANCELLED ──
  await createOrder({
    orderNumber: generateOrderNumber(12),
    customerId: customer2.id,
    restaurantId: kfc.id,
    addressId: address2.id,
    deliveryAddress: 'Green Valley PG, 3rd Cross, Indiranagar',
    hostelOrPgName: 'Green Valley PG',
    roomNumber: 'B-112',
    items: [
      { menuItemId: kfcItem2.id, name: 'Zinger Burger', price: 199, qty: 1 },
    ],
    deliveryFee: 30,
    paymentMethod: PaymentMethod.ONLINE,
    paymentStatus: PaymentStatus.REFUNDED,
    status: OrderStatus.CANCELLED,
    rejectedAt: minutesAgo(40),
    cancelledAt: minutesAgo(40),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser2.id, createdAt: minutesAgo(60) },
      { type: 'MANAGER_TIMEOUT', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_TIMEOUT, createdAt: minutesAgo(50) },
      { type: 'ESCALATED_TO_ADMIN', prevStatus: OrderStatus.MANAGER_TIMEOUT, newStatus: OrderStatus.WAITING_FOR_ADMIN, createdAt: minutesAgo(50) },
      { type: 'ADMIN_REJECTED', prevStatus: OrderStatus.WAITING_FOR_ADMIN, newStatus: OrderStatus.ADMIN_REJECTED, actorId: adminUser.id, createdAt: minutesAgo(40) },
      { type: 'ORDER_CANCELLED', prevStatus: OrderStatus.ADMIN_REJECTED, newStatus: OrderStatus.CANCELLED, createdAt: minutesAgo(40) },
    ],
  });

  // ── ORDER 13: ADMIN_ACCEPTED (timeout → admin steps in) ──
  await createOrder({
    orderNumber: generateOrderNumber(13),
    customerId: customer3.id,
    restaurantId: subway.id,
    deliveryPartnerId: partner1.id,
    addressId: address3.id,
    deliveryAddress: 'Blue Residency, HSR Layout',
    hostelOrPgName: 'Blue Residency',
    roomNumber: 'C-301',
    items: [
      { menuItemId: subItem2.id, name: 'Veggie Delight', price: 199, qty: 2 },
    ],
    deliveryFee: 20,
    paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PREPARING,
    acceptedAt: minutesAgo(15),
    events: [
      { type: 'ORDER_CREATED', newStatus: OrderStatus.WAITING_FOR_MANAGER, actorId: customerUser3.id, createdAt: minutesAgo(30) },
      { type: 'MANAGER_TIMEOUT', prevStatus: OrderStatus.WAITING_FOR_MANAGER, newStatus: OrderStatus.MANAGER_TIMEOUT, createdAt: minutesAgo(20) },
      { type: 'ESCALATED_TO_ADMIN', prevStatus: OrderStatus.MANAGER_TIMEOUT, newStatus: OrderStatus.WAITING_FOR_ADMIN, createdAt: minutesAgo(20) },
      { type: 'ADMIN_ACCEPTED', prevStatus: OrderStatus.WAITING_FOR_ADMIN, newStatus: OrderStatus.ADMIN_ACCEPTED, actorId: adminUser.id, createdAt: minutesAgo(15) },
      { type: 'ORDER_STARTED_PREPARING', prevStatus: OrderStatus.ADMIN_ACCEPTED, newStatus: OrderStatus.PREPARING, actorId: managerUser3.id, createdAt: minutesAgo(12) },
    ],
  });

  console.log(`  ✅ Created 13 orders with items, payments, and events`);

  // ──────────────────────────────────────────────────────
  // 11. DELIVERY REQUESTS
  // ──────────────────────────────────────────────────────
  console.log('📨 Creating delivery requests...');

  // For order 6 (WAITING_FOR_PARTNER) — partner 3 rejected, partner 2 expired
  await prisma.deliveryRequest.create({
    data: {
      orderId: order6.id,
      deliveryPartnerId: partner3.id,
      status: DeliveryRequestStatus.REJECTED,
      offeredAt: minutesAgo(6),
      expiresAt: minutesAgo(1),
      respondedAt: minutesAgo(4),
      rejectedAt: minutesAgo(4),
    },
  });

  await prisma.deliveryRequest.create({
    data: {
      orderId: order6.id,
      deliveryPartnerId: partner2.id,
      status: DeliveryRequestStatus.EXPIRED,
      offeredAt: minutesAgo(3),
      expiresAt: minutesAgo(0),
    },
  });

  // For order 1 (DELIVERED) — partner 1 accepted
  await prisma.deliveryRequest.create({
    data: {
      orderId: order1.id,
      deliveryPartnerId: partner1.id,
      status: DeliveryRequestStatus.ACCEPTED,
      offeredAt: minutesAgo(58),
      expiresAt: minutesAgo(53),
      respondedAt: minutesAgo(55),
      acceptedAt: minutesAgo(55),
    },
  });

  console.log(`  ✅ Created 3 delivery requests`);

  // ──────────────────────────────────────────────────────
  // 12. DELIVERY OTP
  // ──────────────────────────────────────────────────────
  console.log('🔐 Creating delivery OTPs...');

  await prisma.deliveryOtp.create({
    data: {
      orderId: order1.id,
      hashedOtp: await hashOtp('1234'),
      expiresAt: minutesAgo(25),
      verifiedAt: minutesAgo(30),
      attempts: 1,
    },
  });

  console.log(`  ✅ Created 1 delivery OTP`);

  // ──────────────────────────────────────────────────────
  // 13. NOTIFICATIONS
  // ──────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser1.id,
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Delivered!',
        message: `Your order ${generateOrderNumber(1)} has been delivered. Enjoy your meal!`,
        data: { orderId: order1.id },
        readAt: minutesAgo(25),
      },
      {
        userId: customerUser2.id,
        type: NotificationType.NEW_ORDER,
        title: 'Order Placed',
        message: `Your order ${generateOrderNumber(2)} has been placed and is waiting for confirmation.`,
        data: { orderId: order1.id },
      },
      {
        userId: managerUser1.id,
        type: NotificationType.NEW_ORDER,
        title: 'New Order Received',
        message: 'You have a new order to review.',
        data: { restaurantId: kfc.id },
      },
      {
        userId: partnerUser1.id,
        type: NotificationType.DELIVERY_REQUEST,
        title: 'New Delivery Request',
        message: 'A new delivery is available near you.',
      },
      {
        userId: adminUser.id,
        type: NotificationType.ADMIN_ALERT,
        title: 'Manager Timeout Alert',
        message: `Order ${generateOrderNumber(11)} timed out and needs admin review.`,
      },
      {
        userId: customerUser1.id,
        type: NotificationType.OFFER,
        title: '🎉 Welcome Offer!',
        message: 'Use code WELCOME20 to get 20% off on your first order!',
      },
    ],
  });

  console.log(`  ✅ Created 6 notifications`);

  // ──────────────────────────────────────────────────────
  // 14. DEVICE TOKENS
  // ──────────────────────────────────────────────────────
  console.log('📱 Creating device tokens...');

  await prisma.deviceToken.createMany({
    data: [
      { userId: customerUser1.id, token: 'fcm_token_customer1_android', platform: 'android' },
      { userId: customerUser1.id, token: 'fcm_token_customer1_web', platform: 'web' },
      { userId: customerUser2.id, token: 'fcm_token_customer2_ios', platform: 'ios' },
      { userId: partnerUser1.id, token: 'fcm_token_partner1_android', platform: 'android' },
      { userId: partnerUser2.id, token: 'fcm_token_partner2_android', platform: 'android' },
      { userId: managerUser1.id, token: 'fcm_token_manager1_android', platform: 'android' },
      { userId: adminUser.id, token: 'fcm_token_admin_web', platform: 'web' },
    ],
  });

  console.log(`  ✅ Created 7 device tokens`);

  // ──────────────────────────────────────────────────────
  // 15. ISSUES
  // ──────────────────────────────────────────────────────
  console.log('🎫 Creating issues...');

  const issue1 = await prisma.issue.create({
    data: {
      restaurantId: kfc.id,
      createdByUserId: managerUser1.id,
      category: IssueCategory.ORDER,
      subject: 'Customer complaint about cold food',
      status: IssueStatus.OPEN,
    },
  });

  await prisma.issueMessage.create({
    data: {
      issueId: issue1.id,
      senderUserId: managerUser1.id,
      message: 'A customer called to complain that their order arrived cold. The delivery took over 40 minutes. Please look into this.',
    },
  });

  await prisma.issueMessage.create({
    data: {
      issueId: issue1.id,
      senderUserId: adminUser.id,
      message: 'Thank you for reporting this. We will review the delivery logs and get back to you.',
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      restaurantId: pizzaHut.id,
      createdByUserId: managerUser2.id,
      category: IssueCategory.TECHNICAL,
      subject: 'App notification delay',
      status: IssueStatus.RESOLVED,
      resolvedAt: minutesAgo(120),
    },
  });

  await prisma.issueMessage.create({
    data: {
      issueId: issue2.id,
      senderUserId: managerUser2.id,
      message: 'We are receiving order notifications with a 5-minute delay. This is causing us to miss the response window.',
    },
  });

  await prisma.issueMessage.create({
    data: {
      issueId: issue2.id,
      senderUserId: adminUser.id,
      message: 'We identified the issue with our push notification service and have resolved it. Notifications should now arrive in real-time.',
    },
  });

  console.log(`  ✅ Created 2 issues with 4 messages`);

  // ──────────────────────────────────────────────────────
  // 16. AUDIT LOGS
  // ──────────────────────────────────────────────────────
  console.log('📋 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: adminUser.id,
        action: 'STORE_CREATED',
        entityType: 'Restaurant',
        entityId: kfc.id,
        metadata: { name: 'KFC', slug: 'kfc' },
      },
      {
        actorUserId: adminUser.id,
        action: 'STORE_CREATED',
        entityType: 'Restaurant',
        entityId: pizzaHut.id,
        metadata: { name: 'Pizza Hut', slug: 'pizza-hut' },
      },
      {
        actorUserId: adminUser.id,
        action: 'STORE_CREATED',
        entityType: 'Restaurant',
        entityId: subway.id,
        metadata: { name: 'Subway', slug: 'subway' },
      },
      {
        actorUserId: adminUser.id,
        action: 'MANAGER_CREATED',
        entityType: 'User',
        entityId: managerUser1.id,
        metadata: { name: 'Priya Patel', restaurant: 'KFC' },
      },
      {
        actorUserId: adminUser.id,
        action: 'MANAGER_CREATED',
        entityType: 'User',
        entityId: managerUser2.id,
        metadata: { name: 'Amit Verma', restaurant: 'Pizza Hut' },
      },
      {
        actorUserId: adminUser.id,
        action: 'MANAGER_CREATED',
        entityType: 'User',
        entityId: managerUser3.id,
        metadata: { name: 'Sneha Gupta', restaurant: 'Subway' },
      },
      {
        actorUserId: adminUser.id,
        action: 'OFFER_CREATED',
        entityType: 'Offer',
        entityId: offer1.id,
        metadata: { code: 'WELCOME20' },
      },
    ],
  });

  console.log(`  ✅ Created 7 audit logs`);

  // ──────────────────────────────────────────────────────
  console.log('\n✅ FoodConnect seed completed successfully!');
  console.log('────────────────────────────────────────');
  console.log('Summary:');
  console.log('  Users:              10');
  console.log('  Customers:          3');
  console.log('  Addresses:          5');
  console.log('  Restaurants:        3 (KFC, Pizza Hut, Subway)');
  console.log('  Managers:           3');
  console.log('  Menu Categories:    12');
  console.log('  Menu Items:         22');
  console.log('  Delivery Partners:  3');
  console.log('  Orders:             13 (all statuses covered)');
  console.log('  Delivery Requests:  3');
  console.log('  Delivery OTPs:      1');
  console.log('  Offers:             3');
  console.log('  Notifications:      6');
  console.log('  Device Tokens:      7');
  console.log('  Issues:             2 (with 4 messages)');
  console.log('  Audit Logs:         7');
  console.log('────────────────────────────────────────');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
