// src/views/Login.jsx (igual que el original)
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos',
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp()
      });

      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido de vuelta!`,
        showConfirmButton: false,
        timer: 1500
      });

      navigate('/');

    } catch (error) {
      console.error("Error en login:", error);
      let errorMessage = "Ocurrió un error al iniciar sesión";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "El correo ingresado no es válido.";
          break;
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este correo.";
          break;
        case "auth/wrong-password":
          errorMessage = "La contraseña es incorrecta.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Cuenta temporalmente bloqueada. Intenta más tarde.";
          break;
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido desactivada.";
          break;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h2 className="title-login">Iniciar Sesión</h2>

        <div className="inputs-login">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            placeholder="ejemplo@correo.com"
            required
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="inputs-login">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            required
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="cont-Signup">
          <span>¿No tienes cuenta? <Link className='link' to="/register">Regístrate</Link></span>
        </div>

        <button 
          className="login-button" 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
};

export default Login;