"use client";

import { useEffect, useState } from "react";

const ESTADOS = [
  { value: "Disponible", label: "Disponible", color: "#2E8B3D", textOnColor: "#FFFFFF" },
  { value: "Arrendado", label: "Arrendado", color: "#E0A526", textOnColor: "#1B1917" },
  { value: "Mantencion", label: "Mantención", color: "#1B1917", textOnColor: "#FFFFFF" },
];

const ESTADO_BY_VALUE = Object.fromEntries(ESTADOS.map((e) => [e.value, e]));

function formatPrice(precio) {
  if (precio === null || precio === undefined) return "—";
  return new Intl.NumberFormat("es-CL").format(precio);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function ReturnDateEditor({ car, onSave, onCancel }) {
  const [value, setValue] = useState(car.fechaDevolucion || "");
  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-[13px] border border-[#D8D3C4] rounded px-2 py-1 bg-white text-[#1B1917]"
      />
      <button
        type="button"
        onClick={() => onSave(value)}
        className="text-[12px] font-bold uppercase bg-[#E0A526] text-[#1B1917] px-3 py-1.5 rounded cursor-pointer"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[12px] font-bold uppercase text-[#6B6B68] px-2 py-1.5 rounded cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );
}

function CarCard({ car, onChangeEstado, onChangeFecha, archivoBlackClass }) {
  const estadoInfo = ESTADO_BY_VALUE[car.estado] || ESTADOS[0];
  const [editingDate, setEditingDate] = useState(false);

  const otherEstados = ESTADOS.filter((e) => e.value !== car.estado);

  return (
    <div
      className="bg-white rounded-lg p-5"
      style={{ borderLeft: `6px solid ${estadoInfo.color}` }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className={`${archivoBlackClass} text-[19px] text-[#1B1917] uppercase`}>{car.nombre}</div>
        <div className="bg-[#F0EDE3] text-[#6B6B68] text-[12px] font-semibold px-2.5 py-1 rounded tracking-wide whitespace-nowrap">
          {car.patente}
        </div>
      </div>

      <div className="mt-2.5">
        <span
          className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full"
          style={{ background: estadoInfo.color, color: estadoInfo.textOnColor }}
        >
          {estadoInfo.label}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[26px] font-extrabold text-[#1B1917]">$ {formatPrice(car.precio)}</span>
        <span className="text-[14px] text-[#6B6B68]">/ día</span>
      </div>

      {car.requisitos ? (
        <div className="mt-2.5 text-[14px] text-[#6B6B68] leading-relaxed">{car.requisitos}</div>
      ) : null}

      {car.fechaDevolucion && !editingDate ? (
        <div className="mt-3 text-[14px] text-[#1B1917] flex items-center gap-1.5">
          <span style={{ color: "#E0A526" }}>●</span> Devolución: <strong>{formatDate(car.fechaDevolucion)}</strong>
        </div>
      ) : null}

      {editingDate ? (
        <ReturnDateEditor
          car={car}
          onCancel={() => setEditingDate(false)}
          onSave={(value) => {
            setEditingDate(false);
            onChangeFecha(car.id, value);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingDate(true)}
          className="mt-1.5 text-[13px] font-bold text-[#E0A526] underline cursor-pointer block"
        >
          {car.fechaDevolucion ? "Editar fecha de devolución" : "Agregar fecha de devolución"}
        </button>
      )}

      <div className="flex flex-col gap-2.5 mt-4">
        {otherEstados.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => onChangeEstado(car.id, e.value)}
            className="w-full text-center text-[13px] font-extrabold tracking-wide uppercase px-2.5 py-3.5 rounded-md cursor-pointer"
            style={{ background: e.color, color: e.textOnColor }}
          >
            Marcar {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FleetSection({ archivoBlackClass }) {
  const [autos, setAutos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/autos")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setAutos(data.autos);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  function showError(message) {
    setError(message);
    setTimeout(() => setError((current) => (current === message ? null : current)), 5000);
  }

  async function handleChangeEstado(carId, estado) {
    const previous = autos;
    setAutos((current) => current.map((c) => (c.id === carId ? { ...c, estado } : c)));
    try {
      const res = await fetch(`/api/autos/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar el estado");
    } catch (err) {
      setAutos(previous);
      showError(`No se pudo actualizar el estado: ${err.message}`);
    }
  }

  async function handleChangeFecha(carId, fechaDevolucion) {
    const previous = autos;
    setAutos((current) => current.map((c) => (c.id === carId ? { ...c, fechaDevolucion } : c)));
    try {
      const res = await fetch(`/api/autos/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaDevolucion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar la fecha");
    } catch (err) {
      setAutos(previous);
      showError(`No se pudo actualizar la fecha de devolución: ${err.message}`);
    }
  }

  if (error && !autos) {
    return <div className="px-10 pt-7 text-[14px] text-red-700">Error cargando la flota: {error}</div>;
  }
  if (!autos) {
    return <div className="px-10 pt-7 text-[14px] text-[#6B6B68]">Cargando flota…</div>;
  }

  const stats = [
    { label: "Total de Autos", value: autos.length, dotColor: "#6B6B68" },
    { label: "Disponibles", value: autos.filter((c) => c.estado === "Disponible").length, dotColor: "#2E8B3D" },
    { label: "Arrendados", value: autos.filter((c) => c.estado === "Arrendado").length, dotColor: "#E0A526" },
    { label: "En Mantención", value: autos.filter((c) => c.estado === "Mantencion").length, dotColor: "#1B1917" },
  ];

  const columns = ESTADOS.map((e) => ({
    ...e,
    cars: autos.filter((c) => c.estado === e.value),
  }));

  return (
    <div className="px-5 sm:px-10 pt-5 sm:pt-7">
      {error ? (
        <div className="mb-4 text-[13px] font-semibold text-white bg-[#B8422F] px-4 py-2.5 rounded">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-[10px] px-4 py-4 sm:px-6.5 sm:py-5.5">
            <div className="flex items-center gap-2 mb-2 sm:mb-3.5">
              <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: s.dotColor }} />
              <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#6B6B68] uppercase">{s.label}</div>
            </div>
            <div className={`${archivoBlackClass} text-[26px] sm:text-[38px] text-[#1B1917]`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 sm:gap-6 mt-5 sm:mt-6 items-start flex-wrap">
        {columns.map((col) => (
          <div key={col.value} className="bg-[#E7E2D3] rounded-xl p-4 flex-1 min-w-[280px] sm:min-w-[320px]">
            <div
              className="inline-flex items-center gap-2.5 text-white text-[13px] font-bold tracking-wide uppercase mb-4 py-2.5 pl-4 pr-5"
              style={{ background: col.color, clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)" }}
            >
              <span>{col.label}</span>
              <span className="text-[15px]">{col.cars.length}</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {col.cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  archivoBlackClass={archivoBlackClass}
                  onChangeEstado={handleChangeEstado}
                  onChangeFecha={handleChangeFecha}
                />
              ))}
              {col.cars.length === 0 ? (
                <div className="text-[13px] text-[#6B6B68] italic px-1 py-2">Sin autos en este estado</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
