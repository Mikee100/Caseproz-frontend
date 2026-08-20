import React from 'react';
import { Link } from 'react-router-dom';
import SeoMeta from '../components/SeoMeta';
import { BUSINESS_PHONE_DISPLAY, SUPPORT_EMAIL } from '../utils/seo';

const Returns = () => {
    return (
        <div className="returns-page">
            <SeoMeta
                title="Returns & Refunds Policy | CaseProz Kenya"
                description="Read CaseProz returns and refund policy, eligibility rules, and support contacts for purchases in Kenya."
                canonicalPath="/returns"
            />
            <section className="returns-hero">
                <div className="container">
                    <p className="returns-badge">RETURNS &amp; REFUNDS</p>
                    <h1>Our Returns &amp; Refunds Policy</h1>
                    <p className="subtitle">
                        We want you to love your purchase. If something isn&apos;t right, here&apos;s how we can help.
                    </p>
                </div>
            </section>

            <section className="returns-section">
                <div className="container returns-grid">
                    <div className="returns-card">
                        <h2>Eligible returns</h2>
                        <ul className="returns-list">
                            <li>
                                <strong>Wrong item received</strong>
                                <p>
                                    If you receive a different product from what you ordered, please notify us within{' '}
                                    <strong>24 hours</strong> of delivery with clear photos of the item received.
                                </p>
                            </li>
                            <li>
                                <strong>Damaged on arrival</strong>
                                <p>
                                    For products that arrive visibly damaged or not powering on out of the box, contact us immediately
                                    and do not continue using the item.
                                </p>
                            </li>
                            <li>
                                <strong>Not as described</strong>
                                <p>
                                    If the product specifications are significantly different from what was listed on the product page,
                                    we&apos;ll work with you to exchange or refund.
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className="returns-card">
                        <h2>Change of mind</h2>
                        <ul className="returns-list">
                            <li>
                                <strong>Unopened items</strong>
                                <p>
                                    In some cases, we may accept unopened and unused items within <strong>7 days</strong> of delivery.
                                    Packaging must be intact and resellable.
                                </p>
                            </li>
                            <li>
                                <strong>Non‑returnable items</strong>
                                <p>
                                    For hygiene and safety reasons, certain items like in‑ear headphones, screen protectors and
                                    software licenses cannot be returned once opened.
                                </p>
                            </li>
                            <li>
                                <strong>Custom / special orders</strong>
                                <p>
                                    Special‑order or customized products may not be eligible for change‑of‑mind returns.
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className="returns-card">
                        <h2>How to request a return</h2>
                        <ol className="returns-steps">
                            <li>
                                <strong>Contact support</strong> – Reach us via{' '}
                                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or WhatsApp on{' '}
                                <strong>{BUSINESS_PHONE_DISPLAY}</strong>.
                            </li>
                            <li>
                                <strong>Share details</strong> – Provide your order number, photos/videos of the issue, and a brief
                                description of the problem.
                            </li>
                            <li>
                                <strong>Approval &amp; instructions</strong> – Our team will review and confirm if the item is
                                eligible and guide you on pickup or drop‑off.
                            </li>
                            <li>
                                <strong>Inspection &amp; resolution</strong> – Once received and inspected, we&apos;ll process an
                                exchange, store credit, or refund as applicable.
                            </li>
                        </ol>
                    </div>

                    <div className="returns-card">
                        <h2>Refund timelines</h2>
                        <ul className="returns-list">
                            <li>
                                <strong>M‑Pesa &amp; mobile money</strong>
                                <p>Refunds to M‑Pesa usually reflect within <strong>24–48 hours</strong> once approved.</p>
                            </li>
                            <li>
                                <strong>Card &amp; bank payments</strong>
                                <p>
                                    Card and bank refunds may take <strong>3–7 business days</strong> depending on your bank or
                                    provider.
                                </p>
                            </li>
                            <li>
                                <strong>Store credit</strong>
                                <p>Store credit is applied to your CaseProz account once the return is approved and processed.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="returns-card">
                        <h2>Important notes</h2>
                        <ul className="returns-list">
                            <li>
                                <strong>Proof of purchase</strong>
                                <p>An order confirmation, receipt, or SMS is required for all returns and warranty claims.</p>
                            </li>
                            <li>
                                <strong>Condition of items</strong>
                                <p>
                                    Items must be returned with all original accessories, manuals, and packaging. Missing parts may
                                    affect eligibility.
                                </p>
                            </li>
                            <li>
                                <strong>Warranty claims</strong>
                                <p>
                                    For manufacturer warranties, we may connect you directly with the authorized service center for faster
                                    assistance.
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className="returns-card">
                        <h2>Still need help?</h2>
                        <p>
                            Not sure if your order qualifies for a return or refund? Our support team is happy to guide you through the
                            options available.
                        </p>
                        <p style={{ marginTop: '10px' }}>
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

export default Returns;

