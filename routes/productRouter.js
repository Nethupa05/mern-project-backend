import express from 'express';
import { getProducts, saveProducts, deleteProducts, updateProduct, getProductsById,  } from '../controllers/ProductController.js';

const productRouter = express.Router();

productRouter.get("/", getProducts);

productRouter.post("/", saveProducts);

productRouter.delete("/:productId", deleteProducts);

productRouter.put("/:productId", updateProduct);

productRouter.get("/:productId", getProductsById)

export default productRouter;