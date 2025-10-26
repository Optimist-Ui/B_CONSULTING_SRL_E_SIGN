import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ContactState } from '../slices/contactSlice';
import { fetchContacts, createContact, updateContact, deleteContact, submitEnterpriseInquiry } from '../thunk/contactThunks';

export const buildContactExtraReducers = (builder: ActionReducerMapBuilder<ContactState>) => {
    builder
        // --- Fetch Contacts Cases ---
        .addCase(fetchContacts.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchContacts.fulfilled, (state, action) => {
            state.loading = false;
            state.contacts = action.payload;
        })
        .addCase(fetchContacts.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Create Contact Cases ---
        .addCase(createContact.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createContact.fulfilled, (state, action) => {
            state.loading = false;
            // Add the new contact to the beginning of the list for a nice UX
            state.contacts.unshift(action.payload);
        })
        .addCase(createContact.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Update Contact Cases ---
        .addCase(updateContact.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateContact.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.contacts.findIndex((c) => c._id === action.payload._id);
            if (index !== -1) {
                state.contacts[index] = action.payload;
            }
        })
        .addCase(updateContact.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Delete Contact Cases ---
        .addCase(deleteContact.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteContact.fulfilled, (state, action) => {
            state.loading = false;
            state.contacts = state.contacts.filter((c) => c._id !== action.payload.contactId);
        })
        .addCase(deleteContact.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        // --- Submit Enterprise Inquiry Cases ---
        .addCase(submitEnterpriseInquiry.pending, (state) => {
            state.inquirySubmitting = true;
            state.error = null;
        })
        .addCase(submitEnterpriseInquiry.fulfilled, (state) => {
            state.inquirySubmitting = false;
            // No need to update contacts array for inquiry submission
        })
        .addCase(submitEnterpriseInquiry.rejected, (state, action) => {
            state.inquirySubmitting = false;
            state.error = action.payload as string;
        });
};
