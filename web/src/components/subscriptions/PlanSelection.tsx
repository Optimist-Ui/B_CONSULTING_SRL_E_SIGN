import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IRootState, AppDispatch } from '../../store';
import { fetchPlans } from '../../store/thunk/planThunks';

// Child Component
import PurchaseModal from './PurchaseModal';
import { Plan } from '../../store/slices/planSlice';

// A simple spinner for loading states, consistent with HomePlans
const Spinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);

interface PlanSelectionProps {
    onCancelChange?: () => void;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({ onCancelChange }) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { plans: rawPlans, loading, error } = useSelector((state: IRootState) => state.plans);
    const { subscription } = useSelector((state: IRootState) => state.subscription);

    const { hasHadTrial } = useSelector((state: IRootState) => state.auth.user) || { hasHadTrial: false };

    const [isYearly, setIsYearly] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasActiveSubscription = !!subscription;
    const currentPlanName = subscription?.planName;
    const currentInterval = subscription?.planInterval;

    // Fetch plans on component mount if they are not already loaded
    useEffect(() => {
        if (rawPlans.length === 0) {
            dispatch(fetchPlans());
        }
    }, [dispatch, rawPlans.length]);

    useEffect(() => {
        if (hasActiveSubscription) {
            setIsYearly(currentInterval === 'year');
        }
    }, [hasActiveSubscription, currentInterval]);

    // Memoize and enrich plan data with UI-specific properties
    const plans = useMemo(() => {
        const planOrder = ['Starter', 'Pro', 'Enterprise'];

        // Defensive check to ensure rawPlans is an array
        if (!Array.isArray(rawPlans)) {
            return [];
        }

        return rawPlans
            .map((plan) => {
                let uiData = {
                    description: '',
                    isPopular: false,
                    gradient: 'from-gray-500 to-gray-700',
                    isEnterprise: plan.name === 'Enterprise',
                };
                switch (plan.name) {
                    case 'Starter':
                        uiData.description = 'Perfect for individuals and small teams getting started.';
                        uiData.gradient = 'from-teal-500 to-teal-700';
                        break;
                    case 'Pro':
                        uiData.description = 'Best value for growing businesses and professional teams.';
                        uiData.isPopular = true;
                        uiData.gradient = 'from-blue-500 to-blue-700';
                        break;
                    case 'Enterprise':
                        uiData.description = 'Complete solution for large organizations needing more.';
                        uiData.gradient = 'from-purple-500 to-purple-700';
                        break;
                }
                return { ...plan, ...uiData };
            })
            .sort((a, b) => planOrder.indexOf(a.name) - planOrder.indexOf(b.name));
    }, [rawPlans]);

    const getButtonText = (plan: Plan) => {
        if (!hasActiveSubscription) {
            return !hasHadTrial && plan.monthlyPrice > 0 ? 'Start 14-Day Free Trial' : 'Choose Plan';
        }
        const selectedInterval = isYearly ? 'year' : 'month';
        if (plan.name === currentPlanName) {
            if (selectedInterval === currentInterval) {
                return 'Top-up';
            } else {
                return `Switch to ${isYearly ? 'Yearly' : 'Monthly'} Billing`;
            }
        } else {
            return `Switch to ${plan.name}`;
        }
    };

    const isButtonDisabled = (plan: Plan) => {
        return false;
    };

    const handleSelectPlan = (plan: Plan) => {
        if (isButtonDisabled(plan)) return;
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    return (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
                {/* ========== UI FIX START ========== */}
                {/* Back Navigation Button */}
                {onCancelChange && (
                    <div className="mb-8">
                        <button
                            onClick={onCancelChange}
                            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm transition-colors duration-200 group"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Subscription Management
                        </button>
                    </div>
                )}
                {/* ========== UI FIX END ========== */}
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">{hasActiveSubscription ? 'Select a New Plan' : 'Choose Your Plan'}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-3xl mx-auto">
                    {hasActiveSubscription
                        ? 'Choose a new plan to upgrade, downgrade, or change your billing cycle.'
                        : 'Upgrade your account to unlock more features, higher limits, and dedicated support.'}
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-10">
                <div className="inline-flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-1.5 shadow-lg">
                    <button
                        onClick={() => setIsYearly(false)}
                        className={`px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl text-base font-semibold transition-all duration-300 ease-out ${
                            !isYearly
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setIsYearly(true)}
                        className={`px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl text-base font-semibold transition-all duration-300 ease-out relative ${
                            isYearly
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Yearly
                        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Save 20%</span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            {loading ? (
                <Spinner />
            ) : error ? (
                <div className="text-center text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            className={`group relative flex flex-col bg-white dark:bg-gray-800/50 backdrop-blur-xl border rounded-3xl overflow-hidden h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-600/20 dark:hover:shadow-blue-500/30 ${
                                plan.isPopular ? 'border-blue-400 shadow-xl shadow-blue-600/10 ring-2 ring-blue-400/20' : 'border-gray-200 dark:border-gray-700/50 shadow-lg'
                            }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 z-40">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl border-4 border-white dark:border-gray-800">
                                        ⭐ Most Popular
                                    </div>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="p-8 pb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed min-h-[3rem] mt-2">{plan.description}</p>
                            </div>

                            {/* Price Section */}
                            {!plan.isEnterprise && (
                                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/40 border-y border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-5xl font-bold text-gray-900 dark:text-white">€{isYearly ? (plan.yearlyPrice / 12).toFixed(0) : plan.monthlyPrice}</span>
                                        <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/mo</span>
                                    </div>
                                    {isYearly && <p className="text-center text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">Billed as €{plan.yearlyPrice} per year</p>}
                                </div>
                            )}

                            {/* Features Section */}
                            <div className="p-8 pt-6 flex-grow">
                                <ul className="space-y-4">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-3 mt-0.5">
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA Button */}
                            <div className="p-8 pt-4 mt-auto">
                                {plan.isEnterprise ? (
                                    <button onClick={() => navigate('/enterprise-contact')} className="btn btn-outline-primary w-full text-lg py-3">
                                        Contact Sales
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isButtonDisabled(plan)}
                                        className={`btn w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed ${plan.isPopular ? 'btn-primary' : 'btn-outline-primary'}`}
                                    >
                                        {getButtonText(plan)}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* The Purchase Modal, passed the correct plan and billing cycle */}
            {selectedPlan && <PurchaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} plan={selectedPlan} isYearly={isYearly} />}
        </div>
    );
};

export default PlanSelection;
