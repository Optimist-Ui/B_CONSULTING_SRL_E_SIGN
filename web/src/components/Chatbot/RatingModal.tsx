import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../../store';
import { rateChatSession } from '../../store/thunk/chatbotThunks';
import { hideRatingModal } from '../../store/slices/chatbotSlice';

interface RatingModalProps {
    sessionId: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ sessionId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading } = useSelector((state: IRootState) => state.chatbot);

    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;

        const result = await dispatch(rateChatSession({
            sessionId,
            rating,
            feedback: feedback.trim() || undefined,
        }));

        if (rateChatSession.fulfilled.match(result)) {
            setSubmitSuccess(true);
            setTimeout(() => {
                dispatch(hideRatingModal());
            }, 2000);
        }
    };

    const handleClose = () => {
        dispatch(hideRatingModal());
    };

    if (submitSuccess) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your feedback helps us improve our service.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full transform animate-fade-in">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Rate Your Experience</h3>
                                <p className="text-purple-100 text-sm">How was your chat today?</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-6">
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-all duration-200 transform hover:scale-125 focus:outline-none"
                                >
                                    <svg
                                        className={`w-12 h-12 transition-colors duration-200 ${
                                            star <= (hoveredRating || rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {rating === 0 && 'Click a star to rate'}
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent!'}
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Additional Feedback (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-800 dark:text-white resize-none"
                            placeholder="Tell us more about your experience..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                            {feedback.length}/500 characters
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;