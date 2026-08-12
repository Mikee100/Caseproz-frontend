import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null); // 'success' | 'error' | null

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus('error');
            return;
        }

        // TODO: Replace this with an actual API call to subscribe the user.
        setStatus('success');
        setEmail('');
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h2 className="logo-text">CASEPROZ</h2>
                        <p>Kenya's coolest online shop for premium phone cases, chargers, audio, and tech accessories. Experience fast delivery across Kenya and top-notch customer support.</p>
                        <div className="social-links">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                        </div>
                    </div>
                    <div className="footer-col">
                        <h3>Shop Categories</h3>
                        <ul>
                            <li><Link to="/category/iphone-17-pro-max-case">iPhone 17 Cases</Link></li>
                            <li><Link to="/category/iphone-16-pro-max-case">iPhone 16 Cases</Link></li>
                            <li><Link to="/search?q=anker">Anker Chargers &amp; Audio</Link></li>
                            <li><Link to="/search?q=magsafe">MagSafe Accessories</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Customer Care</h3>
                        <ul>
                            <li><Link to="/customer-support">Customer Support</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                            <li><Link to="/delivery">Delivery Information</Link></li>
                            <li><Link to="/returns">Returns &amp; Refunds</Link></li>
                            <li><Link to="/faq">FAQs</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Newsletter</h3>
                        <p>Subscribe to get the latest tech deals and updates.</p>
                        <form className="newsletter-form" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-primary footer-subscribe-btn">
                                SUBSCRIBE
                            </button>
                            {status === 'success' && (
                                <p className="newsletter-status success">
                                    You&apos;re subscribed! Check your inbox.
                                </p>
                            )}
                            {status === 'error' && (
                                <p className="newsletter-status error">
                                    Please enter a valid email address.
                                </p>
                            )}
                        </form>
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
