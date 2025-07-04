import './administrador.css';
import Navbar from '../componets/navbar';
import { useState } from 'react';
import { storage, db } from '../firebaseconfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';

const Administrador = () => {
    const [nombreJuego, setNombreJuego] = useState('');
    const [logo, setLogo] = useState(null);
    const [fondo, setFondo] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!nombreJuego || !logo || !fondo) {
            Swal.fire('Error', 'Por favor completa todos los campos', 'error');
            return;
        }

        setUploading(true);

        try {
            // Limpia el nombre del juego para usarlo en las rutas
            const cleanName = nombreJuego.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
            const timestamp = Date.now();

            // Referencias con nombres más limpios
            const logoRef = ref(storage, `logos/${cleanName}_${timestamp}`);
            const fondoRef = ref(storage, `fondos/${cleanName}_${timestamp}`);

            // Sube los archivos como tareas separadas
            const uploadLogo = uploadBytesResumable(logoRef, logo);
            const uploadFondo = uploadBytesResumable(fondoRef, fondo);

            // Espera a que ambas cargas terminen
            const [logoSnapshot, fondoSnapshot] = await Promise.all([uploadLogo, uploadFondo]);

            // Obtiene las URLs de descarga
            const [logoURL, fondoURL] = await Promise.all([
                getDownloadURL(logoSnapshot.ref),
                getDownloadURL(fondoSnapshot.ref)
            ]);

            // Guarda en Firestore
            await addDoc(collection(db, 'juegos'), {
                nombre: nombreJuego,
                logoURL,
                fondoURL,
                createdAt: serverTimestamp()
            });

            Swal.fire('¡Éxito!', 'Juego registrado correctamente', 'success');
            setNombreJuego('');
            setLogo(null);
            setFondo(null);
        } catch (error) {
            console.error('Error detallado:', error);
            
            let errorMessage = 'Error al subir el juego';
            if (error.code === 'storage/unauthorized') {
                errorMessage = 'No tienes permisos para subir archivos';
            } else if (error.code === 'storage/canceled') {
                errorMessage = 'La subida fue cancelada';
            } else if (error.code === 'storage/unknown') {
                errorMessage = 'Error desconocido del almacenamiento';
            }

            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className='body-admin'>
            <Navbar />
            <div className='admin-container'>
                <h2 className='admin-title'>Panel del Administrador</h2>

                <form onSubmit={handleSubmit} className='admin-form-container'>
                    <div className='admin-form-group'>
                        <label>Nombre del Juego</label>
                        <input 
                            type='text' 
                            placeholder='Ej: Hollow Knight' 
                            value={nombreJuego} 
                            onChange={e => setNombreJuego(e.target.value)}
                            required
                        />
                    </div>

                    <div className='admin-form-group'>
                        <label>Logo del Juego (PNG/JPG)</label>
                        <input 
                            type='file' 
                            accept='image/png, image/jpeg'
                            onChange={e => e.target.files[0] && setLogo(e.target.files[0])}
                            required
                        />
                        {logo && <p className='file-info'>{logo.name}</p>}
                    </div>

                    <div className='admin-form-group'>
                        <label>Fondo del Juego (PNG/JPG)</label>
                        <input 
                            type='file' 
                            accept='image/png, image/jpeg'
                            onChange={e => e.target.files[0] && setFondo(e.target.files[0])}
                            required
                        />
                        {fondo && <p className='file-info'>{fondo.name}</p>}
                    </div>

                    <button 
                        type='submit' 
                        className='admin-btn'
                        disabled={uploading}
                    >
                        {uploading ? 'Subiendo...' : 'Guardar Juego'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Administrador;