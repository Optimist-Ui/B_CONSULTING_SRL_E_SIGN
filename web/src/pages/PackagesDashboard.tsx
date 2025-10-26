import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppDispatch, IRootState } from '../store';
import { clearPackageState, startPackageCreation, setCurrentPackage } from '../store/slices/packageSlice';
import { fetchPackageForOwner } from '../store/thunk/packageThunks';
import PackageCreationStepper from '../components/package-creator/PackageCreationStepper';
import { toast } from 'react-toastify';

const PackagesDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const draftId = searchParams.get('draft');

    const { isCreatingOrEditingPackage, currentPackage, loading } = useSelector((state: IRootState) => state.packages);

    useEffect(() => {
        const initializePackage = async () => {
            // If we have a draftId in the URL, load that draft
            if (draftId) {
                try {
                    const draftPackage = await dispatch(fetchPackageForOwner(draftId)).unwrap();

                    // Verify it's actually a draft
                    if (draftPackage.status !== 'Draft') {
                        toast.error('This package is not a draft and cannot be edited.');
                        navigate('/dashboard');
                        return;
                    }

                    // Load the draft into the editor
                    dispatch(setCurrentPackage(draftPackage));
                } catch (error: any) {
                    toast.error(error || 'Failed to load draft package.');
                    navigate('/dashboard');
                }
            } else {
                // No draft ID, start a new package
                if (!isCreatingOrEditingPackage) {
                    dispatch(clearPackageState());
                    dispatch(startPackageCreation({ name: 'New Package' }));
                }
            }
        };

        initializePackage();
    }, [draftId, dispatch, navigate, isCreatingOrEditingPackage]);

    // Show loading state while fetching draft
    if (loading && draftId) {
        return (
            <div className="p-6 dark:bg-gray-900 bg-gray-50 min-h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading draft package...</p>
                </div>
            </div>
        );
    }

    if (isCreatingOrEditingPackage && currentPackage) {
        return <PackageCreationStepper />;
    }

    return (
        <div className="p-6 dark:bg-gray-900 bg-gray-50 min-h-full flex items-center justify-center">
            <div className="text-center text-gray-600">Initializing package creation...</div>
        </div>
    );
};

export default PackagesDashboard;
