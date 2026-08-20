import React from 'react';
import { Link } from 'react-router-dom';
import { SHIPPING_ZONES } from '../constants/shippingZones';
import SeoMeta from '../components/SeoMeta';
import { BUSINESS_PHONE_DISPLAY, SUPPORT_EMAIL } from '../utils/seo';

const Delivery = () => {
    return (
        <div className="delivery-page">
            <SeoMeta
                title="Delivery Information | CaseProz Kenya"
                description="Delivery timelines, zone-based shipping fees, and pickup options from CaseProz in Nairobi."
                canonicalPath="/delivery"
            />
            <section className="delivery-hero">
                <div className="container">
                    <p className="delivery-badge">DELIVERY INFORMATION</p>
                    <h1>How CaseProz delivery works</h1>
                    <p className="subtitle">
                        Fast, safe delivery of your favourite tech across Kenya. Here&apos;s what to
                        expect once you place an order.
                    </p>
                </div>
            </section>

            <section className="delivery-section">
                <div className="container delivery-grid">
                    <div className="delivery-card">
                        <h2>Delivery timelines</h2>
                        <ul className="delivery-list">
                            <li>
                                <strong>Same‑day delivery – Nairobi &amp; nearby</strong>
                                <p>
                                    Orders confirmed before <strong>3:00pm</strong> are delivered the
                                    same day within Nairobi and selected surrounding areas.
                                </p>
                            </li>
                            <li>
                                <strong>Next‑day delivery – major towns</strong>
                                <p>
                                    1 business day to most major towns (Thika, Kiambu, Mombasa CBD,
                                    Kisumu CBD, Nakuru, Eldoret, etc.).
                                </p>
                            </li>
                            <li>
                                <strong>Up‑country &amp; remote areas</strong>
                                <p>1–3 business days depending on courier route and accessibility.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="delivery-card">
                        <h2>Delivery fees</h2>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                            These are the same delivery rates you see on the cart page, broken down
                            clearly by location.
                        </p>
                        <ul className="delivery-list">
                            {SHIPPING_ZONES.map((zone) => (
                                <li key={zone.id} style={{ marginBottom: '8px' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            alignItems: 'center',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>{zone.label}</span>
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: zone.price === 0 ? '#16a34a' : '#E41E26',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {zone.price === 0
                                                ? 'Pick up (Free)'
                                                : `KSh ${zone.price.toLocaleString()}`}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p style={{ fontSize: '12px', color: '#777', marginTop: '8px' }}>
                            For very large or fragile items (like TVs or big appliances), a small
                            extra handling fee may apply so we can package and transport them safely.
                        </p>
                    </div>

                    <div className="delivery-card">
                        <h2>Order process</h2>
                        <ol className="delivery-steps">
                            <li>
                                <strong>Place your order</strong> – Add items to cart and checkout
                                with your contact and delivery details.
                            </li>
                            <li>
                                <strong>Confirmation call / SMS</strong> – Our team may contact you
                                to confirm availability and delivery time.
                            </li>
                            <li>
                                <strong>Dispatch</strong> – Your order is packed securely and handed
                                over to a trusted rider or courier partner.
                            </li>
                            <li>
                                <strong>Delivery &amp; inspection</strong> – Inspect your items on
                                delivery. For certain high‑value items we may require ID
                                verification.
                            </li>
                        </ol>
                    </div>

                    <div className="delivery-card">
                        <h2>Payment &amp; delivery terms</h2>
                        <ul className="delivery-list">
                            <li>
                                <strong>Payment methods</strong>
                                <p>
                                    We support M‑Pesa, card payments and bank transfer. Cash on
                                    delivery may be available for selected locations/orders.
                                </p>
                            </li>
                            <li>
                                <strong>Missed deliveries</strong>
                                <p>
                                    If the rider can&apos;t reach you, we&apos;ll reschedule. A
                                    second attempt or storage at a pickup point may attract extra
                                    fees from the courier.
                                </p>
                            </li>
                            <li>
                                <strong>Damaged items</strong>
                                <p>
                                    If a package arrives visibly damaged, please decline it and
                                    contact us immediately so we can assist.
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className="delivery-card">
                        <h2>Need help?</h2>
                        <p>
                            If you have any questions about shipping fees, timelines, or special
                            delivery arrangements, get in touch with our support team.
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            Email:{' '}
                            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                            <br />
                            Phone / WhatsApp: <strong>{BUSINESS_PHONE_DISPLAY}</strong>
                        </p>
                        <p style={{ marginTop: '16px' }}>
                            You can also{' '}
                            <Link to="/contact" style={{ color: '#E1261C', fontWeight: 600 }}>
                                contact us here
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Delivery;

