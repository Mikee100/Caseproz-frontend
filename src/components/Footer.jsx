import React, { useState } from 'react';

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
        // For now, just simulate a successful subscription.
        setStatus('success');
        setEmail('');
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h2 className="logo-text">CASEPROZ</h2>
                        <p>Kenya's coolest online shop for premium electronics, gadgets, and tech accessories. Experience same-day delivery and unbeatable service.</p>
                        <div className="social-links">
                            <a href="#"><i className="fab fa-facebook"></i></a>
                            <a href="#"><i className="fab fa-instagram"></i></a>
                            <a href="#"><i className="fab fa-twitter"></i></a>
                        </div>
                    </div>
                    <div className="footer-col">
                        <h3>Shop Categories</h3>
                        <ul>
                            <li><a href="/category/smartphones">Smartphones</a></li>
                            <li><a href="/category/laptops">Laptops</a></li>
                            <li><a href="/category/audio">Audio & Headphones</a></li>
                            <li><a href="/category/accessories">Accessories</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Customer Care</h3>
                        <ul>
                            <li><a href="/customer-support">Customer Support</a></li>
                            <li><a href="/contact">Contact Us</a></li>
                            <li><a href="/delivery">Delivery Information</a></li>
                            <li><a href="/returns">Returns & Refunds</a></li>
                            <li><a href="/faq">FAQs</a></li>
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
