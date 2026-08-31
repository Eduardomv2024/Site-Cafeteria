/* ==========================================================================
   Café Dalí — Painel de produtos (editor visual, sem precisar programar)
   ========================================================================== */

let state = {}; // catálogo editável, carregado do servidor em loadState()

/* ==========================================================================
   Tela de bloqueio: esconde o painel inteiro até a senha certa ser digitada
   ========================================================================== */

const ADMIN_PW_STORAGE_KEY = "cafeDaliAdminPw";
let panelUnlocked = false;

function setLockStatus(msg) {
  const el = document.getElementById("admin-lock-status");
  if (el) el.textContent = msg || "";
}

async function verifyPassword(pw) {
  const res = await fetch("/.netlify/functions/check-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-password": pw },
    body: "{}",
  });
  if (res.status === 200) return { ok: true };
  const data = await res.json().catch(() => ({}));
  return { ok: false, error: data.error || "Não foi possível confirmar a senha (status " + res.status + ")." };
}

function unlockPanel(pw) {
  document.getElementById("admin-password").value = pw;
  document.getElementById("admin-lock").hidden = true;
  document.getElementById("admin-main").hidden = false;
  if (!panelUnlocked) {
    panelUnlocked = true;
    loadState();
    loadContentState();
  }
}

async function tryUnlock(pw, opts) {
  const silent = opts && opts.silent;
  if (!silent) setLockStatus("Verificando...");
  try {
    const result = await verifyPassword(pw);
    if (result.ok) {
      try {
        sessionStorage.setItem(ADMIN_PW_STORAGE_KEY, pw);
      } catch (e) {}
      setLockStatus("");
      unlockPanel(pw);
      return true;
    }
    if (!silent) {
      setLockStatus(result.error);
    } else {
      try {
        sessionStorage.removeItem(ADMIN_PW_STORAGE_KEY);
      } catch (e) {}
    }
    return false;
  } catch (err) {
    if (!silent) setLockStatus("Não foi possível confirmar a senha agora. Verifique sua internet e tente de novo.");
    return false;
  }
}

document.getElementById("lock-submit").addEventListener("click", () => {
  const pw = document.getElementById("lock-password").value;
  if (!pw) {
    setLockStatus("Digite a senha.");
    return;
  }
  tryUnlock(pw);
});
document.getElementById("lock-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("lock-submit").click();
});
document.getElementById("admin-logout").addEventListener("click", () => {
  try {
    sessionStorage.removeItem(ADMIN_PW_STORAGE_KEY);
  } catch (e) {}
  location.reload();
});

// se a senha já foi confirmada nesta aba (sessionStorage), entra sozinho sem pedir de novo
(function initLock() {
  let saved = "";
  try {
    saved = sessionStorage.getItem(ADMIN_PW_STORAGE_KEY) || "";
  } catch (e) {}
  if (saved) tryUnlock(saved, { silent: true });
})();

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
      <div class="admin-img-cell">
        <span class="admin-col-label">Foto</span>
        <div class="admin-img-preview">
          ${item.imagem ? `<img src="${item.imagem}" alt="" />` : `<span class="admin-img-empty">sem foto</span>`}
        </div>
        <input type="file" accept="image/*" data-img-input style="display:none" />
        <button type="button" class="admin-img-btn" data-img-trigger>${item.imagem ? "Trocar" : "Escolher"}</button>
        ${item.imagem ? `<button type="button" class="admin-img-remove" data-img-remove>Remover foto</button>` : ""}
        <span class="admin-img-hint">até 20MB, qualquer formato</span>
      </div>
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
        setProductStatus('Categoria removida. Não esqueça de clicar em "Salvar produtos".');
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

    // foto do produto
    const imgInput = row.querySelector("[data-img-input]");
    const imgTrigger = row.querySelector("[data-img-trigger]");
    const imgRemoveBtn = row.querySelector("[data-img-remove]");
    if (imgTrigger) {
      imgTrigger.addEventListener("click", () => imgInput.click());
    }
    if (imgInput) {
      imgInput.addEventListener("change", async () => {
        const file = imgInput.files[0];
        if (!file) return;
        const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024; // 20MB
        if (file.size > MAX_ORIGINAL_BYTES) {
          setProductStatus("Essa foto tem mais de 20MB. Escolha uma foto menor (ou tire uma nova com o celular em qualidade normal).");
          imgInput.value = "";
          return;
        }
        setProductStatus("Processando imagem...");
        try {
          const dataUrl = await compressImageFile(file, 640, 0.7);
          state[catKey].itens[idx].imagem = dataUrl;
          render();
          setProductStatus('Foto adicionada. Não esqueça de clicar em "Salvar produtos".');
        } catch (e) {
          setProductStatus("Não foi possível processar essa imagem. Tente outra foto.");
        }
      });
    }
    if (imgRemoveBtn) {
      imgRemoveBtn.addEventListener("click", () => {
        delete state[catKey].itens[idx].imagem;
        render();
      });
    }
  });
}

function compressImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

function syncAddButtonLabel(catKey) {
  const btn = document.querySelector(`[data-add-item="${catKey}"]`);
  if (btn) btn.textContent = `+ Adicionar produto em "${state[catKey].titulo}"`;
}

function setProductStatus(msg) {
  document.getElementById("admin-status-products").textContent = msg;
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
    setProductStatus('Produtos carregados do site. Edite à vontade e clique em "Salvar produtos" quando terminar.');
  } catch (err) {
    document.getElementById("categories").innerHTML =
      '<p style="color:#b00020;">Não foi possível carregar os produtos atuais do site (' +
      escapeHtml(err.message) +
      "). Recarregue a página para tentar de novo — por segurança, o painel não deixa editar sem antes confirmar os dados reais.</p>";
    setProductStatus("Erro ao carregar produtos.");
  }
}

document.getElementById("save-products-btn").addEventListener("click", async () => {
  const { cleaned, skipped } = removeBlankItems(state);
  state = cleaned;
  render();

  const password = document.getElementById("admin-password").value;
  if (!password) {
    setProductStatus("Digite a senha do painel antes de salvar.");
    return;
  }

  const btn = document.getElementById("save-products-btn");
  btn.disabled = true;
  btn.textContent = "Salvando...";
  setProductStatus("Salvando...");

  try {
    const res = await fetch("/.netlify/functions/save-products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(state),
    });

    if (res.status === 401) {
      setProductStatus("Senha incorreta. Confira e tente de novo.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const base = data.error || "status " + res.status;
      throw new Error(data.details ? `${base} — ${data.details}` : base);
    }

    const skippedNote = skipped > 0 ? ` (${skipped} produto${skipped > 1 ? "s" : ""} em branco foi${skipped > 1 ? "ram" : ""} ignorado${skipped > 1 ? "s" : ""})` : "";
    setProductStatus(`Produtos salvos com sucesso!${skippedNote} O site já está atualizado.`);
  } catch (err) {
    setProductStatus("Não foi possível salvar agora (" + err.message + "). Verifique sua internet e tente de novo.");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Salvar produtos";
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

/* ==========================================================================
   Conteúdo do site (hero, contato, endereço, como funciona, galeria, rodapé)
   ========================================================================== */

let contentState = {}; // conteúdo do site, carregado do servidor em loadContentState()

function setContentStatus(msg) {
  document.getElementById("admin-status-content").textContent = msg;
}

async function loadContentState() {
  try {
    const res = await fetch("/.netlify/functions/get-site-content", { cache: "no-store" });
    if (!res.ok) throw new Error("O servidor respondeu com erro " + res.status);
    contentState = await res.json();
    renderContentForm();
    setContentStatus('Conteúdo carregado do site. Edite à vontade e clique em "Salvar conteúdo do site" quando terminar.');
  } catch (err) {
    setContentStatus("Não foi possível carregar o conteúdo do site (" + err.message + "). Recarregue a página para tentar de novo.");
  }
}

function fieldVal(id) {
  return document.getElementById(id).value;
}
function setFieldVal(id, val) {
  document.getElementById(id).value = val || "";
}

function renderContentForm() {
  const c = contentState;
  c.contato = c.contato || {};
  c.endereco = c.endereco || {};
  c.horario = c.horario || {};
  c.hero = c.hero || {};
  c.comoFunciona = c.comoFunciona || {};
  c.galeria = c.galeria || {};
  c.cta = c.cta || {};
  c.footer = c.footer || {};

  setFieldVal("cc-whatsapp", c.contato.whatsapp);
  setFieldVal("cc-whatsapp-display", c.contato.whatsappDisplay);
  setFieldVal("cc-email", c.contato.email);
  setFieldVal("cc-instagram-url", c.contato.instagramUrl);
  setFieldVal("cc-instagram-handle", c.contato.instagramHandle);
  setFieldVal("cc-horario", c.horario.texto);
  setFieldVal("cc-endereco-linha1", c.endereco.linha1);
  setFieldVal("cc-endereco-linha2", c.endereco.linha2);
  setFieldVal("cc-endereco-cep", c.endereco.cep);

  setFieldVal("hero-eyebrow", c.hero.eyebrow);
  setFieldVal("hero-titulo", c.hero.titulo);
  setFieldVal("hero-subtitulo", c.hero.subtitulo);
  renderHeroImgPreview();

  setFieldVal("cf-eyebrow", c.comoFunciona.eyebrow);
  setFieldVal("cf-titulo", c.comoFunciona.titulo);
  setFieldVal("cf-subtitulo", c.comoFunciona.subtitulo);
  renderPassos();

  setFieldVal("gal-eyebrow", c.galeria.eyebrow);
  setFieldVal("gal-titulo", c.galeria.titulo);
  setFieldVal("gal-subtitulo", c.galeria.subtitulo);
  renderFotos();

  setFieldVal("foot-tagline", c.footer.tagline);
  setFieldVal("foot-copyright", c.footer.copyright);
}

function renderHeroImgPreview() {
  const el = document.getElementById("hero-img-preview");
  const src = contentState.hero && contentState.hero.imagem;
  el.innerHTML = src ? `<img src="${src}" alt="" />` : `<span class="admin-img-empty">sem foto</span>`;
}

document.getElementById("hero-img-trigger").addEventListener("click", () => {
  document.getElementById("hero-img-input").click();
});
document.getElementById("hero-img-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    setContentStatus("Essa foto tem mais de 20MB. Escolha uma foto menor.");
    e.target.value = "";
    return;
  }
  setContentStatus("Processando imagem...");
  try {
    const dataUrl = await compressImageFile(file, 1200, 0.75);
    contentState.hero = contentState.hero || {};
    contentState.hero.imagem = dataUrl;
    renderHeroImgPreview();
    setContentStatus('Foto principal atualizada. Não esqueça de clicar em "Salvar conteúdo do site".');
  } catch (err) {
    setContentStatus("Não foi possível processar essa imagem. Tente outra foto.");
  }
});

function renderPassos() {
  const container = document.getElementById("cf-passos");
  contentState.comoFunciona = contentState.comoFunciona || {};
  const passos = contentState.comoFunciona.passos || [];
  while (passos.length < 3) passos.push({ titulo: "", texto: "" });
  contentState.comoFunciona.passos = passos;

  container.innerHTML = passos
    .map(
      (p, i) => `
      <div class="admin-passo-row" data-passo-idx="${i}">
        <div class="form-group" style="margin-bottom:0;">
          <span class="admin-col-label">Passo ${i + 1} — título</span>
          <input type="text" data-passo-field="titulo" value="${escapeAttr(p.titulo)}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <span class="admin-col-label">Passo ${i + 1} — texto</span>
          <input type="text" data-passo-field="texto" value="${escapeAttr(p.texto)}" />
        </div>
      </div>
    `
    )
    .join("");

  container.querySelectorAll(".admin-passo-row").forEach((row) => {
    const idx = Number(row.dataset.passoIdx);
    row.querySelectorAll("[data-passo-field]").forEach((input) => {
      input.addEventListener("input", () => {
        contentState.comoFunciona.passos[idx][input.dataset.passoField] = input.value;
      });
    });
  });
}

function renderFotos() {
  const container = document.getElementById("gal-fotos");
  contentState.galeria = contentState.galeria || {};
  const fotos = contentState.galeria.fotos || [];
  contentState.galeria.fotos = fotos;

  container.innerHTML = fotos
    .map(
      (f, i) => `
      <div class="admin-foto-row" data-foto-idx="${i}">
        <div class="admin-img-preview">${f.imagem ? `<img src="${f.imagem}" alt="" />` : `<span class="admin-img-empty">sem foto</span>`}</div>
        <div>
          <span class="admin-col-label">Descrição da foto (opcional)</span>
          <input type="text" data-foto-field="alt" value="${escapeAttr(f.alt || "")}" placeholder="Ex: Balcão do café" />
          <input type="file" accept="image/*" data-foto-input style="display:none" />
          <button type="button" class="admin-img-btn" data-foto-trigger style="width:auto; margin-top:6px;">${f.imagem ? "Trocar foto" : "Escolher foto"}</button>
        </div>
        <button class="admin-remove" data-foto-remove title="Remover foto" type="button">✕</button>
      </div>
    `
    )
    .join("");

  container.querySelectorAll(".admin-foto-row").forEach((row) => {
    const idx = Number(row.dataset.fotoIdx);
    row.querySelector('[data-foto-field="alt"]').addEventListener("input", (e) => {
      contentState.galeria.fotos[idx].alt = e.target.value;
    });
    const fotoInput = row.querySelector("[data-foto-input]");
    row.querySelector("[data-foto-trigger]").addEventListener("click", () => fotoInput.click());
    fotoInput.addEventListener("change", async () => {
      const file = fotoInput.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        setContentStatus("Essa foto tem mais de 20MB. Escolha uma foto menor.");
        return;
      }
      setContentStatus("Processando imagem...");
      try {
        const dataUrl = await compressImageFile(file, 1000, 0.72);
        contentState.galeria.fotos[idx].imagem = dataUrl;
        renderFotos();
        setContentStatus('Foto adicionada. Não esqueça de clicar em "Salvar conteúdo do site".');
      } catch (err) {
        setContentStatus("Não foi possível processar essa imagem. Tente outra foto.");
      }
    });
    row.querySelector("[data-foto-remove]").addEventListener("click", () => {
      contentState.galeria.fotos.splice(idx, 1);
      renderFotos();
    });
  });
}

document.getElementById("gal-add-foto").addEventListener("click", () => {
  contentState.galeria = contentState.galeria || {};
  contentState.galeria.fotos = contentState.galeria.fotos || [];
  contentState.galeria.fotos.push({ imagem: "", alt: "" });
  renderFotos();
});

function collectContentFromForm() {
  contentState.contato = {
    whatsapp: fieldVal("cc-whatsapp").trim(),
    whatsappDisplay: fieldVal("cc-whatsapp-display").trim(),
    email: fieldVal("cc-email").trim(),
    instagramUrl: fieldVal("cc-instagram-url").trim(),
    instagramHandle: fieldVal("cc-instagram-handle").trim(),
  };
  contentState.endereco = {
    linha1: fieldVal("cc-endereco-linha1").trim(),
    linha2: fieldVal("cc-endereco-linha2").trim(),
    cep: fieldVal("cc-endereco-cep").trim(),
  };
  contentState.horario = { texto: fieldVal("cc-horario").trim() };
  contentState.hero = {
    eyebrow: fieldVal("hero-eyebrow").trim(),
    titulo: fieldVal("hero-titulo").trim(),
    subtitulo: fieldVal("hero-subtitulo").trim(),
    imagem: (contentState.hero && contentState.hero.imagem) || "",
  };
  contentState.comoFunciona = {
    eyebrow: fieldVal("cf-eyebrow").trim(),
    titulo: fieldVal("cf-titulo").trim(),
    subtitulo: fieldVal("cf-subtitulo").trim(),
    passos: (contentState.comoFunciona && contentState.comoFunciona.passos) || [],
  };
  contentState.galeria = {
    eyebrow: fieldVal("gal-eyebrow").trim(),
    titulo: fieldVal("gal-titulo").trim(),
    subtitulo: fieldVal("gal-subtitulo").trim(),
    fotos: ((contentState.galeria && contentState.galeria.fotos) || []).filter((f) => f.imagem),
  };
  contentState.cta = contentState.cta && Object.keys(contentState.cta).length ? contentState.cta : { eyebrow: "", titulo: "", texto: "" };
  contentState.footer = {
    tagline: fieldVal("foot-tagline").trim(),
    copyright: fieldVal("foot-copyright").trim(),
  };
  return contentState;
}

document.getElementById("save-content-btn").addEventListener("click", async () => {
  const password = document.getElementById("admin-password").value;
  if (!password) {
    setContentStatus("Digite a senha do painel antes de salvar.");
    return;
  }

  const payload = collectContentFromForm();
  const btn = document.getElementById("save-content-btn");
  btn.disabled = true;
  btn.textContent = "Salvando...";
  setContentStatus("Salvando...");

  try {
    const res = await fetch("/.netlify/functions/save-site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      setContentStatus("Senha incorreta. Confira e tente de novo.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const base = data.error || "status " + res.status;
      throw new Error(data.details ? `${base} — ${data.details}` : base);
    }

    setContentStatus("Conteúdo do site salvo com sucesso! O site já está atualizado.");
  } catch (err) {
    setContentStatus("Não foi possível salvar agora (" + err.message + "). Verifique sua internet e tente de novo.");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Salvar conteúdo do site";
  }
});
