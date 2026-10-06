const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['placed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);