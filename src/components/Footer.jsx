import React from 'react';
import { Link } from 'react-router-dom';
import { SOCIAL_PROFILES } from '../utils/seo';

const socialIconByHost = (url) => {
    const safe = String(url || '').toLowerCase();
    if (safe.includes('instagram')) return 'fab fa-instagram';
    if (safe.includes('facebook')) return 'fab fa-facebook';
    if (safe.includes('twitter') || safe.includes('x.com')) return 'fab fa-twitter';
    if (safe.includes('tiktok')) return 'fab fa-tiktok';
    return 'fas fa-globe';
};

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h2 className="logo-text">CASEPROZ</h2>
                        <p className="footer-tagline">Your trusted Kenyan destination for premium Anker, Soundcore and everyday electronics essentials.</p>
                        <div className="social-links">
                            {SOCIAL_PROFILES.map((socialUrl) => (
                                <a
                                    key={socialUrl}
                                    className="footer-social-link"
                                    href={socialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="CaseProz social profile"
                                >
                                    <i className={socialIconByHost(socialUrl)}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="footer-col">
                        <h3>Shop</h3>
                        <ul className="footer-link-list">
                            <li><Link to="/search">All Products</Link></li>
                            <li><Link to="/search?q=anker">Anker</Link></li>
                            <li><Link to="/search?q=soundcore">Soundcore</Link></li>
                            <li><Link to="/search?q=audio">Audio</Link></li>
                            <li><Link to="/search?q=power%20bank">Power</Link></li>
                            <li><Link to="/search?q=accessories">Accessories</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Customer Service</h3>
                        <ul className="footer-link-list">
                            <li><Link to="/contact">Contact Us</Link></li>
                            <li><Link to="/delivery">Delivery Information</Link></li>
                            <li><Link to="/returns">Returns &amp; Refunds</Link></li>
                            <li><Link to="/faq">Warranty &amp; FAQs</Link></li>
                            <li><Link to="/customer-support">Customer Support</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Company</h3>
                        <ul className="footer-link-list">
                            <li><Link to="/contact">About CaseProz</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                            <li><Link to="/profile">My Account</Link></li>
                            <li><Link to="/favourites">Wishlist</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} CASEPROZ. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
