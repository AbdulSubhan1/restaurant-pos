export interface PublicMenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  available: boolean;
  categoryId: number | null;
}

export interface PublicCategory {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  menuItems: PublicMenuItem[];
}

export interface PublicMenuResponse {
  success: boolean;
  menu: PublicCategory[];
}
