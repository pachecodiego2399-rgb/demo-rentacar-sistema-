"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const POLL_INTERVAL_MS = 17000;

const COLUMNS = [
  { value: "En conversación", label: "En Conversación", color: "#55534E" },
  { value: "Calificado", label: "Calificado", color: "#E0A526" },
  { value: "Listo para retirar", label: "Listo para Retirar", color: "#2E8B3D" },
  { value: "Necesita ayuda humana", label: "Necesita Ayuda Humana", color: "#B8791A" },
  { value: "Completado", label: "Completado", color: "#1B1917" },
];

function formatLastContact(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(d);
}

function GripDots() {
  return (
    <div className="grid grid-cols-2 gap-[3px] shrink-0 mt-0.5" style={{ gridAutoRows: "3px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="w-[3px] h-[3px] rounded-full bg-[#D8D3C4]" />
      ))}
    </div>
  );
}

function ClientCard({ client, columnColor, archivoBlackClass, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client.id,
    data: { fromColumn: client.estado },
  });

  const style = {
    borderLeft: `6px solid ${columnColor}`,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
    boxShadow: isOverlay ? "0 6px 16px rgba(27,25,23,0.18)" : "none",
    transform: transform && isOverlay ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="bg-white rounded-lg py-3 pl-3 pr-3.5 transition-shadow hover:shadow-md"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripDots />
          <div className={`${archivoBlackClass} text-[13px] text-[#1B1917] truncate`}>{client.nombre}</div>
        </div>
        {client.telefono ? (
          <div className="bg-[#F0EDE3] text-[#6B6B68] text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
            {client.telefono}
          </div>
        ) : null}
      </div>
      {client.conversacion ? (
        <div className="mt-1.5 text-[12px] text-[#6B6B68] leading-snug line-clamp-2">{client.conversacion}</div>
      ) : null}
      <div className="mt-2 text-[11px] text-[#1B1917] flex items-center gap-1.5">
        <span style={{ color: columnColor }}>●</span> Último contacto: {formatLastContact(client.fechaContacto)}
      </div>
    </div>
  );
}

function KanbanColumn({ column, clients, archivoBlackClass, isOver }) {
  const { setNodeRef } = useDroppable({ id: column.value });

  return (
    <div
      ref={setNodeRef}
      className="bg-[#E7E2D3] rounded-xl p-4 w-[82vw] sm:w-[280px] shrink-0"
      style={{ border: `2px dashed ${isOver ? "#E0A526" : "transparent"}`, transition: "border-color 0.15s ease" }}
    >
      <div
        className="inline-flex items-center gap-2.5 text-white text-[12px] font-bold tracking-wide uppercase mb-4 py-2.5 pl-4 pr-5 whitespace-nowrap"
        style={{ background: column.color, clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)" }}
      >
        <span>{column.label}</span>
        <span className="text-[14px]">{clients.length}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} columnColor={column.color} archivoBlackClass={archivoBlackClass} />
        ))}
      </div>
    </div>
  );
}

export default function ConversationsBoard({ archivoBlackClass }) {
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const suppressPollRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const loadClientes = useCallback(() => {
    return fetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (!suppressPollRef.current) setClientes(data.clientes);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadClientes();
    const interval = setInterval(loadClientes, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadClientes]);

  function showError(message) {
    setError(message);
    setTimeout(() => setError((current) => (current === message ? null : current)), 5000);
  }

  function handleDragStart(event) {
    suppressPollRef.current = true;
    setActiveId(event.active.id);
  }

  function handleDragOver(event) {
    setOverId(event.over?.id ?? null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    const targetColumn = over?.id;
    const sourceColumn = active.data.current?.fromColumn;

    if (!targetColumn || targetColumn === sourceColumn) {
      suppressPollRef.current = false;
      return;
    }

    const clientId = active.id;
    const previous = clientes;
    setClientes((current) => current.map((c) => (c.id === clientId ? { ...c, estado: targetColumn } : c)));

    try {
      const res = await fetch(`/api/clientes/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: targetColumn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al mover el cliente");
    } catch (err) {
      setClientes(previous);
      showError(`No se pudo mover al cliente: ${err.message}`);
    } finally {
      suppressPollRef.current = false;
    }
  }

  if (error && !clientes) {
    return <div className="px-10 pt-7 text-[14px] text-red-700">Error cargando conversaciones: {error}</div>;
  }
  if (!clientes) {
    return <div className="px-10 pt-7 text-[14px] text-[#6B6B68]">Cargando conversaciones…</div>;
  }

  const activeClient = activeId ? clientes.find((c) => c.id === activeId) : null;
  const activeColumn = activeClient ? COLUMNS.find((c) => c.value === activeClient.estado) : null;

  return (
    <div className="px-5 sm:px-10 pt-5 sm:pt-7">
      {error ? (
        <div className="mb-4 text-[13px] font-semibold text-white bg-[#B8422F] px-4 py-2.5 rounded">{error}</div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 items-start overflow-x-auto pb-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.value}
              column={column}
              clients={clientes.filter((c) => c.estado === column.value)}
              archivoBlackClass={archivoBlackClass}
              isOver={overId === column.value}
            />
          ))}
        </div>
        <DragOverlay>
          {activeClient ? (
            <div className="w-[248px]">
              <ClientCard client={activeClient} columnColor={activeColumn?.color || "#6B6B68"} archivoBlackClass={archivoBlackClass} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
