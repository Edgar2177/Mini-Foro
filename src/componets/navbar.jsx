import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseconfig';
import './navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const menu = document.querySelector('#menu-icon');
    const navlist = document.querySelector('.nav-list');

    const toggleMenu = () => {
      menu.classList.toggle('bx-x');
      navlist.classList.toggle('open');
    };

    if (menu) {
      menu.addEventListener('click', toggleMenu);
    }

    return () => {
      if (menu) {
        menu.removeEventListener('click', toggleMenu);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return(
    <div className='nav-body'>
      <header>
        <Link to="/" className='Logo'><img src="/logo.webp" alt="" />Mini-Foro</Link>
        <ul className='nav-list'>
          {user && (
            <li className='list-item'><Link className='list-link' to='/perfil'>Cuenta</Link></li>
          )}
          <li className='list-item'><Link className='list-link' to="/listagames">Juegos</Link></li>
        </ul>
        <div className='nav-responsive'>
          {user ? (
            <button className='btn' onClick={handleLogout}>Cerrar Sesión</button>
          ) : (
            <Link className='btn' to="/login">Iniciar Sesión</Link>
          )}
          <div className='bx bx-menu' id="menu-icon"></div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
