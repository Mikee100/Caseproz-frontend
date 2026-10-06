const VISITOR_KEY = 'caseproz_visitor_id';
const SESSION_KEY = 'caseproz_session_id';
const ATTRIBUTION_KEY = 'caseproz_session_attribution';

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

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getOrCreateId = (storage, key, fallback = '') => {
    try {
        let id = storage.getItem(key);
        if (!id) {
            id = fallback || createId();
            storage.setItem(key, id);
        }
        return id;
    } catch {
        return createId();
    }
};

const getVisitorId = () => {
    let legacyId = '';
    try {
        legacyId = localStorage.getItem(SESSION_KEY) || '';
    } catch {
        // Storage may be unavailable in private browsing.
    }
    return getOrCreateId(localStorage, VISITOR_KEY, legacyId);
};

const getAttribution = () => {
    try {
        const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
        if (stored) return JSON.parse(stored);

        const params = new URLSearchParams(window.location.search);
        const referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
        const source = (params.get('utm_source') || referrerHost || 'direct').slice(0, 100);
        let medium = params.get('utm_medium') || '';
        if (!medium) {
            if (!referrerHost) medium = 'none';
            else if (/google\.|bing\.|duckduckgo\./i.test(referrerHost)) medium = 'organic';
            else if (/facebook\.|instagram\.|tiktok\.|linkedin\./i.test(referrerHost)) medium = 'social';
            else medium = 'referral';
        }
        const attribution = {
            source,
            medium: String(medium).slice(0, 100),
            campaign: (params.get('utm_campaign') || '').slice(0, 100),
            referrerHost,
        };
        sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
        return attribution;
    } catch {
        return { source: 'unknown', medium: 'unknown', campaign: '', referrerHost: '' };
    }
};

const getDeviceCategory = () => {
    const userAgent = navigator.userAgent || '';
    if (/ipad|tablet|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android/i.test(userAgent)) return 'mobile';
    return 'desktop';
};

export const trackEvent = (eventName, payload = {}) => {
    if (!eventName) return;

    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) return;

    const page = String(payload.page || window.location.pathname).split('?')[0].slice(0, 250);
    const body = {
        eventName,
        page,
        path: page,
        section: payload.section,
        label: payload.label,
        metadata: {
            ...getAttribution(),
            deviceCategory: getDeviceCategory(),
            ...(payload.metadata || {}),
        },
        referrer: document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '',
        visitorId: getVisitorId(),
        sessionId: getOrCreateId(sessionStorage, SESSION_KEY),
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
