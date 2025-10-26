// types/cookies.ts
export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConfig {
  name: string;
  description: string;
  category: keyof CookiePreferences;
  purpose: string;
  expiry: string;
  provider: string;
}

// utils/cookieManager.ts
export class CookieManager {
  private static readonly CONSENT_COOKIE = 'esign-cookie-consent';
  private static readonly PREFERENCES_COOKIE = 'esign-cookie-preferences';

  static getCookieConsent(): boolean {
    const consent = localStorage.getItem(this.CONSENT_COOKIE);
    return consent === 'true';
  }

  static setCookieConsent(consent: boolean): void {
    localStorage.setItem(this.CONSENT_COOKIE, consent.toString());
    localStorage.setItem(this.CONSENT_COOKIE + '-timestamp', new Date().toISOString());
  }

  static getCookiePreferences(): CookiePreferences {
    const preferences = localStorage.getItem(this.PREFERENCES_COOKIE);
    if (preferences) {
      return JSON.parse(preferences);
    }
    return {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
  }

  static setCookiePreferences(preferences: CookiePreferences): void {
    localStorage.setItem(this.PREFERENCES_COOKIE, JSON.stringify(preferences));
    this.applyCookiePreferences(preferences);
  }

  static applyCookiePreferences(preferences: CookiePreferences): void {
    // Remove cookies based on preferences
    if (!preferences.analytics) {
      this.removeCookiesByCategory('analytics');
    }
    if (!preferences.marketing) {
      this.removeCookiesByCategory('marketing');
    }
    if (!preferences.functional) {
      this.removeCookiesByCategory('functional');
    }
  }

  private static removeCookiesByCategory(category: string): void {
    // Define cookies by category
    const cookiesByCategory: { [key: string]: string[] } = {
      analytics: ['_ga', '_gat', '_gid', '_gtag'],
      marketing: ['_fbp', '_fbc', 'fr'],
      functional: ['theme-preference', 'language-preference'],
    };

    const cookies = cookiesByCategory[category] || [];
    cookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    });
  }

  static shouldShowBanner(): boolean {
    return !this.getCookieConsent();
  }

  static getConsentTimestamp(): Date | null {
    const timestamp = localStorage.getItem(this.CONSENT_COOKIE + '-timestamp');
    return timestamp ? new Date(timestamp) : null;
  }
}