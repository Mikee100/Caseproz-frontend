import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'ig');
    const parts = text.split(regex);

    return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="search-highlight">
                {part}
            </mark>
        ) : (
            part
        )
    );
};

const ProductCard = ({ product, highlightQuery }) => {
    const { favourites, isFavourite, toggleFavourite } = useFavorites();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const primaryMeta = product.subCategory || (product.keyFeatures && product.keyFeatures[0]);

    const fallbackImage = '/placeholder-product.svg';

    const imageSrc =
        (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
        product.image ||
        fallbackImage;

    const secondaryImageSrc =
        (Array.isArray(product.images) && product.images.length > 1 && product.images[1]) ||
        null;

    const priceValue = Number(product?.price || 0);
    const originalPriceValue = Number(product?.originalPrice || 0);
    const hasDiscount = originalPriceValue > priceValue;
    const discountPercent = hasDiscount
        ? Math.round(((originalPriceValue - priceValue) / originalPriceValue) * 100)
        : 0;
    const stockValue = Number(product?.stock || 0);
    const inStock = stockValue > 0;
    const isLowStock = inStock && stockValue <= 3;
    const createdAtTs = Date.parse(product?.createdAt || '');
    const isNewArrival = Number.isFinite(createdAtTs)
        ? (Date.now() - createdAtTs) / (1000 * 60 * 60 * 24) <= 35
        : false;

    const handleToggleFavourite = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        toggleFavourite(product);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inStock) return;
        addToCart(product, 1);
    };

    return (
        <div className="product-card">
            <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-image-wrapper">
                    <span className="product-image-stage">
                        <img
                            className="product-image-primary"
                            src={imageSrc}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 240px"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackImage;
                            }}
                        />
                        {secondaryImageSrc && (
                            <img
                                className="product-image-secondary"
                                src={secondaryImageSrc}
                                alt={`${product.name} alternate view`}
                                loading="lazy"
                                decoding="async"
                                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 240px"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = fallbackImage;
                                }}
                            />
                        )}
                    </span>
                    <div className="product-badge-stack">
                        {hasDiscount && <span className="badge sale">-{discountPercent}%</span>}
                        {isNewArrival && <span className="badge new">New</span>}
                        {!inStock && <span className="badge out-of-stock">Out of Stock</span>}
                    </div>
                    <div className="product-actions">
                        <button
                            className="wishlist-btn"
                            title={isFavourite(product._id) ? 'Remove from favourites' : 'Add to favourites'}
                            onClick={handleToggleFavourite}
                        >
                            <i className={isFavourite(product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                        </button>
                    </div>
                </div>
            </Link>
            <div className="product-info">
                <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {product.brand && (
                        <p className="product-brand">
                            {highlightText(product.brand, highlightQuery)}
                        </p>
                    )}
                    <p className="product-category">
                        {highlightText(product.category || 'Electronics', highlightQuery)}
                    </p>
                    <h3 className="product-title">
                        {highlightText(product.name, highlightQuery)}
                    </h3>
                    {primaryMeta && (
                        <p className="product-meta">
                            {highlightText(primaryMeta, highlightQuery)}
                        </p>
                    )}
                </Link>
                <div className="product-price">
                    {hasDiscount && (
                        <span className="original-price">
                            Ksh {originalPriceValue.toLocaleString()}
                        </span>
                    )}
                    <span className={`current-price ${hasDiscount ? 'sale-price' : ''}`}>
                        Ksh {priceValue.toLocaleString()}
                    </span>
                </div>
                <div className="product-card-footer">
                    <p className={`product-stock ${inStock ? 'in-stock' : 'out-stock'}`}>
                        {!inStock ? 'Out of stock' : isLowStock ? `Only ${stockValue} left` : 'In stock'}
                    </p>
                    <button
                        type="button"
                        className="product-add-cart-btn"
                        disabled={!inStock}
                        onClick={handleAddToCart}
                    >
                        {inStock ? 'Add to cart' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
