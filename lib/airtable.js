/**
 * Helper de acceso a la base de Airtable DEMO de "Sierra Nevada Rentacar".
 *
 * Esta base es exclusiva para demostraciones a clientes potenciales — no es
 * la base de producción. Requiere esta variable de entorno (en Vercel, o en
 * un archivo .env.local para desarrollo local — nunca subirla al repo):
 *   AIRTABLE_DEMO_API_KEY → Personal Access Token de Airtable con permisos
 *                           únicamente sobre la base demo de abajo.
 */

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export const DEMO_BASE_ID = "app0XqPMKwm87Y1qb";

export const AUTOS_TABLE_ID = "tbl8NGZEo71WyM6eO";
export const CLIENTES_TABLE_ID = "tblDTbj3Ow13LecCw";

export const AUTOS_FIELDS = {
  NOMBRE: "fldjcjyeGkuFT4LD3",
  PATENTE: "fldlvksVdyWfB1Sdl",
  ESTADO: "fldNKKQ4qmW73KYRS",
  PRECIO_POR_DIA: "fldYwwAyv90VTnCgO",
  REQUISITOS: "fld0313uF0OGE03kR",
  FECHA_DEVOLUCION: "fld9ugJON3BrMD6hh",
};

// Nombres exactos de las opciones del campo Estado en Airtable (sin tilde en
// "Mantencion" — así está guardado el choice, hay que respetarlo al escribir).
export const AUTO_ESTADOS = ["Disponible", "Arrendado", "Mantencion"];

export const CLIENTES_FIELDS = {
  NOMBRE: "fldkUlCQpZGDwka2m",
  CONVERSACION: "fldzkW55GXFtoV7ms",
  TELEFONO: "fldBP5pnqZwMhK7GI",
  ESTADO: "fldsi2DkoENCBiTMC",
  AUTO_DE_INTERES: "fldWhm1nIlrhT7Kuv",
  TARJETA_CREDITO: "fldrV0hcgJQdyjEwi",
  FECHA_CONTACTO: "fldO65KDn80gYipQF",
  ULTIMA_ACTUALIZACION_ESTADO: "fldhfx5P6V0QLDctZ",
};

// Las primeras 4 ya existen como choices del campo Estado en Airtable. La
// última ("Necesita ayuda humana") todavía no — se crea sola la primera vez
// que se escribe gracias a `typecast: true` en el PATCH de clientes.
export const CLIENTE_ESTADOS = [
  "En conversación",
  "Calificado",
  "Listo para retirar",
  "Necesita ayuda humana",
  "Completado",
];

function authHeaders() {
  const key = process.env.AIRTABLE_DEMO_API_KEY;
  if (!key) throw new Error("Falta la variable de entorno AIRTABLE_DEMO_API_KEY");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function airtableFetch(path, options = {}) {
  const url = `${AIRTABLE_API_URL}/${DEMO_BASE_ID}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `Airtable respondió ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// Trae TODOS los registros de una tabla (maneja paginación).
export async function fetchAllRecords(tableId) {
  let records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    params.set("returnFieldsByFieldId", "true");
    if (offset) params.set("offset", offset);
    const data = await airtableFetch(`/${tableId}?${params.toString()}`);
    records = records.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return records;
}
