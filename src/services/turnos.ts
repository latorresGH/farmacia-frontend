import { api } from "../api/clients";

export async function getPendientesPorTipo(tipoTurnoId: number) {
  const res = await api.get("/turnos", {
    params: {
      estado: "PENDIENTE",
      tipoTurnoId,
    },
  });

  return res.data;
}

export async function llamarSiguiente(tipoTurnoId: number) {
  const res = await api.post("/turnos/siguiente", {
    tipoTurnoId,
  });

  return res.data;
}

export async function getTipos() {
  const res = await api.get("/tipos-turno/1"); // 👈 farmacia hardcodeada
  return res.data;
}