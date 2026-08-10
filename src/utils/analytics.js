const SESSION_KEY = 'caseproz_session_id';

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
