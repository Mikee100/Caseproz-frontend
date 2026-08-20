import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    buildLocalBusinessSchema,
    BUSINESS_HOURS,
    BUSINESS_LOCATION,
    BUSINESS_PHONE_DISPLAY,
    BUSINESS_WHATSAPP_NUMBER,
    DEFAULT_OG_IMAGE,
    SITE_URL,
    SOCIAL_PROFILES,
    SUPPORT_EMAIL,
} from '../utils/seo';

const localBusinessSchema = buildLocalBusinessSchema({
    type: 'ElectronicsStore',
    image: DEFAULT_OG_IMAGE,
    url: SITE_URL,
    sameAs: SOCIAL_PROFILES,
    description: 'Customer support and in-store assistance at CaseProz, Simara Mall Nairobi.',
});

const CustomerSupport = () => {
  return (
    <div className="support-page">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>
      <section className="support-hero">
        <div className="container">
          <p className="support-badge">CUSTOMER SUPPORT</p>
          <h1>We&apos;re here to help</h1>
          <p className="subtitle">
            Reach the CaseProz team by email, phone or WhatsApp whenever you need help with your order.
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            At this time, we offer support in English only.
          </p>
        </div>
      </section>

      <section className="support-section">
        <div className="container support-grid">
          <div className="support-card">
            <h2>Email support</h2>
            <p>
              For order questions, product help or general feedback, email our Customer Care team any time. We aim to
              respond to most messages within <strong>one business day</strong>.
            </p>
            <p style={{ marginTop: 12 }}>
              Email:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#E1261C', fontWeight: 600 }}>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="support-card">
            <h2>Phone support</h2>
            <p>Talk directly to our team during business hours for quick help with your order or delivery.</p>
            <p style={{ marginTop: 10 }}>
              Phone:{' '}
              <a href={`tel:${BUSINESS_PHONE_DISPLAY.replace(/\s+/g, '')}`} style={{ color: '#E1261C', fontWeight: 600 }}>
                {BUSINESS_PHONE_DISPLAY}
              </a>
            </p>
            <div className="support-hours">
              <p><strong>Hours (EAT):</strong></p>
              <ul>
                <li>{BUSINESS_HOURS.weekdaysAndSaturday}</li>
                <li>{BUSINESS_HOURS.sunday}</li>
              </ul>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              *Standard local and national call rates apply.
            </p>
          </div>

          <div className="support-card">
            <h2>Store location</h2>
            <p>{BUSINESS_LOCATION.city}</p>
            <p>{BUSINESS_LOCATION.streetAddress}</p>
          </div>

          <div className="support-card">
            <h2>WhatsApp live chat</h2>
            <p>
              Prefer messaging? Chat with us on WhatsApp for quick updates, simple questions and basic product guidance.
            </p>
            <p style={{ marginTop: 10 }}>
              WhatsApp:{' '}
              <a href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={{ color: '#E1261C', fontWeight: 600 }}>
                {BUSINESS_PHONE_DISPLAY}
              </a>
            </p>
            <div className="support-hours">
              <p><strong>Chat hours (EAT):</strong></p>
              <ul>
                <li>{BUSINESS_HOURS.weekdaysAndSaturday}</li>
                <li>{BUSINESS_HOURS.sunday}</li>
              </ul>
            </div>
          </div>

          <div className="support-card">
            <h2>Order &amp; product help</h2>
            <p>
              For detailed questions about a specific order, please have your <strong>order number</strong> ready so we
              can assist you faster.
            </p>
            <p style={{ marginTop: 10 }}>
              You can also manage your orders directly from the{' '}
              <Link to="/orders" style={{ color: '#E1261C', fontWeight: 600 }}>
                My Orders
              </Link>{' '}
              page when signed in.
            </p>
          </div>

          <div className="support-card">
            <h2>More information</h2>
            <p>
              Looking for details about delivery fees, returns or common questions? You might find what you need here:
            </p>
            <ul className="support-links">
              <li>
                <Link to="/delivery" style={{ color: '#E1261C', fontWeight: 600 }}>
                  Delivery Information
                </Link>
              </li>
              <li>
                <Link to="/returns" style={{ color: '#E1261C', fontWeight: 600 }}>
                  Returns &amp; Refunds
                </Link>
              </li>
              <li>
                <Link to="/faq" style={{ color: '#E1261C', fontWeight: 600 }}>
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerSupport;

