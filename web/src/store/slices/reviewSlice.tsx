import { createSlice } from '@reduxjs/toolkit';
import { buildReviewExtraReducers } from '../extra-reducers/reviewExtraReducers';
// 1. Import the new FeaturedReview type
import { FeaturedReview } from '../thunk/reviewThunks';

// 2. Update the main state definition
export interface ReviewState {
    featuredReviews: {
        reviews: FeaturedReview[];
        status: 'idle' | 'loading' | 'succeeded' | 'failed';
    };
    eligibility: {
        isEligible: boolean;
        reason: string | null;
        status: 'idle' | 'loading' | 'succeeded' | 'failed';
    };
    submissionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    questions: { [key: string]: string };
}

// 3. Update the initial state to match
const initialState: ReviewState = {
    featuredReviews: {
        reviews: [],
        status: 'idle',
    },
    eligibility: {
        isEligible: false,
        reason: null,
        status: 'idle',
    },
    submissionStatus: 'idle',
    error: null,
    questions: {
        easeOfUse: 'How easy was the platform to use?',
        clarity: 'How clear were the instructions?',
        speed: 'How would you rate the speed of the process?',
        overall: 'What is your overall satisfaction?',
    },
};

const reviewSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        clearReviewState: (state) => {
            Object.assign(state, initialState);
        },
    },
    extraReducers: (builder) => {
        buildReviewExtraReducers(builder);
    },
});

export const { clearReviewState } = reviewSlice.actions;

export default reviewSlice.reducer;
