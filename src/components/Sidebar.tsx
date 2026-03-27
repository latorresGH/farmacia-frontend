import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, 
  BarChart3, 
  Users, 
  LogOut, 
  Pill 
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // Clase para los botones para no repetir código
  const navItemClass = "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 group";

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white p-6">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-2 mb-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Pill size={20} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-gray-800">
          Farmacia
        </h2>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1">
        <button 
          onClick={() => navigate("/")} 
          className={navItemClass}
        >
          <ClipboardList size={18} className="text-gray-400 group-hover:text-blue-600" />
          Turnos
        </button>

        <button className={navItemClass}>
          <BarChart3 size={18} className="text-gray-400 group-hover:text-blue-600" />
          Estadísticas
        </button>

        <button className={navItemClass}>
          <Users size={18} className="text-gray-400 group-hover:text-blue-600" />
          Usuarios
        </button>
      </nav>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}