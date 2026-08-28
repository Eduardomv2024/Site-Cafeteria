/* ==========================================================================
   Café Dalí — Netlify Function: salva o catálogo editado no Painel de
   Produtos (admin.html) diretamente no Netlify Blobs, para valer no site
   na mesma hora — sem precisar baixar arquivo nem publicar de novo.

   CONFIGURAÇÃO NECESSÁRIA:
   No painel da Netlify, em Project configuration > Environment variables,
   crie:
     ADMIN_PASSWORD = <uma senha sua, só para você usar o Painel de Produtos>

   Sem essa variável configurada, o salvamento fica bloqueado por segurança.
   ========================================================================== */

const { getStore } = require("@netlify/blobs");

function isValidCatalogo(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  return Object.values(obj).every(
    (cat) =>
      cat &&
      typeof cat.titulo === "string" &&
      Array.isArray(cat.itens) &&
      cat.itens.every(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.nome === "string" &&
          typeof item.preco === "number"
      )
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "ADMIN_PASSWORD não configurado. Defina essa variável de ambiente na Netlify (Project configuration > Environment variables) para habilitar o salvamento.",
      }),
    };
  }

  const headers = event.headers || {};
  const provided = headers["x-admin-password"] || headers["X-Admin-Password"];
  if (!provided || provided !== adminPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: "Senha incorreta." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido." }) };
  }

  if (!isValidCatalogo(payload)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Formato de catálogo inválido." }) };
  }

  try {
    const store = getStore("catalogo");
    await store.setJSON("produtos", payload);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("save-products falhou:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao salvar no Netlify Blobs.", details: String(err && err.message ? err.message : err) }),
    };
  }
};
