import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    DEFAULT_OG_IMAGE,
    SITE_URL,
    SOCIAL_PROFILES,
    SUPPORT_EMAIL,
    SUPPORT_PHONE,
} from '../utils/seo';

const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'CaseProz',
    image: DEFAULT_OG_IMAGE,
    url: SITE_URL,
    telephone: SUPPORT_PHONE,
    email: SUPPORT_EMAIL,
    priceRange: 'KSh',
    description: 'Premium phone cases, Anker chargers, screen protectors and mobile accessories. Fast delivery across Kenya.',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Nairobi CBD',
        addressLocality: 'Nairobi',
        addressRegion: 'Nairobi County',
        postalCode: '00100',
        addressCountry: 'KE',
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: -1.2864,
        longitude: 36.8172,
    },
    openingHoursSpecification: [
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '16:00',
        },
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday'],
            opens: '09:00',
            closes: '12:00',
        },
    ],
    currenciesAccepted: 'KES',
    paymentAccepted: 'Cash, Mobile Money, Card, Pay on Delivery',
    areaServed: {
        '@type': 'Country',
        name: 'Kenya',
    },
    contactPoint: [
        {
            '@type': 'ContactPoint',
            telephone: SUPPORT_PHONE,
            contactType: 'customer support',
            contactOption: 'TollFree',
            areaServed: 'KE',
            availableLanguage: 'English',
        },
        {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@caseproz.co.ke',
            areaServed: 'KE',
            availableLanguage: 'English',
        },
    ],
    sameAs: SOCIAL_PROFILES,
};

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
              <a href="mailto:support@caseproz.co.ke" style={{ color: '#E1261C', fontWeight: 600 }}>
                support@caseproz.co.ke
              </a>
            </p>
          </div>

          <div className="support-card">
            <h2>Phone support</h2>
            <p>Talk directly to our team during business hours for quick help with your order or delivery.</p>
            <p style={{ marginTop: 10 }}>
              Phone:{' '}
              <a href={`tel:${SUPPORT_PHONE}`} style={{ color: '#E1261C', fontWeight: 600 }}>
                +254 794 057 030
              </a>
            </p>
            <div className="support-hours">
              <p><strong>Hours (EAT):</strong></p>
              <ul>
                <li>Monday – Friday: 9:00am – 1:00pm &amp; 2:00pm – 4:00pm</li>
                <li>Saturday: 9:00am – 12:00pm</li>
                <li>Sundays &amp; Public Holidays: Offline</li>
              </ul>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              *Standard local and national call rates apply.
            </p>
          </div>

          <div className="support-card">
            <h2>WhatsApp live chat</h2>
            <p>
              Prefer messaging? Chat with us on WhatsApp for quick updates, simple questions and basic product guidance.
            </p>
            <p style={{ marginTop: 10 }}>
              WhatsApp:{' '}
              <a href={`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`} target="_blank" rel="noreferrer" style={{ color: '#E1261C', fontWeight: 600 }}>
                +254 700 000 000
              </a>
            </p>
            <div className="support-hours">
              <p><strong>Chat hours (EAT):</strong></p>
              <ul>
                <li>Monday – Friday: 9:00am – 1:00pm &amp; 2:00pm – 4:00pm</li>
                <li>Saturday: 9:00am – 12:00pm</li>
                <li>Sundays &amp; Public Holidays: Offline</li>
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

