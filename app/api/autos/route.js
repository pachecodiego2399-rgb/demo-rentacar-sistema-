import { NextResponse } from "next/server";
import { fetchAllRecords, AUTOS_TABLE_ID, AUTOS_FIELDS } from "../../../lib/airtable";

// GET /api/autos → [{ id, nombre, patente, estado, precio, requisitos, fechaDevolucion }]
export async function GET() {
  try {
    const records = await fetchAllRecords(AUTOS_TABLE_ID);
    const autos = records.map((r) => ({
      id: r.id,
      nombre: r.fields[AUTOS_FIELDS.NOMBRE] || "",
      patente: r.fields[AUTOS_FIELDS.PATENTE] || "",
      estado: r.fields[AUTOS_FIELDS.ESTADO]?.name || r.fields[AUTOS_FIELDS.ESTADO] || "",
      precio: r.fields[AUTOS_FIELDS.PRECIO_POR_DIA] ?? null,
      requisitos: r.fields[AUTOS_FIELDS.REQUISITOS] || "",
      fechaDevolucion: r.fields[AUTOS_FIELDS.FECHA_DEVOLUCION] || null,
    }));
    return NextResponse.json({ autos });
  } catch (err) {
    console.error("GET /api/autos:", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
