import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/slices/themeConfigSlice';
import { checkAuthStatus } from './store/thunk/authThunks';
import store from './store';
import { ToastContainer } from 'react-toastify';
import CookieBanner from './components/cookies/CookieBanner';
import CookiePreferencesModal from './components/cookies/CookiePreferencesModal';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch: AppDispatch = useDispatch();

    // This effect runs once when the app component mounts
    useEffect(() => {
        dispatch(checkAuthStatus()); // Check for an existing session
    }, [dispatch]);

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleLocale(localStorage.getItem('i18nextLng') || themeConfig.locale));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    }, [dispatch, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    return (
        <div
            className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                themeConfig.rtlClass
            } main-section antialiased relative font-nunito text-sm font-normal`}
        >
            {children}
            
            {/* Cookie Management Components */}
            <CookieBanner />
            <CookiePreferencesModal />

            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </div>
    );
}

export default App;
