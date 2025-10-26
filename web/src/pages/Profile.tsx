import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { IRootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { deleteAccount } from '../store/thunk/authThunks';
import DeleteAccountModal from '../components/auth/DeleteAccountModal';

// Import the new components
import ProfileForm from '../components/profile/ProfileForm';
import EmailForm from '../components/profile/EmailForm';
import PasswordForm from '../components/profile/PasswordForm';

const Profile = () => {
    const dispatch: AppDispatch = useDispatch();

    // Only select what we actually need to prevent unnecessary re-renders
    const user = useSelector((state: IRootState) => state.auth.user);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'password'>('profile');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteConfirm = async () => {
        setShowDeleteModal(false);
        try {
            await dispatch(deleteAccount()).unwrap();
            toast.success('Account deletion requested');
            dispatch(logout());
            navigate('/login');
        } catch (err: any) {
            toast.error(err?.message || 'Failed');
        }
    };

    // Memoize user object to prevent reference changes causing re-renders
    const stableUser = useMemo(() => user, [user?._id, user?.email, user?.firstName, user?.lastName, user?.phone, user?.language, user?.profileImageUrl]);

    if (!stableUser) return <div className="p-6 text-lg font-semibold">Loading...</div>;

    return (
        <div>
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Account Settings</h5>
            <div className="mb-5 border-b border-[#ebedf2] dark:border-[#191e3a]">
                <ul className="flex font-semibold">
                    <li className="mr-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`p-4 py-3 border-b-2 border-transparent hover:border-primary hover:text-primary ${activeTab === 'profile' ? '!border-primary text-primary' : ''}`}
                        >
                            Profile
                        </button>
                    </li>
                    <li className="mr-2">
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`p-4 py-3 border-b-2 border-transparent hover:border-primary hover:text-primary ${activeTab === 'email' ? '!border-primary text-primary' : ''}`}
                        >
                            Email
                        </button>
                    </li>
                    <li className="mr-2">
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`p-4 py-3 border-b-2 border-transparent hover:border-primary hover:text-primary ${activeTab === 'password' ? '!border-primary text-primary' : ''}`}
                        >
                            Password
                        </button>
                    </li>
                </ul>
            </div>

            {activeTab === 'profile' && <ProfileForm key="profile-form" user={stableUser} onDeleteAccount={() => setShowDeleteModal(true)} />}

            {activeTab === 'email' && <EmailForm key="email-form" user={stableUser} />}

            {activeTab === 'password' && <PasswordForm key="password-form" />}

            <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} />
        </div>
    );
};

export default Profile;
