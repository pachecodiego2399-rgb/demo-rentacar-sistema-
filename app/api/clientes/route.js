import { NextResponse } from "next/server";
import { fetchAllRecords, CLIENTES_TABLE_ID, CLIENTES_FIELDS } from "../../../lib/airtable";

// GET /api/clientes → [{ id, nombre, conversacion, telefono, estado, autoDeInteres, tarjetaCredito, fechaContacto }]
export async function GET() {
  try {
    const records = await fetchAllRecords(CLIENTES_TABLE_ID);
    const clientes = records.map((r) => ({
      id: r.id,
      nombre: r.fields[CLIENTES_FIELDS.NOMBRE] || "",
      conversacion: r.fields[CLIENTES_FIELDS.CONVERSACION] || "",
      telefono: r.fields[CLIENTES_FIELDS.TELEFONO] || "",
      estado: r.fields[CLIENTES_FIELDS.ESTADO]?.name || r.fields[CLIENTES_FIELDS.ESTADO] || "",
      autoDeInteres: r.fields[CLIENTES_FIELDS.AUTO_DE_INTERES] || "",
      tarjetaCredito:
        r.fields[CLIENTES_FIELDS.TARJETA_CREDITO]?.name ||
        r.fields[CLIENTES_FIELDS.TARJETA_CREDITO] ||
        "",
      fechaContacto: r.fields[CLIENTES_FIELDS.FECHA_CONTACTO] || null,
    }));
    return NextResponse.json({ clientes });
  } catch (err) {
    console.error("GET /api/clientes:", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
