import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css"
import MainLayout from "./layout/MainLayout";
import Turnos from "./pages/PanelTurnos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Turnos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}