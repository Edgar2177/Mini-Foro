import { useState, useEffect } from "react";
import { auth, storage } from '../firebaseconfig';
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from '../componets/navbar';
import './perfil.css';
import Swal from 'sweetalert2';

const Perfil = () => {
    const [previewImage, setPreviewImage] = useState(null);
    const [username, setUsername] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const user = auth.currentUser;

    useEffect(() => {
        if (user) {
            setUsername(user.displayName || '');
            setPreviewImage(user.photoURL || null);
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
            setSelectedFile(file);
        }
    };

    const handleSave = async () => {
        try {
            let photoURL = user.photoURL;

            // Si se seleccionó un nuevo archivo, subirlo a Firebase Storage
            if (selectedFile) {
                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, selectedFile);
                photoURL = await getDownloadURL(storageRef);
            }

            await updateProfile(user, {
                displayName: username,
                photoURL: photoURL
            });

            Swal.fire({
                icon: 'success',
                title: 'Perfil actualizado',
                text: 'Tu información se ha guardado correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar tu perfil'
        });
        }
    };

  return (
    <div className='perfil-body'>
        <Navbar />
        <div className='perfil-container'>
            <div className='perfil-content'>
                <h2>Editar Perfil</h2>
                <div className="image-upload">
                    <input type="file" onChange={handleImageChange} accept="image/*" id="avatar-upload" />
                    <label htmlFor="avatar-upload">
                    {previewImage ? (
                    <img src={previewImage} alt="Vista previa" className="preview-image" />
                    ) : (
                    <span>+ Cambia tu foto</span>
                    )}
                    </label>
                </div>
                <div className="inputs-register">
                    <label htmlFor="usuario">Usuario</label>
                    <input
                    type="text"
                    id="usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario1234"
                    required
                    />
                </div>
                <button className="perfil-button" onClick={handleSave}>Guardar Cambios</button>
            </div>
        </div>
    </div>
  );
};

export default Perfil;
