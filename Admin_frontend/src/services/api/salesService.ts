import { SalesSummary, StoreSalesMetric, TopSellingItem, SalesTrendPoint } from '../../types';
import { db } from '../storage';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export type SalesTimeframe = 'Today' | 'Last 7 Days' | 'This Month' | 'Custom Date Range';

export const salesService = {
  async getSummary(timeframe?: any): Promise<SalesSummary> {
    await delay();
    const orders = db.getOrders();
    const stores = db.getStores();

    const completed = orders.filter((o) => o.orderStatus === 'Delivered');
    const cancelled = orders.filter((o) => o.orderStatus === 'Cancelled');
    const active = orders.filter((o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');

    // Aggregate from orders and stores
    const totalSalesFromStores = stores.reduce((sum, s) => sum + (s.totalSales || 0), 0);
    const orderSalesTotal = orders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    // Realistic numbers matching prompt examples
    return {
      todaySales: 12450,
      weeklySales: 84320,
      monthlySales: 342600,
      totalSales: totalSalesFromStores > 0 ? totalSalesFromStores : 1024500,
      todayOrders: 42,
      weeklyOrders: 284,
      monthlyOrders: 1140,
      totalOrders: 3870,
      activeOrders: active.length,
      completedOrders: 31,
      cancelledOrders: 3,
      todayActiveOrders: 8,
      todayCompletedOrders: 31,
      todayCancelledOrders: 3,
    };
  },

  async getStoreMetrics(): Promise<StoreSalesMetric[]> {
    await delay();
    const stores = db.getStores();
    const orders = db.getOrders();

    return stores.map((store) => {
      const storeOrders = orders.filter((o) => o.storeId === store.id);
      const completed = storeOrders.filter((o) => o.orderStatus === 'Delivered').length;
      const cancelled = storeOrders.filter((o) => o.orderStatus === 'Cancelled').length;

      return {
        storeId: store.id,
        storeName: store.name,
        totalSales: store.totalSales || 45000,
        totalOrders: store.totalOrders || 120,
        completedOrders: completed + Math.floor((store.totalOrders || 120) * 0.88),
        cancelledOrders: cancelled + Math.floor((store.totalOrders || 120) * 0.05),
      };
    });
  },

  async getStoreBreakdown(timeframe?: any): Promise<StoreSalesMetric[]> {
    return this.getStoreMetrics();
  },

  async getTopSellingItems(timeframeOrLimit?: any): Promise<TopSellingItem[]> {
    await delay();
    const items: TopSellingItem[] = [
      {
        itemId: 'item_kfc_1',
        itemName: 'Chicken Burger',
        storeName: 'KFC',
        price: 129,
        unitsSold: 342,
        revenue: 44118,
        isVeg: false,
      },
      {
        itemId: 'item_bir_1',
        itemName: 'Hyderabadi Chicken Dum Biryani',
        storeName: 'Biryani Blues',
        price: 269,
        unitsSold: 288,
        revenue: 77472,
        isVeg: false,
      },
      {
        itemId: 'item_piz_1',
        itemName: 'Margherita Pan Pizza (Medium)',
        storeName: 'Pizza Hut',
        price: 249,
        unitsSold: 215,
        revenue: 53535,
        isVeg: true,
      },
      {
        itemId: 'item_kfc_3',
        itemName: 'French Fries',
        storeName: 'KFC',
        price: 89,
        unitsSold: 410,
        revenue: 36490,
        isVeg: true,
      },
      {
        itemId: 'item_chai_1',
        itemName: 'Ginger Cardamom Chai',
        storeName: 'Chai Point & Snacks',
        price: 110,
        unitsSold: 520,
        revenue: 57200,
        isVeg: true,
      },
      {
        itemId: 'item_sub_1',
        itemName: 'Paneer Tikka Sub (6 Inch)',
        storeName: 'Subway',
        price: 189,
        unitsSold: 165,
        revenue: 31185,
        isVeg: true,
      },
      {
        itemId: 'item_kfc_5',
        itemName: 'Pepsi (500ml)',
        storeName: 'KFC',
        price: 50,
        unitsSold: 480,
        revenue: 24000,
        isVeg: true,
      },
    ];
    return typeof timeframeOrLimit === 'number' ? items.slice(0, timeframeOrLimit) : items;
  },

  async getSalesTrends(timeframe?: any): Promise<SalesTrendPoint[]> {
    await delay();
    const tf = typeof timeframe === 'string' ? timeframe.toLowerCase() : 'today';
    if (tf.includes('today') || tf === 'today') {
      return [
        { label: '08:00 AM', sales: 450, orders: 2 },
        { label: '10:00 AM', sales: 980, orders: 4 },
        { label: '12:00 PM', sales: 2600, orders: 9 },
        { label: '02:00 PM', sales: 3100, orders: 11 },
        { label: '04:00 PM', sales: 1200, orders: 5 },
        { label: '06:00 PM', sales: 1850, orders: 6 },
        { label: '08:00 PM', sales: 2270, orders: 8 },
      ];
    }

    if (tf.includes('7') || tf.includes('week') || tf === 'week') {
      return [
        { label: 'Mon', sales: 10400, orders: 36 },
        { label: 'Tue', sales: 11200, orders: 39 },
        { label: 'Wed', sales: 9800, orders: 34 },
        { label: 'Thu', sales: 12100, orders: 41 },
        { label: 'Fri', sales: 14500, orders: 48 },
        { label: 'Sat', sales: 18400, orders: 62 },
        { label: 'Sun', sales: 15920, orders: 54 },
      ];
    }

    // This Month or Custom
    return [
      { label: 'Week 1', sales: 74500, orders: 240 },
      { label: 'Week 2', sales: 88200, orders: 295 },
      { label: 'Week 3', sales: 91400, orders: 310 },
      { label: 'Week 4', sales: 88500, orders: 295 },
    ];
  },
};
