// src/views/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, storage, db } from "../firebaseconfig";
import Swal from "sweetalert2";
import './Register.css';

const Register = () => {
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Solo se permiten archivos de imagen', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Error', 'La imagen no debe superar 2MB', 'error');
        return;
      }
      
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }
    if (password.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = "";
      if (selectedFile) {
        try {
          const timestamp = Date.now();
          const imageRef = ref(storage, `avatars/${user.uid}/profile_${timestamp}.jpg`);
          await uploadBytes(imageRef, selectedFile);
          photoURL = await getDownloadURL(imageRef);
        } catch (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          Swal.fire({
            icon: 'warning',
            title: 'Registro exitoso',
            text: 'Tu cuenta se creó pero no pudimos subir tu imagen. Puedes actualizarla luego.',
          });
        }
      }

      await Promise.all([
        updateProfile(user, {
          displayName: username,
          photoURL: photoURL || ""
        }),
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          username,
          avatar: photoURL || "",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          role: "user"
        })
      ]);

      await Swal.fire({
        icon: 'success',
        title: `¡Bienvenido ${username}!`,
        showConfirmButton: false,
        timer: 2000
      });
      navigate("/");

    } catch (error) {
      console.error("Error completo:", error);
      
      const errorMap = {
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/invalid-email': 'Correo electrónico no válido',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'storage/unauthorized': 'Error de permisos con la imagen',
        'storage/retry-limit-exceeded': 'La imagen es muy pesada'
      };

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMap[error.code] || 'Ocurrió un error inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <h2 className="title-register">Registrarse</h2>
        
        <div className="image-upload">
          <input 
            type="file" 
            onChange={handleImageChange} 
            accept="image/*" 
            id="avatar-upload" 
            disabled={loading}
          />
          <label htmlFor="avatar-upload">
            {previewImage ? (
              <img src={previewImage} alt="Vista previa" className="preview-image" />
            ) : (
              <span>+ Sube tu foto</span>
            )}
          </label>
        </div>

        <div className="inputs-register">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            disabled={loading}
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div className="inputs-register">
          <label>Usuario</label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            disabled={loading}
            placeholder="Mínimo 3 caracteres"
            minLength="3"
          />
        </div>

        <div className="inputs-register">
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            disabled={loading}
            placeholder="Mínimo 6 caracteres"
            minLength="6"
          />
        </div>

        <div className="cont-register">
          <span>¿Ya tienes cuenta? <Link className="link" to="/login">Iniciar Sesión</Link></span>
        </div>

        <button 
          className="register-button" 
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </div>
    </div>
  );
};

export default Register;