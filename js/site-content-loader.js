/* ==========================================================================
   Café Dalí — Carrega o conteúdo editável do site (textos e fotos da home,
   contato, endereço) e aplica nos elementos marcados com data-site="...".

   Convenções usadas nas páginas HTML:
   - data-site="caminho.no.objeto"      -> define textContent (ou src, se <img>)
   - data-site-html="caminho.no.objeto" -> define innerHTML (para endereços com <br>)
   - data-site-whatsapp-link            -> define href = https://wa.me/<numero>
   - data-site-whatsapp-text            -> define textContent = número formatado
   - data-site-email-link               -> define href = mailto:<email>
   - data-site-email-text               -> (junto com o acima) também define o texto
   - data-site-instagram-link           -> define href = URL do instagram
   - data-site-instagram-text           -> (junto com o acima) também define o texto
   - data-site-steps                    -> (só na home) recebe os 3 cards "como funciona"
   - data-site-galeria                  -> (só na home) recebe as fotos da galeria

   Enquanto os dados do servidor não chegam, o site usa o conteúdo de exemplo
   abaixo. O conteúdo de verdade é editado no Painel de Produtos (admin.html),
   aba "Conteúdo do site".
   ========================================================================== */

var SITE_CONTENT = {
  contato: {
    whatsapp: "5548988410415",
    whatsappDisplay: "(48) 98841-0415",
    email: "contato@cafeteriadali.com.br",
    instagramUrl: "https://instagram.com/dalicafeteria",
    instagramHandle: "@dalicafeteria",
  },
  endereco: {
    linha1: "Rua Lauro Linhares, 2055",
    linha2: "Trindade, Florianópolis - SC",
    cep: "88036-003",
  },
  horario: { texto: "Todos os dias, das 8h às 19h" },
  hero: {
    eyebrow: "Encomendas artesanais",
    titulo: "Tortas, docinhos e folhados feitos com o toque surrealista do Café Dalí",
    subtitulo: "Receitas autorais, ingredientes selecionados e aquele capricho de confeitaria de bairro — pedidos com 48h de antecedência para retirada ou entrega em Florianópolis.",
    imagem: "img/hero-dali.jpg",
  },
  comoFunciona: {
    eyebrow: "Como funciona",
    titulo: "Encomendar é simples",
    subtitulo: "Do catálogo até a retirada, em três passos.",
    passos: [
      { titulo: "Escolha seus produtos", texto: "Navegue pelo catálogo de tortas, docinhos e folhados e monte seu pedido." },
      { titulo: "Finalize com antecedência", texto: "Escolha a data de retirada ou entrega — pedidos precisam de no mínimo 48h de antecedência." },
      { titulo: "Retire ou receba", texto: "Buscar no próprio Café Dalí ou combinar entrega, conforme a opção escolhida no pedido." },
    ],
  },
  galeria: {
    eyebrow: "Nosso espaço",
    titulo: "Um cantinho surrealista em Florianópolis",
    subtitulo: "Conheça um pouco do ambiente do Café Dalí, na Trindade.",
    fotos: [
      { imagem: "img/fachada-balcao.jpg", alt: "Balcão do Café Dalí" },
      { imagem: "img/interior-mesas-wide.jpg", alt: "Área de mesas do Café Dalí" },
      { imagem: "img/interior-balcao.jpg", alt: "Vitrine de doces do Café Dalí" },
      { imagem: "img/placa-pilar.jpg", alt: "Fachada do Café Dalí" },
    ],
  },
  cta: {
    eyebrow: "Pronto para encomendar?",
    titulo: "Monte seu pedido agora",
    texto: "Tortas, docinhos e folhados para festas, eventos ou aquele mimo do fim de semana.",
  },
  footer: {
    tagline: "Tortas, docinhos e folhados artesanais, feitos sob encomenda em Florianópolis.",
    copyright: "© 2026 Café Dalí. Todos os direitos reservados.",
  },
};

var _siteContentReady = false;
var _siteContentCallbacks = [];

function onSiteContentReady(fn) {
  if (_siteContentReady) fn();
  else _siteContentCallbacks.push(fn);
}

function _getByPath(obj, path) {
  return path.split(".").reduce(function (o, k) {
    return o == null ? undefined : o[k];
  }, obj);
}

function _escHtmlSite(str) {
  return (str || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function applySiteContent() {
  document.querySelectorAll("[data-site]").forEach(function (el) {
    var val = _getByPath(SITE_CONTENT, el.getAttribute("data-site"));
    if (val === undefined) return;
    if (el.tagName === "IMG") el.src = val;
    else el.textContent = val;
  });

  document.querySelectorAll("[data-site-html]").forEach(function (el) {
    var val = _getByPath(SITE_CONTENT, el.getAttribute("data-site-html"));
    if (val !== undefined) el.innerHTML = val;
  });

  document.querySelectorAll("[data-site-endereco-html]").forEach(function (el) {
    var e = SITE_CONTENT.endereco || {};
    el.innerHTML = [e.linha1, e.linha2, e.cep].filter(Boolean).map(_escHtmlSite).join("<br />");
  });

  document.querySelectorAll("[data-site-whatsapp-link]").forEach(function (el) {
    el.href = "https://wa.me/" + SITE_CONTENT.contato.whatsapp;
  });
  document.querySelectorAll("[data-site-whatsapp-text]").forEach(function (el) {
    el.textContent = SITE_CONTENT.contato.whatsappDisplay;
  });
  document.querySelectorAll("[data-site-email-link]").forEach(function (el) {
    el.href = "mailto:" + SITE_CONTENT.contato.email;
    if (el.hasAttribute("data-site-email-text")) el.textContent = SITE_CONTENT.contato.email;
  });
  document.querySelectorAll("[data-site-instagram-link]").forEach(function (el) {
    el.href = SITE_CONTENT.contato.instagramUrl;
    if (el.hasAttribute("data-site-instagram-text")) el.textContent = SITE_CONTENT.contato.instagramHandle;
  });

  var stepsEl = document.querySelector("[data-site-steps]");
  if (stepsEl && SITE_CONTENT.comoFunciona && Array.isArray(SITE_CONTENT.comoFunciona.passos)) {
    stepsEl.innerHTML = SITE_CONTENT.comoFunciona.passos
      .map(function (p, i) {
        return (
          '<div class="step-card"><div class="step-num">' +
          (i + 1) +
          "</div><h3>" +
          _escHtmlSite(p.titulo) +
          "</h3><p>" +
          _escHtmlSite(p.texto) +
          "</p></div>"
        );
      })
      .join("");
  }

  var galeriaEl = document.querySelector("[data-site-galeria]");
  if (galeriaEl && SITE_CONTENT.galeria && Array.isArray(SITE_CONTENT.galeria.fotos)) {
    galeriaEl.innerHTML = SITE_CONTENT.galeria.fotos
      .map(function (f) {
        return '<a href="' + f.imagem + '" target="_blank"><img src="' + f.imagem + '" alt="' + _escHtmlSite(f.alt || "") + '" /></a>';
      })
      .join("");
  }
}

function _finishSiteContentLoad() {
  _siteContentReady = true;
  var callbacks = _siteContentCallbacks;
  _siteContentCallbacks = [];
  applySiteContent();
  callbacks.forEach(function (fn) {
    fn();
  });
}

function loadSiteContent() {
  fetch("/.netlify/functions/get-site-content", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("status " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data && typeof data === "object") SITE_CONTENT = data;
    })
    .catch(function () {
      // Sem internet ou função indisponível: mantém o conteúdo de exemplo.
    })
    .then(_finishSiteContentLoad);
}

document.addEventListener("DOMContentLoaded", loadSiteContent);
