// store/slices/cookieSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CookiePreferences } from '../../utils/CookieManager';
import { CookieManager } from '../../utils/CookieManager';

interface CookieState {
  hasConsent: boolean;
  showBanner: boolean;
  showPreferences: boolean;
  preferences: CookiePreferences;
}

const initialState: CookieState = {
  hasConsent: CookieManager.getCookieConsent(),
  showBanner: CookieManager.shouldShowBanner(),
  showPreferences: false,
  preferences: CookieManager.getCookiePreferences(),
};

const cookieSlice = createSlice({
  name: 'cookies',
  initialState,
  reducers: {
    setConsent: (state, action: PayloadAction<boolean>) => {
      state.hasConsent = action.payload;
      state.showBanner = false;
      CookieManager.setCookieConsent(action.payload);
    },
    setShowBanner: (state, action: PayloadAction<boolean>) => {
      state.showBanner = action.payload;
    },
    setShowPreferences: (state, action: PayloadAction<boolean>) => {
      state.showPreferences = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<CookiePreferences>) => {
      state.preferences = action.payload;
      CookieManager.setCookiePreferences(action.payload);
    },
    acceptAll: (state) => {
      const allPreferences: CookiePreferences = {
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
      };
      state.preferences = allPreferences;
      state.hasConsent = true;
      state.showBanner = false;
      CookieManager.setCookieConsent(true);
      CookieManager.setCookiePreferences(allPreferences);
    },
    rejectAll: (state) => {
      const minimalPreferences: CookiePreferences = {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
      state.preferences = minimalPreferences;
      state.hasConsent = true;
      state.showBanner = false;
      CookieManager.setCookieConsent(true);
      CookieManager.setCookiePreferences(minimalPreferences);
    },
  },
});

export const {
  setConsent,
  setShowBanner,
  setShowPreferences,
  updatePreferences,
  acceptAll,
  rejectAll,
} = cookieSlice.actions;

export default cookieSlice.reducer;