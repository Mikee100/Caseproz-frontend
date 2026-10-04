const SESSION_KEY = 'caseproz_session_id';

export const GOOGLE_ADS_ID = 'AW-18230898154';
export const GOOGLE_ADS_CONVERSION_LABELS = {
    getDirections: 'NC9PCOny4YsdEOrblfVD',
};
export const PENDING_PURCHASE_KEY = 'caseprozPendingPurchase';

const gtagSafe = (...args) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
    window.gtag(...args);
    return true;
};

// Standard GA4/Ads ecommerce event; no-ops if gtag.js hasn't loaded (blocked, SSR, prerender).
export const trackGtagEvent = (eventName, params = {}) => {
    if (!eventName) return;
    gtagSafe('event', eventName, params);
};

export const trackAdsConversion = (label, params = {}) => {
    if (!label) return;
    gtagSafe('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${label}`,
        ...params,
    });
};

export const toGtagItems = (cartItems = []) =>
    cartItems.map((item) => ({
        item_id: item.variantSku || item._id,
        item_name: item.name,
        item_variant: item.variantLabel || undefined,
        price: Number(item.price) || 0,
        quantity: item.quantity || 1,
    }));

const getSessionId = () => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(SESSION_KEY, id);
    }
    return id;
};

export const trackEvent = (eventName, payload = {}) => {
    if (!eventName) return;

    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) return;

    const body = {
        eventName,
        page: payload.page || 'home',
        section: payload.section,
        label: payload.label,
        metadata: payload.metadata || {},
        referrer: document.referrer || '',
        sessionId: getSessionId(),
    };

    const endpoint = `${apiBase}/api/analytics/event`;
    const serialized = JSON.stringify(body);

    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([serialized], { type: 'application/json' });
            const queued = navigator.sendBeacon(endpoint, blob);
            if (queued) return;
        }

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: serialized,
            keepalive: true,
            credentials: 'include',
        }).catch(() => {});
    } catch {
        // Swallow analytics errors so tracking never breaks UX.
    }
};
