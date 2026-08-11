import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiClient';
import { slugify } from '../utils/categoryMap';
import { useSiteConfig } from '../context/SiteConfigContext';

const CategoryShowcase = () => {
    const [categories, setCategories] = useState([]);
    const { config } = useSiteConfig();

    useEffect(() => {
        const loadCategoryCards = async () => {
            try {
                const [categoriesRes, productsRes] = await Promise.all([
                    apiFetch(`${import.meta.env.VITE_API_URL}/api/categories`),
                    apiFetch(`${import.meta.env.VITE_API_URL}/api/products`),
                ]);

                const categoryRows = Array.isArray(categoriesRes) ? categoriesRes : [];
                const allProducts = Array.isArray(productsRes)
                    ? productsRes
                    : Array.isArray(productsRes?.products)
                        ? productsRes.products
                        : [];

                const cards = categoryRows
                    .map((cat) => {
                        const catName = String(cat?.name || '').trim();
                        if (!catName) return null;

                        const productsInCategory = allProducts.filter(
                            (p) => String(p?.category || '').toLowerCase() === catName.toLowerCase()
                        );

                        const coverImage = productsInCategory.find(
                            (p) => Array.isArray(p.images) && p.images.length > 0 && p.images[0]
                        )?.images?.[0] || '/placeholder-product.svg';

                        return {
                            name: catName,
                            slug: slugify(catName),
                            image: coverImage,
                            countLabel: productsInCategory.length > 0 ? 'Explore' : 'View',
                            detail: `${productsInCategory.length} products`,
                            productCount: productsInCategory.length,
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.productCount - a.productCount);

                const preferredNames = Array.isArray(config?.homeShowcaseCategories)
                    ? config.homeShowcaseCategories.map((n) => String(n || '').trim().toLowerCase()).filter(Boolean)
                    : [];

                let nextCards = cards;
                if (preferredNames.length > 0) {
                    const byName = new Map(cards.map((c) => [c.name.toLowerCase(), c]));
                    const preferred = preferredNames
                        .map((name) => byName.get(name))
                        .filter(Boolean);
                    const remainder = cards.filter(
                        (card) => !preferredNames.includes(card.name.toLowerCase())
                    );
                    nextCards = [...preferred, ...remainder];
                }

                nextCards = nextCards.slice(0, 4);

                setCategories(nextCards);
            } catch (error) {
                console.error('Failed to load dynamic category showcase:', error);
                setCategories([]);
            }
        };

        loadCategoryCards();
    }, [config]);

    if (categories.length === 0) {
        return null;
    }

    return (
        <section className="category-showcase container">
            <div className="section-header">
                <div className="title-area">
                    <span className="subtitle">EXPLORE</span>
                    <h2 className="main-title">Top Categories</h2>
                </div>
                <Link to="/search" className="view-all">
                    View All <ChevronRight size={16} />
                </Link>
            </div>

            <div className="category-grid">
                {categories.map((cat, index) => (
                    <motion.div
                        key={cat.slug || index}
                        className="category-card"
                        whileHover={{ y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link to={`/category/${cat.slug}`}>
                            <div className="cat-image-wrapper">
                                <img src={cat.image} alt={cat.name} />
                                <div className="item-count">{cat.countLabel}</div>
                            </div>
                            <div className="cat-info">
                                <h3>{cat.name}</h3>
                                <p>{cat.detail}</p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default CategoryShowcase;
