import { NextResponse } from "next/server";
import {
  airtableFetch,
  CLIENTES_TABLE_ID,
  CLIENTES_FIELDS,
  CLIENTE_ESTADOS,
} from "../../../../lib/airtable";

// PATCH /api/clientes/[id]  body: { estado } y/o { pausado }
// Usa typecast:true porque "Necesita ayuda humana" puede no existir todavía
// como choice del campo Estado en Airtable — typecast lo crea automáticamente
// la primera vez que se escribe.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const fields = {};

    if (body.estado !== undefined) {
      if (!CLIENTE_ESTADOS.includes(body.estado)) {
        return NextResponse.json({ error: "estado inválido" }, { status: 400 });
      }
      fields[CLIENTES_FIELDS.ESTADO] = body.estado;
    }

    if (body.pausado !== undefined) {
      fields[CLIENTES_FIELDS.PAUSADO] = !!body.pausado;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "nada para actualizar" }, { status: 400 });
    }

    const data = await airtableFetch(`/${CLIENTES_TABLE_ID}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields, typecast: true }),
    });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("PATCH /api/clientes/[id]:", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
