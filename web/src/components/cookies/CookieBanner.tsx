// components/CookieBanner.tsx
import React, { ComponentType } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IRootState, AppDispatch } from '../../store/index';
import { acceptAll, rejectAll, setShowPreferences } from '../..//store/slices/cookieSlice';
import { FiShield, FiSettings, FiX } from 'react-icons/fi';

const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiSettingsTyped = FiSettings as ComponentType<{ className?: string }>;
const FiShieldTyped = FiShield as ComponentType<{ className?: string }>;

const CookieBanner: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showBanner } = useSelector((state: IRootState) => state.cookies);

  if (!showBanner) {
    return null;
  }

  const handleAcceptAll = () => {
    dispatch(acceptAll());
  };

  const handleRejectAll = () => {
    dispatch(rejectAll());
  };

  const handleCustomize = () => {
    dispatch(setShowPreferences(true));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Icon and Content */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FiShieldTyped className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-gray-300 text-sm lg:text-base leading-relaxed mb-4 lg:mb-0">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies. You can customize your preferences at any time.
                  </p>
                  <button
                    onClick={() => window.open('/cookie-policy', '_blank')}
                    className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors duration-200"
                  >
                    Read our Privacy Policy
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={handleCustomize}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 border border-slate-600/50"
              >
                <FiSettingsTyped className="w-4 h-4" />
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="px-6 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg font-medium transition-all duration-200"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;