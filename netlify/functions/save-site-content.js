/* ==========================================================================
   Café Dalí — Netlify Function: salva o conteúdo editável do site (Painel
   de Produtos > aba "Conteúdo do site"), protegido pela mesma senha do
   Painel de Produtos (ADMIN_PASSWORD).
   ========================================================================== */

const { getStore } = require("@netlify/blobs");

function isNonEmptyString(v) {
  return typeof v === "string";
}

function isValidContent(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const c = obj.contato;
  const e = obj.endereco;
  const h = obj.horario;
  const hero = obj.hero;
  const cf = obj.comoFunciona;
  const gal = obj.galeria;
  const cta = obj.cta;
  const foot = obj.footer;

  if (!c || !isNonEmptyString(c.whatsapp) || !isNonEmptyString(c.email)) return false;
  if (!e || !isNonEmptyString(e.linha1)) return false;
  if (!h || !isNonEmptyString(h.texto)) return false;
  if (!hero || !isNonEmptyString(hero.titulo)) return false;
  if (!cf || !Array.isArray(cf.passos)) return false;
  if (!gal || !Array.isArray(gal.fotos)) return false;
  if (!cta || typeof cta !== "object") return false;
  if (!foot || typeof foot !== "object") return false;
  return true;
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

  if (!isValidContent(payload)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Formato de conteúdo inválido." }) };
  }

  try {
    const store = getStore("site-content");
    await store.setJSON("conteudo", payload);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("save-site-content falhou:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao salvar no Netlify Blobs.", details: String(err && err.message ? err.message : err) }),
    };
  }
};
