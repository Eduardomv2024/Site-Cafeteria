/* ==========================================================================
   Café Dalí — Carrinho de encomendas (compartilhado por todas as páginas)
   ========================================================================== */

const CART_KEY = "dalicafe_carrinho";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function findProductById(id) {
  for (const cat of Object.values(CATALOGO)) {
    const found = cat.itens.find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
}

function updateQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter((i) => i.id !== productId);
  } else {
    const item = cart.find((i) => i.id === productId);
    if (item) item.qty = qty;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.id !== productId);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal() {
  return getCart().reduce((sum, i) => {
    const p = findProductById(i.id);
    return sum + (p ? p.preco * i.qty : 0);
  }, 0);
}

function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }
});
