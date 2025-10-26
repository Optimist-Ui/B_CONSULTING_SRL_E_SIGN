// components/CookiePreferencesModal.tsx
import React, { ComponentType, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IRootState, AppDispatch } from '../../store/index';
import { setShowPreferences, updatePreferences, setConsent } from '../..//store/slices/cookieSlice';
import { CookiePreferences, CookieConfig } from '../../utils/CookieManager';
import { FiX, FiShield, FiBarChart, FiTarget, FiSettings } from 'react-icons/fi';


const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiSettingsTyped = FiSettings as ComponentType<{ className?: string }>;
const FiBarChartTyped = FiBarChart as ComponentType<{ className?: string }>;
const FiTargetTyped = FiTarget as ComponentType<{ className?: string }>;
const FiShieldTyped = FiShield as ComponentType<{ className?: string }>;

const cookieConfigs: CookieConfig[] = [
  {
    name: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be disabled.',
    category: 'necessary',
    purpose: 'Authentication, security, and basic website functionality',
    expiry: 'Session / 1 year',
    provider: 'E-Sign Platform',
  },
  {
    name: 'Functional Cookies',
    description: 'These cookies enable enhanced functionality and personalization.',
    category: 'functional',
    purpose: 'Remember your preferences, language settings, and improve user experience',
    expiry: '1 year',
    provider: 'E-Sign Platform',
  },
  {
    name: 'Analytics Cookies',
    description: 'These cookies help us understand how you interact with our website.',
    category: 'analytics',
    purpose: 'Analyze website traffic, user behavior, and improve our services',
    expiry: '2 years',
    provider: 'Google Analytics',
  },
  {
    name: 'Marketing Cookies',
    description: 'These cookies are used to deliver relevant advertisements to you.',
    category: 'marketing',
    purpose: 'Personalized advertising and social media integration',
    expiry: '1 year',
    provider: 'Facebook, Google Ads',
  },
];

const CookiePreferencesModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showPreferences, preferences } = useSelector((state: IRootState) => state.cookies);
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);

  if (!showPreferences) {
    return null;
  }

  const handleClose = () => {
    dispatch(setShowPreferences(false));
  };

  const handleSave = () => {
    dispatch(updatePreferences(localPreferences));
    dispatch(setConsent(true));
    dispatch(setShowPreferences(false));
  };

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Can't disable necessary cookies
    
    setLocalPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'necessary':
        return <FiShieldTyped className="w-5 h-5 text-green-400" />;
      case 'functional':
        return <FiSettingsTyped className="w-5 h-5 text-blue-400" />;
      case 'analytics':
        return <FiBarChartTyped className="w-5 h-5 text-purple-400" />;
      case 'marketing':
        return <FiTargetTyped className="w-5 h-5 text-orange-400" />;
      default:
        return <FiShieldTyped className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage your cookie settings and privacy preferences
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
          >
            <FiXTyped className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {cookieConfigs.map((config) => (
              <div key={config.category} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getIcon(config.category)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{config.description}</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center">
                    <button
                      onClick={() => handleToggle(config.category)}
                      disabled={config.category === 'necessary'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        localPreferences[config.category]
                          ? 'bg-blue-600'
                          : 'bg-slate-600'
                      } ${config.category === 'necessary' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localPreferences[config.category] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Cookie Details */}
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Purpose:</span>
                    <span className="text-gray-300">{config.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiry:</span>
                    <span className="text-gray-300">{config.expiry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="text-gray-300">{config.provider}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
            <h4 className="text-white font-semibold mb-2">Why do we use cookies?</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              Cookies help us provide you with a better experience by remembering your preferences, 
              keeping you signed in, and helping us understand how you use our platform. You can 
              change these settings at any time, but please note that disabling certain cookies 
              may affect the functionality of our service.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-slate-700/50 bg-slate-800/30">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setLocalPreferences({
                necessary: true,
                functional: false,
                analytics: false,
                marketing: false,
              });
            }}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            Reject All
          </button>
          <button
            onClick={() => {
              setLocalPreferences({
                necessary: true,
                functional: true,
                analytics: true,
                marketing: true,
              });
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
          >
            Accept All
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferencesModal;