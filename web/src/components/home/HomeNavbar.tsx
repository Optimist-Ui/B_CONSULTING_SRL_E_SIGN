import React, { useState, useEffect, ComponentType } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IRootState, AppDispatch } from '../../store/index';
import { logout } from '../../store/slices/authSlice';
import { FiLogIn, FiUserPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useSubscription } from '../../store/hooks/useSubscription';
import { resetSubscriptionState } from '../../store/slices/subscriptionSlice';

const FiXTyped = FiX as ComponentType<{ className?: string }>;
const FiUserPlusTyped = FiUserPlus as ComponentType<{ className?: string }>;
const FiLogInTyped = FiLogIn as ComponentType<{ className?: string }>;

const HomeNavbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    // Get authentication status from the Redux store
    const { isAuthenticated } = useSelector((state: IRootState) => state.auth);

    const { hasActiveSubscription } = useSubscription({
        autoFetchStatus: isAuthenticated, // Only fetch if the user is authenticated
        fetchOnMount: true,
    });

    useEffect(() => {
        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string): void => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
        setIsMenuOpen(false);
    };

    const scrollToTop = (): void => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const handleDashboardNavigation = () => {
        // This function decides the correct destination
        if (hasActiveSubscription) {
            navigate('/dashboard');
        } else {
            navigate('/subscriptions');
        }
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setAuthModalOpen(false);
    };

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetSubscriptionState());
        toast.success("You've been logged out successfully.");
        setIsMenuOpen(false);
        navigate('/');
    };

    // Render action buttons based on authentication status
    const renderAuthButtons = () => {
        if (isAuthenticated) {
            return (
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDashboardNavigation}
                        className="bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg text-sm lg:text-base"
                    >
                        Dashboard
                    </button>
                    <button onClick={handleLogout} className="hidden md:block text-gray-300 hover:text-white transition-colors">
                        Logout
                    </button>
                </div>
            );
        }
        return (
            <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm lg:text-base"
            >
                Get Started
            </button>
        );
    };

    const renderMobileAuthButtons = () => {
        if (isAuthenticated) {
            return (
                <>
                    <button onClick={handleDashboardNavigation} className="bg-blue-500 text-white font-medium block px-3 py-3 text-base text-center w-full rounded-md transition-all duration-200">
                        Go to Dashboard
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 mt-1 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                    >
                        Logout
                    </button>
                </>
            );
        }
        return (
            <button
                onClick={() => {
                    setAuthModalOpen(true);
                    setIsMenuOpen(false);
                }}
                className="bg-blue-500 text-white font-medium block px-3 py-3 text-base text-center w-full rounded-md transition-all duration-200 mt-2"
            >
                Login / Register
            </button>
        );
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-slate-900/90'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo - left Side */}
                        <div className="flex-shrink-0 cursor-pointer" onClick={scrollToTop}>
                            {/* <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                        <path d="M14 2v6h6" />
                                        <path d="M16 13H8" />
                                        <path d="M16 17H8" />
                                        <path d="M10 9H8" />
                                    </svg>
                                </div>
                                <span className="text-xl lg:text-2xl font-bold text-white">
                                    E<span className="text-blue-400">-Sign</span>
                                </span>
                            </div> */}
                            <img src="/logo-white.png" alt="logo" className='w-36' />
                        </div>

                        {/* Desktop Navigation - right Side */}
                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-8">
                                <button
                                    onClick={() => scrollToTop()}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    Home
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => scrollToSection('pricing')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    Pricing
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => scrollToSection('about')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    About
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => scrollToSection('faq')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    FAQ
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                                <button
                                    onClick={() => navigate('/terms-of-use')}
                                    className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm lg:text-base font-medium transition-colors duration-200 relative group"
                                >
                                    Terms & Privacy
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-200"></span>
                                </button>
                            </div>
                        </div>

                        {/* Auth buttons - Right side */}
                        <div className="hidden md:block">{renderAuthButtons()}</div>

                        {/* Mobile menu button - Center for mobile */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800/50 backdrop-blur-sm rounded-b-lg mt-2">
                            <button
                                onClick={() => scrollToSection('pricing')}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => scrollToSection('about')}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                About
                            </button>
                            <button
                                onClick={() => scrollToSection('faq')}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                FAQ
                            </button>
                            <button
                                onClick={() => {
                                    navigate('/terms-of-use');
                                    setIsMenuOpen(false);
                                }}
                                className="text-gray-300 hover:text-blue-400 hover:bg-slate-700/50 block px-3 py-2 text-base font-medium w-full text-left rounded-md transition-all duration-200"
                            >
                                Terms & Privacy
                            </button>
                            <div className="border-t border-slate-700/50 my-2"></div>
                            {renderMobileAuthButtons()}
                        </div>
                    </div>
                </div>
            </nav>
            {/* Authentication Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div
                        className={`bg-slate-800 rounded-2xl shadow-2xl p-8 lg:p-10 w-full max-w-md transform transition-all duration-300 ${
                            isAuthModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Join Us</h2>
                            <button onClick={() => setAuthModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <FiXTyped className="w-7 h-7" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-8 text-center">Choose an option to continue and manage your documents.</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => handleNavigation('/login')}
                                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                            >
                                <FiLogInTyped />
                                Login to Your Account
                            </button>
                            <button
                                onClick={() => handleNavigation('/register')}
                                className="w-full flex items-center justify-center gap-3 bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-slate-600 transition-all duration-300"
                            >
                                <FiUserPlusTyped />
                                Create a New Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HomeNavbar;
