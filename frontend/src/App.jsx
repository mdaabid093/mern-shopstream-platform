import { useEffect, useState } from 'react';
import { api } from './api';
import './App.css';

const CATEGORIES = [
  { id: '', label: 'All', icon: '🛍️' },
  { id: 'audio', label: 'Audio', icon: '🎧' },
  { id: 'accessories', label: 'Accessories', icon: '🖱️' },
  { id: 'wearables', label: 'Wearables', icon: '⌚' },
  { id: 'laptops', label: 'Laptops', icon: '💻' },
  { id: 'mobiles', label: 'Mobiles', icon: '📱' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'cameras', label: 'Cameras', icon: '📷' },
  { id: 'smart-home', label: 'Smart Home', icon: '💡' },
];

const THEME = {
  audio: { icons: ['🎧', '🔊', '🎙️'], from: '#6366f1', to: '#a78bfa' },
  accessories: { icons: ['🖱️', '⌨️', '🔌'], from: '#0ea5e9', to: '#67e8f9' },
  wearables: { icons: ['⌚', '🏃', '💪'], from: '#10b981', to: '#6ee7b7' },
  laptops: { icons: ['💻', '🖥️', '⌨️'], from: '#f59e0b', to: '#fcd34d' },
  mobiles: { icons: ['📱', '📲', '🔋'], from: '#ef4444', to: '#fca5a5' },
  gaming: { icons: ['🎮', '🕹️', '🎧'], from: '#ec4899', to: '#f9a8d4' },
  cameras: { icons: ['📷', '🎥', '📹'], from: '#14b8a6', to: '#99f6e4' },
  'smart-home': { icons: ['💡', '🏠', '📡'], from: '#8b5cf6', to: '#c4b5fd' },
};
const FALLBACK = { icons: ['📦'], from: '#64748b', to: '#cbd5e1' };

const visual = (p) => {
  const t = THEME[p.category] || FALLBACK;
  const hash = [...p.name].reduce((s, c) => s + c.charCodeAt(0), 0);
  return {
    icon: t.icons[hash % t.icons.length],
    bg: `linear-gradient(135deg, ${t.from}, ${t.to})`,
  };
};

const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function App() {
  const [view, setView] = useState('shop');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useState(() =>
    JSON.parse(localStorage.getItem('auth') || 'null')
  );
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);

  const loadProducts = (cat = category, q = search) => {
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (q) params.set('search', q);
    setLoading(true);
    return api(`/products?${params.toString()}`)
      .then(setProducts)
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts('', '');
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const pickCategory = (id) => {
    setCategory(id);
    setView('shop');
    loadProducts(id, search);
  };

  const addToCart = (p) => {
    setCart((c) => {
      const found = c.find((i) => i._id === p._id);
      if (found) {
        return c.map((i) =>
          i._id === p._id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i
        );
      }
      return [...c, { ...p, qty: 1 }];
    });
    setMsg(`${p.name} added to cart`);
  };

  const changeQty = (id, delta) =>
    setCart((c) =>
      c.map((i) =>
        i._id === id
          ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.stock)) }
          : i
      )
    );

  const removeFromCart = (id) => setCart((c) => c.filter((i) => i._id !== id));
  const cartCount = cart.reduce((n, i) => n + i.qty, 0);
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const submitAuth = async (e) => {
    e.preventDefault();
    try {
      const path = isRegister ? '/auth/register' : '/auth/login';
      const data = await api(path, { method: 'POST', body: form });
      localStorage.setItem('auth', JSON.stringify(data));
      setAuth(data);
      setView('shop');
      setMsg(`Welcome, ${data.user.name}`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    setOrders([]);
    setView('shop');
  };

  const showOrders = async () => {
    if (!auth) {
      setView('login');
      return;
    }
    try {
      setOrders(await api('/orders/mine', { token: auth.token }));
      setView('orders');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const checkout = async () => {
    if (!auth) {
      setMsg('Please log in to place an order');
      setView('login');
      return;
    }
    try {
      await api('/orders', {
        method: 'POST',
        token: auth.token,
        body: { items: cart.map((i) => ({ product: i._id, quantity: i.qty })) },
      });
      setCart([]);
      setMsg('Order placed successfully!');
      loadProducts();
      showOrders();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="wrap bar">
          <h1 className="logo" onClick={() => pickCategory('')}>
            🛒 Shop<span>Stream</span>
          </h1>
          <div className="search">
            <input
              placeholder="Search gadgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setView('shop');
                  loadProducts(category, search);
                }
              }}
            />
            <button
              onClick={() => {
                setView('shop');
                loadProducts(category, search);
              }}
            >
              Search
            </button>
          </div>
          <nav className="nav">
            <button className="ghost" onClick={showOrders}>
              📦 Orders
            </button>
            <button className="ghost" onClick={() => setView('cart')}>
              🛒 Cart
              {cartCount > 0 && <span className="count">{cartCount}</span>}
            </button>
            {auth ? (
              <button className="ghost" onClick={logout}>
                👤 {auth.user.name} · Logout
              </button>
            ) : (
              <button onClick={() => setView('login')}>Login</button>
            )}
          </nav>
        </div>
      </header>

      {msg && <div className="toast">{msg}</div>}

      <main className="wrap">
        {view === 'shop' && (
          <>
            <section className="hero">
              <div>
                <h2>Latest gadgets at the best prices</h2>
                <p>Headphones, laptops, phones, cameras and more, delivered fast.</p>
                <div className="perks">
                  <span>🚚 Free delivery over ₹999</span>
                  <span>🔒 Secure checkout</span>
                  <span>↩️ Easy returns</span>
                </div>
              </div>
              <div className="hero-art">🎧 💻 📱 ⌚</div>
            </section>

            <div className="chips">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`chip ${category === c.id ? 'active' : ''}`}
                  onClick={() => pickCategory(c.id)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <div className="section-title">
              <h2>{category ? CATEGORIES.find((c) => c.id === category)?.label : 'All products'}</h2>
              <span>{products.length} items</span>
            </div>

            {loading && <p className="empty">Loading products...</p>}

            <div className="grid">
              {products.map((p) => {
                const v = visual(p);
                return (
                  <div className="card" key={p._id}>
                    <div className="thumb" style={{ background: v.bg }}>
                      <span>{v.icon}</span>
                      {p.stock > 0 && p.stock <= 5 && (
                        <em className="badge warn">Only {p.stock} left</em>
                      )}
                      {p.stock === 0 && <em className="badge out">Sold out</em>}
                    </div>
                    <div className="info">
                      <p className="brand">{p.brand || p.category}</p>
                      <h3>{p.name}</h3>
                      {p.description && <p className="desc">{p.description}</p>}
                      <div className="buy">
                        <span className="price">{money(p.price)}</span>
                        <button disabled={p.stock < 1} onClick={() => addToCart(p)}>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!loading && products.length === 0 && (
              <p className="empty">No products found.</p>
            )}
          </>
        )}

        {view === 'cart' && (
          <section className="panel">
            <h2>Your cart</h2>
            {cart.length === 0 && <p className="empty">Your cart is empty.</p>}
            {cart.map((i) => (
              <div className="line" key={i._id}>
                <div className="mini" style={{ background: visual(i).bg }}>
                  {visual(i).icon}
                </div>
                <div className="grow">
                  <b>{i.name}</b>
                  <p className="muted">{money(i.price)} each</p>
                </div>
                <div className="qty">
                  <button onClick={() => changeQty(i._id, -1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => changeQty(i._id, 1)}>+</button>
                </div>
                <b className="line-total">{money(i.price * i.qty)}</b>
                <button className="ghost danger" onClick={() => removeFromCart(i._id)}>
                  ✕
                </button>
              </div>
            ))}
            {cart.length > 0 && (
              <div className="summary">
                <h3>Total: {money(total)}</h3>
                <button onClick={checkout}>Place order</button>
              </div>
            )}
          </section>
        )}

        {view === 'orders' && (
          <section className="panel">
            <h2>My orders</h2>
            {orders.length === 0 && <p className="empty">No orders yet.</p>}
            {orders.map((o) => (
              <div className="order" key={o._id}>
                <div className="order-head">
                  <b>{new Date(o.createdAt).toLocaleString()}</b>
                  <span className={`tag ${o.status}`}>{o.status}</span>
                </div>
                {o.items.map((it, idx) => (
                  <p key={idx} className="muted">
                    {it.name} × {it.quantity} · {money(it.price)} each
                  </p>
                ))}
                <p className="price">Total: {money(o.totalPrice)}</p>
              </div>
            ))}
          </section>
        )}

        {view === 'login' && (
          <section className="panel narrow">
            <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
            <form className="auth" onSubmit={submitAuth}>
              {isRegister && (
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
            </form>
            <p className="link" onClick={() => setIsRegister(!isRegister)}>
              {isRegister
                ? 'Already have an account? Login'
                : 'New here? Create an account'}
            </p>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="wrap">
          ShopStream · Built with MERN · Deployed with Docker, Kubernetes and AWS
        </div>
      </footer>
    </div>
  );
}