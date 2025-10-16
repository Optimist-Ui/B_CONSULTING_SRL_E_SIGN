// store/extra-reducers/reviewExtraReducers.tsx
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ReviewState } from '../slices/reviewSlice';
// 1. Import the new fetchFeaturedReviews thunk
import { checkReviewEligibility, submitReview, fetchFeaturedReviews } from '../thunk/reviewThunks';

export const buildReviewExtraReducers = (builder: ActionReducerMapBuilder<ReviewState>) => {
    builder
        // --- (Reducers for eligibility and submission remain unchanged) ---
        .addCase(checkReviewEligibility.pending, (state) => {
            state.eligibility.status = 'loading';
            state.error = null;
        })
        .addCase(checkReviewEligibility.fulfilled, (state, action) => {
            state.eligibility.status = 'succeeded';
            state.eligibility.isEligible = action.payload.eligible;
            state.eligibility.reason = action.payload.reason || null;
        })
        .addCase(checkReviewEligibility.rejected, (state, action) => {
            state.eligibility.status = 'failed';
            state.error = action.payload as string;
        })
        .addCase(submitReview.pending, (state) => {
            state.submissionStatus = 'loading';
            state.error = null;
        })
        .addCase(submitReview.fulfilled, (state) => {
            state.submissionStatus = 'succeeded';
            state.eligibility.isEligible = false;
            state.eligibility.reason = 'You have already submitted a review for this package.';
        })
        .addCase(submitReview.rejected, (state, action) => {
            state.submissionStatus = 'failed';
            state.error = action.payload as string;
        })

        // --- 2. ADD NEW REDUCERS FOR FETCHING FEATURED REVIEWS ---
        .addCase(fetchFeaturedReviews.pending, (state) => {
            state.featuredReviews.status = 'loading';
            state.error = null;
        })
        .addCase(fetchFeaturedReviews.fulfilled, (state, action) => {
            state.featuredReviews.status = 'succeeded';
            state.featuredReviews.reviews = action.payload;
        })
        .addCase(fetchFeaturedReviews.rejected, (state, action) => {
            state.featuredReviews.status = 'failed';
            state.error = action.payload as string;
        });
};
