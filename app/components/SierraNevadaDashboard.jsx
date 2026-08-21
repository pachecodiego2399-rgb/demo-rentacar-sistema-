"use client";

import { useState } from "react";
import { Archivo_Black, Inter } from "next/font/google";
import FleetSection from "./FleetSection";
import ConversationsBoard from "./ConversationsBoard";

const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

function buildZigzagPoints() {
  const w = 1200;
  const h = 32;
  const amps = [10, 26, 6, 30, 14, 32, 4, 24, 12, 28, 8, 32, 18, 6, 30, 10, 24, 4, 32, 14, 8, 28, 16, 32];
  const step = w / (amps.length - 1);
  let pts = `0,${h} `;
  amps.forEach((a, i) => {
    pts += `${(i * step).toFixed(1)},${h - a} `;
  });
  pts += `${w},${h}`;
  return pts;
}

const ZIGZAG_POINTS = buildZigzagPoints();

function Logo() {
  return (
    <div className="relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-md bg-[#1B1917]">
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#E0A526]" />
      <div
        className="absolute bottom-1.5 -left-1.5 w-0 h-0"
        style={{ borderLeft: "26px solid transparent", borderRight: "14px solid transparent", borderBottom: "34px solid #E0A526" }}
      />
      <div
        className="absolute bottom-1.5 left-[22px] w-0 h-0"
        style={{ borderLeft: "20px solid transparent", borderRight: "22px solid transparent", borderBottom: "26px solid #E0A526" }}
      />
      <div
        className="absolute bottom-1.5 left-0 w-[76px] h-0.5 bg-[#1B1917]"
        style={{ transform: "rotate(8deg)", transformOrigin: "left bottom" }}
      />
    </div>
  );
}

export default function SierraNevadaDashboard() {
  const [tab, setTab] = useState("fleet");

  return (
    <div className={`${inter.className} min-h-screen pb-16`} style={{ background: "#F3EEE1" }}>
      <div className="flex items-start justify-between px-10 pt-8 pb-5">
        <div className="flex items-center gap-5">
          <Logo />
          <div>
            <div className={`${archivoBlack.className} text-[30px] text-[#1B1917] tracking-wide leading-tight`}>
              SIERRA NEVADA RENTACAR
            </div>
            <div className="text-[15px] text-[#6B6B68] mt-1">Panel de control de flota</div>
          </div>
        </div>
        <div className="bg-[#E8D9A8] text-[#7A5A0E] text-[11px] font-bold tracking-widest px-3 py-1.5 rounded uppercase">
          Versión demo
        </div>
      </div>

      <div className="w-full h-8 relative">
        <svg width="100%" height="32" viewBox="0 0 1200 32" preserveAspectRatio="none" className="block">
          <rect width="1200" height="32" fill="#1B1917" />
          <polygon points={ZIGZAG_POINTS} fill="#E0A526" />
        </svg>
        <div className="h-[3px] bg-[#E0A526]" />
      </div>

      <div className="flex gap-2 px-10 pt-5">
        <button
          type="button"
          onClick={() => setTab("fleet")}
          className="cursor-pointer px-5 py-2.5 text-[13px] font-bold tracking-wide uppercase rounded"
          style={{
            background: tab === "fleet" ? "#E0A526" : "transparent",
            color: tab === "fleet" ? "#1B1917" : "#6B6B68",
          }}
        >
          Flota de Autos
        </button>
        <button
          type="button"
          onClick={() => setTab("conversations")}
          className="cursor-pointer px-5 py-2.5 text-[13px] font-bold tracking-wide uppercase rounded"
          style={{
            background: tab === "conversations" ? "#E0A526" : "transparent",
            color: tab === "conversations" ? "#1B1917" : "#6B6B68",
          }}
        >
          Conversaciones
        </button>
      </div>

      {tab === "fleet" ? <FleetSection archivoBlackClass={archivoBlack.className} /> : <ConversationsBoard archivoBlackClass={archivoBlack.className} />}
    </div>
  );
}
