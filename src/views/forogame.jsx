import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../componets/Navbar';
import './forogame.css';
import { 
  doc, getDoc, collection, addDoc, query, where, getDocs, 
  serverTimestamp, orderBy, onSnapshot, updateDoc, increment
} from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../auth/authContext';

const Forogame = () => {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('discussions');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [showUploadArtwork, setShowUploadArtwork] = useState(false);
  
  // Estados de formularios
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [artworkTitle, setArtworkTitle] = useState('');
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkDescription, setArtworkDescription] = useState('');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Estados para modal de artwork
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [artworkComments, setArtworkComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Hooks y servicios
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const storage = getStorage();

  // Obtener datos del juego
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        if (location.state?.juego) {
          setGameData(location.state.juego);
        } else {
          const docRef = doc(db, 'juegos', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setGameData({ id: docSnap.id, ...docSnap.data() });
          }
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id, location.state]);

  // Obtener discusiones en tiempo real
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'discussions'),
      where('gameId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const newDiscussions = [];
      const authorIds = new Set();
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        authorIds.add(data.author);
      });

      const authors = {};
      await Promise.all(
        Array.from(authorIds).map(async userId => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            authors[userId] = userDoc.data();
          }
        })
      );

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        
        newDiscussions.push({
          id: doc.id,
          ...data,
          createdAt,
          authorData: authors[data.author] || { username: 'Anónimo', avatar: '' }
        });
      });

      setDiscussions(newDiscussions);
      setTotalItems(querySnapshot.size);
      setAuthorsData(prev => ({ ...prev, ...authors }));
    });

    return () => unsubscribe();
  }, [id]);

  // Obtener artworks en tiempo real
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'artworks'),
      where('gameId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newArtworks = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        
        newArtworks.push({
          id: doc.id,
          ...data,
          createdAt,
          authorData: authorsData[data.author] || { username: 'Anónimo', avatar: '' }
        });
      });

      if (activeTab === 'artwork') {
        setArtworks(newArtworks);
        setTotalItems(querySnapshot.size);
      }
    });

    return () => unsubscribe();
  }, [id, activeTab, authorsData]);

  // Función para paginación
  const getPaginatedItems = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Abrir modal de artwork
  const openArtworkModal = async (artwork) => {
    setSelectedArtwork(artwork);
    setLoading(true);
    
    try {
      const q = query(
        collection(db, 'artworkComments'),
        where('artworkId', '==', artwork.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const comments = [];
      const authorIds = new Set();
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        });
        authorIds.add(data.author);
      });
      
      const authors = {};
      await Promise.all(
        Array.from(authorIds).map(async userId => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            authors[userId] = userDoc.data();
          }
        })
      );
      
      const commentsWithAuthors = comments.map(comment => ({
        ...comment,
        authorData: authors[comment.author] || { username: 'Anónimo', avatar: '' }
      }));
      
      setArtworkComments(commentsWithAuthors);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Agregar comentario
  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !selectedArtwork) return;

    try {
      const comment = {
        artworkId: selectedArtwork.id,
        content: newComment,
        author: user.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'artworkComments'), comment);
      setNewComment('');
      
      await updateDoc(doc(db, 'artworks', selectedArtwork.id), {
        commentsCount: increment(1)
      });
      
      openArtworkModal(selectedArtwork);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Manejar creación de discusión
  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const newDiscussion = {
        gameId: id,
        title: discussionTitle,
        content: discussionContent,
        author: user.uid,
        createdAt: serverTimestamp(),
        replies: 0,
        views: 0,
        pinned: false
      };

      await addDoc(collection(db, 'discussions'), newDiscussion);
      
      setShowNewDiscussion(false);
      setDiscussionTitle('');
      setDiscussionContent('');
    } catch (error) {
      console.error("Error creating discussion:", error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar subida de artwork
  const handleUploadArtwork = async (e) => {
    e.preventDefault();
    if (!user || !artworkFile) {
      if (!user) navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const fileId = uuidv4();
      const storageRef = ref(storage, `artworks/${user.uid}/${fileId}`);
      await uploadBytes(storageRef, artworkFile);
      const downloadURL = await getDownloadURL(storageRef);

      const newArtwork = {
        gameId: id,
        title: artworkTitle,
        imageURL: downloadURL,
        description: artworkDescription,
        author: user.uid,
        createdAt: serverTimestamp(),
        likes: 0,
        commentsCount: 0
      };

      await addDoc(collection(db, 'artworks'), newArtwork);
      
      setShowUploadArtwork(false);
      setArtworkTitle('');
      setArtworkFile(null);
      setArtworkDescription('');
    } catch (error) {
      console.error("Error uploading artwork:", error);
    } finally {
      setLoading(false);
    }
  };

  // Componente de paginación
  const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
      <div className="pagination">
        {currentPage > 1 && (
          <button onClick={() => onPageChange(currentPage - 1)}>Anterior</button>
        )}
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={currentPage === page ? 'active' : ''}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        
        {currentPage < totalPages && (
          <button onClick={() => onPageChange(currentPage + 1)}>Siguiente</button>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="forum-app">
      <Navbar />
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando contenido...</p>
      </div>
    </div>
  );

  if (!gameData) return (
    <div className="forum-app">
      <Navbar />
      <div className="error-screen">
        <p>No se pudo cargar la información del juego</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    </div>
  );

  return (
    <div className="forum-app">
      <Navbar />

      <div className="game-banner">
        <img 
          src={gameData.bannerURL || gameData.fondoURL || '/default-banner.jpg'} 
          alt={`Banner ${gameData.nombre}`} 
          onError={(e) => e.target.src = '/default-banner.jpg'}
        />
        <div className="banner-overlay">
          <h1>{gameData.nombre}</h1>
        </div>
      </div>

      <div className="forum-container">
        <aside className="forum-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Explorar</h3>
            <nav className="sidebar-nav">
              <button 
                className={`sidebar-link ${activeTab === 'discussions' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('discussions');
                  setCurrentPage(1);
                }}
              >
                <span>💬</span> Discusiones
              </button>
              <button 
                className={`sidebar-link ${activeTab === 'artwork' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('artwork');
                  setCurrentPage(1);
                }}
              >
                <span>🎨</span> Artwork
              </button>
            </nav>
          </div>
        </aside>

        <main className="forum-main">
          <div className="action-buttons">
            {activeTab === 'discussions' && user && (
              <button 
                className="action-button"
                onClick={() => setShowNewDiscussion(true)}
              >
                <span>+</span> Nueva Discusión
              </button>
            )}
            
            {activeTab === 'artwork' && user && (
              <button 
                className="action-button"
                onClick={() => setShowUploadArtwork(true)}
              >
                <span>+</span> Subir Artwork
              </button>
            )}
          </div>

          {activeTab === 'discussions' ? (
            <>
              <div className="threads-list">
  {getPaginatedItems(discussions).length > 0 ? (
    getPaginatedItems(discussions).map(discussion => (
      <div 
        key={discussion.id} 
        className="thread-card"
        onClick={() => navigate(`/game/${discussion.id}`)} // Navegar a la página de la discusión
      >
              <div className="thread-author">
                <div className="author-avatar">
                  {discussion.authorData?.avatar ? (
                  <img src={discussion.authorData.avatar} alt={discussion.authorData.username} />
                  ) : (
                  <span>{discussion.authorData?.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="author-name">{discussion.authorData?.username}</span>
              </div>
                <div className="thread-content">
                  <h3 className="thread-title">{discussion.title}</h3>
                  <p>{discussion.content}</p>
                    <div className="thread-meta">
                      <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                      <span>{discussion.views} vistas</span>
                      <span>{discussion.replies} respuestas</span>
                    </div>
                  </div>
                </div>
                ))
                ) : (
                <div className="empty-state">
                  <p>No hay discusiones aún. ¡Sé el primero en crear una!</p>
                </div>
                )}
              </div>
              {discussions.length > itemsPerPage && (
                <Pagination
                  totalItems={discussions.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <>
              <div className="artwork-grid">
                {getPaginatedItems(artworks).length > 0 ? (
                  getPaginatedItems(artworks).map(artwork => (
                    <div key={artwork.id} className="artwork-card">
                      <div className="artwork-image-container" onClick={() => openArtworkModal(artwork)}>
                        <img src={artwork.imageURL} alt={artwork.title} className="artwork-image" />
                      </div>
                      <div className="artwork-info">
                        <h4 className="artwork-title">{artwork.title}</h4>
                        <p className="artwork-description">{artwork.description}</p>
                        <div className="artwork-meta">
                          <span>Por: {artwork.authorData?.username}</span>
                          <span>{new Date(artwork.createdAt).toLocaleDateString()}</span>
                          <span>{artwork.likes} likes</span>
                          <span>{artwork.commentsCount || 0} comentarios</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No hay artworks aún. ¡Sube el primero!</p>
                  </div>
                )}
              </div>
              {artworks.length > itemsPerPage && (
                <Pagination
                  totalItems={artworks.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Nueva Discusión */}
      {showNewDiscussion && (
        <div className="modal-overlay" onClick={() => setShowNewDiscussion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-modal" 
              onClick={() => setShowNewDiscussion(false)}
            >
              &times;
            </button>
            <h2>Crear Nueva Discusión</h2>
            <form onSubmit={handleCreateDiscussion}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Título de la discusión"
                  value={discussionTitle}
                  onChange={(e) => setDiscussionTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contenido</label>
                <textarea
                  placeholder="Describe tu discusión..."
                  value={discussionContent}
                  onChange={(e) => setDiscussionContent(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowNewDiscussion(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="submit-btn">
                  Crear Discusión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Subir Artwork */}
      {showUploadArtwork && (
        <div className="modal-overlay" onClick={() => setShowUploadArtwork(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-modal" 
              onClick={() => setShowUploadArtwork(false)}
            >
              &times;
            </button>
            <h2>Subir Artwork</h2>
            <form onSubmit={handleUploadArtwork}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Título del artwork"
                  value={artworkTitle}
                  onChange={(e) => setArtworkTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArtworkFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  placeholder="Descripción del artwork..."
                  value={artworkDescription}
                  onChange={(e) => setArtworkDescription(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowUploadArtwork(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="submit-btn">
                  Subir Artwork
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Artwork */}
      {selectedArtwork && (
        <div className="artwork-modal-overlay" onClick={() => setSelectedArtwork(null)}>
          <div className="artwork-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedArtwork(null)}>
              &times;
            </button>
            
            <div className="artwork-modal-main">
              <div className="artwork-modal-image">
                <img src={selectedArtwork.imageURL} alt={selectedArtwork.title} />
              </div>
              
              <div className="artwork-modal-info">
                <h2>{selectedArtwork.title}</h2>
                <p className="artwork-description">{selectedArtwork.description}</p>
                
                <div className="artwork-author">
                  <div className="author-avatar">
                    {selectedArtwork.authorData?.avatar ? (
                      <img src={selectedArtwork.authorData.avatar} alt={selectedArtwork.authorData.username} />
                    ) : (
                      <span>{selectedArtwork.authorData?.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span>Publicado por {selectedArtwork.authorData?.username}</span>
                </div>
              </div>
            </div>
            
            <div className="artwork-comments-section">
              <h3>Comentarios ({artworkComments.length})</h3>
              
              {user && (
                <div className="add-comment">
                  <textarea
                    placeholder="Añadir un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button onClick={handleAddComment}>Comentar</button>
                </div>
              )}
              
              <div className="comments-list">
                {artworkComments.length > 0 ? (
                  artworkComments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-author">
                        <div className="author-avatar">
                          {comment.authorData?.avatar ? (
                            <img src={comment.authorData.avatar} alt={comment.authorData.username} />
                          ) : (
                            <span>{comment.authorData?.username?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="author-name">{comment.authorData?.username}</span>
                      </div>
                      <div className="comment-content">
                        <p>{comment.content}</p>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No hay comentarios aún</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forogame;