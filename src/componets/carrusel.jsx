import './carrusel.css';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Carrusel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const autoSlideInterval = useRef(null);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);
    const carouselRef = useRef(null);
    const isTransitioning = useRef(false);

    const slideItems = [
        {
            imgSrc: '/imagenes/carruselImg.webp',
            title: 'Bienvenido a Mini-Foro',
            description: 'Pásalo en grande, crea tus discusiones en el foro de tu videojuego favorito.',
            showButton: false
        },
        {
            imgSrc: 'https://i.redd.it/5f9oitros35e1.png',
            title: 'Foros de tus juegos favoritos',
            description: 'Únete a la comunidad de tus juegos preferidos y comparte tus experiencias.',
        },
        {
            imgSrc: 'https://es.gamewallpapers.com/img_script/wallpaper_dir/img.php?src=wallpaper_clair_obscur_expedition_33_06_2560x1080.jpg&height=506&sharpen',
            title: 'Crea nuevas discusiones',
            description: 'Inicia conversaciones sobre los temas que más te interesan.',
        }
    ];

    useEffect(() => {
        startAutoSlide();
        return () => clearInterval(autoSlideInterval.current);
    }, []);

    const startAutoSlide = () => {
        autoSlideInterval.current = setInterval(() => {
            if (!isTransitioning.current) {
                goToNext();
            }
        }, 6000);
    };

    const resetAutoSlide = () => {
        clearInterval(autoSlideInterval.current);
        startAutoSlide();
    };

    const goToPrevious = () => {
        if (isTransitioning.current) return;
        isTransitioning.current = true;
        setCurrentIndex(prev => (prev - 1 + slideItems.length) % slideItems.length);
        setTimeout(() => { isTransitioning.current = false; }, 500);
        resetAutoSlide();
    };

    const goToNext = () => {
        if (isTransitioning.current) return;
        isTransitioning.current = true;
        setCurrentIndex(prev => (prev + 1) % slideItems.length);
        setTimeout(() => { isTransitioning.current = false; }, 500);
        resetAutoSlide();
    };

    const goToSlide = (index) => {
        if (isTransitioning.current || index === currentIndex) return;
        isTransitioning.current = true;
        setCurrentIndex(index);
        setTimeout(() => { isTransitioning.current = false; }, 500);
        resetAutoSlide();
    };

    const handleTouchStart = (e) => {
        setTouchStartX(e.changedTouches[0].screenX);
    };

    const handleTouchEnd = (e) => {
        setTouchEndX(e.changedTouches[0].screenX);
        handleSwipe();
    };

    const handleSwipe = () => {
        const difference = touchStartX - touchEndX;
        if (difference > 50) {
            goToNext();
        } else if (difference < -50) {
            goToPrevious();
        }
    };

    return (
        <div className='carrusel-wrapper'>
            <div 
                className='carrusel-container'
                ref={carouselRef}
                onMouseEnter={() => clearInterval(autoSlideInterval.current)}
                onMouseLeave={startAutoSlide}
            >
                <div 
                    className='carrusel-transicion'
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {slideItems.map((item, index) => (
                        <div className='carrusel-slide' key={index}>
                            <img src={item.imgSrc} alt={item.title} className="slide-image" />
                            <div className='slide-content'>
                                <h2>{item.title}</h2>
                                <p>{item.description}</p>
                                {item.showButton && (
                                    <Link to="/foros" className='slide-button'>
                                        Explorar foros
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button className='carousel-control prev' onClick={goToPrevious} aria-label="Slide anterior">
                    &#10094;
                </button>
                <button className='carousel-control next' onClick={goToNext} aria-label="Slide siguiente">
                    &#10095;
                </button>

                <div className='carousel-indicators'>
                    {slideItems.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Ir al slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Carrusel;