/* ==========================================================================
   Café Dalí — Carrega o catálogo de produtos "ao vivo" (via Netlify Function
   + Netlify Blobs) para todas as páginas do site usarem.

   Enquanto os dados do servidor não chegam (ou se a internet falhar), o site
   usa o catálogo de exemplo definido logo abaixo, só para a página nunca
   aparecer vazia. O catálogo de verdade é editado no Painel de Produtos
   (admin.html), que salva direto no servidor.
   ========================================================================== */

var CATALOGO = {
  tortas: {
    titulo: "Tortas",
    subtitulo: "Vendidas inteiras, sob encomenda",
    itens: [
      { id: "torta-chocolate", nome: "Torta de Chocolate Belga", descricao: "Massa amanteigada, ganache de chocolate meio amargo e raspas.", preco: 99.9, unidade: "aprox. 12 fatias" },
      { id: "torta-limao", nome: "Torta de Limão", descricao: "Base crocante, creme de limão siciliano e merengue maçaricado.", preco: 84.9, unidade: "aprox. 12 fatias" },
      { id: "torta-morango", nome: "Torta de Morango com Chantilly", descricao: "Pão de ló leve, chantilly artesanal e morangos frescos.", preco: 94.9, unidade: "aprox. 12 fatias" },
    ],
  },
  docinhos: {
    titulo: "Docinhos",
    subtitulo: "Vendidos por cento, ideais para festas",
    itens: [
      { id: "brigadeiro-gourmet", nome: "Brigadeiro Gourmet", descricao: "Chocolate belga 70%, enrolado na hora.", preco: 120, unidade: "cento" },
      { id: "beijinho", nome: "Beijinho", descricao: "Coco fresco ralado e finalizado com cravo.", preco: 110, unidade: "cento" },
      { id: "docinho-doce-leite", nome: "Trufa de Doce de Leite", descricao: "Recheio cremoso envolto em chocolate ao leite.", preco: 130, unidade: "cento" },
    ],
  },
  folhados: {
    titulo: "Folhados",
    subtitulo: "Salgados assados, vendidos por dúzia",
    itens: [
      { id: "folhado-frango", nome: "Folhado de Frango com Catupiry", descricao: "Massa folhada crocante e recheio cremoso.", preco: 48, unidade: "dúzia" },
      { id: "folhado-queijo", nome: "Folhado de Queijo e Presunto", descricao: "Recheio generoso, dourado no forno.", preco: 46, unidade: "dúzia" },
    ],
  },
};

var _catalogoReady = false;
var _catalogoCallbacks = [];

// Outras páginas chamam onCatalogoReady(fn) em vez de usar CATALOGO direto,
// pra garantir que o fn só roda depois que os dados do servidor chegaram
// (ou, na falha, depois que decidimos manter o catálogo de exemplo acima).
function onCatalogoReady(fn) {
  if (_catalogoReady) fn();
  else _catalogoCallbacks.push(fn);
}

function _finishCatalogoLoad() {
  _catalogoReady = true;
  var callbacks = _catalogoCallbacks;
  _catalogoCallbacks = [];
  callbacks.forEach(function (fn) {
    fn();
  });
}

function loadCatalogo() {
  fetch("/.netlify/functions/get-products", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("status " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data && typeof data === "object") {
        CATALOGO = data;
      }
    })
    .catch(function () {
      // Sem internet ou função indisponível: mantém o catálogo de exemplo.
    })
    .then(_finishCatalogoLoad);
}

document.addEventListener("DOMContentLoaded", loadCatalogo);
