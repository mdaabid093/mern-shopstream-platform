import { useEffect, useState } from 'react';
import { api } from './api';
import './App.css';

export default function App() {
  const [view, setView] = useState('shop');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useState(() =>
    JSON.parse(localStorage.getItem('auth') || 'null')
  );
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);

  const loadProducts = () =>
    api(`/products?search=${encodeURIComponent(search)}`)
      .then(setProducts)
      .catch((e) => setMsg(e.message));

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (p) =>
    setCart((c) => {
      const found = c.find((i) => i._id === p._id);
      if (found) {
        return c.map((i) =>
          i._id === p._id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i
        );
      }
      return [...c, { ...p, qty: 1 }];
    });

  const removeFromCart = (id) => setCart((c) => c.filter((i) => i._id !== id));
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
      setMsg('Order placed!');
      loadProducts();
      showOrders();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="app">
      <header>
        <h1 onClick={() => setView('shop')}>ShopStream</h1>
        <nav>
          <button onClick={() => setView('shop')}>Shop</button>
          <button onClick={() => setView('cart')}>
            Cart ({cart.reduce((n, i) => n + i.qty, 0)})
          </button>
          <button onClick={showOrders}>My orders</button>
          {auth ? (
            <button onClick={logout}>Logout ({auth.user.name})</button>
          ) : (
            <button onClick={() => setView('login')}>Login</button>
          )}
        </nav>
      </header>

      {msg && (
        <p className="msg" onClick={() => setMsg('')}>
          {msg}
        </p>
      )}

      {view === 'shop' && (
        <section>
          <div className="search">
            <input
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            />
            <button onClick={loadProducts}>Search</button>
          </div>
          <div className="grid">
            {products.map((p) => (
              <div className="card" key={p._id}>
                <h3>{p.name}</h3>
                <p className="muted">
                  {p.brand} · {p.category}
                </p>
                <p className="price">₹{p.price}</p>
                <p className="muted">
                  {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                </p>
                <button disabled={p.stock < 1} onClick={() => addToCart(p)}>
                  Add to cart
                </button>
              </div>
            ))}
            {products.length === 0 && <p>No products found.</p>}
          </div>
        </section>
      )}

      {view === 'cart' && (
        <section>
          <h2>Your cart</h2>
          {cart.length === 0 && <p>Your cart is empty.</p>}
          {cart.map((i) => (
            <div className="row" key={i._id}>
              <span>
                {i.name} × {i.qty}
              </span>
              <span>₹{i.price * i.qty}</span>
              <button onClick={() => removeFromCart(i._id)}>Remove</button>
            </div>
          ))}
          {cart.length > 0 && (
            <>
              <h3>Total: ₹{total}</h3>
              <button onClick={checkout}>Place order</button>
            </>
          )}
        </section>
      )}

      {view === 'orders' && (
        <section>
          <h2>My orders</h2>
          {orders.length === 0 && <p>No orders yet.</p>}
          {orders.map((o) => (
            <div className="card wide" key={o._id}>
              <p>
                <b>{new Date(o.createdAt).toLocaleString()}</b> —{' '}
                <span className="tag">{o.status}</span>
              </p>
              {o.items.map((it, idx) => (
                <p key={idx}>
                  {it.name} × {it.quantity} (₹{it.price} each)
                </p>
              ))}
              <p className="price">Total: ₹{o.totalPrice}</p>
            </div>
          ))}
        </section>
      )}

      {view === 'login' && (
        <section>
          <h2>{isRegister ? 'Create account' : 'Login'}</h2>
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
            {isRegister ? 'Already have an account? Login' : 'New here? Create an account'}
          </p>
        </section>
      )}
    </div>
  );
}