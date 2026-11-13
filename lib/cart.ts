// Cart = { rewardId: qty } per user in localStorage. Prices/stock always come fresh from the DB.
export type Cart = Record<string, number>;
const key = (uid: string) => `cart:${uid}`;
const CURRENT = "cart:user"; // whose cart the nav badge shows

export function readCart(uid: string): Cart {
  try { return JSON.parse(localStorage.getItem(key(uid)) ?? "{}"); } catch { return {}; }
}
export function writeCart(uid: string, cart: Cart) {
  try { localStorage.setItem(key(uid), JSON.stringify(cart)); localStorage.setItem(CURRENT, uid); } catch {}
  window.dispatchEvent(new Event("cart"));
}
export function setCartUser(uid: string) {
  try { localStorage.setItem(CURRENT, uid); } catch {}
  window.dispatchEvent(new Event("cart"));
}
export function cartCount() {
  try {
    const uid = localStorage.getItem(CURRENT);
    return uid ? Object.values(readCart(uid)).reduce((a, b) => a + b, 0) : 0;
  } catch { return 0; }
}
