import React, { useState, useEffect, useRef } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../utils/pdf-utils';
import { DocumentPackage } from '../../store/slices/packageSlice';
import StatusFieldRenderer from './StatusFieldRenderer';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BASE_URL;

interface Props {
    packageData: DocumentPackage;
}

interface PageInfo {
    width: number;
    height: number;
    scale: number;
}

const OwnerDocumentViewer: React.FC<Props> = ({ packageData }) => {
    const [pdfInstance, setPdfInstance] = useState<PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isLoading, setIsLoading] = useState(true);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
    const canvasRefs = useRef<Array<React.RefObject<HTMLCanvasElement>>>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // The base scale where fields were positioned correctly
    const BASE_SCALE = 1.5;
    const scale = BASE_SCALE * (zoomLevel / 100);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        canvasRefs.current = Array.from({ length: numPages }, () => React.createRef());
    }, [numPages]);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                setIsLoading(true);
                let fullUrl;
                if (packageData.downloadUrl) {
                    fullUrl = packageData.downloadUrl;
                } else {
                    let correctedFileUrl = packageData.fileUrl.replace('/Uploads/templates/', '/uploads/').replace('/Uploads/', '/uploads/');

                    // Special case: if it's templates, prepend /public
                    if (correctedFileUrl.startsWith('/uploads/templates/')) {
                        correctedFileUrl = '/public' + correctedFileUrl;
                    }

                    fullUrl = `${BACKEND_URL}${correctedFileUrl.startsWith('/') ? '' : '/'}${correctedFileUrl}`;
                }

                const response = await fetch(fullUrl, { mode: 'cors' });
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);

                const arrayBuffer = await response.arrayBuffer();
                const pdf = await loadPdfDocument(arrayBuffer);
                setPdfInstance(pdf);
                setNumPages(pdf.numPages);
            } catch (err: any) {
                toast.error(`Failed to load document: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        loadPdf();
    }, [packageData.fileUrl, packageData.downloadUrl]);

    useEffect(() => {
        const computePageInfos = async () => {
            if (!pdfInstance || numPages === 0) return;
            const info: PageInfo[] = [];
            for (let i = 1; i <= numPages; i++) {
                const page = await pdfInstance.getPage(i);
                const viewport = page.getViewport({ scale });
                info.push({ width: viewport.width, height: viewport.height, scale });
            }
            setPageInfos(info);
        };
        computePageInfos();
    }, [pdfInstance, numPages, scale]);

    useEffect(() => {
        if (!pdfInstance || pageInfos.length === 0) return;

        const renderPages = async () => {
            for (let i = 1; i <= numPages; i++) {
                const canvas = canvasRefs.current[i - 1]?.current;
                if (canvas) {
                    await renderPdfPageToCanvas(pdfInstance, i, canvas, pageInfos[i - 1].scale);
                }
            }
        };
        renderPages();
    }, [pdfInstance, numPages, pageInfos]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full overflow-auto bg-gray-50">
            {/* Document Controls - Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    {/* Page Navigation */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <span className="text-sm font-medium text-gray-700">
                            Page {currentPage} of {numPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                            disabled={currentPage >= numPages}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>

                        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">{zoomLevel}%</span>

                        <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Pages */}
            <div className="flex flex-col items-center py-6">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
                    const pageInfo = pageInfos[pageNumber - 1];
                    if (!pageInfo) return null;

                    const clampedWidth = Math.min(pageInfo.width, windowSize.width - 32);
                    const clampedHeight = pageInfo.height * (clampedWidth / pageInfo.width);
                    const scaleFactor = clampedWidth / pageInfo.width;

                    return (
                        <div
                            key={pageNumber}
                            className={`
                                relative bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden
                                ${pageNumber === currentPage ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}
                            `}
                            style={{
                                width: `${clampedWidth}px`,
                                height: `${clampedHeight}px`,
                                display: numPages > 3 && Math.abs(pageNumber - currentPage) > 1 ? 'none' : 'block',
                            }}
                        >
                            {/* Page Number Badge */}
                            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">{pageNumber}</div>

                            <div
                                style={{
                                    transform: `scale(${scaleFactor})`,
                                    transformOrigin: 'top left',
                                    width: `${pageInfo.width}px`,
                                    height: `${pageInfo.height}px`,
                                    position: 'relative',
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

                                {/* Field Overlays */}
                                {packageData.fields
                                    .filter((f) => f.page === pageNumber)
                                    .map((field) => (
                                        <StatusFieldRenderer
                                            key={field.id}
                                            field={field}
                                            currentScale={scale}
                                            baseScale={BASE_SCALE}
                                            packageStatus={packageData.status} // 👈 ADD THIS
                                        />
                                    ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OwnerDocumentViewer;
