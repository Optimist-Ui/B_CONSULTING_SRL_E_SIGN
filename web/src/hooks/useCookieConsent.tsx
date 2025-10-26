// hooks/useCookieConsent.ts
import { useSelector } from 'react-redux';
import { IRootState } from '../store/index';
import { CookieManager } from '../utils/CookieManager';

export const useCookieConsent = () => {
    const { hasConsent, preferences } = useSelector((state: IRootState) => state.cookies);

    const canUseAnalytics = hasConsent && preferences.analytics;
    const canUseMarketing = hasConsent && preferences.marketing;
    const canUseFunctional = hasConsent && preferences.functional;

    const trackEvent = (eventName: string, properties?: any) => {
        if (canUseAnalytics) {
            // Your analytics tracking code here
            console.log('Tracking event:', eventName, properties);
            // Example: gtag('event', eventName, properties);
        }
    };

    return {
        hasConsent,
        preferences,
        canUseAnalytics,
        canUseMarketing,
        canUseFunctional,
        trackEvent,
    };
};