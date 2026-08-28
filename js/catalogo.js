/* ==========================================================================
   Café Dalí — Renderização do catálogo na página de encomendas
   ========================================================================== */

function productCardHTML(p) {
  return `
    <div class="product-card">
      <div class="product-media">${p.nome}</div>
      <div class="product-body">
        <h3>${p.nome}</h3>
        <p class="product-desc">${p.descricao}</p>
        <div class="product-footer">
          <div>
            <span class="price">${formatBRL(p.preco)}</span>
            <span class="price-unit">${p.unidade}</span>
          </div>
          <button class="add-btn" data-add="${p.id}" aria-label="Adicionar ${p.nome}">+</button>
        </div>
      </div>
    </div>
  `;
}

function renderCatalogo() {
  const container = document.getElementById("catalogo");
  if (!container) return;

  container.innerHTML = Object.entries(CATALOGO)
    .map(
      ([key, cat]) => `
      <section class="product-group" id="cat-${key}" data-category="${key}">
        <h2>${cat.titulo} <small>${cat.subtitulo}</small></h2>
        <div class="product-grid">
          ${cat.itens.map(productCardHTML).join("")}
        </div>
      </section>
    `
    )
    .join("");

  container.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add, 1);
      btn.textContent = "✓";
      btn.classList.add("added");
      setTimeout(() => {
        btn.textContent = "+";
        btn.classList.remove("added");
      }, 900);
    });
  });
}

function setupCategoryNav() {
  const nav = document.getElementById("category-nav");
  if (!nav) return;

  const buttonsHTML =
    `<button data-target="all" class="active">Tudo</button>` +
    Object.entries(CATALOGO)
      .map(([key, cat]) => `<button data-target="${key}">${cat.titulo}</button>`)
      .join("");
  nav.innerHTML = buttonsHTML;

  const buttons = nav.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      if (target === "all") {
        document.querySelectorAll(".product-group").forEach((g) => (g.style.display = ""));
      } else {
        document.querySelectorAll(".product-group").forEach((g) => {
          g.style.display = g.dataset.category === target ? "" : "none";
        });
      }
      document.getElementById(target === "all" ? "catalogo" : `cat-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

onCatalogoReady(() => {
  renderCatalogo();
  setupCategoryNav();
});
