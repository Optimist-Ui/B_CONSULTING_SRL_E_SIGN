// store/thunks/reviewThunks.tsx
import { createAsyncThunk } from '@reduxjs/toolkit';
// --- THE ONLY CHANGE IS THIS IMPORT ---
import publicApi from '../../utils/publicApi';

// Interface definitions remain the same...
interface EligibilityPayload {
    packageId: string;
    participantId: string;
}
interface EligibilityResponse {
    eligible: boolean;
    reason?: string;
}
export interface ReviewAnswers {
    easeOfUse: number;
    clarity: number;
    speed: number;
    overall: number;
}
interface SubmitReviewPayload {
    packageId: string;
    participantId: string;
    reviewData: {
        answers: ReviewAnswers;
        comment?: string;
    };
}

export interface FeaturedReview {
    _id: string;
    reviewerName: string;
    reviewerRole: 'Initiator' | 'Signer' | 'Approver' | 'FormFiller';
    averageRating: number;
    comment: string;
    createdAt: string;
}

/**
 * Thunk to fetch top-rated featured reviews for public display.
 * Uses the publicApi instance as it requires no authentication.
 */
export const fetchFeaturedReviews = createAsyncThunk<FeaturedReview[]>('reviews/fetchFeatured', async (_, { rejectWithValue }) => {
    try {
        const response = await publicApi.get('/api/reviews/featured');
        return response.data.data; // The array of review objects
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch featured reviews.');
    }
});

/**
 * Thunk to check if the current user is eligible to review a package.
 * Now uses publicApi.
 */
export const checkReviewEligibility = createAsyncThunk<EligibilityResponse, EligibilityPayload>('reviews/checkEligibility', async ({ packageId, participantId }, { rejectWithValue }) => {
    try {
        // Updated route to match backend
        const response = await publicApi.get(`/api/reviews/packages/${packageId}/participant/${participantId}/review/eligibility`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to check review eligibility.');
    }
});

/**
 * Thunk to submit the review to the backend.
 * Now uses publicApi.
 */
export const submitReview = createAsyncThunk<void, SubmitReviewPayload>('reviews/submitReview', async ({ packageId, participantId, reviewData }, { rejectWithValue }) => {
    try {
        // Updated route to match backend
        await publicApi.post(`/api/reviews/packages/${packageId}/participant/${participantId}/review`, reviewData);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to submit review.');
    }
});
