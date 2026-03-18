import type { User } from "@supabase/supabase-js";
import { AppError } from "../../core/errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";
import { SupabaseRepository } from "../../core/supabase/repository.js";
import type {
  CreateProductBody,
  Product,
  ProductListQuery,
  ProductListResponse,
  UpdateProductBody,
  UploadProductImageInput,
} from "../../types/product.types.js";

const productSelect =
  "id, name, description, price, images, image_url, is_active, stock, category, created_at, updated_at";
const productsRepository = new SupabaseRepository<Product>("products");
type ProductRecord = Product & { owner_id: string };
type ProductSelectRow = Product & { image_url?: unknown };
const productsRecordRepository = new SupabaseRepository<ProductRecord>(
  "products",
);
const productImageBucket = process.env.SUPABASE_PRODUCT_BUCKET ?? "products";

async function resolveBusinessRole(user: User): Promise<string> {
  const appRole = user.app_metadata?.role;

  if (typeof appRole === "string" && appRole.trim()) {
    return appRole.trim().toLowerCase();
  }

  const userRole = user.user_metadata?.role;

  if (typeof userRole === "string" && userRole.trim()) {
    return userRole.trim().toLowerCase();
  }

  const { data, error } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to resolve user role", 500, error.message);
  }

  const profileRole = data?.role;

  if (typeof profileRole === "string" && profileRole.trim()) {
    return profileRole.trim().toLowerCase();
  }

  return "user";
}

function getImageExtension(mimetype: string): "png" | "jpg" {
  if (mimetype === "image/png") {
    return "png";
  }

  if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    return "jpg";
  }

  throw new AppError("Unsupported product image file type", 400, mimetype);
}

function normalizeImages(record: {
  images?: unknown;
  image_url?: unknown;
}): string[] {
  if (Array.isArray(record.images)) {
    return record.images.filter(
      (value): value is string => typeof value === "string",
    );
  }

  if (typeof record.image_url === "string" && record.image_url) {
    return [record.image_url];
  }

  return [];
}

function toProduct(record: ProductSelectRow): Product {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    price: record.price,
    images: normalizeImages(record as ProductRecord & { image_url?: unknown }),
    is_active: record.is_active,
    stock: record.stock,
    category: record.category,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export const productService = {
  async listProducts(
    query: ProductListQuery = {},
  ): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const sortBy = query.sort_by ?? "created_at";
    const ascending = (query.sort_order ?? "desc") === "asc";

    let dbQuery = supabaseService
      .from("products")
      .select(productSelect, { count: "exact" })
      .range(start, end)
      .order(sortBy, { ascending });

    if (query.search) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query.search}%,description.ilike.%${query.search}%`,
      );
    }

    if (query.category) {
      dbQuery = dbQuery.eq("category", query.category);
    }

    if (query.is_active !== undefined) {
      dbQuery = dbQuery.eq("is_active", query.is_active);
    }

    if (query.min_price !== undefined) {
      dbQuery = dbQuery.gte("price", query.min_price);
    }

    if (query.max_price !== undefined) {
      dbQuery = dbQuery.lte("price", query.max_price);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new AppError("Failed to list products", 500, error.message);
    }

    const total = count ?? 0;

    return {
      items: ((data ?? []) as ProductSelectRow[]).map(toProduct),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getProductById(productId: string): Promise<Product> {
    const product = await productsRepository.findById(productId, {
      select: productSelect,
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return toProduct(product as ProductRecord);
  },

  async getProductRecordById(productId: string): Promise<ProductRecord> {
    const product = await productsRecordRepository.findById(productId, {
      select: `${productSelect}, owner_id`,
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  },

  async createProduct(
    user: User,
    payload: CreateProductBody,
  ): Promise<Product> {
    const created = await productsRecordRepository.create({
      owner_id: user.id,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      images: payload.images ?? [],
      is_active: payload.is_active ?? true,
      stock: payload.stock,
      category: payload.category,
    });

    return toProduct(created);
  },

  async updateProduct(
    user: User,
    productId: string,
    payload: UpdateProductBody,
  ): Promise<Product> {
    const existingProduct = await this.getProductRecordById(productId);
    const role = await resolveBusinessRole(user);

    if (role !== "admin" && existingProduct.owner_id !== user.id) {
      throw new AppError("Forbidden: you cannot update this product", 403);
    }

    const updated = await productsRecordRepository.update(productId, payload);

    return toProduct(updated);
  },

  async deleteProduct(user: User, productId: string): Promise<void> {
    const existingProduct = await this.getProductRecordById(productId);
    const role = await resolveBusinessRole(user);

    if (role !== "admin" && existingProduct.owner_id !== user.id) {
      throw new AppError("Forbidden: you cannot delete this product", 403);
    }

    await productsRepository.remove(productId);
  },

  async uploadProductImages(
    user: User,
    productId: string,
    files: UploadProductImageInput[],
  ): Promise<Product> {
    const existingProduct = await this.getProductRecordById(productId);
    const role = await resolveBusinessRole(user);

    if (role !== "admin" && existingProduct.owner_id !== user.id) {
      throw new AppError(
        "Forbidden: you cannot upload image for this product",
        403,
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const extension = getImageExtension(file.mimetype);
      const path = `${productId}/image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

      const { error: uploadError } = await supabaseService.storage
        .from(productImageBucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new AppError(
          "Failed to upload product image",
          400,
          uploadError.message,
        );
      }

      const { data: publicUrlData } = supabaseService.storage
        .from(productImageBucket)
        .getPublicUrl(path);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    const currentImages = normalizeImages(
      existingProduct as ProductRecord & { image_url?: unknown },
    );
    const mergedImages = Array.from(
      new Set([...currentImages, ...uploadedUrls]),
    );

    return this.updateProduct(user, productId, {
      images: mergedImages,
    });
  },
};
