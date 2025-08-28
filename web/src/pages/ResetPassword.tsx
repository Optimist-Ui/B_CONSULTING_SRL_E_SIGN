import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { toast } from 'react-toastify';

// Redux Imports
import { setPageTitle, toggleRTL } from '../store/slices/themeConfigSlice';
import { verifyResetToken, resetPassword } from '../store/thunk/authThunks';

// Component and Icon Imports
import Dropdown from '../components/Dropdown';
import i18next from 'i18next';
import IconCaretDown from '../components/Icon/IconCaretDown';
import IconLockDots from '../components/Icon/IconLockDots';
import IconCircleCheck from '../components/Icon/IconCircleCheck';
import IconXCircle from '../components/Icon/IconXCircle';

const ResetPassword = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();

    // Redux State Selectors
    const { loading, isTokenVerified, error: reduxError } = useSelector((state: IRootState) => state.auth);
    const { rtlClass, locale, languageList } = useSelector((state: IRootState) => state.themeConfig);
    const isRtl = rtlClass === 'rtl';

    // Local Component State
    type Phase = 'verifying' | 'success' | 'form' | 'error';
    const [phase, setPhase] = useState<Phase>('verifying');
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [flag, setFlag] = useState(locale);

    // Effect to verify the token on component load
    useEffect(() => {
        dispatch(setPageTitle('Reset Password'));
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

        // When not loading, decide the phase
        if (!loading) {
            if (isTokenVerified) {
                setPhase('success');
                // After showing success, move to the form
                timer = setTimeout(() => {
                    setPhase('form');
                }, 1500); // Show success message for 1.5 seconds
            } else if (reduxError) {
                // If there's an error from verification, show the error phase
                setPhase('error');
            }
        }

        // Cleanup the timer if the component unmounts
        return () => clearTimeout(timer);
    }, [loading, isTokenVerified, reduxError]);

    // Form and UI handlers
    const setLocale = (newFlag: string) => {
        setFlag(newFlag);
        i18next.changeLanguage(newFlag);
        dispatch(toggleRTL(newFlag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
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
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="animate-spin border-4 border-transparent border-l-primary rounded-full w-14 h-14 mb-5"></span>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Verifying Link</h2>
                        <p className="text-white-dark">Please wait while we check your password reset link...</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-green-500 mb-5">
                            <IconCircleCheck className="w-16 h-16" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Verification Successful!</h2>
                        <p className="text-white-dark">Please wait, loading the form...</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-danger mb-5">
                            <IconXCircle className="w-16 h-16" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 text-danger">Invalid or Expired Link</h2>
                        <p className="text-white-dark mb-6">{reduxError || 'The password reset link is not valid. It may have been used already or has expired.'}</p>
                        <Link to="/login" className="btn btn-gradient !mt-6 w-full border-0 uppercase">
                            Back to Login
                        </Link>
                    </div>
                );
            case 'form':
                return (
                    <>
                        <div className="mb-7">
                            <h1 className="mb-3 text-2xl font-bold !leading-snug dark:text-white">Create New Password</h1>
                            <p className="text-white-dark">Please enter your new password below.</p>
                        </div>
                        <form className="space-y-5" onSubmit={submitForm}>
                            <div>
                                <label htmlFor="newPassword">New Password</label>
                                <div className="relative text-white-dark">
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        placeholder="Enter New Password"
                                        className="form-input ps-10"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                        <IconLockDots fill={true} />
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="relative text-white-dark">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm New Password"
                                        className="form-input ps-10"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                        <IconLockDots fill={true} />
                                    </span>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase" disabled={loading}>
                                {loading ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5 ltr:mr-4 rtl:ml-4 inline-block"></span> : 'Reset Password'}
                            </button>
                        </form>
                    </>
                );
            default:
                return null;
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
                                <img src="/assets/images/auth/logo-white.svg" alt="Logo" className="w-full" />
                            </Link>
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/reset-password.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
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
                                                    <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />{' '}
                                                    <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="w-full max-w-[440px] lg:mt-16">{renderContent()}</div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. E-sign All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
