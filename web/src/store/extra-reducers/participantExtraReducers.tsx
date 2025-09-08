import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ParticipantState, ParticipantPackageField } from '../slices/participantSlice';
import {
    fetchPackageForParticipant,
    submitParticipantFields,
    rejectPackage,
    fetchReassignmentContacts,
    createContactForReassignment,
    performReassignment,
    downloadPackage,
    addReceiverByParticipant,
} from '../thunk/participantThunks';
import { toast } from 'react-toastify';

export const buildParticipantExtraReducers = (builder: ActionReducerMapBuilder<ParticipantState>) => {
    builder
        .addCase(fetchPackageForParticipant.pending, (state) => {
            state.loading = true;
            state.error = null;
            state.packageData = null;
        })
        .addCase(fetchPackageForParticipant.fulfilled, (state, action) => {
            state.loading = false;
            state.packageData = action.payload;
            const initialValues: { [key: string]: any } = {};
            action.payload.fields.forEach((field) => {
                if (field.value !== undefined) {
                    initialValues[field.id] = field.value;
                }
            });
            state.fieldValues = initialValues;
        })
        .addCase(fetchPackageForParticipant.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(submitParticipantFields.pending, (state) => {
            state.loading = true; // Use the main loader for this
            state.error = null;
        })
        .addCase(submitParticipantFields.fulfilled, (state, action) => {
            state.loading = false;
            state.packageData = action.payload.package;
            const initialValues: { [key: string]: any } = {};
            action.payload.package.fields.forEach((field: ParticipantPackageField) => {
                if (field.value !== undefined) {
                    initialValues[field.id] = field.value;
                }
            });
            state.fieldValues = initialValues;
        })
        .addCase(submitParticipantFields.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            toast.error(action.payload as string);
        })
        .addCase(rejectPackage.pending, (state) => {
            state.loading = true; // Use the main loading state for simplicity
            state.error = null;
        })
        .addCase(rejectPackage.fulfilled, (state, action) => {
            state.loading = false;
            // The API returns the updated package, so we update our state
            state.packageData = action.payload.package;
            state.uiState.isRejectModalOpen = false; // Close modal on success
            toast.success(action.payload.message || 'Document has been rejected.');
        })
        .addCase(rejectPackage.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            // Let the user know it failed
            toast.error(action.payload as string);
        }) // Fetching the list of contacts
        .addCase(fetchReassignmentContacts.pending, (state) => {
            state.uiState.reassignmentLoading = true;
            state.uiState.reassignmentError = null;
        })
        .addCase(fetchReassignmentContacts.fulfilled, (state, action) => {
            state.uiState.reassignmentLoading = false;
            state.uiState.reassignmentContacts = action.payload;
        })
        .addCase(fetchReassignmentContacts.rejected, (state, action) => {
            state.uiState.reassignmentLoading = false;
            state.uiState.reassignmentError = action.payload as string;
            toast.error(action.payload as string);
        })

        // Creating a new contact
        .addCase(createContactForReassignment.pending, (state) => {
            state.uiState.reassignmentLoading = true;
            state.uiState.reassignmentError = null;
        })
        .addCase(createContactForReassignment.fulfilled, (state, action) => {
            state.uiState.reassignmentLoading = false;
            // Select the newly created contact automatically and go to the confirmation step
            state.uiState.selectedReassignContact = action.payload.data.contact;
            state.uiState.reassignStep = 'confirm';
            toast.success(action.payload.message);
        })
        .addCase(createContactForReassignment.rejected, (state, action) => {
            state.uiState.reassignmentLoading = false;
            state.uiState.reassignmentError = action.payload as string;
            toast.error(action.payload as string);
        })

        // Performing the final reassignment
        .addCase(performReassignment.pending, (state) => {
            state.uiState.reassignmentLoading = true;
            state.uiState.reassignmentError = null;
        })
        .addCase(performReassignment.fulfilled, (state, action) => {
            state.uiState.reassignmentLoading = false;
            state.uiState.reassignStep = 'success';
            toast.success(action.payload);
        })
        .addCase(performReassignment.rejected, (state, action) => {
            state.uiState.reassignmentLoading = false;
            state.uiState.reassignStep = 'failure'; // Can add a failure screen if desired
            state.uiState.reassignmentError = action.payload as string;
            toast.error(action.payload as string);
        })
        .addCase(downloadPackage.pending, (state) => {
            state.uiState.isDownloading = true;
        })
        .addCase(downloadPackage.fulfilled, (state) => {
            state.uiState.isDownloading = false; // Turn off on success
        })
        .addCase(downloadPackage.rejected, (state, action) => {
            state.uiState.isDownloading = false; // Turn off on failure
            toast.error(action.payload as string);
        })
        .addCase(addReceiverByParticipant.pending, (state) => {
            state.uiState.addReceiverLoading = true;
            state.uiState.addReceiverError = null;
        })
        .addCase(addReceiverByParticipant.fulfilled, (state, action) => {
            state.uiState.addReceiverLoading = false;
            state.uiState.addReceiverStep = 'success';
            toast.success(action.payload.message);
            // NOTE: We do not update the packageData here. The component will rely on the WebSocket
            // event triggered by the backend to receive the fully updated package state.
        })
        .addCase(addReceiverByParticipant.rejected, (state, action) => {
            state.uiState.addReceiverLoading = false;
            state.uiState.addReceiverStep = 'failure';
            state.uiState.addReceiverError = action.payload as string;
            toast.error(action.payload as string);
        });
};
