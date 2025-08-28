import { lazy } from 'react';
import ProtectedRoute from '../utils/ProtectedRoute';
import PublicRoute from '../utils/PublicRoute'; // Import the PublicRoute HOC
import PendingVerification from '../pages/PendingVerification';
import VerifyEmail from '../pages/VerifyEmail';
import MyDocuments from '../pages/MyDocuments';
import TemplatesDashboard from '../pages/TemplatesDashboard';
import PackageDashboard from '../pages/PackagesDashboard';
import ParticipantPage from '../pages/ParticipantPage';

// ---------------- LAZY LOADED PAGE COMPONENTS ----------------
const Index = lazy(() => import('../pages/Index'));
const GroupContacts = lazy(() => import('../pages/GroupContacts'));
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
    // === PROTECTED ROUTES ===
    // These routes are only accessible to authenticated users.
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Index />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/my-documents',
        element: (
            <ProtectedRoute>
                <MyDocuments />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/add-document',
        element: (
            <ProtectedRoute>
                <PackageDashboard />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/templates',
        element: (
            <ProtectedRoute>
                <TemplatesDashboard />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/contacts',
        element: (
            <ProtectedRoute>
                <Contacts />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/group-contacts',
        element: (
            <ProtectedRoute>
                <GroupContacts />
            </ProtectedRoute>
        ),
        layout: 'default',
    },
    {
        path: '/profile',
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
        layout: 'default',
    },

    // === PUBLIC ROUTES ===
    // These routes are only accessible to non-authenticated users.
    // If a logged-in user tries to access them, they will be redirected to '/'.
    {
        path: '/package/:packageId/participant/:participantId',
        element: (
            <PublicRoute>
                <ParticipantPage />
            </PublicRoute>
        ),
        layout: 'blank',
    },
    {
        path: '/terms-of-use',
        element: (
            <PublicRoute>
                <TermsAndPrivacy />
            </PublicRoute>
        ),
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
                <PendingVerification />,
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
                <VerifyEmail />,
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
    // This should generally be accessible to everyone.
    {
        path: '*',
        element: <Error404 />,
        layout: 'blank',
    },
];

export { routes };
