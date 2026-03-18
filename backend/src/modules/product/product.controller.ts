import type { Request, Response } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { asyncHandler } from "../../core/http/async-handler.js";
import { sendSuccess } from "../../core/http/response.js";
import { productService } from "./product.service.js";
import type {
  CreateProductBody,
  ProductListQuery,
  UpdateProductBody,
} from "../../types/product.types.js";

function getProductIdParam(req: Request): string {
  const productId = req.params.id;

  if (typeof productId !== "string") {
    throw new AppError("Invalid product id", 400);
  }

  return productId;
}

export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const products = await productService.listProducts(
      req.query as unknown as ProductListQuery,
    );

    return sendSuccess(res, 200, products, "Products retrieved");
  },
);

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await productService.getProductById(getProductIdParam(req));

    return sendSuccess(res, 200, product, "Product retrieved");
  },
);

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const createdProduct = await productService.createProduct(
      req.authUser,
      req.body as CreateProductBody,
    );

    const files = (req as Request & { files?: any[] }).files;

    const product = files?.length
      ? await productService.uploadProductImages(
          req.authUser,
          createdProduct.id,
          files.map((file) => ({
            buffer: file.buffer,
            mimetype: file.mimetype,
          })),
        )
      : createdProduct;

    return sendSuccess(res, 201, product, "Product created");
  },
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const updatedProduct = await productService.updateProduct(
      req.authUser,
      getProductIdParam(req),
      req.body as UpdateProductBody,
    );

    const files = (req as Request & { files?: any[] }).files;

    const product = files?.length
      ? await productService.uploadProductImages(
          req.authUser,
          updatedProduct.id,
          files.map((file) => ({
            buffer: file.buffer,
            mimetype: file.mimetype,
          })),
        )
      : updatedProduct;

    return sendSuccess(res, 200, product, "Product updated");
  },
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    await productService.deleteProduct(req.authUser, getProductIdParam(req));

    return sendSuccess(res, 200, undefined, "Product deleted");
  },
);

export const uploadProductImage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.authUser) {
      throw new AppError("Authentication required", 401);
    }

    const files = (req as Request & { files?: any[] }).files;

    if (!files?.length) {
      throw new AppError("At least one product image file is required", 400);
    }

    const product = await productService.uploadProductImages(
      req.authUser,
      getProductIdParam(req),
      files.map((file) => ({
        buffer: file.buffer,
        mimetype: file.mimetype,
      })),
    );

    return sendSuccess(res, 200, product, "Product images uploaded");
  },
);
