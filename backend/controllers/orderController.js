const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const badRequest = (message) =>
  Object.assign(new Error(message), { status: 400 });

// POST /api/orders   body: { items: [{ product: "<id>", quantity: 2 }] }
exports.createOrder = async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items must be a non-empty array' });
  }
  for (const it of items) {
    if (
      !it ||
      !mongoose.isValidObjectId(it.product) ||
      !Number.isInteger(it.quantity) ||
      it.quantity < 1
    ) {
      return res
        .status(400)
        .json({ message: 'Each item needs a valid product id and a whole quantity of 1 or more' });
    }
  }

  const reserved = [];
  try {
    const orderItems = [];
    let total = 0;

    for (const it of items) {
      // Atomic: only decrements if enough stock is left
      const product = await Product.findOneAndUpdate(
        { _id: it.product, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity } },
        { new: true }
      );
      if (!product) {
        throw badRequest(`Product not found or not enough stock: ${it.product}`);
      }
      reserved.push(it);
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
      });
      total += product.price * it.quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice: total,
    });
    res.status(201).json(order);
  } catch (err) {
    // Put back any stock we already took
    for (const it of reserved) {
      await Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity } });
    }
    res.status(err.status || 500).json({ message: err.message });
  }
};

// GET /api/orders/mine
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders   (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/status   (admin)   body: { status: "shipped" }
exports.updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};