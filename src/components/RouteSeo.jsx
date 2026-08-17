import React from 'react';
import { useLocation } from 'react-router-dom';
import SeoMeta from './SeoMeta';

const routeMeta = (pathname) => {
    if (pathname.startsWith('/admin')) {
        return {
            title: 'Admin | CaseProz Kenya',
            description: 'CaseProz administration area.',
            noIndex: true,
        };
    }

    if (pathname === '/cart') {
        return {
            title: 'Your Cart | CaseProz Kenya',
            description: 'Review items in your cart and continue to secure checkout at CaseProz Kenya.',
            noIndex: true,
        };
    }

    if (pathname === '/checkout') {
        return {
            title: 'Checkout | CaseProz Kenya',
            description: 'Complete your order securely with delivery options and trusted payment methods.',
            noIndex: true,
        };
    }

    if (pathname === '/contact') {
        return {
            title: 'Contact CaseProz | Support, Sales & Bulk Orders',
            description: 'Contact CaseProz for order support, product questions, and bulk purchase inquiries in Kenya.',
            image: '/og-contact.png',
            noIndex: false,
        };
    }

    if (pathname === '/delivery') {
        return {
            title: 'Delivery Information | CaseProz Kenya',
            description: 'See CaseProz delivery timelines, coverage zones, and shipping costs across Kenya.',
            image: '/og-delivery.png',
            noIndex: false,
        };
    }

    if (pathname === '/returns') {
        return {
            title: 'Returns & Refunds Policy | CaseProz Kenya',
            description: 'Read CaseProz returns, exchanges and refunds policy for purchases in Kenya.',
            image: '/og-returns.png',
            noIndex: false,
        };
    }

    if (pathname === '/faq') {
        return {
            title: 'FAQs | CaseProz Kenya',
            description: 'Find answers about delivery, payments, returns, warranties and account support at CaseProz.',
            image: '/og-faq.png',
            noIndex: false,
        };
    }

    if (pathname === '/customer-support') {
        return {
            title: 'Customer Support | CaseProz Kenya',
            description: 'Reach CaseProz customer support by phone, WhatsApp or email for order and delivery help.',
            noIndex: false,
        };
    }

    if (pathname.startsWith('/login')) {
        return {
            title: 'Login | CaseProz Kenya',
            description: 'Sign in to your CaseProz account to track orders, manage profile and checkout faster.',
            noIndex: true,
        };
    }

    if (pathname.startsWith('/register')) {
        return {
            title: 'Create Account | CaseProz Kenya',
            description: 'Create your CaseProz account for faster checkout, order tracking and saved favourites.',
            noIndex: true,
        };
    }

    if (pathname.startsWith('/forgot-password')) {
        return {
            title: 'Forgot Password | CaseProz Kenya',
            description: 'Request a password reset link for your CaseProz account.',
            noIndex: true,
        };
    }

    if (pathname.startsWith('/reset-password')) {
        return {
            title: 'Reset Password | CaseProz Kenya',
            description: 'Reset your CaseProz account password securely.',
            noIndex: true,
        };
    }

    if (pathname.startsWith('/verify')) {
        return {
            title: 'Verify Email | CaseProz Kenya',
            description: 'Verify your email to activate your CaseProz account.',
            noIndex: true,
        };
    }

    if (pathname.startsWith('/complete-profile')) {
        return {
            title: 'Complete Profile | CaseProz Kenya',
            description: 'Complete your CaseProz account profile to continue shopping.',
            noIndex: true,
        };
    }

    if (pathname === '/profile') {
        return {
            title: 'My Profile | CaseProz Kenya',
            description: 'Manage your CaseProz profile details, saved address, and account settings.',
            noIndex: true,
        };
    }

    if (pathname === '/orders') {
        return {
            title: 'My Orders | CaseProz Kenya',
            description: 'View and track your CaseProz orders in one place.',
            noIndex: true,
        };
    }

    if (pathname.startsWith('/order/')) {
        return {
            title: 'Order Details | CaseProz Kenya',
            description: 'Check your order status and delivery updates on CaseProz.',
            noIndex: true,
        };
    }

    if (pathname === '/favourites') {
        return {
            title: 'My Wishlist | CaseProz Kenya',
            description: 'Review and manage your saved products on CaseProz.',
            noIndex: true,
        };
    }

    return {
        title: 'CaseProz Kenya | Phone Cases, Accessories & Tech',
        description:
            'Shop premium phone cases, chargers, audio, power and accessories at CaseProz with fast delivery across Kenya.',
        noIndex: false,
    };
};

const RouteSeo = () => {
    const location = useLocation();

    // These routes manage their own dynamic SEO metadata at page level.
    if (
        location.pathname === '/' ||
        location.pathname === '/search' ||
        location.pathname.startsWith('/category/') ||
        location.pathname.startsWith('/brand/') ||
        location.pathname.startsWith('/product/')
    ) {
        return null;
    }

    const meta = routeMeta(location.pathname);

    return (
        <SeoMeta
            title={meta.title}
            description={meta.description}
            canonicalPath={location.pathname}
            image={meta.image}
            noIndex={meta.noIndex}
        />
    );
};

export default RouteSeo;
