import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { useEffect, useState, ChangeEvent, FormEvent, ComponentType } from 'react';
import { toast } from 'react-toastify';

// Redux Imports
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { loginUser } from '../store/thunk/authThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconMail from '../components/Icon/IconMail';
import IconEye from '../components/Icon/IconEye';
import { FaEyeSlash } from 'react-icons/fa';
import { fetchSubscriptionStatus } from '../store/thunk/subscriptionThunks';
const FaEyeSlashTyped = FaEyeSlash as ComponentType<{ className?: string }>;

const Login = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();

    // Select state from Redux store
    const { loading } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Component state
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [flag, setFlag] = useState(locale);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Login'));
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
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(loginUser(formData)).unwrap();

            // 2. AFTER successful login, immediately check subscription status
            const statusResult = await dispatch(fetchSubscriptionStatus()).unwrap();

            toast.success('Login successful!');

            // 3. DECIDE where to redirect the user
            if (statusResult.hasActiveSubscription) {
                navigate('/dashboard'); // User has a plan, go to the dashboard
            } else {
                navigate('/subscriptions'); // New or expired user, guide them to pick a plan
            }
        } catch (error: any) {
            toast.error(error || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <Link to="/" className="w-48 block lg:w-72 ms-10">
                                <img src="/logo-white.png" alt="Logo" className="w-full" />
                            </Link>
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/login.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                            <Link to="/" className="w-8 block lg:hidden">
                                <img src="/assets/images/logo.svg" alt="Logo" className="mx-auto w-10" />
                            </Link>
                            <div className="dropdown ms-auto w-max">
                                <Dropdown
                                    offset={[0, 8]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                    button={
                                        <>
                                            <div>
                                                <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="image" className="h-5 w-5 rounded-full object-cover" />
                                            </div>
                                            <div className="text-base font-bold uppercase">{flag}</div>
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
                                                    className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
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
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign In</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your email and password to login</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="Enter Email"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute end-4 top-1/2 -translate-y-1/2">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter Password"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        {/* Eye Icon Button */}
                                        <button type="button" className="absolute end-4 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <FaEyeSlashTyped /> : <IconEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <Link to="/reset-password" className="text-sm text-white-dark hover:text-primary">
                                        Forgot Your Password?
                                    </Link>
                                </div>
                                <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={loading}>
                                    {loading ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 ltr:mr-4 rtl:ml-4 inline-block"></span> : 'Sign In'}
                                </button>
                            </form>
                            <div className="text-center mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-primary font-semibold hover:underline hover:text-primary-dark dark:hover:text-primary-light transition-colors">
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. E-sign All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
