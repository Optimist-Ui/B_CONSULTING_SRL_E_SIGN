import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, IRootState } from '../store';
import { checkReviewEligibility, submitReview } from '../store/thunk/reviewThunks';
import StarRatingInput from '../components/reviews/StarRatingInput';
import { ReviewAnswers } from '../store/thunk/reviewThunks';

// Icons
import IconLoader from '../components/Icon/IconLoader';
import IconCircleCheck from '../components/Icon/IconCircleCheck';
import IconPlusCircle from '../components/Icon/IconPlusCircle';

const ReviewPage: React.FC = () => {
    const { packageId, participantId } = useParams<{ packageId: string; participantId: string }>();
    const dispatch = useDispatch<AppDispatch>();

    const { eligibility, submissionStatus, questions, error } = useSelector((state: IRootState) => state.reviews);

    const [ratings, setRatings] = useState<ReviewAnswers>({
        easeOfUse: 0,
        clarity: 0,
        speed: 0,
        overall: 0,
    });
    const [comment, setComment] = useState('');
    const [validationError, setValidationError] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (packageId && participantId) {
            dispatch(checkReviewEligibility({ packageId, participantId }));
        }
        // Trigger animation
        setTimeout(() => setIsVisible(true), 100);
    }, [dispatch, packageId, participantId]);

    const handleRatingChange = (questionKey: keyof ReviewAnswers, value: number) => {
        setRatings((prev) => ({ ...prev, [questionKey]: value }));
        if (validationError) setValidationError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.values(ratings).some((r) => r === 0)) {
            setValidationError('Please provide a rating for all questions.');
            return;
        }
        if (packageId && participantId) {
            dispatch(submitReview({ packageId, participantId, reviewData: { answers: ratings, comment } }));
        }
    };

    // Calculate completion percentage
    const completedRatings = Object.values(ratings).filter((r) => r > 0).length;
    const totalRatings = Object.keys(ratings).length;
    const completionPercentage = (completedRatings / totalRatings) * 100;

    const renderContent = () => {
        // Loading State
        if (eligibility.status === 'loading') {
            return (
                <div className="flex flex-col items-center justify-center text-white min-h-[60vh]">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                        <div style={{ width: 48, height: 48 }} className="absolute top-2 left-2">
                            <IconLoader className="w-full h-full text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <h3 className="text-xl font-semibold mb-2">Checking Eligibility</h3>
                        <p className="text-gray-300">Please wait while we verify your access...</p>
                    </div>

                    {/* Loading dots animation */}
                    <div className="flex gap-2 mt-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                </div>
            );
        }

        // Submission Success State
        if (submissionStatus === 'succeeded') {
            return (
                <div className="text-center py-12">
                    <div className="relative mb-8">
                        {/* Success circle animation */}
                        <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                            <IconCircleCheck className="w-12 h-12 text-green-400 relative z-10" />
                        </div>

                        {/* Floating particles */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                            <div className="w-2 h-2 bg-green-400/60 rounded-full animate-bounce delay-100"></div>
                        </div>
                        <div className="absolute top-8 right-1/4">
                            <div className="w-1 h-1 bg-blue-400/60 rounded-full animate-bounce delay-300"></div>
                        </div>
                        <div className="absolute top-8 left-1/4">
                            <div className="w-1 h-1 bg-purple-400/60 rounded-full animate-bounce delay-500"></div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">Thank You! 🎉</h2>
                    <p className="text-lg text-gray-300 mb-6">Your feedback has been submitted successfully.</p>

                    <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4 inline-block">
                        <p className="text-green-400 text-sm font-medium">Your review helps us improve the experience for everyone</p>
                    </div>
                </div>
            );
        }

        // Ineligible State
        if (!eligibility.isEligible && eligibility.status === 'succeeded') {
            return (
                <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                        <IconPlusCircle className="w-10 h-10 text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Review Not Available</h2>
                    <p className="text-gray-300 text-lg">{eligibility.reason}</p>

                    <div className="mt-8 bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4 inline-block">
                        <p className="text-yellow-400 text-sm">If you believe this is an error, please contact support</p>
                    </div>
                </div>
            );
        }

        // The Enhanced Review Form
        return (
            <div className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        Feedback Required
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        How was your
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> experience</span>?
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">Your feedback helps us improve the e-signing experience for everyone. Please take a moment to rate your experience.</p>

                    {/* Progress indicator */}
                    <div className="mt-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-sm text-gray-400">Progress:</span>
                            <span className="text-sm font-medium text-blue-400">
                                {completedRatings} of {totalRatings} completed
                            </span>
                        </div>
                        <div className="w-32 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating Cards - Improved Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.entries(questions) as [keyof ReviewAnswers, string][]).map(([key, question], index) => (
                            <div
                                key={key}
                                className={`bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/60 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transform hover:scale-[1.02] ${
                                    ratings[key as keyof ReviewAnswers] > 0 ? 'border-blue-500/50 bg-slate-800/60' : ''
                                }`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold text-lg mb-1">{question}</h3>
                                        <p className="text-gray-400 text-sm">Rate from 1 (poor) to 5 (excellent)</p>
                                    </div>
                                    {ratings[key as keyof ReviewAnswers] > 0 && (
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-3">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-center">
                                    <StarRatingInput rating={ratings[key as keyof ReviewAnswers]} onRatingChange={(value) => handleRatingChange(key as keyof ReviewAnswers, value)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comments Section - Enhanced */}
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">Additional Comments</h3>
                                <p className="text-gray-400 text-sm">Tell us more about your experience (optional)</p>
                            </div>
                        </div>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts, suggestions, or any specific feedback..."
                            rows={4}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        />
                        <div className="mt-2 text-right">
                            <span className="text-xs text-gray-500">{comment.length}/500</span>
                        </div>
                    </div>

                    {/* Error Messages - Enhanced */}
                    {(validationError || error) && (
                        <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    {validationError && <p className="text-red-400 font-medium">{validationError}</p>}
                                    {error && <p className="text-red-400 font-medium">Submission Error: {error}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button - Greatly Enhanced */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={submissionStatus === 'loading'}
                            className="group w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 disabled:scale-100 disabled:shadow-none relative overflow-hidden"
                        >
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>

                            <div className="relative flex items-center justify-center gap-3">
                                {submissionStatus === 'loading' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Submitting Feedback...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span>Submit Feedback</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </div>

                            {/* Completion indicator */}
                            {completionPercentage === 100 && submissionStatus !== 'loading' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>}
                        </button>

                        {/* Helper text */}
                        <p className="text-center text-gray-400 text-sm mt-3">
                            {completionPercentage === 100 ? 'All ratings completed! Ready to submit.' : 'Please complete all ratings before submitting.'}
                        </p>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center py-8 px-4">
            <div className="w-full max-w-5xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    <div className="relative z-10 p-6 md:p-10">{renderContent()}</div>
                </div>
            </div>

            {/* Floating decorative elements */}
            <div className="fixed top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-1000"></div>
            <div className="fixed top-40 right-20 w-3 h-3 bg-purple-400/30 rounded-full animate-bounce delay-1500"></div>
            <div className="fixed bottom-20 left-20 w-2 h-2 bg-green-400/30 rounded-full animate-bounce delay-2000"></div>
        </div>
    );
};

export default ReviewPage;
