import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { useEffect, useState, FormEvent, ChangeEvent, ComponentType } from 'react';
import { toast } from 'react-toastify';

// Redux Imports for Authentication
import { signupUser } from '../store/thunk/authThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconUser from '../components/Icon/IconUser';
import IconMail from '../components/Icon/IconMail';
import IconEye from '../components/Icon/IconEye';
import { FaEyeSlash } from 'react-icons/fa';
const FaEyeSlashTyped = FaEyeSlash as ComponentType<{ className?: string }>;

const Register = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();

    // Selectors for Redux state
    const { loading } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Component state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });

    const [flag, setFlag] = useState(locale);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Register'));
        setIsVisible(true);
    }, [dispatch]);

    // Handlers
    const setLocale = (newFlag: string) => {
        setFlag(newFlag);
        i18next.changeLanguage(newFlag);
        dispatch(toggleRTL(newFlag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        // Validate password length
        if (id === 'password') {
            if (value.length > 0 && value.length < 6) {
                setPasswordError('Password must be at least 6 characters');
            } else {
                setPasswordError('');
            }
        }
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const resultAction = await dispatch(signupUser(formData)).unwrap();
            toast.success(resultAction.message || 'Registration successful!');
            navigate('/pending-verification');
        } catch (error: any) {
            toast.error(error || 'Registration failed. Please try again.');
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

                                <p className="text-xl text-gray-300 leading-relaxed">Join thousands of businesses that trust our platform for secure electronic signatures.</p>

                                {/* Feature highlights */}
                                <div className="space-y-4 pt-8">
                                    {[
                                        { icon: '🚀', title: 'Quick Setup', desc: 'Get started in minutes' },
                                        { icon: '🔐', title: 'Secure & Compliant', desc: 'Industry-standard security' },
                                        { icon: '💼', title: 'Business Ready', desc: 'Enterprise features included' },
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

                    {/* Right side - Register Form */}
                    <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Sign Up</h2>
                                    <p className="text-gray-300">Create your account to get started.</p>
                                </div>

                                {/* Language Dropdown */}
                                <div className="dropdown ms-auto w-max">
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

                            {/* Form */}
                            <form onSubmit={submitForm} className="space-y-5">
                                {/* First Name Input */}
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="text-white font-medium block">
                                        First Name
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="firstName"
                                            type="text"
                                            placeholder="Enter your first name"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                            <IconUser fill={true} />
                                        </span>
                                    </div>
                                </div>

                                {/* Last Name Input */}
                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="text-white font-medium block">
                                        Last Name
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="lastName"
                                            type="text"
                                            placeholder="Enter your last name"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                            <IconUser fill={true} />
                                        </span>
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-white font-medium block">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-white font-medium block">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a password (min. 6 characters)"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 pr-12 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                            value={formData.password}
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

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || passwordError !== '' || formData.password.length < 6}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 inline-block"></span>
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Account</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Sign In Link */}
                            <div className="mt-8 text-center">
                                <p className="text-gray-300">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300">
                                        Sign In
                                    </Link>
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">© {new Date().getFullYear()} i-sign.eu. All Rights Reserved.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
