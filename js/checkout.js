/* ==========================================================================
   Café Dalí — Página do carrinho / checkout
   ========================================================================== */

const WHATSAPP_NUMBER = "5548988410415"; // valor padrão/reserva — o número de verdade vem do Painel de Produtos > Conteúdo do site
const MIN_HOURS_AHEAD = 48;

function cartItemRow(item) {
  const p = findProductById(item.id);
  if (!p) return "";
  return `
    <div class="cart-item" data-id="${p.id}">
      <div class="cart-item-info">
        <h4>${p.nome}</h4>
        <span>${formatBRL(p.preco)} · ${p.unidade}</span>
        <div class="qty-control" style="margin-top:8px;">
          <button data-qty-minus="${p.id}" aria-label="Diminuir">–</button>
          <span>${item.qty}</span>
          <button data-qty-plus="${p.id}" aria-label="Aumentar">+</button>
        </div>
        <div><button class="remove-link" data-remove="${p.id}">Remover</button></div>
      </div>
      <div class="cart-item-price">${formatBRL(p.preco * item.qty)}</div>
    </div>
  `;
}

function renderCart() {
  const list = document.getElementById("cart-list");
  const emptyState = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary-wrap");
  if (!list) return;

  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (summary) summary.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (summary) summary.style.display = "block";

  list.innerHTML = cart.map(cartItemRow).join("");

  list.querySelectorAll("[data-qty-plus]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cart = getCart();
      const item = cart.find((i) => i.id === btn.dataset.qtyPlus);
      updateQty(btn.dataset.qtyPlus, (item?.qty || 0) + 1);
      renderCart();
      renderSummary();
    })
  );
  list.querySelectorAll("[data-qty-minus]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cart = getCart();
      const item = cart.find((i) => i.id === btn.dataset.qtyMinus);
      updateQty(btn.dataset.qtyMinus, (item?.qty || 0) - 1);
      renderCart();
      renderSummary();
    })
  );
  list.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.remove);
      renderCart();
      renderSummary();
    })
  );
}

function renderSummary() {
  const totalEl = document.getElementById("cart-total");
  const subtotalEl = document.getElementById("cart-subtotal");
  if (!totalEl) return;
  const total = cartTotal();
  totalEl.textContent = formatBRL(total);
  if (subtotalEl) subtotalEl.textContent = formatBRL(total);
}

/* ---- Data mínima (48h) --------------------------------------------------- */
function minAllowedDate() {
  const d = new Date();
  d.setHours(d.getHours() + MIN_HOURS_AHEAD);
  return d;
}

function setupDateField() {
  const dateInput = document.getElementById("data-retirada");
  if (!dateInput) return;
  const min = minAllowedDate();
  const iso = min.toISOString().slice(0, 10);
  dateInput.min = iso;
}

/* ---- Alternância retirada / entrega -------------------------------------- */
function setupDeliveryToggle() {
  const radios = document.querySelectorAll('input[name="entrega-tipo"]');
  const enderecoWrap = document.getElementById("endereco-wrap");
  if (!radios.length || !enderecoWrap) return;
  radios.forEach((r) =>
    r.addEventListener("change", () => {
      enderecoWrap.style.display = r.value === "entrega" && r.checked ? "block" : enderecoWrap.style.display;
      if (r.checked) {
        enderecoWrap.style.display = r.value === "entrega" ? "block" : "none";
      }
    })
  );
}

/* ---- Monta o texto do pedido para WhatsApp / metadata --------------------- */
function buildOrderSummaryText(form) {
  const cart = getCart();
  const lines = cart.map((i) => {
    const p = findProductById(i.id);
    return `• ${i.qty}x ${p.nome} (${formatBRL(p.preco)} cada) = ${formatBRL(p.preco * i.qty)}`;
  });
  const tipo = form.querySelector('input[name="entrega-tipo"]:checked')?.value === "entrega" ? "Entrega" : "Retirada no local";
  const endereco = form.enderecoEntrega?.value ? `\nEndereço: ${form.enderecoEntrega.value}` : "";
  const obs = form.observacoes?.value ? `\nObservações: ${form.observacoes.value}` : "";

  return (
    `*Novo pedido — Café Dalí*\n\n` +
    `Nome: ${form.nomeCliente.value}\n` +
    `Telefone: ${form.telefoneCliente.value}\n` +
    `Data desejada: ${form.dataRetirada.value}\n` +
    `Tipo: ${tipo}${endereco}${obs}\n\n` +
    `Itens:\n${lines.join("\n")}\n\n` +
    `*Total: ${formatBRL(cartTotal())}*`
  );
}

function showStatus(msg, type = "info") {
  const el = document.getElementById("checkout-status");
  if (!el) return;
  el.textContent = msg;
  el.className = `checkout-status show ${type}`;
}

function validateForm(form) {
  let valid = true;
  const requiredFields = [form.nomeCliente, form.telefoneCliente, form.dataRetirada];
  requiredFields.forEach((field) => {
    const errorEl = document.getElementById(`error-${field.name}`);
    if (!field.value.trim()) {
      valid = false;
      if (errorEl) errorEl.classList.add("show");
    } else if (errorEl) {
      errorEl.classList.remove("show");
    }
  });

  // valida antecedência mínima de 48h
  const dateErrorEl = document.getElementById("error-dataRetirada-min");
  if (form.dataRetirada.value) {
    const chosen = new Date(form.dataRetirada.value + "T00:00:00");
    const min = minAllowedDate();
    min.setHours(0, 0, 0, 0);
    if (chosen < min) {
      valid = false;
      if (dateErrorEl) dateErrorEl.classList.add("show");
    } else if (dateErrorEl) {
      dateErrorEl.classList.remove("show");
    }
  }

  const entregaTipo = form.querySelector('input[name="entrega-tipo"]:checked');
  if (entregaTipo?.value === "entrega" && !form.enderecoEntrega.value.trim()) {
    valid = false;
    document.getElementById("error-enderecoEntrega")?.classList.add("show");
  } else {
    document.getElementById("error-enderecoEntrega")?.classList.remove("show");
  }

  return valid;
}

function whatsappFallback(form, reason) {
  const text = buildOrderSummaryText(form);
  if (reason) {
    showStatus(reason, "info");
  }
  const numero = (typeof SITE_CONTENT !== "undefined" && SITE_CONTENT.contato && SITE_CONTENT.contato.whatsapp) || WHATSAPP_NUMBER;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Processando...";
  showStatus("Gerando pagamento...", "info");

  const cart = getCart();
  const items = cart.map((i) => {
    const p = findProductById(i.id);
    return { id: p.id, title: p.nome, quantity: i.qty, unit_price: p.preco };
  });

  const payload = {
    items,
    payer: {
      name: form.nomeCliente.value,
      phone: form.telefoneCliente.value,
    },
    metadata: {
      data_retirada: form.dataRetirada.value,
      tipo_entrega: form.querySelector('input[name="entrega-tipo"]:checked')?.value,
      endereco: form.enderecoEntrega?.value || "",
      observacoes: form.observacoes?.value || "",
    },
  };

  try {
    const res = await fetch("/.netlify/functions/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Pagamento online indisponível no momento");

    const data = await res.json();
    if (data.init_point) {
      localStorage.setItem("dalicafe_ultimo_pedido", buildOrderSummaryText(form));
      window.location.href = data.init_point;
      return;
    }
    throw new Error("Resposta inesperada do pagamento");
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Finalizar pedido";
    whatsappFallback(
      form,
      "O pagamento online ainda está sendo configurado. Vamos abrir o WhatsApp para confirmar seu pedido diretamente com o Café Dalí."
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onCatalogoReady(() => {
    renderCart();
    renderSummary();
  });
  setupDateField();
  setupDeliveryToggle();

  const form = document.getElementById("checkout-form");
  if (form) form.addEventListener("submit", handleCheckoutSubmit);
});
