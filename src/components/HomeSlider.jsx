import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultSlides = [
    {
        id: 1,
        eyebrow: 'ANKER POWER',
        title: 'Charge Faster, Go Further',
        subtitle: 'Discover trusted Anker chargers, cables and power banks for work, travel and daily use.',
        cta: 'Shop Anker',
        link: '/search?q=anker',
    },
    {
        id: 2,
        eyebrow: 'SOUNDCORE AUDIO',
        title: 'Sound That Moves With You',
        subtitle: 'Explore Soundcore earbuds and headphones with premium comfort and long battery life.',
        cta: 'Shop Soundcore',
        link: '/search?q=soundcore',
    },
    {
        id: 3,
        eyebrow: 'TECH ESSENTIALS',
        title: 'Premium Electronics, Delivered Fast',
        subtitle: 'From audio to charging gear, shop curated electronics with dependable support across Kenya.',
        cta: 'Shop Tech',
        link: '/search',
    },
];

const HOME_SLIDE_IMAGES = [
    '/home-banner-2026-08-11.png',
    '/home-banner-2026-08-11-slide-2.png',
    '/home-banner-2026-08-11-slide-3.png',
];

const HomeSlider = () => {
    const [current, setCurrent] = useState(0);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const slides = defaultSlides.map((slide, index) => ({
        ...slide,
        image: HOME_SLIDE_IMAGES[index] || HOME_SLIDE_IMAGES[HOME_SLIDE_IMAGES.length - 1],
    }));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    // Touch handlers for swipe support
    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <div
            className="home-slider"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    className="slide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${slides[current].image})` }}
                >
                    <div className="container slide-content-wrapper">
                        <div className="slide-content">
                            <span className="slide-badge">{slides[current].eyebrow}</span>
                            <h1>{slides[current].title}</h1>
                            <p>{slides[current].subtitle}</p>
                            <div className="slide-actions">
                                <Link to={slides[current].link} className="btn btn-primary slider-btn">
                                    {slides[current].cta}
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="slider-controls">
                <button onClick={prevSlide} className="control-btn"><ChevronLeft size={24} /></button>
                <button onClick={nextSlide} className="control-btn"><ChevronRight size={24} /></button>
            </div>

            <div className="slider-dots">
                {slides.map((_, index) => (
                    <div
                        key={index}
                        className={`dot ${index === current ? 'active' : ''}`}
                        onClick={() => setCurrent(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomeSlider;
