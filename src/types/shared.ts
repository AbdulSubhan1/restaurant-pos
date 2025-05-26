// types.ts

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null; // From backend
  imageUrl?: string | null; // Used in the form/UI
  available: boolean;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
};

export type Category = {
  id: number;
  name: string;
};
