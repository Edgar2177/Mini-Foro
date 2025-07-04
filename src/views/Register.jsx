// src/views/Register.jsx (misma funcionalidad)
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
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  const handleRegister = async () => {
    if (!email || !username || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos',
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = "";
      if (selectedFile) {
        const imageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(imageRef, selectedFile);
        photoURL = await getDownloadURL(imageRef);
      }

      await updateProfile(user, {
        displayName: username,
        photoURL: photoURL || "",
      });

      const userData = {
        uid: user.uid,
        email: user.email,
        username: username,
        avatar: photoURL || "",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: "user",
      };

      await setDoc(doc(db, "users", user.uid), userData);

      await Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: `Bienvenido, ${username}`,
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/");

    } catch (error) {
      console.error("Error al registrar:", error);

      let message = "Ocurrió un error inesperado";

      if (error.code === "auth/email-already-in-use") {
        message = "El correo ya está registrado";
      } else if (error.code === "auth/invalid-email") {
        message = "El correo no es válido";
      } else if (error.code === "auth/weak-password") {
        message = "La contraseña es muy débil (mínimo 6 caracteres)";
      }

      Swal.fire({
        icon: 'error',
        title: 'Error al registrarte',
        text: message,
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