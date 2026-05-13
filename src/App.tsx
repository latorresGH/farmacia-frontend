import { useEffect, useState } from "react";
import { socket } from "./socket";

type Turno = {
  id: number;
  codigo: string;
  estado: string;
  tipoTurno?: { nombre: string };
  caja?: { id: number; nombre: string } | null;
};

type CajaEstado = {
  id: number;
  nombre: string;
  turnoActual: Turno | null;
};

const API_URL = import.meta.env.VITE_API_URL;

function useHora() {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return hora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const [cajas, setCajas] = useState<CajaEstado[]>([]);
  const [pendientes, setPendientes] = useState<Turno[]>([]);
  const [conectado, setConectado] = useState(false);
  const [ultimoLlamado, setUltimoLlamado] = useState<Turno | null>(null);
  const hora = useHora();

  async function cargarEstado() {
    try {
      const res = await fetch(`${API_URL}/turnos/public/estado`);
      const data = await res.json();
      setCajas(data.cajas ?? []);
      setPendientes(data.pendientes ?? []);
    } catch (e) {
      console.error("Error cargando estado:", e);
    }
  }

  useEffect(() => {
    cargarEstado();
    socket.connect();

    socket.on("connect", () => setConectado(true));
    socket.on("disconnect", () => setConectado(false));

    socket.on("turno_llamado", (turno: Turno) => {
      setUltimoLlamado(turno);
      setPendientes((prev) => prev.filter((t) => t.id !== turno.id));
      setCajas((prev) =>
        prev.map((c) =>
          c.id === turno.caja?.id ? { ...c, turnoActual: turno } : c,
        ),
      );
      // Limpiar el flash de último llamado después de 5 segundos
      setTimeout(() => setUltimoLlamado(null), 5000);
    });

    socket.on("turno_en_atencion", (turno: Turno) => {
      setCajas((prev) =>
        prev.map((c) =>
          c.turnoActual?.id === turno.id ? { ...c, turnoActual: turno } : c,
        ),
      );
    });

    socket.on("turno_finalizado", (turno: Turno) => {
      setCajas((prev) =>
        prev.map((c) =>
          c.turnoActual?.id === turno.id ? { ...c, turnoActual: null } : c,
        ),
      );
    });

    socket.on("turno_cancelado", (turno: Turno) => {
      setCajas((prev) =>
        prev.map((c) =>
          c.turnoActual?.id === turno.id ? { ...c, turnoActual: null } : c,
        ),
      );
      setPendientes((prev) => prev.filter((t) => t.id !== turno.id));
    });

    socket.on("turno_creado", (turno: Turno) => {
      setPendientes((prev) => [...prev, turno]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("turno_llamado");
      socket.off("turno_en_atencion");
      socket.off("turno_finalizado");
      socket.off("turno_cancelado");
      socket.off("turno_creado");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex flex-col font-sans">

      {/* Header */}
      <header className="px-10 py-4 bg-white border-b border-zinc-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-zinc-900">
            Farmacia
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Sistema de turnos
          </p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-3xl font-black tracking-tighter text-zinc-700 tabular-nums">
            {hora}
          </span>
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${
              conectado
                ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-red-400"
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {conectado ? "En línea" : "Sin conexión"}
            </span>
          </div>
        </div>
      </header>

      {/* Flash último llamado */}
      {ultimoLlamado && (
        <div className="mx-8 mt-6 px-8 py-5 rounded-3xl bg-indigo-600 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <div className="px-2 py-1 rounded-xl bg-white/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                Nuevo llamado
              </span>
            </div>
            <span className="text-4xl font-black tracking-tighter text-white">
              {ultimoLlamado.codigo}
            </span>
            {ultimoLlamado.tipoTurno && (
              <span className="text-sm font-bold text-indigo-200">
                {ultimoLlamado.tipoTurno.nombre}
              </span>
            )}
          </div>
          {ultimoLlamado.caja && (
            <div className="flex items-center gap-2">
              <span className="text-indigo-200 text-sm font-bold">Dirigirse a</span>
              <span className="text-2xl font-black text-white">
                {ultimoLlamado.caja.nombre}
              </span>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 flex flex-col gap-6 p-8">

        {/* Grilla de cajas */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">
            Estado de cajas
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cajas.map((caja) => (
              <div
                key={caja.id}
                className={`rounded-3xl border p-6 transition-all ${
                  caja.turnoActual
                    ? "bg-white border-indigo-200 shadow-md shadow-indigo-100"
                    : "bg-white/60 border-zinc-200"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                  {caja.nombre}
                </p>

                {caja.turnoActual ? (
                  <div>
                    <p className="text-5xl font-black tracking-tighter text-zinc-900 leading-none mb-2">
                      {caja.turnoActual.codigo}
                    </p>
                    {caja.turnoActual.tipoTurno && (
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {caja.turnoActual.tipoTurno.nombre}
                      </p>
                    )}
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      caja.turnoActual.estado === "LLAMADO"
                        ? "text-amber-500"
                        : "text-emerald-600"
                    }`}>
                      {caja.turnoActual.estado === "LLAMADO" ? "● Llamando" : "● En atención"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl font-black tracking-tighter text-zinc-300 leading-none mb-2">
                      —
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                      ○ Libre
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lista de espera */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
              Cola de espera
            </p>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-zinc-200 text-zinc-600">
              {pendientes.length} {pendientes.length === 1 ? "turno" : "turnos"}
            </span>
          </div>

          {pendientes.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-white/40">
              <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">
                Sin turnos en espera
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {pendientes.map((turno, idx) => (
                <div
                  key={turno.id}
                  className={`rounded-2xl border p-4 text-center transition-all ${
                    idx === 0
                      ? "bg-amber-50 border-amber-200"
                      : "bg-white border-zinc-200"
                  }`}
                >
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                    #{idx + 1}
                  </span>
                  <span className={`font-mono font-black text-lg block ${
                    idx === 0 ? "text-amber-700" : "text-zinc-800"
                  }`}>
                    {turno.codigo}
                  </span>
                  {turno.tipoTurno && (
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mt-1 truncate">
                      {turno.tipoTurno.nombre}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-10 py-4 border-t border-zinc-200 bg-white">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-center">
          Node IT · Sistema de gestión de turnos
        </p>
      </footer>
    </div>
  );
}