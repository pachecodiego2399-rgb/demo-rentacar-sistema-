import { NextResponse } from "next/server";
import {
  airtableFetch,
  CLIENTES_TABLE_ID,
  CLIENTES_FIELDS,
  CLIENTE_ESTADOS,
} from "../../../../lib/airtable";

// PATCH /api/clientes/[id]  body: { estado }
// Usa typecast:true porque "Necesita ayuda humana" puede no existir todavía
// como choice del campo Estado en Airtable — typecast lo crea automáticamente
// la primera vez que se escribe.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.estado || !CLIENTE_ESTADOS.includes(body.estado)) {
      return NextResponse.json({ error: "estado inválido" }, { status: 400 });
    }

    const data = await airtableFetch(`/${CLIENTES_TABLE_ID}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        fields: { [CLIENTES_FIELDS.ESTADO]: body.estado },
        typecast: true,
      }),
    });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("PATCH /api/clientes/[id]:", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
