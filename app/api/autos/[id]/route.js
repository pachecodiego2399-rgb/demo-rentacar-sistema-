import { NextResponse } from "next/server";
import { airtableFetch, AUTOS_TABLE_ID, AUTOS_FIELDS, AUTO_ESTADOS } from "../../../../lib/airtable";

// PATCH /api/autos/[id]  body: { estado } | { fechaDevolucion }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const fields = {};

    if (body.estado !== undefined) {
      if (!AUTO_ESTADOS.includes(body.estado)) {
        return NextResponse.json({ error: "estado inválido" }, { status: 400 });
      }
      fields[AUTOS_FIELDS.ESTADO] = body.estado;
    }

    if (body.fechaDevolucion !== undefined) {
      fields[AUTOS_FIELDS.FECHA_DEVOLUCION] = body.fechaDevolucion;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    }

    const data = await airtableFetch(`/${AUTOS_TABLE_ID}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("PATCH /api/autos/[id]:", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
