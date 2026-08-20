import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SeoMeta from '../components/SeoMeta';
import { BUSINESS_PHONE_DISPLAY, SUPPORT_EMAIL } from '../utils/seo';

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'How long does delivery take?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'For Nairobi and nearby areas, most orders placed before 3:00pm are delivered the same day. Other major towns usually take 1 business day, and up-country deliveries take 1 to 3 business days depending on courier route.',
            },
        },
        {
            '@type': 'Question',
            name: 'How much is the delivery fee?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Delivery fees depend on your location. You can view the exact amount on the cart and checkout pages and get a full breakdown on the Delivery Information page.',
            },
        },
        {
            '@type': 'Question',
            name: 'What payment methods do you accept?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'CaseProz supports M-Pesa, major debit and credit cards, and bank transfer. Cash on delivery may be available for selected locations and order types.',
            },
        },
        {
            '@type': 'Question',
            name: 'What is your returns policy?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Returns are accepted for wrong items, items damaged on arrival, and products not as described. Some restrictions apply for opened accessories and hygiene-sensitive items.',
            },
        },
        {
            '@type': 'Question',
            name: 'How long do refunds take?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'M-Pesa refunds typically take 24 to 48 hours once approved. Card and bank refunds may take 3 to 7 business days depending on your provider.',
            },
        },
    ],
};

const Faq = () => {
    return (
        <div className="faq-page">
            <SeoMeta
                title="FAQs | CaseProz Kenya"
                description="Frequently asked questions about delivery, payments, returns, and order support at CaseProz Kenya."
                canonicalPath="/faq"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(faqSchema)}
                </script>
            </Helmet>
            <section className="faq-hero">
                <div className="container">
                    <p className="faq-badge">HELP CENTER</p>
                    <h1>Frequently Asked Questions</h1>
                    <p className="subtitle">
                        Quick answers about orders, delivery, payments and your CaseProz account.
                    </p>
                </div>
            </section>

            <section className="faq-section">
                <div className="container faq-grid">
                    <div className="faq-card">
                        <h2>Orders &amp; delivery</h2>
                        <div className="faq-item">
                            <h3>How long does delivery take?</h3>
                            <p>
                                For Nairobi and nearby areas, most orders placed before <strong>3:00pm</strong> are delivered the same
                                day. Other major towns usually take <strong>1 business day</strong>, and up‑country deliveries
                                <strong> 1–3 business days</strong> depending on the courier route.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>How much is the delivery fee?</h3>
                            <p>
                                Delivery fees depend on your location. You can see the exact amount on the cart and checkout pages. For
                                a full breakdown, visit our{' '}
                                <Link to="/delivery" style={{ color: '#E1261C', fontWeight: 600 }}>
                                    Delivery Information
                                </Link>{' '}
                                page.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>Can I track my order?</h3>
                            <p>
                                Yes. Once your order is dispatched, you&apos;ll receive an SMS or email with tracking details or a
                                direct update from our rider/courier partner.
                            </p>
                        </div>
                    </div>

                    <div className="faq-card">
                        <h2>Payments</h2>
                        <div className="faq-item">
                            <h3>What payment methods do you accept?</h3>
                            <p>
                                We support M‑Pesa, major debit/credit cards and bank transfer. Cash on delivery may be available for
                                selected locations and order types.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>Is it safe to pay online?</h3>
                            <p>
                                Yes. All online payments are processed via secure, PCI‑compliant payment providers using encrypted
                                connections. We never store your full card details on our servers.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>How do I pay with Lipa na M-Pesa?</h3>
                            <p>
                                To pay for your order using M-Pesa, go to <strong>Lipa na Mpesa</strong> on your phone and enter:<br />
                                <strong>Account Number:</strong> 40043<br />
                                <strong>Business Number:</strong> (your name as entered in the order)<br />
                                After payment, your order will be processed promptly.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>My payment failed, what should I do?</h3>
                            <p>
                                First, confirm that you have enough funds and that your details are correct. If you&apos;re still
                                having issues, contact your bank or reach out to our support team with your order attempt and we&apos;ll
                                help.
                            </p>
                        </div>
                    </div>

                    <div className="faq-card">
                        <h2>Returns &amp; refunds</h2>
                        <div className="faq-item">
                            <h3>What is your returns policy?</h3>
                            <p>
                                We accept returns for wrong items, damaged on arrival, and products that are not as described. Some
                                restrictions apply for opened accessories and hygiene‑sensitive items. For full details, see our{' '}
                                <Link to="/returns" style={{ color: '#E1261C', fontWeight: 600 }}>
                                    Returns &amp; Refunds
                                </Link>{' '}
                                page.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>How do I request a return?</h3>
                            <p>
                                Contact us with your order number, photos/videos of the issue, and a short explanation. Our team will
                                confirm eligibility and guide you on pickup or drop‑off.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>How long do refunds take?</h3>
                            <p>
                                M‑Pesa refunds typically take <strong>24–48 hours</strong> once approved. Card and bank refunds can
                                take <strong>3–7 business days</strong>, depending on your provider.
                            </p>
                        </div>
                    </div>

                    <div className="faq-card">
                        <h2>Account &amp; security</h2>
                        <div className="faq-item">
                            <h3>Do I need an account to place an order?</h3>
                            <p>
                                You can browse without an account, but we recommend creating one to save your details, track orders and
                                manage your wishlist more easily.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>I forgot my password, what do I do?</h3>
                            <p>
                                Use the <strong>“Forgot password”</strong> link on the login page to reset your password via email. If
                                you still have trouble, contact our support team for assistance.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>How do you protect my data?</h3>
                            <p>
                                We use secure, encrypted connections and follow best practices to protect your personal data. We never
                                sell your information to third parties.
                            </p>
                        </div>
                    </div>

                    <div className="faq-card">
                        <h2>Products &amp; stock</h2>
                        <div className="faq-item">
                            <h3>Are all products genuine?</h3>
                            <p>
                                Yes. We work only with trusted distributors and brands to ensure all products on CaseProz are 100%
                                genuine and covered by applicable manufacturer warranties.
                            </p>
                        </div>
                        <div className="faq-item">
                            <h3>An item is out of stock, what now?</h3>
                            <p>
                                You can add it to your favourites or check back later. For high‑demand items, you can also contact us
                                and we&apos;ll let you know when new stock is expected.
                            </p>
                        </div>
                    </div>

                    <div className="faq-card">
                        <h2>Still need help?</h2>
                        <p>
                            Couldn&apos;t find the answer you&apos;re looking for? Our support team is happy to help with any question
                            about your order, delivery or products.
                        </p>
                        <p style={{ marginTop: '8px' }}>
                            Email:{' '}
                            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                            <br />
                            Phone / WhatsApp: <strong>{BUSINESS_PHONE_DISPLAY}</strong>
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            You can also{' '}
                            <Link to="/contact" style={{ color: '#E1261C', fontWeight: 600 }}>
                                send us a message
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Faq;

