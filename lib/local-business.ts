export type LocalBusiness = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  address: string;
  website: string;
  phone: string;
  distance?: number;
};

export const businessCategories = ["All businesses", "Food & drink", "Shops", "Services"] as const;
