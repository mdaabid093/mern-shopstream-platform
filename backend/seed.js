require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  // Audio
  { name: 'Aurix Studio Headphones', brand: 'Aurix', category: 'audio', price: 4999, stock: 20, description: 'Over-ear, 40 hr battery, deep bass' },
  { name: 'Aurix Bass Earbuds', brand: 'Aurix', category: 'audio', price: 1999, stock: 45, description: 'True wireless, 24 hr with case' },
  { name: 'Zentra Portable Speaker', brand: 'Zentra', category: 'audio', price: 2999, stock: 30, description: 'Waterproof, 12 hr playtime' },
  // Accessories
  { name: 'Zentra Wireless Mouse', brand: 'Zentra', category: 'accessories', price: 799, stock: 60, description: 'Silent clicks, 18 month battery' },
  { name: 'NovaTech RGB Keyboard', brand: 'NovaTech', category: 'accessories', price: 2299, stock: 25, description: 'Mechanical, hot-swappable switches' },
  { name: 'NovaTech USB-C Hub 7-in-1', brand: 'NovaTech', category: 'accessories', price: 1799, stock: 35, description: 'HDMI, USB 3.0, SD card reader' },
  // Wearables
  { name: 'Pixelo Fit Band 6', brand: 'Pixelo', category: 'wearables', price: 2499, stock: 40, description: 'Heart rate, sleep tracking, 14 day battery' },
  { name: 'Pixelo Smartwatch Ultra', brand: 'Pixelo', category: 'wearables', price: 7999, stock: 15, description: 'AMOLED display, GPS, calls' },
  { name: 'Aurix Fitness Tracker', brand: 'Aurix', category: 'wearables', price: 1499, stock: 50, description: 'Step counter, water resistant' },
  // Laptops
  { name: 'NovaTech Slim 14 Laptop', brand: 'NovaTech', category: 'laptops', price: 45999, stock: 8, description: '14 inch, 16 GB RAM, 512 GB SSD' },
  { name: 'NovaTech Pro 16 Laptop', brand: 'NovaTech', category: 'laptops', price: 74999, stock: 5, description: '16 inch, 32 GB RAM, dedicated graphics' },
  { name: 'Zentra Chromebook 11', brand: 'Zentra', category: 'laptops', price: 19999, stock: 12, description: 'Light, 12 hr battery, great for students' },
  // Mobiles
  { name: 'Pixelo Nova 5G', brand: 'Pixelo', category: 'mobiles', price: 17999, stock: 25, description: '6.5 inch display, 50 MP camera' },
  { name: 'Pixelo Max Pro 5G', brand: 'Pixelo', category: 'mobiles', price: 42999, stock: 10, description: 'Flagship chip, 120 Hz AMOLED' },
  { name: 'Zentra Lite 4G', brand: 'Zentra', category: 'mobiles', price: 8999, stock: 40, description: 'Big battery, everyday smartphone' },
  // Gaming
  { name: 'Zentra Gamepad Pro', brand: 'Zentra', category: 'gaming', price: 2499, stock: 22, description: 'Wireless controller, PC and mobile' },
  { name: 'NovaTech Gaming Mouse', brand: 'NovaTech', category: 'gaming', price: 1499, stock: 33, description: '16000 DPI, 6 programmable buttons' },
  { name: 'Aurix Gaming Headset', brand: 'Aurix', category: 'gaming', price: 3499, stock: 18, description: '7.1 surround, noise-cancelling mic' },
  // Cameras
  { name: 'Pixelo Action Cam 4K', brand: 'Pixelo', category: 'cameras', price: 8999, stock: 14, description: 'Waterproof, image stabilization' },
  { name: 'NovaTech Mirrorless Kit', brand: 'NovaTech', category: 'cameras', price: 54999, stock: 4, description: '24 MP sensor with 18-55 mm lens' },
  { name: 'Zentra Webcam 1080p', brand: 'Zentra', category: 'cameras', price: 2199, stock: 38, description: 'Auto focus, built-in microphone' },
  // Smart home
  { name: 'Aurix Smart Bulb Pack', brand: 'Aurix', category: 'smart-home', price: 1299, stock: 55, description: '4 colour bulbs, app and voice control' },
  { name: 'Zentra Smart Plug 2-pack', brand: 'Zentra', category: 'smart-home', price: 999, stock: 48, description: 'Schedule and control from your phone' },
  { name: 'NovaTech Wi-Fi Security Cam', brand: 'NovaTech', category: 'smart-home', price: 2799, stock: 20, description: '2K video, night vision, motion alerts' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  // Insert only products that don't exist yet (matched by name), so it is safe to run many times
  const ops = products.map(({ name, ...rest }) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: rest },
      upsert: true,
    },
  }));
  const result = await Product.bulkWrite(ops);
  console.log(`Added ${result.upsertedCount} new products`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});