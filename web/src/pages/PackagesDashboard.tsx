import React, { useEffect, ComponentType } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../store';
import { clearPackageState, startPackageCreation } from '../store/slices/packageSlice';
import PackageCreationStepper from '../components/package-creator/PackageCreationStepper';

const PackagesDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isCreatingOrEditingPackage, currentPackage } = useSelector((state: IRootState) => state.packages);

    useEffect(() => {
        // This effect runs once on component mount to start the package creation process.
        // It ensures that visiting this route directly initiates a new package.
        if (!isCreatingOrEditingPackage) {
            dispatch(clearPackageState());
            dispatch(startPackageCreation({ name: 'New Package' }));
        }
    }, [dispatch, isCreatingOrEditingPackage]);

    // The component will now directly render the stepper,
    // as the useEffect hook ensures the creation process is always active.
    if (isCreatingOrEditingPackage && currentPackage) {
        return <PackageCreationStepper />;
    }

    // Fallback content while the redirection to the stepper is initializing.
    // This will likely not be visible to the user.
    return (
        <div className="p-6 bg-gray-50 min-h-full flex items-center justify-center">
            <div className="text-center text-gray-600">Initializing package creation...</div>
        </div>
    );
};

export default PackagesDashboard;
