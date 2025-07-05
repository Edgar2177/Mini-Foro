import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  doc, getDoc, collection, addDoc, query, 
  where, orderBy, onSnapshot, serverTimestamp,
  updateDoc, increment
} from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { useAuth } from '../auth/authContext';
import Navbar from '../componets/navbar';
import './game.css';

const ForumDiscussion = () => {
    const [reply, setReply] = useState('');
    const [discussion, setDiscussion] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({}); // Cambiado de userAvatars a userData
    
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Obtener discusión y respuestas
    useEffect(() => {
        const fetchDiscussion = async () => {
            try {
                setLoading(true);
                
                // Obtener datos de location.state o de Firestore
                if (location.state?.discussion) {
                    setDiscussion(location.state.discussion);
                } else {
                    const docRef = doc(db, 'discussions', id);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setDiscussion({
                            id: docSnap.id,
                            title: data.title,
                            content: data.content,
                            author: data.author,
                            createdAt: data.createdAt?.toDate() || new Date(),
                            gameId: data.gameId,
                            replies: data.replies || 0
                        });
                    } else {
                        navigate('/not-found');
                        return;
                    }
                }

                // Obtener respuestas en tiempo real
                const q = query(
                    collection(db, 'replies'),
                    where('discussionId', '==', id),
                    orderBy('createdAt', 'asc')
                );

                const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                    const repliesData = [];
                    const userIds = new Set([discussion?.author]); // Incluye al autor de la discusión
                    
                    // Recolectar IDs de usuarios
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        repliesData.push({
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate() || new Date()
                        });
                        userIds.add(data.author);
                    });

                    // Obtener datos completos de usuarios
                    const usersData = {};
                    await Promise.all([...userIds].map(async (userId) => {
                        const userDoc = await getDoc(doc(db, 'users', userId));
                        if (userDoc.exists()) {
                            usersData[userId] = {
                                avatar: userDoc.data().photoURL || userDoc.data().avatar || '',
                                username: userDoc.data().displayName || userDoc.data().username || 'Usuario'
                            };
                        }
                    }));

                    setUserData(usersData);
                    setReplies(repliesData);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching discussion:", error);
                navigate('/error');
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussion();
    }, [id, location.state, navigate, discussion?.author]); // Añadido discussion?.author a las dependencias

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reply.trim() || !user) return;

        try {
            // Agregar respuesta a Firestore
            await addDoc(collection(db, 'replies'), {
                discussionId: id,
                content: reply,
                author: user.uid,
                createdAt: serverTimestamp()
            });

            // Actualizar contador de respuestas
            await updateDoc(doc(db, 'discussions', id), {
                replies: increment(1)
            });

            setReply('');
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Hace unos segundos';
        if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} minutos`;
        if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
        
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const renderUserAvatar = (userId) => {
        const user = userData[userId];
        if (user?.avatar) {
            return <img src={user.avatar} alt={`Avatar de ${user.username}`} className="user-avatar" />;
        }
        // Si no hay avatar, muestra las iniciales
        const username = user?.username || 'U';
        return <div className="user-avatar-default">{username.charAt(0).toUpperCase()}</div>;
    };

    const renderUsername = (userId) => {
        return userData[userId]?.username || 'Usuario';
    };

    if (loading) {
        return (
            <div className="game-page">
                <Navbar />
                <div className="loading">Cargando discusión...</div>
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="game-page">
                <Navbar />
                <div className="error">No se pudo cargar la discusión</div>
            </div>
        );
    }

    return (
        <div className="game-page">
            <Navbar />
            
            <div className="game-container">
                <div className="left-panel">
                    {/* Discusión principal */}
                    <div className="main-discussion">
                        <div className="discussion-header">
                            <div className="user-avatar">
                                {renderUserAvatar(discussion.author)}
                            </div>
                            <div className="discussion-info">
                                <h2>{discussion.title}</h2>
                                <div className="discussion-meta">
                                    <span className="author">{renderUsername(discussion.author)}</span>
                                    <span className="time">{formatDate(discussion.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="discussion-content">
                            <p>{discussion.content}</p>
                        </div>
                    </div>

                    {/* Respuestas */}
                    <div className="replies-section">
                        <h3>Respuestas ({replies.length})</h3>
                        {replies.length > 0 ? (
                            replies.map((reply) => (
                                <div key={reply.id} className="reply">
                                    <div className="reply-avatar">
                                        {renderUserAvatar(reply.author)}
                                    </div>
                                    <div className="reply-content">
                                        <div className="reply-author">{renderUsername(reply.author)}</div>
                                        <div className="reply-text">{reply.content}</div>
                                        <div className="reply-time">{formatDate(reply.createdAt)}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No hay respuestas todavía. ¡Sé el primero en comentar!</div>
                        )}
                    </div>
                </div>

                <div className="right-panel">
                    {/* Formulario de respuesta */}
                    {user ? (
                        <form className="reply-form" onSubmit={handleSubmit}>
                            <h3>Responder</h3>
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Escribe tu respuesta aquí..."
                                required
                            />
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    Publicar respuesta
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="login-prompt">
                            <p>Debes <button onClick={() => navigate('/login')}>iniciar sesión</button> para responder.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForumDiscussion;