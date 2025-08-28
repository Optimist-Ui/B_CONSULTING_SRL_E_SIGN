// src/utils/pdf-utils.ts
import { pdfjsLib } from './pdfConfig';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist/types/src/display/api';

/**
 * Loads a PDF from an ArrayBuffer and returns a PDFDocumentProxy.
 */
export const loadPdfDocument = async (data: ArrayBuffer): Promise<PDFDocumentProxy> => {
    const loadingTask = pdfjsLib.getDocument({
        data,
        verbosity: 0,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    return pdf;
};

/**
 * Renders a specific page of a PDF document onto a canvas.
 * THIS FUNCTION NOW CORRECTLY RETURNS A PROMISE OF THE CANCELLABLE RENDER TASK.
 * @returns A promise that resolves with the RenderTask object.
 */
export const renderPdfPageToCanvas = async (pdf: PDFDocumentProxy, pageNumber: number, canvas: HTMLCanvasElement, scale: number = 1.5): Promise<RenderTask> => {
    // <-- FIX #1: The return type is now Promise<RenderTask>
    try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context for canvas');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        // FIX #2: DO NOT await the render. Return the task object immediately.
        // The calling component will manage awaiting the promise within the task.
        const renderTask = page.render(renderContext);

        return renderTask; // <-- FIX #3: Return the entire cancellable task
    } catch (error) {
        console.error(`Error preparing page ${pageNumber} for rendering:`, error);
        throw error;
    }
};
