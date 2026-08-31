/* ==========================================================================
   Café Dalí — Netlify Function: confere a senha do Painel administrativo
   (admin.html), usada só para liberar a TELA do painel — não salva nada.
   Usa a mesma variável ADMIN_PASSWORD do salvamento (veja save-products.js).
   ========================================================================== */

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
          "ADMIN_PASSWORD não configurado. Defina essa variável de ambiente na Netlify (Project configuration > Environment variables) para habilitar o painel.",
      }),
    };
  }

  const headers = event.headers || {};
  const provided = headers["x-admin-password"] || headers["X-Admin-Password"];
  if (!provided || provided !== adminPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: "Senha incorreta." }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
