/* ==========================================================================
   Café Dalí — Netlify Function: devolve o conteúdo editável do site (textos
   e fotos da página inicial, contato, endereço, etc.), lido do Netlify Blobs.
   Se ainda não houver nada salvo, devolve o conteúdo padrão (ver
   default-site-content.json, nesta mesma pasta).
   ========================================================================== */

const { getStore } = require("@netlify/blobs");
const DEFAULT_CONTENT = require("./default-site-content.json");

exports.handler = async () => {
  try {
    const store = getStore("site-content");
    const data = await store.get("conteudo", { type: "json" });
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
      body: JSON.stringify(data || DEFAULT_CONTENT),
    };
  } catch (err) {
    console.error("get-site-content falhou, usando conteudo padrao:", err);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(DEFAULT_CONTENT),
    };
  }
};
