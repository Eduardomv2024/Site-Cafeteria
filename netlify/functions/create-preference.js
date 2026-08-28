/* ==========================================================================
   Café Dalí — Netlify Function: cria uma preferência de pagamento no
   Mercado Pago (Checkout Pro) e devolve a URL de redirecionamento.

   CONFIGURAÇÃO NECESSÁRIA:
   No painel da Netlify, em Site settings > Environment variables, crie:
     MP_ACCESS_TOKEN = <seu Access Token de produção do Mercado Pago>

   Sem essa variável configurada, esta função responde com erro 500 e o
   site cai automaticamente no fluxo alternativo por WhatsApp (ver
   js/checkout.js).
   ========================================================================== */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "MP_ACCESS_TOKEN não configurado. Configure a variável de ambiente na Netlify para habilitar o pagamento online.",
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  const { items, payer, metadata } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Carrinho vazio" }) };
  }

  const origin =
    event.headers.origin ||
    (event.headers.referer ? new URL(event.headers.referer).origin : "https://cafedali.netlify.app");

  const preference = {
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      currency_id: "BRL",
    })),
    payer: {
      name: payer?.name || "",
      phone: { number: payer?.phone || "" },
    },
    metadata: metadata || {},
    back_urls: {
      success: `${origin}/sucesso.html`,
      pending: `${origin}/pendente.html`,
      failure: `${origin}/erro.html`,
    },
    auto_return: "approved",
    statement_descriptor: "CAFE DALI",
  };

  try {
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Erro ao criar preferência no Mercado Pago", details: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: data.init_point, id: data.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falha ao conectar ao Mercado Pago", details: String(err) }),
    };
  }
};
