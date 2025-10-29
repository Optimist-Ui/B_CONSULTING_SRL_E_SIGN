import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Redux Thunks
import { fetchPlans } from '../store/thunk/planThunks';
import { fetchPaymentMethods } from '../store/thunk/paymentMethodThunks';
import { setPageTitle } from '../store/slices/themeConfigSlice';

// Child Components
import PlanSelection from '../components/subscriptions/PlanSelection';
import ManageSubscription from '../components/subscriptions/ManageSubscription';
import { useSubscription } from '../store/hooks/useSubscription';
import { IRootState, AppDispatch } from '../store';

const Spinner = () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
    </div>
);

const Subscriptions: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: IRootState) => state.auth);
    const location = useLocation();
    const navigate = useNavigate();

    const { subscription, isFetchingDetails, refreshDetails, refreshStatus } = useSubscription({
        autoFetchDetails: true,
        fetchOnMount: true,
    });

    const [isSelectingPlan, setIsSelectingPlan] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(t('subscriptions.pageTitle')));
        if (user) {
            dispatch(fetchPlans());
            dispatch(fetchPaymentMethods());
            refreshDetails();
            refreshStatus();
        }
    }, [dispatch, user, refreshDetails, refreshStatus, t]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('mode') === 'upgrade') {
            setIsSelectingPlan(true);
        }
    }, [location.search]);

    const handleCancelChange = () => {
        setIsSelectingPlan(false);
        navigate('/subscriptions', { replace: true });
        refreshDetails();
    };

    const handleChangePlan = () => {
        setIsSelectingPlan(true);
        refreshDetails();
    };

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
