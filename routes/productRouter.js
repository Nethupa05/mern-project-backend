import express from 'express';
import { getProducts, saveProducts, deleteProducts, updateProduct, getProductsById, searchProducts, searchProductsFull  } from '../controllers/ProductController.js';

const productRouter = express.Router();

productRouter.get("/", getProducts);

productRouter.post("/", saveProducts);

productRouter.delete("/:productId", deleteProducts);

productRouter.put("/:productId", updateProduct);

productRouter.get("/:productId", getProductsById)

productRouter.get('/search', searchProducts); // For dropdown

productRouter.get('/search/full', searchProductsFull); // For full results page


export default productRouter;