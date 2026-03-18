export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  is_active: boolean;
  stock: number;
  category: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateProductBody = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images?: string[];
  is_active?: boolean;
};

export type UpdateProductBody = Partial<CreateProductBody>;

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: "created_at" | "price" | "name";
  sort_order?: "asc" | "desc";
};

export type ProductListResponse = {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type UploadProductImageInput = {
  buffer: Buffer;
  mimetype: string;
};
