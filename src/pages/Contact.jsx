import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { apiFetch } from '../utils/apiClient';
import {
    buildLocalBusinessSchema,
    BUSINESS_HOURS,
    BUSINESS_LOCATION,
    BUSINESS_PHONE_DISPLAY,
    BUSINESS_WHATSAPP_NUMBER,
    SITE_URL,
    SUPPORT_EMAIL,
} from '../utils/seo';

const Contact = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const localBusinessSchema = buildLocalBusinessSchema({
        type: 'ElectronicsStore',
        url: SITE_URL,
    });

    const contactPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact CaseProz',
        url: `${SITE_URL}/contact`,
        about: {
            '@type': 'Organization',
            name: 'CaseProz',
        },
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (!form.name || !form.email || !form.message) {
            setStatus({ type: 'error', message: 'Please fill in all required fields.' });
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            setStatus({ type: 'success', message: 'Thank you! Your message has been sent.' });
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="contact-page">
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(localBusinessSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(contactPageSchema)}
                </script>
            </Helmet>
            <section className="contact-hero">
                <div className="container">
                    <p className="contact-badge">CONTACT CASEPROZ</p>
                    <h1>We&apos;re here to help</h1>
                    <p className="subtitle">
                        Have a question about an order, product, or bulk pricing? Send us a message
                        and our team will get back to you.
                    </p>
                </div>
            </section>

            <section className="contact-section">
                <div className="container contact-grid">
                    <div className="contact-form-card">
                        <h2>Send us a message</h2>
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">
                                        Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">
                                        Email <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">
                                    Message <span className="required">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Share as much detail as possible so we can assist you quickly."
                                />
                            </div>

                            {status.message && (
                                <div
                                    className={`contact-status contact-status-${status.type}`}
                                    role="alert"
                                >
                                    {status.message}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={submitting}>
                                {submitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>

                    <aside className="contact-info-card">
                        <h2>Other ways to reach us</h2>
                        <ul className="contact-info-list">
                            <li>
                                <h3>Call or WhatsApp</h3>
                                <p>{BUSINESS_PHONE_DISPLAY}</p>
                                <p>
                                    <a href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                                        WhatsApp Chat
                                    </a>
                                </p>
                            </li>
                            <li>
                                <h3>Email</h3>
                                <p>{SUPPORT_EMAIL}</p>
                            </li>
                            <li>
                                <h3>Business hours</h3>
                                <p>{BUSINESS_HOURS.weekdaysAndSaturday}</p>
                                <p>{BUSINESS_HOURS.sunday}</p>
                            </li>
                            <li>
                                <h3>Location</h3>
                                <p>{BUSINESS_LOCATION.city}</p>
                                <p>{BUSINESS_LOCATION.streetAddress}</p>
                            </li>
                        </ul>
                        <p className="contact-note">
                            For urgent order issues, please include your order number so we can
                            assist you faster.
                        </p>
                    </aside>
                </div>
            </section>
        </div>
    );
};

export default Contact;

