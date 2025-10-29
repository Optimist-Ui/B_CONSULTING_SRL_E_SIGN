import React, { useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/themeConfigSlice';
import { IRootState } from '../../store';
import { useSubscription } from '../../store/hooks/useSubscription';

// Import the banner and its CSS
import SubscriptionNotificationBanner from '../subscriptions/SubscriptionNotificationBanner';
import '../../assets/css/sidebar.css';

// Icon imports
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconUser from '../Icon/IconUser';
import IconMenuDocumentation from '../Icon/Menu/IconMenuDocumentation';
import IconUsersGroup from '../Icon/IconUsersGroup';
import IconMenuElements from '../Icon/Menu/IconMenuElements';
import IconCreditCard from '../Icon/IconCreditCard';
import IconLockDots from '../Icon/IconLockDots';
import IconPlus from '../Icon/IconPlus';

// --- Reusable NavItem Component ---
const NavItem: React.FC<{
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    textKey: string; // Changed from 'text' to 'textKey' for clarity
}> = ({ to, icon: Icon, textKey }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { subscriptionStatus } = useSelector((state: IRootState) => state.subscription);
    const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription ?? false;
    const canCreatePackages = subscriptionStatus?.canCreatePackages ?? false;

    let isLocked = false;
    let reason = '';

    const activeSubscriptionRoutes = ['/dashboard', '/my-documents', '/templates', '/contacts'];
    if (activeSubscriptionRoutes.includes(to)) {
        isLocked = !hasActiveSubscription;
        reason = 'active_subscription_required';
    } else if (to === '/add-document') {
        isLocked = !canCreatePackages;
        reason = hasActiveSubscription ? 'package_creation_not_allowed' : 'active_subscription_required';
    }

    const handleClick = (e: React.MouseEvent) => {
        if (isLocked) {
            e.preventDefault();
            navigate('/subscription-required', { state: { from: { pathname: to }, reason } });
        }
    };

    return (
        <li className="nav-item">
            <NavLink to={isLocked ? '#' : to} className={`group ${isLocked ? 'opacity-60' : ''}`} onClick={handleClick}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Icon className="group-hover:!text-primary shrink-0" />
                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t(textKey)}</span>
                    </div>
                    {isLocked && <IconLockDots className="w-5 ms-6 h-5 text-gray-500" />}
                </div>
            </NavLink>
        </li>
    );
};

// --- Main Sidebar Component ---
const Sidebar = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const { subscriptionStatus } = useSubscription({
        autoFetchStatus: true,
        fetchOnMount: true,
    });

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu')?.querySelectorAll('.nav-link')?.[0];
                if (ele) {
                    setTimeout(() => ele.click());
                }
            }
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${
                    semidark ? 'text-white-dark' : ''
                } ${themeConfig.sidebar ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-[260px] rtl:-right-[260px]'} lg:ltr:left-0 lg:rtl:right-0`}
            >
                <div className="bg-white dark:bg-black h-full flex flex-col">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-32 ml-[5px] flex-none" src="/logo-t.png" alt="logo" />
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>

                    <PerfectScrollbar className="relative flex-grow">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <h2 className="py-3 px-4 text-white-dark text-xs font-extrabold uppercase dark:text-gray-500">{t('sidebar.headings.dashboard')}</h2>

                            <NavItem to="/dashboard" icon={IconMenuDocumentation} textKey="sidebar.nav.allDocuments" />
                            <NavItem to="/templates" icon={IconMenuElements} textKey="sidebar.nav.templates" />
                            <NavItem to="/contacts" icon={IconUsersGroup} textKey="sidebar.nav.contacts" />
                            <NavItem to="/add-document" icon={IconPlus} textKey="sidebar.nav.addDocument" />

                            <h2 className="py-3 px-4 text-white-dark text-xs font-extrabold uppercase dark:text-gray-500">{t('sidebar.headings.settings')}</h2>

                            <li className="nav-item">
                                <NavLink to="/subscriptions" className="group">
                                    <div className="flex items-center">
                                        <IconCreditCard className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('sidebar.nav.subscriptions')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/payment-methods" className="group">
                                    <div className="flex items-center">
                                        <IconCreditCard className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('sidebar.nav.paymentMethods')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/profile" className="group">
                                    <div className="flex items-center">
                                        <IconUser className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('sidebar.nav.profile')}</span>
                                    </div>
                                </NavLink>
                            </li>
                        </ul>
                    </PerfectScrollbar>

                    {/* RENDER THE BANNER AT THE BOTTOM */}
                    {subscriptionStatus && <SubscriptionNotificationBanner subscriptionStatus={subscriptionStatus} />}
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
