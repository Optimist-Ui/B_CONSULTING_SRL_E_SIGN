import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { useEffect, useState, FormEvent, ChangeEvent, ComponentType } from 'react';
import { toast } from 'react-toastify';

// Redux Imports
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { verifyResetToken, resetPassword } from '../store/thunk/authThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconCircleCheck from '../components/Icon/IconCircleCheck';
import IconXCircle from '../components/Icon/IconXCircle';
import { FaEyeSlash } from 'react-icons/fa';
import IconEye from '../components/Icon/IconEye';
const FaEyeSlashTyped = FaEyeSlash as ComponentType<{ className?: string }>;

const ResetPassword = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();
    const [showPassword, setShowPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Redux State Selectors
    const { loading, isTokenVerified, error: reduxError } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Local Component State
    type Phase = 'verifying' | 'success' | 'form' | 'error';
    const [phase, setPhase] = useState<Phase>('verifying');
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [flag, setFlag] = useState(locale);
    const [passwordError, setPasswordError] = useState('');

    // Effect to verify the token on component load
    useEffect(() => {
        dispatch(setPageTitle('Reset Password'));
        setIsVisible(true);
        if (token) {
            dispatch(verifyResetToken(token));
        } else {
            toast.error('No reset token provided.');
            navigate('/login');
        }
    }, [dispatch, token, navigate]);

    // Effect to control the UI phase based on Redux state
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (!loading) {
            if (isTokenVerified) {
                setPhase('success');
                timer = setTimeout(() => {
                    setPhase('form');
                }, 1500);
            } else if (reduxError) {
                setPhase('error');
            }
        }

        return () => clearTimeout(timer);
    }, [loading, isTokenVerified, reduxError]);

    // Form and UI handlers
    const setLocale = (newFlag: string) => {
        setFlag(newFlag);
        i18next.changeLanguage(newFlag);
        dispatch(toggleRTL(newFlag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'newPassword') {
            if (value.length > 0 && value.length < 6) {
                setPasswordError('Password must be at least 6 characters');
            } else {
                setPasswordError('');
            }
        }
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (token) {
            try {
                await dispatch(resetPassword({ token, newPassword: formData.newPassword })).unwrap();
                toast.success('Password successfully reset! You can now log in.');
                navigate('/login');
            } catch (err: any) {
                toast.error(err || 'Failed to reset password. The link may have expired.');
            }
        }
    };

    // Dynamically render content based on the current phase
    const renderContent = () => {
        switch (phase) {
            case 'verifying':
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <span className="animate-spin border-4 border-transparent border-l-blue-500 rounded-full w-14 h-14"></span>
                        <h2 className="text-2xl font-bold text-white">Verifying Link</h2>
                        <p className="text-gray-300">Please wait while we check your password reset link...</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative text-green-500">
                                <IconCircleCheck className="w-16 h-16" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verification Successful!</h2>
                        <p className="text-gray-300">Please wait, loading the form...</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative text-red-500">
                                <IconXCircle className="w-16 h-16" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-red-500">Invalid or Expired Link</h2>
                        <p className="text-gray-300">{reduxError || 'The password reset link is not valid. It may have been used already or has expired.'}</p>
                        <Link
                            to="/login"
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform flex items-center justify-center gap-2 mt-4"
                        >
                            Back to Login
                        </Link>
                    </div>
                );
            case 'form':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Create New Password</h2>
                            <p className="text-gray-300">Please enter your new password below.</p>
                        </div>
                        <form className="space-y-5" onSubmit={submitForm}>
                            {/* New Password Input */}
                            <div className="space-y-2">
                                <label htmlFor="newPassword" className="text-white font-medium block">
                                    New Password
                                </label>
                                <div className="relative group">
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password (min. 6 characters)"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                                    >
                                        {showPassword ? <FaEyeSlashTyped className="w-5 h-5" /> : <IconEye />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-white font-medium block">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm new password"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                                    >
                                        {showPassword ? <FaEyeSlashTyped className="w-5 h-5" /> : <IconEye />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || passwordError !== '' || formData.newPassword.length < 6}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                                        <span>Resetting Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Reset Password</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
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

                                <p className="text-xl text-gray-300 leading-relaxed">The most secure and user-friendly electronic signature platform for businesses of all sizes.</p>

                                {/* Feature highlights */}
                                <div className="space-y-4 pt-8">
                                    {[
                                        { icon: '🔒', title: '256-bit Encryption', desc: 'Bank-level security' },
                                        { icon: '⚡', title: '99.9% Uptime', desc: 'Always available' },
                                        { icon: '✓', title: 'Legally Binding', desc: 'Compliant signatures' },
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

                    {/* Right side - Reset Password Form */}
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                            {/* Language Dropdown - Top Right */}
                            <div className="flex justify-end mb-6">
                                <div className="dropdown w-max">
                                    <Dropdown
                                        offset={[0, 8]}
                                        placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                        btnClassName="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-all duration-300"
                                        button={
                                            <>
                                                <div>
                                                    <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="flag" className="h-5 w-5 rounded-full object-cover" />
                                                </div>
                                                <div className="text-sm font-medium uppercase">{flag}</div>
                                                <span className="shrink-0">
                                                    <IconCaretDown />
                                                </span>
                                            </>
                                        }
                                    >
                                        <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                            {languageList.map((item: any) => (
                                                <li key={item.code}>
                                                    <button
                                                        type="button"
                                                        className={`flex w-full hover:text-primary rounded-lg p-2 ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                        onClick={() => setLocale(item.code)}
                                                    >
                                                        <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                        <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-8">
                                <Link to="/">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">i-sign.eu</h1>
                                </Link>
                            </div>

                            {/* Dynamic Content */}
                            {renderContent()}

                            {/* Footer */}
                            <div className="mt-12 pt-6 border-t border-white/10 text-center text-sm text-gray-400">© {new Date().getFullYear()} i-sign.eu. All Rights Reserved.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
