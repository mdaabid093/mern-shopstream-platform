const express = require('express');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every order route needs a login

router.post('/', createOrder);
router.get('/mine', getMyOrders);
router.get('/', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;