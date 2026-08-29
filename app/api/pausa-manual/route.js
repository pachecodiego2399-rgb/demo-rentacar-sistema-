import { NextResponse } from "next/server";

// Webhook de n8n (workflow "Pausa Manual - Telegram") que marca al cliente
// como Pausado, agrega el mensaje a la Conversación y lo envía por Telegram.
const PAUSA_MANUAL_WEBHOOK_URL =
  "https://diegocesarpacheco23.app.n8n.cloud/webhook/pausa-manual-telegram";

// POST /api/pausa-manual  body: { telefono, mensaje }
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.telefono || !body.mensaje) {
      return NextResponse.json({ error: "telefono y mensaje son requeridos" }, { status: 400 });
    }

    const res = await fetch(PAUSA_MANUAL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: body.telefono, mensaje: body.mensaje }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `El webhook respondió ${res.status}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/pausa-manual:", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
