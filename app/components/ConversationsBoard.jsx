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

const COLUMN_BY_VALUE = Object.fromEntries(COLUMNS.map((c) => [c.value, c]));

function formatLastContact(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(d);
}

// El campo Conversación en Airtable viene como bloques de texto:
//   [dd/MM/yyyy HH:mm]
//   Cliente: mensaje
//   Salva: respuesta
// repetidos por cada intercambio. Si el texto trae código de n8n sin
// resolver (p. ej. "{{ ... }}"), se marca como "malformed" para mostrarlo
// como texto plano en vez de intentar armar burbujas con eso.
function parseConversation(raw) {
  if (!raw) return { messages: [], malformed: false };

  const looksLikeUnresolvedCode = /\{\{|\$\(['"]|\.item\.json|toFormat\(/.test(raw);
  if (looksLikeUnresolvedCode) return { messages: [], malformed: true };

  const lines = raw.split(/\r?\n/);
  const messages = [];
  let currentTimestamp = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const tsMatch = line.match(/^\[([^\]]+)\]$/);
    if (tsMatch) {
      currentTimestamp = tsMatch[1];
      continue;
    }

    const clienteMatch = line.match(/^Cliente:\s*(.*)$/i);
    const salvaManualMatch = line.match(/^Salva\s*\(manual\):\s*(.*)$/i);
    const salvaMatch = line.match(/^Salva:\s*(.*)$/i);

    if (clienteMatch) {
      messages.push({ sender: "cliente", text: clienteMatch[1], timestamp: currentTimestamp });
    } else if (salvaManualMatch) {
      messages.push({ sender: "salva-manual", text: salvaManualMatch[1], timestamp: currentTimestamp });
    } else if (salvaMatch) {
      messages.push({ sender: "salva", text: salvaMatch[1], timestamp: currentTimestamp });
    } else if (messages.length > 0) {
      messages[messages.length - 1].text += ` ${line}`;
    }
  }

  if (messages.length === 0) return { messages: [], malformed: true };
  return { messages, malformed: false };
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

function StatusBadge({ column }) {
  if (!column) return null;
  return (
    <span
      className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full whitespace-nowrap"
      style={{ background: column.color, color: "#FFFFFF" }}
    >
      {column.label}
    </span>
  );
}

function ClientCard({ client, columnColor, archivoBlackClass, isOverlay, onOpen }) {
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
      onClick={() => onOpen && onOpen(client)}
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

function KanbanColumn({ column, clients, archivoBlackClass, isOver, onOpenDetail }) {
  const { setNodeRef } = useDroppable({ id: column.value });

  return (
    <div
      ref={setNodeRef}
      className="bg-[#E7E2D3] rounded-xl p-4 w-full sm:w-[280px] shrink-0"
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
          <ClientCard
            key={client.id}
            client={client}
            columnColor={column.color}
            archivoBlackClass={archivoBlackClass}
            onOpen={onOpenDetail}
          />
        ))}
        {clients.length === 0 ? (
          <div className="text-[13px] text-[#6B6B68] italic px-1 py-2">Sin clientes en este estado</div>
        ) : null}
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isCliente = message.sender === "cliente";
  const isManual = message.sender === "salva-manual";
  return (
    <div className={`flex ${isCliente ? "justify-start" : "justify-end"}`}>
      <div
        className="max-w-[80%] sm:max-w-[65%] px-4 py-2.5 text-[14px] leading-relaxed"
        style={
          isCliente
            ? {
                background: "#FFFFFF",
                color: "#1B1917",
                border: "1px solid #E5DFCB",
                borderRadius: "12px 12px 12px 2px",
              }
            : isManual
            ? {
                background: "#B8791A",
                color: "#FFFFFF",
                borderRadius: "12px 12px 2px 12px",
              }
            : {
                background: "#1B1917",
                color: "#FFFFFF",
                borderRadius: "12px 12px 2px 12px",
              }
        }
      >
        <div className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-60">
          {isCliente ? "Cliente" : isManual ? "Salva (manual)" : "Salva"}
        </div>
        {message.text}
      </div>
    </div>
  );
}

function ConversationDetail({ client, column, archivoBlackClass, onClose, onTogglePausado, onMessageSent, onShowError }) {
  const { messages, malformed } = parseConversation(client.conversacion);
  const [pausando, setPausando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [client.conversacion]);

  let lastTimestamp = null;

  async function handleTogglePausado() {
    setPausando(true);
    try {
      await onTogglePausado(client.id, !client.pausado);
    } finally {
      setPausando(false);
    }
  }

  async function handleEnviar() {
    const texto = mensaje.trim();
    if (!texto || enviando) return;
    if (!client.telefono) {
      onShowError("Este cliente no tiene teléfono registrado, no se puede enviar el mensaje.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/pausa-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: client.telefono, mensaje: texto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el mensaje");
      setMensaje("");
      onMessageSent(client.id);
    } catch (err) {
      onShowError(`No se pudo enviar el mensaje: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#F3EEE1", borderTop: client.pausado ? "5px solid #B8791A" : "none" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-5 sm:px-10 py-5 border-b border-[#E5DFCB]">
        <div className="min-w-0">
          <div className={`${archivoBlackClass} text-[19px] sm:text-[22px] text-[#1B1917] truncate`}>
            {client.nombre || "Cliente sin nombre"}
          </div>
          <div className="text-[13px] text-[#6B6B68] mt-1">{client.telefono || "Sin teléfono"}</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge column={column} />
            {client.pausado ? (
              <span className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full whitespace-nowrap bg-[#B8791A] text-white">
                Pausado — respondiendo manualmente
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTogglePausado}
            disabled={pausando}
            className="cursor-pointer flex-1 sm:flex-none shrink-0 text-white text-[13px] font-bold uppercase tracking-wide px-4 py-2.5 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: client.pausado ? "#2E8B3D" : "#B8791A" }}
          >
            {pausando ? "Guardando…" : client.pausado ? "Reanudar bot" : "Pausar bot"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 sm:flex-none shrink-0 bg-[#1B1917] text-white text-[13px] font-bold uppercase tracking-wide px-4 py-2.5 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-10 py-6">
        {malformed ? (
          <div className="max-w-[720px] mx-auto bg-white border border-[#E5DFCB] rounded-lg p-4 text-[13px] text-[#6B6B68] whitespace-pre-wrap break-words">
            {client.conversacion ? client.conversacion : "Todavía no hay conversación registrada para este cliente."}
          </div>
        ) : (
          <div className="max-w-[720px] mx-auto flex flex-col gap-3">
            {messages.map((message, i) => {
              const showTimestamp = message.timestamp && message.timestamp !== lastTimestamp;
              if (showTimestamp) lastTimestamp = message.timestamp;
              return (
                <div key={i} className="flex flex-col gap-3">
                  {showTimestamp ? (
                    <div className="text-center text-[11px] font-semibold text-[#6B6B68] uppercase tracking-wide">
                      {message.timestamp}
                    </div>
                  ) : null}
                  <ChatBubble message={message} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[#E5DFCB] bg-[#F3EEE1] px-5 sm:px-10 py-4">
        <div className="max-w-[720px] mx-auto flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !enviando) handleEnviar();
            }}
            placeholder="Escribe un mensaje manual para este cliente…"
            className="flex-1 min-w-0 rounded-lg border border-[#D8D3C4] bg-white px-3.5 py-2.5 text-[14px] text-[#1B1917] placeholder:text-[#A8A399] focus:outline-none focus:border-[#B8791A]"
          />
          <button
            type="button"
            onClick={handleEnviar}
            disabled={enviando || !mensaje.trim()}
            className="cursor-pointer shrink-0 bg-[#1B1917] text-white text-[13px] font-bold uppercase tracking-wide px-5 py-2.5 rounded disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConversationsBoard({ archivoBlackClass }) {
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [detailClientId, setDetailClientId] = useState(null);
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

  async function handleTogglePausado(clientId, nuevoPausado) {
    suppressPollRef.current = true;
    const previous = clientes;
    setClientes((current) => current.map((c) => (c.id === clientId ? { ...c, pausado: nuevoPausado } : c)));
    try {
      const res = await fetch(`/api/clientes/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pausado: nuevoPausado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar el estado de pausa");
    } catch (err) {
      setClientes(previous);
      showError(`No se pudo actualizar el estado de pausa: ${err.message}`);
    } finally {
      suppressPollRef.current = false;
    }
  }

  async function handleMessageSent(clientId) {
    suppressPollRef.current = true;
    setClientes((current) => current.map((c) => (c.id === clientId ? { ...c, pausado: true } : c)));
    suppressPollRef.current = false;
    await loadClientes();
  }

  if (error && !clientes) {
    return <div className="px-10 pt-7 text-[14px] text-red-700">Error cargando conversaciones: {error}</div>;
  }
  if (!clientes) {
    return <div className="px-10 pt-7 text-[14px] text-[#6B6B68]">Cargando conversaciones…</div>;
  }

  const activeClient = activeId ? clientes.find((c) => c.id === activeId) : null;
  const activeColumn = activeClient ? COLUMN_BY_VALUE[activeClient.estado] : null;
  const detailClient = detailClientId ? clientes.find((c) => c.id === detailClientId) : null;

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
        <div className="flex flex-col sm:flex-row gap-5 items-stretch sm:items-start sm:overflow-x-auto sm:pb-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.value}
              column={column}
              clients={clientes.filter((c) => c.estado === column.value)}
              archivoBlackClass={archivoBlackClass}
              isOver={overId === column.value}
              onOpenDetail={(client) => setDetailClientId(client.id)}
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

      {detailClient ? (
        <ConversationDetail
          client={detailClient}
          column={COLUMN_BY_VALUE[detailClient.estado]}
          archivoBlackClass={archivoBlackClass}
          onClose={() => setDetailClientId(null)}
          onTogglePausado={handleTogglePausado}
          onMessageSent={handleMessageSent}
          onShowError={showError}
        />
      ) : null}
    </div>
  );
}
