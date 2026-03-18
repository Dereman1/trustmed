import { Router } from "express";
import {
  productImageUpload,
  requireAuth,
  requireRole,
  validate,
} from "../../middlewares/index.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  uploadProductImage,
  updateProduct,
} from "./product.controller.js";
import {
  createProductSchema,
  listProductsSchema,
  updateProductSchema,
} from "../../validators/product.validators.js";

const productRouter = Router();

productRouter.get("/", requireAuth, validate(listProductsSchema), listProducts);
productRouter.get("/:id", requireAuth, getProductById);
productRouter.post(
  "/",
  requireAuth,
  requireRole(["admin", "owner"]),
  productImageUpload.array("images", 10),
  validate(createProductSchema),
  createProduct,
);
productRouter.patch(
  "/:id",
  requireAuth,
  requireRole(["admin", "owner"]),
  productImageUpload.array("images", 10),
  validate(updateProductSchema),
  updateProduct,
);
productRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["admin", "owner"]),
  deleteProduct,
);
productRouter.patch(
  "/:id/image",
  requireAuth,
  requireRole(["admin", "owner"]),
  productImageUpload.array("images", 10),
  uploadProductImage,
);

export default productRouter;
