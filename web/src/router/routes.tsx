// ===== Updated routes.tsx =====
import { lazy } from 'react';
import ProtectedRoute from '../utils/ProtectedRoute';
import SubscriptionRequiredRoute from '../utils/SubscriptionRequiredRoute';
import PublicRoute from '../utils/PublicRoute';
import PendingVerification from '../pages/PendingVerification';
import VerifyEmail from '../pages/VerifyEmail';
import MyDocuments from '../pages/MyDocuments';
import TemplatesDashboard from '../pages/TemplatesDashboard';
import PackageDashboard from '../pages/PackagesDashboard';
import ParticipantPage from '../pages/ParticipantPage';
import PackageStatusPage from '../pages/PackageStatusPage';
import Home from '../pages/Home';
import CookiePolicyPage from '../pages/CookiePolicyPage';
import PaymentMethods from '../pages/PaymentMethods';
import Subscriptions from '../pages/Subscriptions';
import SubscriptionRequired from '../pages/SubscriptionRequired';
import EnterpriseContact from '../pages/EnterpriseContact';
import ReviewPage from '../pages/ReviewPage';
import ReactivateAccount from '../pages/ReactivateAccount';
import DigitalSignaturesGuidePage from '../pages/DigitalSignaturesGuidePage';

// ---------------- LAZY LOADED PAGE COMPONENTS ----------------
const Index = lazy(() => import('../pages/Index'));
const Contacts = lazy(() => import('../pages/Contacts'));
const Profile = lazy(() => import('../pages/Profile'));

// Public Pages
const Register = lazy(() => import('../pages/Register'));
const Login = lazy(() => import('../pages/Login'));
const ForgetPassword = lazy(() => import('../pages/ForgetPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const TermsAndPrivacy = lazy(() => import('../pages/TermsAndPrivacy'));

// Error Page
const Error404 = lazy(() => import('../pages/Error404'));

// ---------------- ROUTE DEFINITIONS ----------------
const routes = [
    // === ROUTES THAT REQUIRE ACTIVE SUBSCRIPTION ===
    {
        path: '/dashboard',
        element: (
            <SubscriptionRequiredRoute requiresActiveSubscription={true}>
                <Index />
            </SubscriptionRequiredRoute>
        ),
        layout: 'default',
    },
    {
        path: '/my-documents',
        element: (
            <SubscriptionRequiredRoute requiresActiveSubscription={true}>
                <MyDocuments />
            </SubscriptionRequiredRoute>
        ),
        layout: 'default',
    },
    {
        path: '/contacts',
        element: (
            <SubscriptionRequiredRoute requiresActiveSubscription={true}>
                <Contacts />
            </SubscriptionRequiredRoute>
        ),
        layout: 'default',
    },
    {
        path: '/package/:packageId',
        element: (
            <SubscriptionRequiredRoute requiresActiveSubscription={true}>
                <PackageStatusPage />
            </SubscriptionRequiredRoute>
        ),
        layout: 'default',
    },
    {
        path: '/templates',
        element: (
            <SubscriptionRequiredRoute requiresActiveSubscription={true}>
                <TemplatesDashboard />
            </SubscriptionRequiredRoute>
        ),
        layout: 'default',
    },

    // === ROUTE THAT REQUIRES PACKAGE CREATION ABILITY ===
    {
        path: '/add-document',
        element: (
            <SubscriptionRequiredRoute requiresPackageCreation={true}>
                <PackageDashboard />
            </SubscriptionRequiredRoute>
        ),
        layout: 'default',
    },

    // === PROTECTED ROUTES (No Subscription Required) ===
    {
        path: '/profile',
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/payment-methods',
        element: (
            <ProtectedRoute>
                <PaymentMethods />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/subscriptions',
        element: (
            <ProtectedRoute>
                <Subscriptions />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // === SUBSCRIPTION REQUIRED PAGE ===
    {
        path: '/subscription-required',
        element: (
            <ProtectedRoute>
                <SubscriptionRequired />
            </ProtectedRoute>
        ),
        layout: 'blank', // Use blank layout for full-screen experience
    },

    // === PUBLIC ROUTES ===
    {
        path: '/',
        element: <Home />,
        layout: 'blank',
    },
    {
        path: '/enterprise-contact',
        element: <EnterpriseContact />,
        layout: 'blank',
    },
    {
        path: '/help',
        element: <EnterpriseContact />,
        layout: 'blank',
    },
    {
        path: '/cookie-policy',
        element: <CookiePolicyPage />,
        layout: 'blank',
    },
    {
        path: '/digital-signatures-guide',
        element: <DigitalSignaturesGuidePage />,
        layout: 'blank', // or 'default' depending on your preference
    },
    {
        path: '/package/:packageId/participant/:participantId',
        element: <ParticipantPage />,
        layout: 'blank',
    },
    {
        path: '/package/:packageId/participant/:participantId/review',
        element: <ReviewPage />,
        layout: 'blank',
    },
    {
        path: '/terms-of-use',
        element: <TermsAndPrivacy />,
        layout: 'blank',
    },
    {
        path: '/register',
        element: (
            <PublicRoute>
                <Register />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/pending-verification',
        element: (
            <PublicRoute>
                <PendingVerification />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/login',
        element: (
            <PublicRoute>
                <Login />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/reset-password',
        element: (
            <PublicRoute>
                <ForgetPassword />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/verify-email/:token',
        element: (
            <PublicRoute>
                <VerifyEmail />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/reactivate/:token',
        element: (
            <PublicRoute>
                <ReactivateAccount />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/reset-password/:token',
        element: (
            <PublicRoute>
                <ResetPassword />
            </PublicRoute>
        ),
        layout: 'blank',
    },

    // === CATCH-ALL ROUTE ===
    {
        path: '*',
        element: <Error404 />,
        layout: 'blank',
    },
];

export { routes };
