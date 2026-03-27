import { useEffect, useState } from "react";
import { getTipos } from "../services/turnos";
import ColumnaTipo from "../components/ColumnaTipo";
import { socket } from "../socket";
import { LayoutDashboard, RefreshCcw, GripVertical } from "lucide-react";
// Importamos los componentes de Drag and Drop
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

export default function PanelTurnos() {
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ... useEffects del socket y carga inicial (igual que antes) ...
    useEffect(() => {
    socket.connect();
    socket.on("connect", () => console.log("🟢 conectado al socket"));
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const data = await getTipos();
        // Intentar cargar orden guardado del localStorage
        const ordenGuardado = localStorage.getItem('orden_categorias');
        if (ordenGuardado) {
          const IDsOrdenados = JSON.parse(ordenGuardado);
          // Reordenar los datos de la API según el orden guardado
          const dataOrdenada = IDsOrdenados.map((id: any) => 
            data.find((tipo: any) => tipo.id === id)
          ).filter(Boolean); // Filtrar por si acaso una categoría ya no existe
          
          // Añadir las categorías nuevas que no estaban en el orden guardado
          const idsGuardadosSet = new Set(IDsOrdenados);
          const nuevasCategorias = data.filter((tipo: any) => !idsGuardadosSet.has(tipo.id));
          
          setTipos([...dataOrdenada, ...nuevasCategorias]);
        } else {
          setTipos(data);
        }
      } catch (error) {
        console.error("Error cargando tipos:", error);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  // FUNCIÓN QUE MANEJA EL FINAL DEL ARRASTRE
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // Si no hay destino (se soltó fuera) o se soltó en el mismo lugar, no hacemos nada
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Reordenar el array localmente
    const nuevosTipos = Array.from(tipos);
    const [reorderedItem] = nuevosTipos.splice(source.index, 1);
    nuevosTipos.splice(destination.index, 0, reorderedItem);

    // Actualizar estado
    setTipos(nuevosTipos);
    
    // PERSISTIR EL ORDEN: Guardar en localStorage para que se mantenga al recargar
    const IDsOrdenados = nuevosTipos.map(t => t.id);
    localStorage.setItem('orden_categorias', JSON.stringify(IDsOrdenados));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      {/* Header (igual que antes) */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={20} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Gestión de Turnos
            </h1>
          </div>
          <p className="text-sm text-gray-500">Mueve las columnas para organizar tu vista</p>
        </div>
        {/* ... loading indicator ... */}
      </header>

      {/* ÁREA DE DRAG AND DROP */}
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Droppable: El contenedor horizontal donde se pueden soltar cosas */}
        <Droppable droppableId="columnas-turnos" direction="horizontal">
          {(provided) => (
            <main 
              className="flex-1 overflow-x-auto overflow-y-hidden p-8"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <div className="flex items-start gap-6 h-full min-w-max pb-4">
                {tipos.map((tipo, index) => (
                  // Draggable: Cada columna individual
                  <Draggable key={tipo.id} draggableId={String(tipo.id)} index={index}>
                    {(providedDraggable, snapshot) => (
                      <div
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        // Añadimos un pequeño estilo visual cuando se está arrastrando
                        className={`transition-shadow duration-150 ${snapshot.isDragging ? 'shadow-2xl shadow-blue-100/50 z-50' : ''}`}
                      >
                        {/* Agregamos un "manubrio" (handle) para arrastrar, así no interfiere con los botones internos */}
                        <div className="relative group">
                          <div 
                            {...providedDraggable.dragHandleProps} 
                            className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Arrastrar para reordenar"
                          >
                            <GripVertical size={20} />
                          </div>
                          <ColumnaTipo tipo={tipo} />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                
                {/* Elemento requerido por la librería para funcionar */}
                {provided.placeholder}
                
                {/* Espaciador final */}
                <div className="w-4 h-full flex-shrink-0" />
              </div>
            </main>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}