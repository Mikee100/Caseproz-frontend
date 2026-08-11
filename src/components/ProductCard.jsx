import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

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
    const navigate = useNavigate();

    const primaryMeta = product.subCategory || (product.keyFeatures && product.keyFeatures[0]);

    const fallbackImage = '/placeholder-product.svg';

    const imageSrc =
        (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
        product.image ||
        fallbackImage;

    const handleToggleFavourite = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        toggleFavourite(product);
    };

    return (
        <div className="product-card">
            <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-image-wrapper">
                    <img
                        src={imageSrc}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImage;
                        }}
                    />
                    {product.onSale && <span className="badge sale">Sale!</span>}
                    {product.stock <= 0 && <span className="badge out-of-stock">Out of Stock</span>}
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
                    {product.originalPrice && (
                        <span className="original-price">
                            Ksh {product.originalPrice.toLocaleString()}
                        </span>
                    )}
                    <span className={`current-price ${product.onSale ? 'sale-price' : ''}`}>
                        Ksh {product.price.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
