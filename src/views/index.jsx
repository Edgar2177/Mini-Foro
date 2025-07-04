import Navbar from '../componets/navbar';
import Carrusel from '../componets/carrusel';
import './index.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig';

const Index = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    // Función para obtener los juegos de Firebase
    const fetchGames = async () => {
        try {
            const gamesCollection = collection(db, 'juegos');
            const gamesSnapshot = await getDocs(gamesCollection);
            const gamesList = gamesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGames(gamesList);
        } catch (error) {
            console.error("Error fetching games: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    return (
        <div className="home-page">
            <Navbar />
            
            <section className="hero-section">
                <Carrusel/>
            </section>

            <section className="games-section">
                <div className="container">
                    <h2 className="section-title">Juegos Disponibles</h2>
                    
                    {loading ? (
                        <div className="loading-games">
                            <div className="spinner"></div>
                            <p>Cargando juegos...</p>
                        </div>
                    ) : games.length > 0 ? (
                        <div className="games-grid">
                            {games.map(game => (
                                <div className="game-card" key={game.id}>
                                    <div className="game-banner">
                                        <img 
                                            src={game.bannerURL || game.fondoURL || 'https://via.placeholder.com/300x169?text=No+Image'} 
                                            alt={game.nombre} 
                                            className="game-image" 
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/300x169?text=No+Image'}
                                        />
                                        <div className="banner-overlay">
                                            <h3>{game.nombre}</h3>
                                        </div>
                                    </div>
                                    <Link to={`/forogame/${game.id}`} className="game-button">
                                        Ver Foro
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-games">
                            <p>No se encontraron juegos</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="community-section">
                <div className="container">
                    <h2 className="section-title">Únete a la Comunidad</h2>
                    <div className="community-content">
                        <div className="community-text">
                            <p>Conéctate con otros jugadores, comparte tus experiencias y descubre nuevos amigos con tus mismos intereses.</p>
                            <Link to="/register" className="cta-button">Regístrate Ahora</Link>
                        </div>
                        <div className="community-image">
                            <img src="https://cdn.pixabay.com/photo/2021/09/07/07/11/game-console-6603118_640.jpg" alt="Comunidad de jugadores" />
                        </div>
                    </div>
                </div>
            </section>

            <footer className="page-footer">
                <div className="container">
                    <p>© {new Date().getFullYear()} Mini-Foro Gaming. Todos los derechos reservados.</p>
                    <div className="footer-links">
                        <Link to="/terminos">Términos de Servicio</Link>
                        <Link to="/privacidad">Política de Privacidad</Link>
                        <Link to="/contacto">Contacto</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;