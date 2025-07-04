// src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';

const PrivateRoute = ({ children, requiresAdmin = false }) => {
    const { user, userData, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                {/* Agrega aquí tu spinner o componente de carga */}
                <p>Cargando verificación de acceso...</p>
            </div>
        );
    }

    // Redirecciones condicionales
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiresAdmin && !userData?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PrivateRoute;