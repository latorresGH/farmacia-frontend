import { useEffect, useState } from "react";
import { getPendientesPorTipo } from "../services/turnos";

export function useTurnos(tipoTurnoId: number) {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    try {
      const data = await getPendientesPorTipo(tipoTurnoId);
      setTurnos(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 3000); // 🔁 polling simple
    return () => clearInterval(interval);
  }, [tipoTurnoId]);

  return { turnos, loading, recargar: cargar };
}