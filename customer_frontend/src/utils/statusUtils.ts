import { OrderStatus } from '../types';

export interface FriendlyStatusInfo {
  stepIndex: number; // 0 to 6 (or -1 for rejected)
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  isRejected: boolean;
  isCompleted: boolean;
  estimatedTime?: string;
  iconName: 'clock' | 'check-circle' | 'chef-hat' | 'bike' | 'package-check' | 'navigation' | 'sparkles' | 'alert-triangle' | 'x-circle';
}

export const TRACKING_STEPS = [
  { id: 'placed', label: 'Order Placed', desc: 'Order details received' },
  { id: 'confirmed', label: 'Restaurant Confirmation', desc: 'Accepted by store' },
  { id: 'preparing', label: 'Preparing Food', desc: 'Kitchen is cooking' },
  { id: 'partner_assigned', label: 'Delivery Partner Assigned', desc: 'Rider on the way to store' },
  { id: 'picked_up', label: 'Picked Up', desc: 'Food packed & collected' },
  { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'Heading to your hostel/room' },
  { id: 'delivered', label: 'Delivered', desc: 'Order successfully completed' },
];

export function getFriendlyStatus(status: OrderStatus): FriendlyStatusInfo {
  switch (status) {
    case 'WAITING_FOR_MANAGER':
      return {
        stepIndex: 0,
        title: 'Order Placed Successfully',
        subtitle: 'Waiting for restaurant confirmation...',
        badgeText: 'Waiting for Confirmation',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '25-35 mins',
        iconName: 'clock',
      };

    case 'MANAGER_ACCEPTED':
      return {
        stepIndex: 1,
        title: 'Restaurant Confirmed Your Order',
        subtitle: 'The kitchen has accepted and is prepping ingredients',
        badgeText: 'Confirmed',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '20-30 mins',
        iconName: 'check-circle',
      };

    case 'WAITING_FOR_ADMIN':
    case 'MANAGER_TIMEOUT':
      return {
        stepIndex: 1,
        title: 'Checking Availability',
        subtitle: 'Restaurant is finalizing confirmation with central support...',
        badgeText: 'Verifying with Kitchen',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '20-30 mins',
        iconName: 'clock',
      };

    case 'ADMIN_ACCEPTED':
      return {
        stepIndex: 1,
        title: 'Order Confirmed by Store',
        subtitle: 'Order queued in kitchen express line',
        badgeText: 'Confirmed',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '20-30 mins',
        iconName: 'check-circle',
      };

    case 'PREPARING':
      return {
        stepIndex: 2,
        title: 'Preparing Your Fresh Food',
        subtitle: 'Chefs are cooking your meal with care and hygiene',
        badgeText: 'Cooking in Kitchen',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '15-20 mins',
        iconName: 'chef-hat',
      };

    case 'READY_FOR_PICKUP':
      return {
        stepIndex: 2,
        title: 'Order is Ready & Packed',
        subtitle: 'Hot and packed securely, waiting for delivery partner pickup',
        badgeText: 'Packed & Ready',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '12-18 mins',
        iconName: 'package-check',
      };

    case 'WAITING_FOR_PARTNER':
      return {
        stepIndex: 3,
        title: 'Locating Nearest Delivery Partner',
        subtitle: 'Assigning a nearby rider on campus...',
        badgeText: 'Assigning Rider',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '12-15 mins',
        iconName: 'bike',
      };

    case 'DELIVERY_ASSIGNED':
      return {
        stepIndex: 3,
        title: 'Delivery Partner Assigned',
        subtitle: 'Rider is arriving at the restaurant to pick up your order',
        badgeText: 'Rider Assigned',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '10-15 mins',
        iconName: 'bike',
      };

    case 'PICKED_UP':
      return {
        stepIndex: 4,
        title: 'Order Picked Up',
        subtitle: 'Delivery partner has collected the hot food package',
        badgeText: 'Picked Up',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '8-12 mins',
        iconName: 'package-check',
      };

    case 'OUT_FOR_DELIVERY':
      return {
        stepIndex: 5,
        title: 'Out for Delivery',
        subtitle: 'Rider is zooming towards your hostel/room address',
        badgeText: 'Out for Delivery',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
        isRejected: false,
        isCompleted: false,
        estimatedTime: '3-6 mins',
        iconName: 'navigation',
      };

    case 'DELIVERED':
      return {
        stepIndex: 6,
        title: 'Order Delivered',
        subtitle: 'Handed over at your doorstep. Enjoy your meal!',
        badgeText: 'Delivered',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isRejected: false,
        isCompleted: true,
        estimatedTime: 'Completed',
        iconName: 'sparkles',
      };

    case 'MANAGER_REJECTED':
    case 'ADMIN_REJECTED':
    case 'CANCELLED':
      return {
        stepIndex: -1,
        title: 'Order Unavailable',
        subtitle: 'Sorry, we are unable to fulfil this order.',
        badgeText: 'Cancelled / Unavailable',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        isRejected: true,
        isCompleted: true,
        estimatedTime: 'Cancelled',
        iconName: 'x-circle',
      };

    default:
      return {
        stepIndex: 0,
        title: 'Order Placed',
        subtitle: 'Processing order...',
        badgeText: 'Processing',
        badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
        isRejected: false,
        isCompleted: false,
        iconName: 'clock',
      };
  }
}

// Sequence for standard progression simulation
export const HAPPY_PATH_STATUS_SEQUENCE: OrderStatus[] = [
  'WAITING_FOR_MANAGER',
  'MANAGER_ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DELIVERY_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
