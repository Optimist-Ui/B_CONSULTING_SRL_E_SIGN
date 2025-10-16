// src/pages/auth/VerifyEmail.tsx
import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { verifyEmail } from '../store/thunk/authThunks';
import { setPageTitle } from '../store/slices/themeConfigSlice';

// Component and Icon Imports
import IconCircleCheck from '../components/Icon/IconCircleCheck';
import IconXCircle from '../components/Icon/IconXCircle';

const VerifyEmail = () => {
    const dispatch: AppDispatch = useDispatch();
    const { token } = useParams<{ token: string }>();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const effectRan = useRef(false);

    useEffect(() => {
        dispatch(setPageTitle('Verifying Email...'));
        setIsVisible(true);

        // Prevents double-execution in development (React 18 Strict Mode)
        if (effectRan.current === true) {
            return;
        }

        if (token) {
            dispatch(verifyEmail(token))
                .unwrap()
                .then((response) => {
                    setStatus('success');
                    setMessage(response.message || 'Email verified successfully! You may now log in.');
                })
                .catch((error) => {
                    setStatus('error');
                    setMessage(error || 'The link is invalid or has expired.');
                });
        } else {
            setStatus('error');
            setMessage('No verification token was found. The link is incomplete.');
        }

        // Mark the effect as having run
        return () => {
            effectRan.current = true;
        };
    }, [dispatch, token]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                            <div className="animate-spin border-4 border-blue-500/30 border-t-blue-500 rounded-full w-16 h-16"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-white">Verifying Account</h2>
                        <p className="text-gray-300 text-lg">Please wait while we activate your account...</p>
                        <div className="mt-6 flex gap-1">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-8 relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative text-green-400">
                                <IconCircleCheck className="w-20 h-20" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-white">Account Activated!</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md">{message}</p>
                        <Link
                            to="/login"
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 transform flex items-center justify-center gap-2"
                        >
                            <span>Proceed to Login</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-8 relative">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative text-red-400">
                                <IconXCircle className="w-20 h-20" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-red-400">Verification Failed</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md">{message}</p>
                        <Link
                            to="/register"
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform flex items-center justify-center gap-2"
                        >
                            <span>Back to Registration</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
            </div>

            {/* Floating particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '500ms' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '700ms' }}></div>

            <div className="relative w-full max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left side - Branding */}
                    <div className={`hidden lg:block transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
                            <div className="space-y-8">
                                <div>
                                    <Link to="/" className="block">
                                        <h2 className="text-5xl font-bold text-white mb-4">Welcome to</h2>
                                        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                    </Link>
                                </div>

                                <p className="text-xl text-gray-300 leading-relaxed">Verify your email and start signing documents securely with our trusted platform.</p>

                                {/* Feature highlights */}
                                <div className="space-y-4 pt-8">
                                    {[
                                        { icon: '✉️', title: 'Email Verification', desc: 'Secure account setup' },
                                        { icon: '⚡', title: 'Instant Access', desc: 'Start signing immediately' },
                                        { icon: '🔐', title: 'Protected Account', desc: 'Your data is safe' },
                                    ].map((feature, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 transform"
                                        >
                                            <div className="text-3xl">{feature.icon}</div>
                                            <div>
                                                <h3 className="text-white font-semibold">{feature.title}</h3>
                                                <p className="text-gray-400 text-sm">{feature.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Verification Status */}
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-8">
                                <Link to="/">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                </Link>
                            </div>

                            {/* Content */}
                            <div className="min-h-[400px] flex items-center justify-center">{renderContent()}</div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">© {new Date().getFullYear()} i-sign.eu. All Rights Reserved.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
