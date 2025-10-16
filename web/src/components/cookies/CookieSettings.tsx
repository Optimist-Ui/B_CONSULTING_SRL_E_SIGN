// components/CookieSettings.tsx
import React, { ComponentType } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IRootState, AppDispatch } from '../../store/index';
import { setShowPreferences } from '../../store/slices/cookieSlice';
import { CookieManager } from '../../utils/CookieManager';
import { FiShield, FiSettings, FiTrash2, FiInfo } from 'react-icons/fi';

const FiInfoTyped = FiInfo as ComponentType<{ className?: string }>;
const FiTrash2Typed = FiTrash2 as ComponentType<{ className?: string }>;
const FiSettingsTyped = FiSettings as ComponentType<{ className?: string }>;
const FiShieldTyped = FiShield as ComponentType<{ className?: string }>;

const CookieSettings: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { hasConsent, preferences } = useSelector((state: IRootState) => state.cookies);

    const handleOpenPreferences = () => {
        dispatch(setShowPreferences(true));
    };

    const handleClearAllData = () => {
        if (window.confirm('Are you sure you want to clear all cookie data? This action cannot be undone.')) {
            localStorage.clear();
            sessionStorage.clear();
            // Clear all cookies
            document.cookie.split(';').forEach((c) => {
                const eqPos = c.indexOf('=');
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            });
            window.location.reload();
        }
    };

    const consentTimestamp = CookieManager.getConsentTimestamp();

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">Cookie Settings</h5>
            </div>

            <div className="space-y-4">
                {/* Consent Status */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <FiShieldTyped className={`w-5 h-5 ${hasConsent ? 'text-green-500' : 'text-orange-500'}`} />
                        <div>
                            <h6 className="font-medium text-dark dark:text-white-light">Consent Status: {hasConsent ? 'Granted' : 'Not Granted'}</h6>
                            {consentTimestamp && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Last updated: {consentTimestamp.toLocaleDateString()} at {consentTimestamp.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Current Preferences */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <h6 className="font-medium text-dark dark:text-white-light mb-3">Current Cookie Preferences</h6>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Essential</span>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    preferences.necessary ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}
                            >
                                {preferences.necessary ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Functional</span>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    preferences.functional ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}
                            >
                                {preferences.functional ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Analytics</span>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    preferences.analytics ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}
                            >
                                {preferences.analytics ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Marketing</span>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    preferences.marketing ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}
                            >
                                {preferences.marketing ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleOpenPreferences} className="btn btn-primary flex items-center gap-2">
                        <FiSettingsTyped className="w-4 h-4" />
                        Manage Cookie Preferences
                    </button>
                    <button onClick={handleClearAllData} className="btn btn-danger flex items-center gap-2">
                        <FiTrash2Typed className="w-4 h-4" />
                        Clear All Data
                    </button>
                </div>
                {/* Information */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FiInfoTyped className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">About Cookies</p>
                        <p>
                            Cookies help us provide you with a better experience. You can change your preferences at any time, but please note that disabling certain cookies may affect the
                            functionality of our platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieSettings;
