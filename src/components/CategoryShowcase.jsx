import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiClient';

const CURATED_TOP_CATEGORY_CARDS = [
    {
        key: 'iphone-cases',
        name: 'iPhone Cases',
        path: '/category/iphone-cases',
        terms: ['iphone case', 'iphone cases', 'iphone'],
    },
    {
        key: 'soundcore',
        name: 'Soundcore',
        path: '/search?q=soundcore',
        terms: ['soundcore'],
    },
    {
        key: 'anker',
        name: 'Anker',
        path: '/search?q=anker',
        terms: ['anker'],
    },
];

const buildProductHaystack = (product) => {
    const name = String(product?.name || '').toLowerCase();
    const category = String(product?.category || '').toLowerCase();
    const subCategory = String(product?.subCategory || '').toLowerCase();
    const brand = String(product?.brand || '').toLowerCase();
    const tags = Array.isArray(product?.categories)
        ? product.categories.map((c) => String(c || '').toLowerCase()).join(' ')
        : '';

    return `${name} ${category} ${subCategory} ${brand} ${tags}`;
};

const productMatchesTerms = (product, terms = []) => {
    if (!terms.length) return false;
    const haystack = buildProductHaystack(product);
    return terms.some((term) => haystack.includes(String(term || '').toLowerCase()));
};

const CategoryShowcase = ({ products = null }) => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadCategoryCards = async () => {
            try {
                let allProducts = Array.isArray(products) ? products : [];

                if (allProducts.length === 0) {
                    const productsRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products?page=1&pageSize=60&sort=newest&isActive=true`);
                    allProducts = Array.isArray(productsRes?.products)
                        ? productsRes.products
                        : [];
                }

                const nextCards = CURATED_TOP_CATEGORY_CARDS.map((card) => {
                    const matchingProducts = allProducts.filter((p) => productMatchesTerms(p, card.terms));
                    const coverImage = matchingProducts.find(
                        (p) => Array.isArray(p.images) && p.images.length > 0 && p.images[0]
                    )?.images?.[0] || '/placeholder-product.svg';
                    const count = matchingProducts.length;

                    return {
                        key: card.key,
                        name: card.name,
                        path: card.path,
                        image: coverImage,
                        countLabel: count > 0 ? 'Explore' : 'View',
                        detail: `${count} product${count === 1 ? '' : 's'}`,
                    };
                });

                setCategories(nextCards);
            } catch (error) {
                console.error('Failed to load dynamic category showcase:', error);
                setCategories([]);
            }
        };

        loadCategoryCards();
    }, [products]);

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
                        key={cat.key || index}
                        className="category-card"
                        whileHover={{ y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Link to={cat.path}>
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
