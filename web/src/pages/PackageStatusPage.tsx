import React, { ComponentType, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, IRootState } from '../store';
import { fetchPackageForOwner } from '../store/thunk/packageThunks';
import { setCurrentPackage } from '../store/slices/packageSlice';
import PackageStatusLayout from '../components/owner-view/PackageStatusLayout';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const FiAlertTriangleTyped = FiAlertTriangle as ComponentType<{ className?: string }>;
const FiLoaderTyped = FiLoader as ComponentType<{ className?: string }>;

const PackageStatusPage: React.FC = () => {
    const { t } = useTranslation(); // Initialize translation hook
    const dispatch = useDispatch<AppDispatch>();
    const { packageId } = useParams<{ packageId: string }>();

    // We get the data from the 'packages' slice, as planned.
    const { currentPackage, loading, error } = useSelector((state: IRootState) => state.packages);
    useEffect(() => {
        if (packageId) {
            dispatch(fetchPackageForOwner(packageId));
        }

        // Cleanup when the component unmounts
        return () => {
            dispatch(setCurrentPackage(null));
        };
    }, [dispatch, packageId]);

    useEffect(() => {
        if (error) {
            toast.error(error); // Assuming error is a server-provided string
        }
    }, [error, t]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center p-8">
                    <FiLoaderTyped className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">{t('packageStatusPage.loading.title')}</h3>
                    <p className="text-gray-600">{t('packageStatusPage.loading.message')}</p>
                </div>
            </div>
        );
    }

    if (error && !currentPackage) {
        return (
            <div className="min-h-screen bg-red-50 flex justify-center items-center p-4">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
                    <FiAlertTriangleTyped className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-700">{t('packageStatusPage.error.title')}</h2>
                    <p className="text-red-600 mt-2">{error}</p> {/* Assuming error is a server-provided string */}
                </div>
            </div>
        );
    }

    if (!currentPackage) {
        return null; // Should be handled by loading/error states
    }

    return <PackageStatusLayout packageData={currentPackage} />;
};

export default PackageStatusPage;
