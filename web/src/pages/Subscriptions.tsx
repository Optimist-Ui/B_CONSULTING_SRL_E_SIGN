import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../store';
import { useLocation, useNavigate } from 'react-router-dom';

// Redux Thunks
import { fetchPlans } from '../store/thunk/planThunks';
import { fetchPaymentMethods } from '../store/thunk/paymentMethodThunks';
import { setPageTitle } from '../store/slices/themeConfigSlice';

// Child Components (We will create these next)
import PlanSelection from '../components/subscriptions/PlanSelection';
import ManageSubscription from '../components/subscriptions/ManageSubscription';
import { useSubscription } from '../store/hooks/useSubscription';

const Spinner = () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
    </div>
);

const Subscriptions: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: IRootState) => state.auth);
    const location = useLocation();
    const navigate = useNavigate();

    // --- 👇 USE THE HOOK TO MANAGE SUBSCRIPTION DATA 👇 ---
    const { subscription, isFetchingDetails, refreshDetails, refreshStatus } = useSubscription({
        autoFetchDetails: true, // Tell the hook to automatically manage fetching details
        fetchOnMount: true,
    });
    // --- END OF CHANGE ---

    const [isSelectingPlan, setIsSelectingPlan] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Billing & Subscriptions'));

        // This component is now only responsible for fetching the peripheral data.
        if (user) {
            dispatch(fetchPlans());
            dispatch(fetchPaymentMethods());

            // 🚀 FORCE REFRESH SUBSCRIPTION DATA ON EVERY MOUNT
            refreshDetails(); // Force refresh details
            refreshStatus(); // Force refresh status
        }
    }, [dispatch, user, refreshDetails, refreshStatus]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('mode') === 'upgrade') {
            setIsSelectingPlan(true);
        }
    }, [location.search]);

    const handleCancelChange = () => {
        setIsSelectingPlan(false);
        navigate('/subscriptions', { replace: true }); // Clean the URL by removing query params

        // 🔄 Refresh data when canceling plan change
        refreshDetails();
    };

    const handleChangePlan = () => {
        setIsSelectingPlan(true);

        // 🔄 Refresh data before showing plan selection
        refreshDetails();
    };

    // The loading state check is now powered by the smarter hook. It will not show
    // a spinner if the data is already in the Redux store.
    if (isFetchingDetails) {
        return <Spinner />;
    }

    return (
        <div className="p-4 md:p-6">
            {subscription && !isSelectingPlan ? <ManageSubscription onChangePlan={handleChangePlan} /> : <PlanSelection onCancelChange={subscription ? handleCancelChange : undefined} />}
        </div>
    );
};

export default Subscriptions;
