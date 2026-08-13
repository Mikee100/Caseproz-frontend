import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiClient';
import { useSiteConfig } from '../context/SiteConfigContext';

const DEFAULT_TOP_CATEGORIES = ['iPhone Cases', 'Anker'];

const PRESET_CATEGORY_DEFINITIONS = {
    iphonecases: {
        path: '/category/iphone-cases',
        terms: ['iphone case', 'iphone cases', 'iphone'],
    },
    soundcore: {
        path: '/search?q=soundcore',
        terms: ['soundcore', 'sound core'],
    },
    audioheadphones: {
        path: '/search?q=audio',
        terms: ['audio', 'headphone', 'earbuds', 'soundcore'],
    },
    phonesandtablets: {
        path: '/search?q=phones%20tablets',
        terms: ['phones & tablets', 'phones and tablets', 'tablet', 'phone'],
    },
    samsungcases: {
        path: '/search?q=samsung%20case',
        terms: ['samsung case', 'samsung cases', 'galaxy case'],
    },
    anker: {
        path: '/search?q=anker',
        terms: ['anker'],
    },
};

const normalizeCategoryToken = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '');

const EXCLUDED_TOP_CATEGORY_TOKENS = new Set(['soundcore']);

const buildConfiguredCards = (configuredNames = []) =>
    configuredNames.map((rawName) => {
        const name = String(rawName || '').trim();
        const normalized = normalizeCategoryToken(name);
        const preset = PRESET_CATEGORY_DEFINITIONS[normalized];

        return {
            key: normalized || name.toLowerCase(),
            name,
            path: preset?.path || `/search?q=${encodeURIComponent(name)}`,
            terms:
                preset?.terms ||
                name
                    .toLowerCase()
                    .replace(/&/g, ' ')
                    .split(/\s+/)
                    .filter(Boolean),
        };
    }).filter((card) => !EXCLUDED_TOP_CATEGORY_TOKENS.has(card.key));

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
    const { config } = useSiteConfig();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadCategoryCards = async () => {
            try {
                const configuredTopCategories = Array.isArray(config?.homeShowcaseCategories)
                    ? config.homeShowcaseCategories.filter(Boolean)
                    : [];
                const topCategories =
                    configuredTopCategories.length > 0
                        ? configuredTopCategories
                        : DEFAULT_TOP_CATEGORIES;
                const curatedCards = buildConfiguredCards(topCategories);

                let allProducts = Array.isArray(products) ? products : [];

                if (allProducts.length === 0) {
                    const productsRes = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products?page=1&pageSize=60&sort=newest&isActive=true`);
                    allProducts = Array.isArray(productsRes?.products)
                        ? productsRes.products
                        : [];
                }

                const nextCards = curatedCards.map((card) => {
                    const matchingProducts = allProducts.filter((p) => productMatchesTerms(p, card.terms));
                    const coverImage = matchingProducts.find(
                        (p) => Array.isArray(p.images) && p.images.length > 0 && p.images[0]
                    )?.images?.[0] || '/placeholder-product.svg';
                    const count = matchingProducts.length;
                    const previews = matchingProducts
                        .filter((p) => p && p._id)
                        .slice(0, 3)
                        .map((p) => ({
                            id: p._id,
                            name: p.name || 'Product',
                            image: (Array.isArray(p.images) && p.images[0]) || '/placeholder-product.svg',
                        }));

                    return {
                        key: card.key,
                        name: card.name,
                        path: card.path,
                        image: coverImage,
                        countLabel: count > 0 ? 'Explore' : 'View',
                        detail: `${count} product${count === 1 ? '' : 's'}`,
                        previews,
                    };
                });

                setCategories(nextCards);
            } catch (error) {
                console.error('Failed to load dynamic category showcase:', error);
                setCategories([]);
            }
        };

        loadCategoryCards();
    }, [products, config]);

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
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder-product.svg';
                                    }}
                                />
                                <div className="item-count">{cat.countLabel}</div>
                            </div>
                            <div className="cat-info">
                                <h3>{cat.name}</h3>
                                <p>{cat.detail}</p>
                                {Array.isArray(cat.previews) && cat.previews.length > 0 && (
                                    <>
                                        <div className="cat-preview-row" aria-hidden="true">
                                            {cat.previews.map((preview) => (
                                                <div key={preview.id} className="cat-preview-thumb">
                                                    <img
                                                        src={preview.image}
                                                        alt={preview.name}
                                                        loading="lazy"
                                                        decoding="async"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/placeholder-product.svg';
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="cat-preview-names">
                                            {cat.previews.map((preview) => preview.name).join(' • ')}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default CategoryShowcase;
