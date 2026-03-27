import { useEffect } from "react";
import { socket } from "../socket";
import { llamarSiguiente } from "../services/turnos";
import { useTurnos } from "../hooks/useTurnos";
// Importamos iconos para darle un toque visual
import { StepForward, Users, Clock3, LoaderCircle } from "lucide-react";

// Nota: cambié 'any' por una interfaz básica para mejor DX
interface TipoTurno {
  id: number;
  nombre: string;
}

export default function ColumnaTipo({ tipo }: { tipo: TipoTurno }) {
  const { turnos, loading, recargar } = useTurnos(tipo.id);

  async function handleLlamar() {
    try {
      await llamarSiguiente(tipo.id);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    function handler(turno: any) {
      if (turno.tipoTurnoId === tipo.id) {
        recargar();
      }
    }

    socket.on("turno_creado", handler);
    socket.on("turno_llamado", handler);
    socket.on("turno_finalizado", handler);
    socket.on("turno_cancelado", handler);

    return () => {
      socket.off("turno_creado", handler);
      socket.off("turno_llamado", handler);
      socket.off("turno_finalizado", handler);
      socket.off("turno_cancelado", handler);
    };
  }, [tipo.id, recargar]); // Añadí recargar a las dependencias por buena práctica

  // Separamos el turno actual (el primero) de los que esperan
  const turnoActual = turnos[0];
  const turnosEnEspera = turnos.slice(1);

  return (
    // LA TARJETA DE COLUMNA
    <div className="flex flex-col flex-shrink-0 w-80 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      
      {/* CABECERA DE LA COLUMNA */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            {tipo.nombre}
          </h2>
          {loading && <LoaderCircle className="animate-spin text-blue-500" size={18} />}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} className="text-gray-400" />
          <span>
            {turnos.length} {turnos.length === 1 ? 'persona' : 'personas'} en total
          </span>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL (CONTENIDO SCROLLEABLE) */}
      <div className="flex-1 p-5 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        
        {/* TURNO ACTUALMENTE LLAMADO */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Atendiendo ahora
          </h3>
          {turnoActual ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700">
                <Clock3 size={24} />
              </div>
              <div>
                <span className="block text-3xl font-bold text-blue-900 tracking-tight">
                  {turnoActual.codigo}
                </span>
                <span className="text-xs text-blue-700 font-medium">Desde hace: 2 min</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 text-sm">
              Nadie siendo atendido
            </div>
          )}
        </div>

        {/* LISTA DE ESPERA */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            En espera ({turnosEnEspera.length})
          </h3>
          <div className="space-y-2">
            {turnosEnEspera.length > 0 ? (
              turnosEnEspera.map((t, index) => (
                <div 
                  key={t.id} 
                  className={`flex items-center justify-between p-3 animate-pop-in rounded-lg border border-gray-100 ${index === 0 ? 'bg-gray-50' : ''}`}
                >
                  <><span className="font-mono text-base font-medium text-gray-800">
                  {t.codigo}
                </span><span className="text-xs text-gray-400">
                    #{turnos.indexOf(t) + 1}
                  </span></>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic pl-1">No hay turnos en espera.</p>
            )}
          </div>
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN (FIJO ABAJO) */}
      <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50/50">
        <button 
          onClick={handleLlamar}
          disabled={turnos.length === 0}
          className="flex items-center justify-center gap-2.5 w-full px-5 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm shadow-blue-100"
        >
          <StepForward size={18} />
          Llamar siguiente
        </button>
      </div>
    </div>
  );
}