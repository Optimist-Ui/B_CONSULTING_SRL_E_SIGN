import { createSlice, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { fetchPlans } from '../thunk/planThunks';

// Define the shape of a single plan, matching your API response
export interface Plan {
    _id: string;
    name: 'Starter' | 'Pro' | 'Enterprise';
    monthlyPriceId?: string;
    yearlyPriceId?: string;
    monthlyPrice: number;
    yearlyPrice: number;
    documentLimit: number;
    features: string[];
    isEnterprise: boolean;
}

// Define the shape of the slice's state
export interface PlanState {
    plans: Plan[];
    loading: boolean;
    error: string | null;
}

const initialState: PlanState = {
    plans: [],
    loading: false,
    error: null,
};

// --- Extra Reducers Logic ---
const buildPlanExtraReducers = (builder: ActionReducerMapBuilder<PlanState>) => {
    builder
        .addCase(fetchPlans.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchPlans.fulfilled, (state, action) => {
            state.loading = false;
            state.plans = action.payload;
        })
        .addCase(fetchPlans.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
};

const planSlice = createSlice({
    name: 'plans',
    initialState,
    reducers: {
        // Reducer to manually clear errors if needed
        clearPlanError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        buildPlanExtraReducers(builder);
    },
});

export const { clearPlanError } = planSlice.actions;
export default planSlice.reducer;