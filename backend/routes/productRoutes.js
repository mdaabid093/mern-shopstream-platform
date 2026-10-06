const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(protect, adminOnly, createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;