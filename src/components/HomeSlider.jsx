import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';

const defaultSlides = [
    {
        id: 1,
        title: "The Future of Gaming",
        subtitle: "Experience ultra-fast performance with the new PS5 and Xbox Series X.",
        image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=2070&auto=format&fit=crop",
        cta: "Explore Gaming",
        link: "/category/Gaming",
        color: "#E1261C"
    },
    {
        id: 2,
        title: "Elegance in Every Pixel",
        subtitle: "Discover the stunning Retina display on the latest MacBook Pro.",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1926&auto=format&fit=crop",
        cta: "Shop Laptops",
        link: "/category/Computers & Laptops",
        color: "#1a1a1a"
    },
    {
        id: 3,
        title: "Sound Without Limits",
        subtitle: "Immerse yourself in crystal clear audio with noise-canceling technology.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
        cta: "View Collection",
        link: "/category/Audio & Headphones",
        color: "#4a90e2"
    }
];

const HomeSlider = () => {
    const [current, setCurrent] = useState(0);
    const { config } = useSiteConfig();
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const activeSlidesFromConfig = Array.isArray(config?.heroSlides)
        ? config.heroSlides.filter((s) => s && s.active !== false && s.title && s.image)
        : [];

    const slides = activeSlidesFromConfig.length > 0 ? activeSlidesFromConfig : defaultSlides;

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
                        <motion.div
                            className="slide-content"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <motion.span
                                className="slide-badge"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Limited Edition
                            </motion.span>
                            <h1>{slides[current].title}</h1>
                            <p>{slides[current].subtitle}</p>
                            <div className="slide-actions">
                                <Link to={slides[current].link} className="btn-primary slider-btn">
                                    {slides[current].cta}
                                </Link>
                                <Link to="/search" className="slider-text-link slider-btn-secondary-desktop">
                                    Learn more <ChevronRight size={14} />
                                </Link>
                            </div>
                        </motion.div>
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
