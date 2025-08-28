import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { Contact } from '../slices/contactSlice';

// --- Type Definitions for Thunk Arguments ---

// For creating a contact (ownerId is added on the backend)
export interface CreateContactArgs {
    firstName: string;
    lastName: string;
    email: string;
    title?: string;
    phone?: string;
    language?: string;
    customFields?: { [key: string]: string };
}

// For updating a contact (all fields are optional)
export interface UpdateContactArgs {
    contactId: string;
    contactData: Partial<CreateContactArgs>;
}

// For fetching (search is optional)
interface FetchContactsArgs {
    search?: string;
}

// --- Thunks ---

export const fetchContacts = createAsyncThunk<Contact[], FetchContactsArgs>('contacts/fetchContacts', async ({ search }, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/contacts', {
            params: { search: search || undefined },
        });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts.');
    }
});

export const createContact = createAsyncThunk<Contact, CreateContactArgs>('contacts/createContact', async (contactData, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/contacts', contactData);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create contact.');
    }
});

export const updateContact = createAsyncThunk<Contact, UpdateContactArgs>('contacts/updateContact', async ({ contactId, contactData }, { rejectWithValue }) => {
    try {
        const response = await api.patch(`/api/contacts/${contactId}`, contactData);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to update contact.');
    }
});

export const deleteContact = createAsyncThunk<
    { message: string; contactId: string }, // <-- CORRECTED return type
    string
>('contacts/deleteContact', async (contactId, { rejectWithValue }) => {
    try {
        const response = await api.delete(`/api/contacts/${contactId}`);
        // This line now correctly matches the new return type above
        return { ...response.data, contactId };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete contact.');
    }
});
