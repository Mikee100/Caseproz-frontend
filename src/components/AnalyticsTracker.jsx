import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

const isTrackablePath = (pathname) => {
    if (pathname.startsWith('/admin')) return false;
    if (/^\/(login|register|complete-profile|forgot-password|reset-password|verify|profile|orders)(\/|$)/.test(pathname)) return false;
    if (/^\/order\/[^/]+/.test(pathname)) return false;
    return true;
};

const AnalyticsTracker = () => {
    const { pathname } = useLocation();
    const lastPageView = useRef('');

    useEffect(() => {
        if (!isTrackablePath(pathname)) return undefined;

        if (lastPageView.current !== pathname) {
            trackEvent('page_view', { page: pathname });
            lastPageView.current = pathname;
        }

        let intervalStart = performance.now();
        let engagedMilliseconds = 0;
        const flushEngagement = () => {
            const now = performance.now();
            engagedMilliseconds += Math.max(0, now - intervalStart);
            intervalStart = now;
            const durationSeconds = Math.floor(engagedMilliseconds / 1000);
            if (durationSeconds >= 2) {
                trackEvent('page_engagement', {
                    page: pathname,
                    metadata: { durationSeconds },
                });
                engagedMilliseconds = 0;
            }
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushEngagement();
            else intervalStart = performance.now();
        };
        const sentScrollDepth = new Set();
        const onScroll = () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollableHeight <= 0) return;
            const depth = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));
            [25, 50, 75, 100].forEach((threshold) => {
                if (depth >= threshold && !sentScrollDepth.has(threshold)) {
                    sentScrollDepth.add(threshold);
                    trackEvent('scroll_depth', { page: pathname, metadata: { percentage: threshold } });
                }
            });
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            flushEngagement();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('scroll', onScroll);
        };
    }, [pathname]);

    useEffect(() => {
        const onClick = (event) => {
            if (!isTrackablePath(pathname) || !(event.target instanceof Element)) return;
            const control = event.target.closest('a, button, [role="button"], input[type="submit"]');
            if (!control || control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true') return;

            const href = control.getAttribute('href');
            let destination = '';
            let destinationType = '';
            if (href) {
                try {
                    const url = new URL(href, window.location.origin);
                    destination = url.origin === window.location.origin ? url.pathname : url.hostname;
                    destinationType = url.origin === window.location.origin ? 'internal' : 'external';
                } catch {
                    destination = 'unknown';
                }
            }
            const label = control.dataset.analyticsLabel || control.getAttribute('aria-label') || control.getAttribute('title') || '';
            trackEvent('ui_click', {
                page: pathname,
                metadata: {
                    element: control.tagName.toLowerCase(),
                    label: label.slice(0, 80),
                    destination,
                    destinationType,
                    controlId: (control.id || '').slice(0, 80),
                },
            });
        };

        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, [pathname]);

    return null;
};

export default AnalyticsTracker;