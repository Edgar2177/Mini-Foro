import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './auth/authContext'; // Asegúrate de tener este archivo
import Login from "./views/Login";
import Register from "./views/Register";
import Index from "./views/index";
import Navbar from "./componets/navbar";
import Perfil from "./views/perfil";
import Forogame from "./views/forogame"; // Cambié ForoGame por Forogame (con la misma capitalización)
import ListaGames from "./views/listagames";
import ForumDiscussion from "./views/game";
import PrivateRoute from './componets/privateroute';
import Administrador from './views/administrador';

function App() {
  return (
    <AuthProvider> {/* Envuelve todo con el proveedor de autenticación */}
      <Router>
        <Navbar /> {/* Si Navbar debe aparecer en todas las páginas */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/listagames" element={<ListaGames />}/>
          <Route 
            path="/forogame/:id" 
            element={<PrivateRoute><Forogame /></PrivateRoute>} // Ruta para Forogame
          />
          <Route path="/administrador" element={<Administrador />}/>
          <Route path="/game/:id" element={<ForumDiscussion />}/>0
          <Route path="/" element={<Index />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
