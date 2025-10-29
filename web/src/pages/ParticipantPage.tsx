import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, IRootState } from '../store';
import { clearParticipantState } from '../store/slices/participantSlice';
import { fetchPackageForParticipant as fetchPackageThunk } from '../store/thunk/participantThunks';
import ParticipantLayout from '../components/participant/ParticipantLayout';
import { toast } from 'react-toastify';
import '../assets/css/participantpage.scss';
import { useTranslation } from 'react-i18next';

const ParticipantPage: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { packageId, participantId } = useParams<{ packageId: string; participantId: string }>();

    const { packageData, loading, error } = useSelector((state: IRootState) => state.participant);

    useEffect(() => {
        if (packageId && participantId) {
            dispatch(fetchPackageThunk({ packageId, participantId }));
        }

        return () => {
            dispatch(clearParticipantState());
        };
    }, [dispatch, packageId, participantId]);

    useEffect(() => {
        if (error) {
            toast.error(error, { autoClose: false });
        }
    }, [error]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200/50 backdrop-blur-sm">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1e293b] animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-slate-400 animate-spin animation-delay-150"></div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-[#1e293b]">{t('participantPage.loading.title')}</h3>
                        <p className="text-slate-600">{t('participantPage.loading.message')}</p>
                    </div>

                    <div className="flex justify-center items-center mt-4 space-x-1">
                        <div className="w-2 h-2 bg-[#1e293b] rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-[#1e293b] rounded-full animate-pulse animation-delay-200"></div>
                        <div className="w-2 h-2 bg-[#1e293b] rounded-full animate-pulse animation-delay-400"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex justify-center items-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-2xl border border-red-200/50 backdrop-blur-sm max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-700">{t('participantPage.error.title')}</h2>
                        <div className="space-y-2">
                            <p className="text-red-600 font-medium">{error}</p>
                            <p className="text-sm text-slate-500 leading-relaxed">{t('participantPage.error.message')}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2.5 bg-[#1e293b] text-white rounded-lg hover:bg-slate-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2"
                    >
                        {t('participantPage.error.action')}
                    </button>
                </div>
            </div>
        );
    }

    if (!packageData) {
        return null;
    }

    return <ParticipantLayout packageData={packageData} />;
};

export default ParticipantPage;
