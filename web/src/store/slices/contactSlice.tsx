import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { buildContactExtraReducers } from '../extra-reducers/contactExtraReducers';

// Define the shape of a single contact
export interface Contact {
    _id: string;
    ownerId: string;
    firstName: string;
    lastName: string;
    email: string;
    title?: string;
    phone?: string;
    dob?: string;
    language?: string;
    customFields?: { [key: string]: string };
}

// Define the shape of the slice's state
export interface ContactState {
    contacts: Contact[];
    loading: boolean;
    error: string | null;
}

const initialState: ContactState = {
    contacts: [],
    loading: false,
    error: null,
};

const contactSlice = createSlice({
    name: 'contacts',
    initialState,
    reducers: {
        // Reducer to manually clear errors if needed
        clearContactError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // We'll build the async logic in a separate file for organization
        buildContactExtraReducers(builder);
    },
});

export const { clearContactError } = contactSlice.actions;
export default contactSlice.reducer;
