import { z } from "zod";

const productNameSchema = z.string().min(2).max(150);
const productDescriptionSchema = z.string().min(2).max(5000);
const categorySchema = z.string().min(2).max(100);
const imageUrlSchema = z.string().url();
const imagesSchema = z.array(imageUrlSchema).max(10);

export const createProductSchema = z.object({
  body: z.object({
    name: productNameSchema,
    description: productDescriptionSchema,
    price: z.coerce.number().nonnegative(),
    stock: z.coerce.number().int().nonnegative(),
    category: categorySchema,
    images: imagesSchema.optional(),
    is_active: z.coerce.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z
    .object({
      name: productNameSchema.optional(),
      description: productDescriptionSchema.optional(),
      price: z.coerce.number().nonnegative().optional(),
      stock: z.coerce.number().int().nonnegative().optional(),
      category: categorySchema.optional(),
      images: imagesSchema.optional(),
      is_active: z.coerce.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      path: ["body"],
      message: "Provide at least one field to update",
    }),
});

export const listProductsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().min(1).max(120).optional(),
      category: categorySchema.optional(),
      is_active: z.coerce.boolean().optional(),
      min_price: z.coerce.number().nonnegative().optional(),
      max_price: z.coerce.number().nonnegative().optional(),
      sort_by: z.enum(["created_at", "price", "name"]).optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    })
    .refine(
      (query) =>
        query.min_price === undefined ||
        query.max_price === undefined ||
        query.min_price <= query.max_price,
      {
        message: "min_price cannot be greater than max_price",
        path: ["max_price"],
      },
    ),
});
