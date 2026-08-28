/* ==========================================================================
   Café Dalí — Painel de produtos (editor visual, sem precisar programar)
   ========================================================================== */

let state = {}; // catálogo editável, carregado do servidor em loadState()

function slugify(text) {
  return (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function uniqueId(base, existingIds) {
  let id = base || "produto";
  let i = 2;
  while (existingIds.has(id)) {
    id = `${base}-${i}`;
    i++;
  }
  existingIds.add(id);
  return id;
}

function allExistingIds(excludeCat, excludeIdx) {
  const ids = new Set();
  Object.entries(state).forEach(([catKey, cat]) => {
    cat.itens.forEach((item, idx) => {
      if (catKey === excludeCat && idx === excludeIdx) return;
      ids.add(item.id);
    });
  });
  return ids;
}

function render() {
  const container = document.getElementById("categories");
  container.innerHTML = Object.entries(state)
    .map(([catKey, cat]) => categoryHTML(catKey, cat))
    .join("");
  attachEvents();
}

function categoryHTML(catKey, cat) {
  return `
    <section class="admin-cat" data-cat="${catKey}">
      <div class="admin-cat-header">
        <div class="form-group">
          <label>Nome da categoria</label>
          <input type="text" data-cat-titulo="${catKey}" value="${escapeAttr(cat.titulo)}" />
        </div>
        <div class="form-group">
          <label>Subtítulo (opcional)</label>
          <input type="text" data-cat-subtitulo="${catKey}" value="${escapeAttr(cat.subtitulo || "")}" />
        </div>
        <button class="admin-cat-remove" data-remove-cat="${catKey}" type="button">Remover categoria</button>
      </div>

      <div class="admin-items" data-items-for="${catKey}">
        ${cat.itens.map((item, idx) => itemHTML(catKey, item, idx)).join("")}
      </div>

      <button class="admin-add-btn" data-add-item="${catKey}" type="button">+ Adicionar produto em "${escapeHtml(cat.titulo)}"</button>
    </section>
  `;
}

function itemHTML(catKey, item, idx) {
  return `
    <div class="admin-item" data-cat="${catKey}" data-idx="${idx}">
      <div>
        <span class="admin-col-label">Nome</span>
        <input type="text" data-field="nome" value="${escapeAttr(item.nome)}" placeholder="Ex: Torta de Chocolate" />
      </div>
      <div>
        <span class="admin-col-label">Descrição</span>
        <textarea data-field="descricao" placeholder="Descrição curta">${escapeHtml(item.descricao || "")}</textarea>
      </div>
      <div>
        <span class="admin-col-label">Preço (R$)</span>
        <input type="number" step="0.01" min="0" data-field="preco" value="${item.preco}" />
      </div>
      <div>
        <span class="admin-col-label">Unidade</span>
        <input type="text" data-field="unidade" value="${escapeAttr(item.unidade || "")}" placeholder="Ex: cento, dúzia" />
      </div>
      <button class="admin-remove" data-remove-item title="Remover produto" type="button">✕</button>
    </div>
  `;
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

function attachEvents() {
  // categoria: título / subtítulo
  document.querySelectorAll("[data-cat-titulo]").forEach((el) =>
    el.addEventListener("input", () => {
      state[el.dataset.catTitulo].titulo = el.value;
      syncAddButtonLabel(el.dataset.catTitulo);
    })
  );
  document.querySelectorAll("[data-cat-subtitulo]").forEach((el) =>
    el.addEventListener("input", () => {
      state[el.dataset.catSubtitulo].subtitulo = el.value;
    })
  );

  // remover categoria
  document.querySelectorAll("[data-remove-cat]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const key = btn.dataset.removeCat;
      if (confirm(`Remover a categoria "${state[key].titulo}" e todos os seus produtos?`)) {
        delete state[key];
        render();
        setStatus("Categoria removida. Não esqueça de baixar o arquivo atualizado.");
      }
    })
  );

  // adicionar produto
  document.querySelectorAll("[data-add-item]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const catKey = btn.dataset.addItem;
      const newId = uniqueId(slugify("novo-produto"), allExistingIds());
      state[catKey].itens.push({ id: newId, nome: "", descricao: "", preco: 0, unidade: "" });
      render();
    })
  );

  // campos dos produtos
  document.querySelectorAll(".admin-item").forEach((row) => {
    const catKey = row.dataset.cat;
    const idx = Number(row.dataset.idx);
    row.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.field;
        const item = state[catKey].itens[idx];
        if (field === "preco") {
          item.preco = parseFloat(input.value) || 0;
        } else {
          item[field] = input.value;
        }
        // regenera o id só se ainda não tiver nome definido antes (produto novo)
        if (field === "nome" && (!item.id || item.id.startsWith("novo-produto"))) {
          const ids = allExistingIds(catKey, idx);
          item.id = uniqueId(slugify(item.nome) || "produto", ids);
        }
      });
    });
    row.querySelector("[data-remove-item]").addEventListener("click", () => {
      state[catKey].itens.splice(idx, 1);
      render();
    });
  });
}

function syncAddButtonLabel(catKey) {
  const btn = document.querySelector(`[data-add-item="${catKey}"]`);
  if (btn) btn.textContent = `+ Adicionar produto em "${state[catKey].titulo}"`;
}

function setStatus(msg) {
  document.getElementById("admin-status").textContent = msg;
}

document.getElementById("add-category").addEventListener("click", () => {
  let base = "nova-categoria";
  let key = base;
  let i = 2;
  while (state[key]) {
    key = `${base}-${i}`;
    i++;
  }
  state[key] = { titulo: "Nova categoria", subtitulo: "", itens: [] };
  render();
});

async function loadState() {
  try {
    const res = await fetch("/.netlify/functions/get-products", { cache: "no-store" });
    if (!res.ok) throw new Error("O servidor respondeu com erro " + res.status);
    state = await res.json();
    render();
    setStatus('Produtos carregados do site. Edite à vontade e clique em "Salvar alterações no site" quando terminar.');
  } catch (err) {
    document.getElementById("categories").innerHTML =
      '<p style="color:#b00020;">Não foi possível carregar os produtos atuais do site (' +
      escapeHtml(err.message) +
      "). Recarregue a página para tentar de novo — por segurança, o painel não deixa editar sem antes confirmar os dados reais.</p>";
    setStatus("Erro ao carregar produtos.");
  }
}

document.getElementById("save-btn").addEventListener("click", async () => {
  const { cleaned, skipped } = removeBlankItems(state);
  state = cleaned;
  render();

  const password = document.getElementById("admin-password").value;
  if (!password) {
    setStatus("Digite a senha do painel antes de salvar.");
    return;
  }

  const btn = document.getElementById("save-btn");
  btn.disabled = true;
  btn.textContent = "Salvando...";
  setStatus("Salvando...");

  try {
    const res = await fetch("/.netlify/functions/save-products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(state),
    });

    if (res.status === 401) {
      setStatus("Senha incorreta. Confira e tente de novo.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "status " + res.status);
    }

    const skippedNote = skipped > 0 ? ` (${skipped} produto${skipped > 1 ? "s" : ""} em branco foi${skipped > 1 ? "ram" : ""} ignorado${skipped > 1 ? "s" : ""})` : "";
    setStatus(`Alterações salvas com sucesso!${skippedNote} O site já está atualizado.`);
  } catch (err) {
    setStatus("Não foi possível salvar agora (" + err.message + "). Verifique sua internet e tente de novo.");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Salvar alterações no site";
  }
});

function removeBlankItems(catalogo) {
  let skipped = 0;
  const cleaned = {};
  Object.entries(catalogo).forEach(([key, cat]) => {
    const itens = cat.itens.filter((item) => {
      const isBlank = !item.nome.trim() && !item.preco;
      if (isBlank) skipped++;
      return !isBlank;
    });
    cleaned[key] = { ...cat, itens };
  });
  return { cleaned, skipped };
}

loadState();
