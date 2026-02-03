import express from 'express';
import { getProducts, saveProducts, deleteProducts } from '../controllers/ProductController.js';

const productRouter = express.Router();

productRouter.get("/", getProducts);

productRouter.post("/", saveProducts);

productRouter.delete("/:productId", deleteProducts);

export default productRouter;