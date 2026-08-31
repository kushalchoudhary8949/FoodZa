import { DeliveryPartner, AccountStatus, PartnerOnlineStatus } from '../../types';
import { db } from '../storage';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CreatePartnerDto {
  name: string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  loginId?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  accountStatus?: AccountStatus;
  onlineStatus?: PartnerOnlineStatus;
}

export interface UpdatePartnerDto extends Partial<CreatePartnerDto> {
  id: string;
}

export const partnerService = {
  async getPartners(): Promise<DeliveryPartner[]> {
    await delay();
    return db.getPartners();
  },

  async getPartnerById(id: string): Promise<DeliveryPartner | undefined> {
    await delay();
    const partners = db.getPartners();
    return partners.find((p) => p.id === id);
  },

  async createPartner(data: CreatePartnerDto): Promise<DeliveryPartner> {
    await delay();
    const partners = db.getPartners();

    const phoneVal = data.phoneNumber || data.phone || '';
    const cleanName = data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const generatedLogin = data.loginId?.trim().toUpperCase() || `RIDER_${Math.floor(100 + Math.random() * 900)}`;
    const generatedEmail = data.email?.trim() || `${cleanName || 'rider'}@foodfleet.delivery`;

    const newPartner: DeliveryPartner = {
      id: `rider_${Date.now()}`,
      name: data.name.trim(),
      phoneNumber: phoneVal.trim(),
      email: generatedEmail,
      loginId: generatedLogin,
      vehicleType: data.vehicleType || 'Motorcycle',
      vehicleNumber: data.vehicleNumber || 'DL 01 AB 0000',
      accountStatus: data.accountStatus || 'Active',
      onlineStatus: data.onlineStatus || 'Online',
      totalDeliveries: 0,
      totalEarnings: 0,
      rating: 5.0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    const updated = [newPartner, ...partners];
    db.setPartners(updated);
    return newPartner;
  },

  async updatePartner(data: UpdatePartnerDto): Promise<DeliveryPartner> {
    await delay();
    const partners = db.getPartners();
    const existing = partners.find((p) => p.id === data.id);
    if (!existing) throw new Error('Delivery partner not found');

    const updatedPartner: DeliveryPartner = {
      ...existing,
      ...data,
    };

    const updated = partners.map((p) => (p.id === data.id ? updatedPartner : p));
    db.setPartners(updated);
    return updatedPartner;
  },

  async deletePartner(id: string): Promise<void> {
    await delay();
    const partners = db.getPartners();
    const filtered = partners.filter((p) => p.id !== id);
    db.setPartners(filtered);
  },

  async toggleAccountStatus(id: string): Promise<DeliveryPartner> {
    await delay();
    const partners = db.getPartners();
    const target = partners.find((p) => p.id === id);
    if (!target) throw new Error('Delivery partner not found');

    const nextStatus: AccountStatus = target.accountStatus === 'Active' ? 'Inactive' : 'Active';
    // If account is deactivated, also set online status to Offline
    const nextOnline: PartnerOnlineStatus = nextStatus === 'Inactive' ? 'Offline' : target.onlineStatus;

    const updatedPartner = { ...target, accountStatus: nextStatus, onlineStatus: nextOnline };
    const updated = partners.map((p) => (p.id === id ? updatedPartner : p));
    db.setPartners(updated);
    return updatedPartner;
  },

  async toggleOnlineStatus(id: string): Promise<DeliveryPartner> {
    await delay();
    const partners = db.getPartners();
    const target = partners.find((p) => p.id === id);
    if (!target) throw new Error('Delivery partner not found');

    if (target.accountStatus === 'Inactive') {
      throw new Error('Cannot set an Inactive account to Online.');
    }

    const nextOnline: PartnerOnlineStatus = target.onlineStatus === 'Online' ? 'Offline' : 'Online';
    const updatedPartner = { ...target, onlineStatus: nextOnline };
    const updated = partners.map((p) => (p.id === id ? updatedPartner : p));
    db.setPartners(updated);
    return updatedPartner;
  },
};
