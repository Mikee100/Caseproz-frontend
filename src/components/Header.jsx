import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { apiFetch } from '../utils/apiClient';

// Dynamic constants initialized as empty arrays
let BRANDS = [];
let SHOP_MEGA_SECTIONS = [];

const toSlug = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/ & /g, '-')
        .replace(/ /g, '-');

const Header = ({ isCartOpen, setIsCartOpen }) => {
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const { favourites } = useFavorites();
    const { config } = useSiteConfig();
    const navigate = useNavigate();
    const location = useLocation();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isDrawerCategoriesOpen, setIsDrawerCategoriesOpen] = useState(false);
    const [activeDrawerCategory, setActiveDrawerCategory] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [drawerSearch, setDrawerSearch] = useState('');
    const [dynamicBrands, setDynamicBrands] = useState([]);
    const [dynamicCategories, setDynamicCategories] = useState([]);

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const [brandsRes, catRes] = await Promise.all([
                    apiFetch(`${import.meta.env.VITE_API_URL}/api/brands`),
                    apiFetch(`${import.meta.env.VITE_API_URL}/api/categories`),
                ]);
                
                // Set brands (limit or slice if needed, but here we take all)
                setDynamicBrands(Array.isArray(brandsRes.data) ? brandsRes.data : brandsRes);
                
                // Map categories to SHOP_MEGA_SECTIONS structure
                const mappedCats = (Array.isArray(catRes.data) ? catRes.data : catRes).map(cat => ({
                    title: cat.name,
                    items: (cat.subCategories || []).map(sub => ({
                        label: sub.name,
                        slug: toSlug(sub.name)
                    }))
                }));
                setDynamicCategories(mappedCats);
            } catch (err) {
                console.error('Failed to fetch navigation data:', err);
            }
        };
        fetchNavData();
    }, []);

    useEffect(() => {
        if (!activeDrawerCategory && dynamicCategories.length > 0) {
            setActiveDrawerCategory(dynamicCategories[0].title);
        }
    }, [dynamicCategories, activeDrawerCategory]);

    // Helper for easier access
    const BRANDS_LIST = dynamicBrands.map(b => typeof b === 'string' ? b : b.name);
    const mobileDrawerBrands = BRANDS_LIST.slice(0, 5);

    useEffect(() => {
        if (isMobileMenuOpen || isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen, isCartOpen]);

    useEffect(() => {
        const className = 'mobile-search-expanded';
        if (isMobileSearchOpen) {
            document.body.classList.add(className);
        } else {
            document.body.classList.remove(className);
        }

        return () => {
            document.body.classList.remove(className);
        };
    }, [isMobileSearchOpen]);

    // Keep header search in sync with the current URL query (?q=...)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const qFromUrl = params.get('q') || '';
        setSearchKeyword((prev) => (prev === qFromUrl ? prev : qFromUrl));
    }, [location.pathname, location.search]);

    // Instant search (debounced) ONLY when already on /search to avoid excessive calls
    useEffect(() => {
        // Only auto-update when user is on the search results page
        if (location.pathname !== '/search') {
            return;
        }

        const handler = setTimeout(() => {
            const trimmed = searchKeyword.trim();
            const currentQ = new URLSearchParams(location.search).get('q') || '';

            // Require at least 2 characters for auto-search (but allow clearing)
            if (trimmed && trimmed.length < 2) {
                return;
            }

            // Nothing to do if URL already matches the input
            if (trimmed === currentQ) {
                return;
            }

            const targetPath = trimmed
                ? `/search?q=${encodeURIComponent(trimmed)}`
                : '/search';

            navigate(targetPath, { replace: true });
        }, 600);

        return () => clearTimeout(handler);
    }, [searchKeyword, location.pathname, location.search, navigate]);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchKeyword.trim();

        // If nothing typed and user is already on a clean search page, do nothing
        if (!trimmed && location.pathname === '/search' && !location.search) {
            return;
        }

        const targetPath = trimmed
            ? `/search?q=${encodeURIComponent(trimmed)}`
            : '/search';
        const replace = location.pathname === '/search';

        navigate(targetPath, { replace });
    };

    const handleMobileSearch = (e) => {
        handleSearch(e);
        setIsMobileSearchOpen(false);
    };

    const handleDrawerSearch = (e) => {
        e.preventDefault();
        if (drawerSearch.trim()) {
            navigate(`/search?q=${encodeURIComponent(drawerSearch.trim())}`);
            setDrawerSearch('');
            setIsMobileMenuOpen(false);
        }
    };

    useEffect(() => {
        setIsMobileSearchOpen(false);
    }, [location.pathname, location.search]);

    return (
        <>
            <header className={`modern-header ${isMobileSearchOpen ? 'mobile-search-open' : ''}`}>
               

                <div className="main-nav-wrapper">
                    <div className="container header-grid">
                        {/* Logo Block */}
                       
                        <div className="logo-area">
                            {/* Logo and Partner Branding Area */}
                            <div className="header-branding">
                                <Link to="/" className="brand-logo" aria-label="CaseProz Home">
                                    <img
                                        src="/WhatsApp%20Image%202026-04-15%20at%204.49.39%20PM.jpeg"
                                        alt="CaseProz logo"
                                        className="header-logo-img"
                                    />
                                </Link>
                                <div className="brand-divider" aria-hidden="true"></div>
                                <button
                                    className="partner-logo"
                                    onClick={() => navigate('/')}
                                    onMouseDown={e => e.preventDefault()} // Prevents focus border
                                    type="button"
                                >
                             Anker 
                                </button>
                            </div>
                        </div>

                        {/* Navigation Links - Sweech-style */}
                        <nav className="central-nav">
                            <ul className="nav-list">
                                <li className="nav-li">
                                    <Link to="/" className="nav-link">
                                        HOME
                                    </Link>
                                </li>

                                <li className="nav-li shop-nav">
                                    <button type="button" className="nav-link">
                                        SHOP <i className="fas fa-chevron-down small-caret" />
                                    </button>
                                    <div className="shop-mega">
                                        <div className="shop-mega-inner">
                                            {dynamicCategories.map((section) => (
                                                <div key={section.title} className="shop-mega-column">
                                                    <h4 className="shop-mega-title">{section.title}</h4>
                                                    {section.items.map((item) => (
                                                        <button
                                                            key={item.slug}
                                                            type="button"
                                                            className="shop-mega-link"
                                                            onClick={() => navigate(`/category/${item.slug}`)}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </li>

                                <li className="nav-li brand-nav">
                                    <button type="button" className="nav-link">
                                        SHOP BY BRAND <i className="fas fa-chevron-down small-caret" />
                                    </button>
                                    <div className="brand-mega">
                                        <div className="brand-mega-inner">
                                            {BRANDS_LIST.map((brand) => (
                                                <button
                                                    key={brand}
                                                    type="button"
                                                    className="brand-pill"
                                                    onClick={() => {
                                                        const slug = brand.toLowerCase().replace(/\s+/g, '-');
                                                        navigate(`/brand/${encodeURIComponent(slug)}`);
                                                    }}
                                                >
                                                    {brand}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                                
                                <li className="nav-li help-nav">
                                    <button type="button" className="nav-link">
                                        HELP CENTER <i className="fas fa-chevron-down small-caret" />
                                    </button>
                                    <div className="help-dropdown">
                                        <Link to="/profile" className="help-link">My Account</Link>
                                        <Link to="/cart" className="help-link hide-on-mobile">Shopping Cart</Link>
                                        <Link to="/checkout" className="help-link">Checkout</Link>
                                        <Link to="/orders" className="help-link">Order Tracking</Link>
                                        <Link to="/favourites" className="help-link">Wishlist</Link>
                                        <Link to="/delivery" className="help-link">Shipping &amp; Delivery Information</Link>
                                        <Link to="/returns" className="help-link">Returns &amp; Refunds</Link>
                                        <Link to="/faq" className="help-link">Warranty Policy &amp; FAQs</Link>
                                        <Link to="/customer-support" className="help-link">Customer Support</Link>
                                        <Link to="/contact" className="help-link">Contact</Link>
                                    </div>
                                </li>
                            </ul>
                        </nav>

                        {/* Search Block */}
                        <div className="search-area">
                            <form className="premium-search" onSubmit={handleSearch}>
                                <i className="fas fa-search search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="What are you looking for?"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                                <button type="submit" className="premium-search-btn">FIND</button>
                            </form>
                        </div>

                        {/* Icons Area */}
                        <div className="actions-area">
                            <div
                                className="action-ic hide-on-mobile"
                                title="Wishlist"
                                role="button"
                                tabIndex={0}
                                onClick={() => navigate('/favourites')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate('/favourites');
                                    }
                                }}
                            >
                                <i className="far fa-heart"></i>
                                {favourites.length > 0 && (
                                    <span className="badge-count">{favourites.length}</span>
                                )}
                            </div>

                            <div
                                className="action-ic cart-trigger hide-on-mobile"
                                role="button"
                                tabIndex={0}
                                aria-label="Go to cart page"
                                onClick={() => navigate('/cart')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate('/cart');
                                    }
                                }}
                            >
                                <i className="fas fa-shopping-cart"></i>
                                {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
                            </div>

                            {user ? (
                                <div className="user-profile-nav hide-on-mobile">
                                    <div className="user-trigger" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                        <div className="user-avatar">
                                            {user.name.charAt(0)}
                                        </div>
                                        <i className={`fas fa-chevron-down ${isUserMenuOpen ? 'rotate' : ''}`}></i>
                                    </div>

                                    {isUserMenuOpen && (
                                        <div className="premium-dropdown">
                                            <div className="dropdown-header">
                                                <p className="welcome-msg">Hello, <strong>{user.name.split(' ')[0]}</strong></p>
                                            </div>
                                            <div className="dropdown-body">
                                                <Link to="/profile" className="drop-link" onClick={() => setIsUserMenuOpen(false)}>
                                                    <i className="far fa-user-circle"></i> My Account
                                                </Link>
                                                <Link to="/orders" className="drop-link" onClick={() => setIsUserMenuOpen(false)}>
                                                    <i className="fas fa-history"></i> My Orders
                                                </Link>
                                                {user.isAdmin && (
                                                    <Link to="/admin/productlist" className="drop-link admin-link" onClick={() => setIsUserMenuOpen(false)}>
                                                        <i className="fas fa-user-shield"></i> Admin Panel
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="dropdown-footer">
                                                <button className="logout-btn" onClick={() => { logout(); setIsUserMenuOpen(false); }}>
                                                    <i className="fas fa-sign-out-alt"></i> Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="login-pill hide-on-mobile">
                                    <i className="far fa-user"></i> LOGIN
                                </Link>
                            )}

                            <div
                                className="mobile-search-btn"
                                role="button"
                                tabIndex={0}
                                aria-label="Toggle search"
                                aria-expanded={isMobileSearchOpen}
                                onClick={() => setIsMobileSearchOpen((prev) => !prev)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setIsMobileSearchOpen((prev) => !prev);
                                    }
                                }}
                            >
                                <i className={`fas ${isMobileSearchOpen ? 'fa-times' : 'fa-search'}`}></i>
                            </div>

                            <div
                                className="mobile-menu-btn"
                                role="button"
                                tabIndex={0}
                                aria-label="Open navigation menu"
                                onClick={() => setIsMobileMenuOpen(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setIsMobileMenuOpen(true);
                                    }
                                }}
                            >
                                <i className="fas fa-bars"></i>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Search Bar – shown below logo row on small screens */}
                    <div className={`mobile-search-bar ${isMobileSearchOpen ? 'open' : ''}`} aria-hidden={!isMobileSearchOpen}>
                        <form className="mobile-search-form" onSubmit={handleMobileSearch}>
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                aria-label="Search products"
                            />
                            {searchKeyword.trim().length > 0 && (
                                <button
                                    type="button"
                                    className="mobile-search-clear"
                                    aria-label="Clear search"
                                    onClick={() => setSearchKeyword('')}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                            <button type="submit" className="mobile-search-submit" aria-label="Search">
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar / Drawer */}
            {isMobileMenuOpen && (
                <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer-header">
                            <span className="brand-logo small"><span className="logo-accent">C</span>ASEPROZ</span>
                            <button className="close-drawer" onClick={() => setIsMobileMenuOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Drawer Search */}
                        <form className="drawer-search-form" onSubmit={handleDrawerSearch}>
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={drawerSearch}
                                onChange={(e) => setDrawerSearch(e.target.value)}
                            />
                        </form>

                        {/* User greeting in drawer */}
                        {user && (
                            <div className="drawer-user-info">
                                <div className="drawer-user-avatar">{user.name.charAt(0)}</div>
                                <div>
                                    <p className="drawer-user-name">{user.name}</p>
                                    <p className="drawer-user-email">{user.email}</p>
                                </div>
                            </div>
                        )}

                        <ul className="drawer-links">
                            <li><Link to="/" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-home"></i> HOME</Link></li>
                            <li><Link to="/search" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-store"></i> SHOP ALL</Link></li>
                            <li>
                                <button
                                    className="drawer-categories-toggle"
                                    onClick={() => setIsDrawerCategoriesOpen((prev) => !prev)}
                                    aria-expanded={isDrawerCategoriesOpen}
                                    aria-controls="drawer-categories-panel"
                                >
                                    <span>
                                        <i className="fas fa-th-large"></i> CATEGORIES
                                    </span>
                                    <i className={`fas fa-chevron-${isDrawerCategoriesOpen ? 'up' : 'down'}`}></i>
                                </button>
                            </li>
                            {isDrawerCategoriesOpen && (
                                <li className="drawer-categories-shell" id="drawer-categories-panel">
                                    {dynamicCategories.length === 0 && (
                                        <div className="drawer-categories-empty">No categories yet.</div>
                                    )}
                                    {dynamicCategories.map((section) => {
                                        const isActive = activeDrawerCategory === section.title;
                                        return (
                                            <div key={section.title} className="drawer-category-group">
                                                <button
                                                    type="button"
                                                    className={`drawer-category-title ${isActive ? 'active' : ''}`}
                                                    onClick={() => setActiveDrawerCategory(section.title)}
                                                >
                                                    {section.title}
                                                    <span>{section.items?.length || 0}</span>
                                                </button>
                                                {isActive && section.items?.length > 0 && (
                                                    <div className="drawer-subcategory-list">
                                                        {section.items.map((item) => (
                                                            <Link
                                                                key={`${section.title}-${item.slug}`}
                                                                to={`/category/${item.slug}`}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                            >
                                                                {item.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </li>
                            )}
                            <li>
                                <span className="drawer-section-label">
                                    Shop by brand
                                </span>
                            </li>
                            {mobileDrawerBrands.map((brand) => (
                                <li key={brand}>
                                    <button
                                        className="drawer-brand-link"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            const slug = brand.toLowerCase().replace(/\s+/g, '-');
                                            navigate(`/brand/${encodeURIComponent(slug)}`);
                                        }}
                                    >
                                        <i className="fas fa-tags"></i> {brand}
                                    </button>
                                </li>
                            ))}
                            {BRANDS_LIST.length > mobileDrawerBrands.length && (
                                <li>
                                    <Link
                                        to="/search"
                                        className="drawer-brand-all"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <i className="fas fa-layer-group"></i> All brands
                                    </Link>
                                </li>
                            )}
                            <li>
                                <span className="drawer-section-label">
                                    Help center
                                </span>
                            </li>
                            <li><Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-shopping-cart"></i> SHOPPING CART</Link></li>
                            <li><Link to="/checkout" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-credit-card"></i> CHECKOUT</Link></li>
                            <li><Link to="/delivery" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-truck"></i> SHIPPING &amp; DELIVERY</Link></li>
                            <li><Link to="/returns" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-undo"></i> RETURNS &amp; REFUNDS</Link></li>
                            <li><Link to="/faq" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-question-circle"></i> WARRANTY &amp; FAQS</Link></li>
                            <li><Link to="/customer-support" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-headset"></i> CUSTOMER SUPPORT</Link></li>
                            <li><Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-envelope"></i> CONTACT</Link></li>
                            <li><Link to="/favourites" onClick={() => setIsMobileMenuOpen(false)}><i className="far fa-heart"></i> WISHLIST {favourites.length > 0 && <span className="drawer-badge">{favourites.length}</span>}</Link></li>
                            {user ? (
                                <>
                                    <li><Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}><i className="far fa-user-circle"></i> MY ACCOUNT</Link></li>
                                    <li><Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-history"></i> MY ORDERS</Link></li>
                                    {user.isAdmin && (
                                        <li><Link to="/admin/productlist" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-user-shield"></i> ADMIN PANEL</Link></li>
                                    )}
                                    <li>
                                        <button className="drawer-logout" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                                            <i className="fas fa-sign-out-alt"></i> LOGOUT
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li><Link to="/login" onClick={() => setIsMobileMenuOpen(false)}><i className="far fa-user"></i> LOGIN / REGISTER</Link></li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
