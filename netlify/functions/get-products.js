/* ==========================================================================
   Café Dalí — Netlify Function: devolve o catálogo de produtos atual.

   Lê os produtos salvos no Netlify Blobs (o que foi editado e salvo pelo
   Painel de Produtos em admin.html). Se ainda não houver nada salvo — por
   exemplo, logo após a primeira publicação do site — devolve um catálogo de
   exemplo (arquivo default-catalogo.json, nesta mesma pasta) para a página
   nunca aparecer vazia.
   ========================================================================== */

const { getStore } = require("@netlify/blobs");
const DEFAULT_CATALOGO = require("./default-catalogo.json");

exports.handler = async () => {
  try {
    const store = getStore("catalogo");
    const data = await store.get("produtos", { type: "json" });
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
      body: JSON.stringify(data || DEFAULT_CATALOGO),
    };
  } catch (err) {
    // Se o Netlify Blobs falhar por qualquer motivo, o site continua no ar
    // mostrando o catálogo de exemplo em vez de quebrar a página.
    console.error("get-products falhou, usando catalogo padrao:", err);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(DEFAULT_CATALOGO),
    };
  }
};
