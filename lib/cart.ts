// Cart = { rewardId: qty } per user in localStorage. Prices/stock always come fresh from the DB.
export type Cart = Record<string, number>;
const key = (uid: string) => `cart:${uid}`;

export function readCart(uid: string): Cart {
  try { return JSON.parse(localStorage.getItem(key(uid)) ?? "{}"); } catch { return {}; }
}
export function writeCart(uid: string, cart: Cart) {
  try { localStorage.setItem(key(uid), JSON.stringify(cart)); } catch {}
}
