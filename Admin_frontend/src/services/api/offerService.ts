import { Offer, DiscountType } from '../../types';
import { db } from '../storage';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CreateOfferDto {
  name?: string;
  title?: string;
  description?: string;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  applicableStoreIds: string[]; // ['ALL'] or list of store IDs
  applicableStoreNames?: string[];
  startDate: string;
  endDate: string;
  status?: 'Active' | 'Inactive';
  isActive?: boolean;
}

export interface UpdateOfferDto extends Partial<CreateOfferDto> {
  id: string;
}

export const offerService = {
  async getOffers(): Promise<Offer[]> {
    await delay();
    const offers = db.getOffers();
    const stores = db.getStores();

    return offers.map((offer) => {
      const isAct = offer.isActive !== undefined ? offer.isActive : offer.status === 'Active';
      const offerTitle = offer.title || offer.name || 'Promotional Offer';
      const offerName = offer.name || offer.title || 'Promotional Offer';

      let applicableStoreNames = offer.applicableStoreNames;
      if (!applicableStoreNames || applicableStoreNames.length === 0) {
        if (!offer.applicableStoreIds || offer.applicableStoreIds.includes('ALL')) {
          applicableStoreNames = ['All Stores'];
        } else {
          applicableStoreNames = offer.applicableStoreIds
            .map((sId) => stores.find((s) => s.id === sId)?.name)
            .filter(Boolean) as string[];
        }
      }

      return {
        ...offer,
        title: offerTitle,
        name: offerName,
        status: isAct ? 'Active' : 'Inactive',
        isActive: isAct,
        applicableStoreNames: applicableStoreNames.length ? applicableStoreNames : ['All Stores'],
      };
    });
  },

  async getOfferById(id: string): Promise<Offer | undefined> {
    await delay();
    const offers = await this.getOffers();
    return offers.find((o) => o.id === id);
  },

  async createOffer(data: CreateOfferDto): Promise<Offer> {
    await delay();
    const offers = db.getOffers();
    const stores = db.getStores();

    const applicableStoreNames = data.applicableStoreIds.includes('ALL')
      ? ['All Stores']
      : (data.applicableStoreIds
          .map((sId) => stores.find((s) => s.id === sId)?.name)
          .filter(Boolean) as string[]);

    const offerName = (data.name || data.title || '').trim();
    const offerStatus: 'Active' | 'Inactive' =
      data.status || (data.isActive !== undefined ? (data.isActive ? 'Active' : 'Inactive') : 'Active');

    const newOffer: Offer = {
      id: `off_${Date.now()}`,
      name: offerName,
      title: offerName,
      description: (data.description || '').trim(),
      couponCode: data.couponCode.trim().toUpperCase(),
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderValue: Number(data.minOrderValue),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
      applicableStoreIds: data.applicableStoreIds,
      applicableStoreNames,
      startDate: data.startDate,
      endDate: data.endDate,
      status: offerStatus,
      isActive: offerStatus === 'Active',
      usageCount: 0,
      totalSavingsGiven: 0,
    };

    const updated = [newOffer, ...offers];
    db.setOffers(updated);
    return newOffer;
  },

  async updateOffer(data: UpdateOfferDto): Promise<Offer> {
    await delay();
    const offers = db.getOffers();
    const stores = db.getStores();
    const existing = offers.find((o) => o.id === data.id);
    if (!existing) throw new Error('Offer not found');

    const applicableStoreIds = data.applicableStoreIds || existing.applicableStoreIds;
    const applicableStoreNames = applicableStoreIds.includes('ALL')
      ? ['All Stores']
      : (applicableStoreIds
          .map((sId) => stores.find((s) => s.id === sId)?.name)
          .filter(Boolean) as string[]);

    const updatedOffer: Offer = {
      ...existing,
      ...data,
      applicableStoreNames,
    };

    const updated = offers.map((o) => (o.id === data.id ? updatedOffer : o));
    db.setOffers(updated);
    return updatedOffer;
  },

  async deleteOffer(id: string): Promise<void> {
    await delay();
    const offers = db.getOffers();
    const filtered = offers.filter((o) => o.id !== id);
    db.setOffers(filtered);
  },

  async toggleOfferStatus(id: string): Promise<Offer> {
    await delay();
    const offers = db.getOffers();
    const target = offers.find((o) => o.id === id);
    if (!target) throw new Error('Offer not found');

    const nextStatus: 'Active' | 'Inactive' = target.status === 'Active' ? 'Inactive' : 'Active';
    const updatedOffer = { ...target, status: nextStatus };
    const updated = offers.map((o) => (o.id === id ? updatedOffer : o));
    db.setOffers(updated);
    return updatedOffer;
  },
};
