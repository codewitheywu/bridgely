// Cart = { rewardId: qty } per user in localStorage. Prices/stock always come fresh from the DB.
export type Cart = Record<string, number>;
const key = (uid: string) => `cart:${uid}`;
const CURRENT = "cart:user"; // whose cart the nav badge shows

/** For useSyncExternalStore: fires on our own writes and on other tabs' writes. */
export const subscribeCart = (cb: () => void) => {
  addEventListener("cart", cb);
  addEventListener("storage", cb);
  return () => { removeEventListener("cart", cb); removeEventListener("storage", cb); };
};
/** The stored JSON string: a stable snapshot that only changes when the cart does. */
export function rawCart(uid: string) {
  try { return localStorage.getItem(key(uid)) ?? "{}"; } catch { return "{}"; }
}
export function parseCart(raw: string): Cart {
  try { return JSON.parse(raw); } catch { return {}; }
}
export const readCart = (uid: string) => parseCart(rawCart(uid));
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
