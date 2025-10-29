import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IRootState, AppDispatch } from '../../store';
import { fetchPlans } from '../../store/thunk/planThunks';

// Child Component
import PurchaseModal from './PurchaseModal';
import { Plan } from '../../store/slices/planSlice';

const Spinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);

interface PlanSelectionProps {
    onCancelChange?: () => void;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({ onCancelChange }) => {
    const { t } = useTranslation();
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

    useEffect(() => {
        if (rawPlans.length === 0) dispatch(fetchPlans());
    }, [dispatch, rawPlans.length]);

    useEffect(() => {
        if (hasActiveSubscription) setIsYearly(currentInterval === 'year');
    }, [hasActiveSubscription, currentInterval]);

    const plans = useMemo(() => {
        const planOrder = ['Starter', 'Pro', 'Enterprise'];
        if (!Array.isArray(rawPlans)) return [];
        return rawPlans
            .map((plan) => {
                let uiData = { descriptionKey: '', isPopular: false, gradient: 'from-gray-500 to-gray-700', isEnterprise: plan.name === 'Enterprise' };
                switch (plan.name) {
                    case 'Starter':
                        uiData.descriptionKey = 'planSelection.plans.starter.description';
                        uiData.gradient = 'from-teal-500 to-teal-700';
                        break;
                    case 'Pro':
                        uiData.descriptionKey = 'planSelection.plans.pro.description';
                        uiData.isPopular = true;
                        uiData.gradient = 'from-blue-500 to-blue-700';
                        break;
                    case 'Enterprise':
                        uiData.descriptionKey = 'planSelection.plans.enterprise.description';
                        uiData.gradient = 'from-purple-500 to-purple-700';
                        break;
                }
                return { ...plan, ...uiData };
            })
            .sort((a, b) => planOrder.indexOf(a.name) - planOrder.indexOf(b.name));
    }, [rawPlans]);

    const getButtonText = (plan: Plan) => {
        if (!hasActiveSubscription) {
            return !hasHadTrial && plan.monthlyPrice > 0 ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('planSelection.buttons.startTrial')}
                </span>
            ) : (
                t('planSelection.buttons.choosePlan')
            );
        }
        const selectedInterval = isYearly ? 'year' : 'month';
        if (plan.name === currentPlanName) {
            return selectedInterval === currentInterval
                ? t('planSelection.buttons.topUp')
                : t('planSelection.buttons.switchToBilling', { interval: isYearly ? t('planSelection.billing.yearly') : t('planSelection.billing.monthly') });
        } else {
            return t('planSelection.buttons.switchToPlan', { planName: plan.name });
        }
    };

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    return (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
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
                            {t('planSelection.backButton')}
                        </button>
                    </div>
                )}
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                    {hasActiveSubscription ? t('planSelection.header.titleChange') : t('planSelection.header.titleChoose')}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-3xl mx-auto">
                    {hasActiveSubscription ? t('planSelection.header.descriptionChange') : t('planSelection.header.descriptionChoose')}
                </p>
            </div>
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
                        {t('planSelection.billing.monthly')}
                    </button>
                    <button
                        onClick={() => setIsYearly(true)}
                        className={`px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl text-base font-semibold transition-all duration-300 ease-out relative ${
                            isYearly
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {t('planSelection.billing.yearly')}
                        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {t('planSelection.billing.save')}
                        </span>
                    </button>
                </div>
            </div>
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
                                        {t('planSelection.popularBadge')}
                                    </div>
                                </div>
                            )}
                            <div className="p-8 pb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed min-h-[3rem] mt-2">{t(plan.descriptionKey)}</p>
                            </div>
                            {!plan.isEnterprise && (
                                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/40 border-y border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-5xl font-bold text-gray-900 dark:text-white">€{isYearly ? (plan.yearlyPrice / 12).toFixed(0) : plan.monthlyPrice}</span>
                                        <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/{t('planSelection.perMonth')}</span>
                                    </div>
                                    {isYearly && (
                                        <p className="text-center text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">{t('planSelection.billedYearly', { price: plan.yearlyPrice })}</p>
                                    )}
                                </div>
                            )}
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
                            <div className="p-8 pt-4 mt-auto">
                                {plan.isEnterprise ? (
                                    <button onClick={() => navigate('/enterprise-contact')} className="btn btn-outline-primary w-full text-lg py-3">
                                        {t('planSelection.buttons.contactSales')}
                                    </button>
                                ) : (
                                    <>
                                        {!hasActiveSubscription && !hasHadTrial && plan.monthlyPrice > 0 && (
                                            <div className="mb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-center shadow-lg">
                                                <div className="flex items-center justify-center gap-2 font-bold text-sm">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>{t('planSelection.trial.title')}</span>
                                                </div>
                                                <p className="text-xs mt-1 opacity-90">{t('planSelection.trial.note')}</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`btn w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
                                                plan.isPopular ? 'btn-primary shadow-lg hover:shadow-xl' : 'btn-outline-primary'
                                            } ${!hasActiveSubscription && !hasHadTrial && plan.monthlyPrice > 0 ? 'ring-2 ring-green-400 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
                                        >
                                            {getButtonText(plan)}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {selectedPlan && <PurchaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} plan={selectedPlan} isYearly={isYearly} />}
        </div>
    );
};

export default PlanSelection;
