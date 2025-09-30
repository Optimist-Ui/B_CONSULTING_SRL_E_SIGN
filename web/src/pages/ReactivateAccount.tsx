// src/pages/auth/ReactivateAccount.tsx (new component, similar to VerifyEmail)
import { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { reactivateAccount } from '../store/thunk/authThunks';
import { setPageTitle } from '../store/slices/themeConfigSlice';

// Component and Icon Imports
import IconCircleCheck from '../components/Icon/IconCircleCheck';
import IconXCircle from '../components/Icon/IconXCircle';

const ReactivateAccount = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    const effectRan = useRef(false);

    useEffect(() => {
        dispatch(setPageTitle('Reactivating Account...'));

        if (effectRan.current === true) {
            return;
        }

        if (token) {
            dispatch(reactivateAccount(token))
                .unwrap()
                .then((response) => {
                    setStatus('success');
                    setMessage(response.message || 'Account reactivated successfully! You may now log in.');
                    setTimeout(() => navigate('/login'), 3000); // Optional auto-redirect
                })
                .catch((error) => {
                    setStatus('error');
                    setMessage(error || 'The link is invalid or has expired.');
                });
        } else {
            setStatus('error');
            setMessage('No reactivation token was found. The link is incomplete.');
        }

        return () => {
            effectRan.current = true;
        };
    }, [dispatch, token, navigate]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <span className="animate-spin border-4 border-transparent border-l-primary rounded-full w-14 h-14 mb-5"></span>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Reactivating Account...</h2>
                        <p className="text-white-dark">Please wait, we are reactivating your account.</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-green-500 mb-5">
                            <IconCircleCheck className="w-16 h-16" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Account Reactivated!</h2>
                        <p className="text-white-dark mb-6">{message}</p>
                        <Link to="/login" className="btn btn-gradient !mt-6 w-full border-0 uppercase">
                            Proceed to Login
                        </Link>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-danger mb-5">
                            <IconXCircle className="w-16 h-16" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 text-danger">Reactivation Failed</h2>
                        <p className="text-white-dark mb-6">{message}</p>
                        <Link to="/login" className="btn btn-gradient !mt-6 w-full border-0 uppercase">
                            Back to Login
                        </Link>
                    </div>
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
                        <div className="w-full max-w-[440px] lg:mt-16">{renderContent()}</div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. E-sign All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReactivateAccount;