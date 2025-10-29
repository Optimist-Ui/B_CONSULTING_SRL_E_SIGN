import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { IRootState, AppDispatch } from '../../store';
import { toast } from 'react-toastify';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { setNumPages, setCurrentPage } from '../../store/slices/participantSlice';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { ParticipantPackageView, SignatureValue } from '../../store/slices/participantSlice';
import InteractiveField from './fields/InteractiveField';
import ReadOnlyField from './fields/ReadOnlyField';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

interface PageInfo {
    width: number;
    height: number;
    scale: number;
}

interface DocumentViewerProps {
    packageData: ParticipantPackageView;
    fieldValues: { [key: string]: string | boolean | number | SignatureValue };
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ packageData, fieldValues }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const numPages = useSelector((state: IRootState) => state.participant.numPages);
    const currentPage = useSelector((state: IRootState) => state.participant.currentPage);
    const zoomLevel = useSelector((state: IRootState) => state.participant.zoomLevel);

    const [pdfInstance, setPdfInstance] = useState<PDFDocumentProxy | null>(null);
    const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
    const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    const pageContainerRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
    const canvasRefs = useRef<Array<React.RefObject<HTMLCanvasElement>>>([]);

    const baseScale = 1.5;

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (numPages > 0) {
            pageContainerRefs.current = Array.from({ length: numPages }, () => React.createRef<HTMLDivElement>());
            canvasRefs.current = Array.from({ length: numPages }, () => React.createRef<HTMLCanvasElement>());
        }
    }, [numPages]);

    useEffect(() => {
        const loadPdf = async () => {
            if (!packageData.fileUrl) {
                setPdfLoadError(t('documentViewer.errors.missingUrl'));
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setLoadingProgress(10);

                let fullUrl;
                if (packageData.downloadUrl) {
                    fullUrl = packageData.downloadUrl;
                } else {
                    const correctedFileUrl = packageData.fileUrl.startsWith('/public') ? packageData.fileUrl : `/public${packageData.fileUrl}`;
                    fullUrl = `${BACKEND_URL}${correctedFileUrl}`;
                }

                setLoadingProgress(30);
                const response = await fetch(fullUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(t('documentViewer.errors.fetchFailed', { status: response.statusText }));

                setLoadingProgress(50);
                const arrayBuffer = await response.arrayBuffer();

                setLoadingProgress(70);
                const pdf = await loadPdfDocument(arrayBuffer);

                setPdfInstance(pdf);
                const pages = pdf.numPages;
                dispatch(setNumPages(pages));

                setLoadingProgress(100);
                setTimeout(() => setIsLoading(false), 300);
            } catch (err: any) {
                setPdfLoadError(err.message || t('documentViewer.errors.unknown'));
                toast.error(t('documentViewer.errors.loadFailed', { message: err.message }) as string);
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [packageData.fileUrl, packageData.downloadUrl, dispatch, t]);

    useEffect(() => {
        const computePageInfos = async () => {
            if (!pdfInstance || numPages === 0) return;
            const info: PageInfo[] = [];
            for (let i = 1; i <= numPages; i++) {
                const page = await pdfInstance.getPage(i);
                const scale = baseScale * (zoomLevel / 100);
                const viewport = page.getViewport({ scale });
                info.push({ width: viewport.width, height: viewport.height, scale });
            }
            setPageInfos(info);
        };
        computePageInfos();
    }, [pdfInstance, numPages, zoomLevel]);

    useEffect(() => {
        const renderPages = async () => {
            if (!pdfInstance || pageInfos.length === 0 || canvasRefs.current.length === 0 || isLoading) return;

            for (let i = 1; i <= numPages; i++) {
                const canvas = canvasRefs.current[i - 1]?.current;
                if (canvas) {
                    await renderPdfPageToCanvas(pdfInstance, i, canvas, pageInfos[i - 1].scale);
                }
            }
        };

        renderPages();
    }, [pdfInstance, pageInfos, numPages, isLoading]);

    useEffect(() => {
        if (pageContainerRefs.current[currentPage - 1]?.current) {
            pageContainerRefs.current[currentPage - 1].current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentPage]);

    useEffect(() => {
        if (pageInfos.length === 0) return;

        const options = {
            threshold: 0.5,
        };

        const observer = new IntersectionObserver((entries) => {
            let maxRatio = 0;
            let visiblePage = currentPage;
            entries.forEach((entry) => {
                if (entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    const pageIndex = pageContainerRefs.current.findIndex((ref) => ref.current === entry.target);
                    if (pageIndex !== -1) {
                        visiblePage = pageIndex + 1;
                    }
                }
            });
            if (maxRatio > 0) {
                dispatch(setCurrentPage(visiblePage));
            }
        }, options);

        pageContainerRefs.current.forEach((ref) => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => observer.disconnect();
    }, [pageInfos, dispatch, currentPage]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 p-8">
                <div className="max-w-md w-full">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#1e293b] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-[#1e293b] mb-2">{t('documentViewer.loading.title')}</h3>
                        <p className="text-gray-600 text-sm">{t('documentViewer.loading.message')}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div className="bg-gradient-to-r from-[#1e293b] to-blue-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                    <div className="text-center">
                        <span className="text-sm font-medium text-gray-700">{t('documentViewer.loading.progress', { progress: loadingProgress })}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (pdfLoadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 p-8">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">{t('documentViewer.errors.title')}</h3>
                    <p className="text-red-600 text-sm mb-4">{pdfLoadError}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium">
                        {t('documentViewer.errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    if (pageInfos.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-96 p-8">
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-600">{t('documentViewer.preparing')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pb-8">
            {packageData.status === 'Rejected' && packageData.rejectionDetails && (
                <div className="w-full max-w-4xl mx-4 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">{t('documentViewer.rejection.title')}</h3>
                            <div className="space-y-2 text-sm text-red-700">
                                <p>
                                    <span className="font-medium">{t('documentViewer.rejection.rejectedBy')}</span> {packageData.rejectionDetails.rejectedBy.contactName}
                                </p>
                                {packageData.rejectionDetails.rejectedIP && (
                                    <p>
                                        <span className="font-medium">{t('documentViewer.rejection.ipAddress')}</span> {packageData.rejectionDetails.rejectedIP}
                                    </p>
                                )}
                                <p>
                                    <span className="font-medium">{t('documentViewer.rejection.date')}</span> {new Date(packageData.rejectionDetails.rejectedAt).toLocaleString()}
                                </p>
                                <p>
                                    <span className="font-medium">{t('documentViewer.rejection.reason')}</span> {packageData.rejectionDetails.reason}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                const pageInfo = pageInfos[pageNumber - 1];
                if (!pageInfo) return null;

                const fieldsOnPage = packageData.fields.filter((field) => field.page === pageNumber);

                const clampedWidth = Math.min(pageInfo.width, windowSize.width - 32);
                const clampedHeight = pageInfo.height * (clampedWidth / pageInfo.width);
                const scaleFactor = clampedWidth / pageInfo.width;

                return (
                    <div key={`page-${pageNumber}`} className="relative my-4 sm:my-6 lg:my-8 transition-all duration-300 hover:shadow-2xl group">
                        <div
                            ref={pageContainerRefs.current[pageNumber - 1]}
                            className="relative bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200"
                            style={{
                                width: `${clampedWidth}px`,
                                height: `${clampedHeight}px`,
                            }}
                        >
                            <div className="absolute top-4 left-4 z-10 bg-[#1e293b] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {t('documentViewer.pageInfo', { current: pageNumber, total: numPages })}
                            </div>
                            <div
                                style={{
                                    transform: `scale(${scaleFactor})`,
                                    transformOrigin: 'top left',
                                    width: `${pageInfo.width}px`,
                                    height: `${pageInfo.height}px`,
                                }}
                            >
                                <canvas
                                    ref={canvasRefs.current[pageNumber - 1]}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: `${pageInfo.width}px`,
                                        height: `${pageInfo.height}px`,
                                    }}
                                />
                                {fieldsOnPage.map((field) => {
                                    const adjustedField = {
                                        ...field,
                                        x: field.x * (zoomLevel / 100),
                                        y: field.y * (zoomLevel / 100),
                                        width: field.width * (zoomLevel / 100),
                                        height: field.height * (zoomLevel / 100),
                                    };
                                    return field.isAssignedToCurrentUser ? (
                                        <InteractiveField
                                            key={field.id}
                                            field={adjustedField}
                                            value={fieldValues[field.id]}
                                            rejectionDetails={packageData.rejectionDetails}
                                            packageStatus={packageData.status}
                                        />
                                    ) : (
                                        <ReadOnlyField key={field.id} field={adjustedField} rejectionDetails={packageData.rejectionDetails} packageStatus={packageData.status} />
                                    );
                                })}
                            </div>
                            <div className="absolute inset-0 rounded-lg shadow-inner pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            {t('documentViewer.fieldsOnPage', { count: fieldsOnPage.length })}
                        </div>
                    </div>
                );
            })}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 max-w-2xl w-full mx-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#1e293b]">{t('documentViewer.reviewComplete.title')}</h3>
                </div>
                <p className="text-center text-gray-600 text-sm">{t('documentViewer.reviewComplete.message')}</p>
            </div>
        </div>
    );
};

export default DocumentViewer;
