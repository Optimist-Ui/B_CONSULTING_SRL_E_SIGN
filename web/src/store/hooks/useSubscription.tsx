// ===== 4. React Hook for Subscription Management =====
// hooks/useSubscription.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../index';
import { fetchSubscriptionStatus, fetchSubscription } from '../thunk/subscriptionThunks';
import { invalidateDetailsCache, invalidateStatusCache } from '../slices/subscriptionSlice';
interface UseSubscriptionOptions {
    autoFetchStatus?: boolean;
    autoFetchDetails?: boolean;
    fetchOnMount?: boolean;
}

export const useSubscription = (options: UseSubscriptionOptions = {}) => {
    const { autoFetchStatus = true, autoFetchDetails = false, fetchOnMount = true } = options;

    const dispatch = useDispatch<AppDispatch>();

    const {
        subscriptionStatus,
        subscription,
        isFetchingStatus: isStatusFetchInProgress,
        isFetchingDetails: isDetailsFetchInProgress,
        error,
        lastStatusFetch,
        lastDetailsFetch,
    } = useSelector((state: IRootState) => state.subscription);

    const isFetchingStatus = isStatusFetchInProgress && !subscriptionStatus;
    const isFetchingDetails = isDetailsFetchInProgress && !subscription;

    // Memoized fetch functions
    const fetchStatus = useCallback(
        (forceRefresh = false) => {
            dispatch(fetchSubscriptionStatus({ forceRefresh }));
        },
        [dispatch]
    );

    const fetchDetails = useCallback(
        (forceRefresh = false) => {
            dispatch(fetchSubscription({ forceRefresh }));
        },
        [dispatch]
    );

    const refreshStatus = useCallback(() => {
        dispatch(invalidateStatusCache());
        fetchStatus(true);
    }, [dispatch, fetchStatus]);

    const refreshDetails = useCallback(() => {
        dispatch(invalidateDetailsCache());
        fetchDetails(true);
    }, [dispatch, fetchDetails]);

    // Auto-fetch on mount
    useEffect(() => {
        if (!fetchOnMount) return;

        if (autoFetchStatus) {
            fetchStatus();
        }

        if (autoFetchDetails) {
            fetchDetails();
        }
    }, [fetchOnMount, autoFetchStatus, autoFetchDetails, fetchStatus, fetchDetails]);

    return {
        // Data
        subscriptionStatus,
        subscription,

        // Loading states
        isFetchingStatus,
        isFetchingDetails,
        error,

        // Cache info
        lastStatusFetch,
        lastDetailsFetch,

        // Actions
        fetchStatus,
        fetchDetails,
        refreshStatus,
        refreshDetails,

        // Computed values
        hasActiveSubscription: subscriptionStatus?.hasActiveSubscription ?? false,
        canCreatePackages: subscriptionStatus?.canCreatePackages ?? false,
    };
};
