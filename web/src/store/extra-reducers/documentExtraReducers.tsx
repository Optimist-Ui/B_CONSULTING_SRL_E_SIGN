import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { DocumentState } from '../slices/documentSlice';
import { fetchDocuments, getDocumentById, downloadDocument, sendReminder, viewDocumentHistory, reassignDocument, skipDocumentStep, revokeDocument, bulkUpdateDocuments } from '../thunk/documentThunks';

export const buildDocumentExtraReducers = (builder: ActionReducerMapBuilder<DocumentState>) => {
    builder
        // Fetch Documents
        .addCase(fetchDocuments.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchDocuments.fulfilled, (state, action) => {
            state.loading = false;
            state.documents = action.payload.documents;
            state.filteredDocuments = action.payload.documents;
            state.pagination = action.payload.pagination;
        })
        .addCase(fetchDocuments.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Get Document by ID
        .addCase(getDocumentById.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getDocumentById.fulfilled, (state, action) => {
            state.loading = false;
            state.selectedDocument = action.payload;

            // Update document in the list if it exists
            const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
            if (index !== -1) {
                state.documents[index] = action.payload;
            }
        })
        .addCase(getDocumentById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Document Actions
        .addCase(sendReminder.fulfilled, (state, action) => {
            // Could show a success message or update UI state
            state.error = null;
        })
        .addCase(sendReminder.rejected, (state, action) => {
            state.error = action.payload as string;
        })

        .addCase(reassignDocument.fulfilled, (state, action) => {
            const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
            if (index !== -1) {
                state.documents[index] = action.payload;
            }
            if (state.selectedDocument?.id === action.payload.id) {
                state.selectedDocument = action.payload;
            }
        })
        .addCase(reassignDocument.rejected, (state, action) => {
            state.error = action.payload as string;
        })

        .addCase(skipDocumentStep.fulfilled, (state, action) => {
            const index = state.documents.findIndex((doc) => doc.id === action.payload.id);
            if (index !== -1) {
                state.documents[index] = action.payload;
            }
            if (state.selectedDocument?.id === action.payload.id) {
                state.selectedDocument = action.payload;
            }
        })
        .addCase(skipDocumentStep.rejected, (state, action) => {
            state.error = action.payload as string;
        })
        .addCase(revokeDocument.fulfilled, (state, action) => {
            // action.payload is now correctly typed as `{ documentId: string, status: 'Revoked' }`
            const { documentId, status } = action.payload;
            // Find the document in the main state array
            const index = state.documents.findIndex((doc) => doc.id === documentId);
            if (index !== -1) {
                // Only update the 'status' property, leaving the rest of the object intact.
                // This provides an instant "optimistic" UI update.
                state.documents[index].status = status;
            }
            // Do the same for the filtered list to ensure consistency
            const filteredIndex = state.filteredDocuments.findIndex((doc) => doc.id === documentId);
            if (filteredIndex !== -1) {
                state.filteredDocuments[filteredIndex].status = status;
            }
            // Also update the 'selectedDocument' if it's the one being revoked
            if (state.selectedDocument?.id === documentId) {
                state.selectedDocument.status = status;
            }
        })
        .addCase(revokeDocument.rejected, (state, action) => {
            state.error = action.payload as string;
        })

        .addCase(bulkUpdateDocuments.fulfilled, (state, action) => {
            // Update multiple documents in the state
            action.payload.forEach((updatedDoc) => {
                const index = state.documents.findIndex((doc) => doc.id === updatedDoc.id);
                if (index !== -1) {
                    state.documents[index] = updatedDoc;
                }
            });
        })
        .addCase(bulkUpdateDocuments.rejected, (state, action) => {
            state.error = action.payload as string;
        });
};
