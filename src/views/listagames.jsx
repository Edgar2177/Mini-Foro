import './listagames.css';
import Navbar from '../componets/navbar';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { Link } from 'react-router-dom';  // Importa Link para la navegación

const Listagames = () => {
  const [busqueda, setBusqueda] = useState('');
  const [juegos, setJuegos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerJuegos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'juegos'));
        const juegosData = querySnapshot.docs.map(doc => ({
          id: doc.id,  // Guarda el ID del documento
          ...doc.data() // Guarda los demás datos del juego
        }));
        setJuegos(juegosData);  // Actualiza el estado de juegos con los datos obtenidos
      } catch (error) {
        console.error('Error al obtener juegos:', error);
      } finally {
        setLoading(false);  // Deja de mostrar el estado de "Cargando juegos..."
      }
    };

    obtenerJuegos();  // Llama a la función para obtener los juegos al montar el componente
  }, []);  // Se ejecuta solo una vez al cargar el componente

  // Filtra los juegos basándose en la búsqueda
  const juegosFiltrados = juegos.filter(juego =>
    juego.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className='games-body'>
      <Navbar />
      <section className='games-container'>
        <h2>Discute en el juego de tu preferencia</h2>
        
        {/* Campo de búsqueda de juegos */}
        <div className='buscador-games'>
          <input
            type="text"
            placeholder='Buscar Juego'
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}  // Actualiza el estado de búsqueda
          />
        </div>

        <div className='games-content'>
          {loading ? (
            <p className="no-result">Cargando juegos...</p>  // Muestra este mensaje mientras cargan los juegos
          ) : juegosFiltrados.length > 0 ? (
            juegosFiltrados.map(juego => (
              // Enlaza cada juego a la página Forogame pasando el id del juego
              <Link to={`/forogame/${juego.id}`} state={{ juego }} key={juego.id} className="juego-card">
                <img src={juego.logoURL} alt={juego.nombre} />
                <p>{juego.nombre}</p>
              </Link>
            ))
          ) : (
            <p className="no-result">No se encontraron juegos.</p>  // Muestra este mensaje si no se encuentra ningún juego
          )}
        </div>
      </section>
    </div>
  );
};

export default Listagames;
