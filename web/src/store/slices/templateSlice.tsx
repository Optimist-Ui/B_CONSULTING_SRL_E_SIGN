import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { buildTemplateExtraReducers } from '../extra-reducers/templateExtraReducers';

// Define the shape of individual fields on the document
export interface DocumentField {
    id: string;
    type: 'text' | 'signature' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'dropdown';
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    label: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    groupId?: string;
    value?: string | boolean;
}

// Define the shape of a single document template
export interface DocumentTemplate {
    _id?: string;
    attachment_uuid: string;
    name: string;
    fileUrl: string;
    fileData?: ArrayBuffer; // Added to store PDF data
    fields: DocumentField[];
}

// Define the state for the template slice
export interface TemplateState {
    templates: DocumentTemplate[];
    currentTemplate: DocumentTemplate | null;
    selectedFieldId: string | null;
    loading: boolean;
    error: string | null;
    isEditingTemplate: boolean;
}

const initialState: TemplateState = {
    templates: [],
    currentTemplate: null,
    selectedFieldId: null,
    loading: false,
    error: null,
    isEditingTemplate: false,
};

const templateSlice = createSlice({
    name: 'templates',
    initialState,
    reducers: {
        setCurrentTemplate: (state, action: PayloadAction<DocumentTemplate | null>) => {
            state.currentTemplate = action.payload;
            state.isEditingTemplate = action.payload !== null;
            state.selectedFieldId = null;
        },
        addFieldToCurrentTemplate: (state, action: PayloadAction<Omit<DocumentField, 'id'>>) => {
            if (state.currentTemplate) {
                state.currentTemplate.fields.push({ id: nanoid(), ...action.payload });
            }
        },
        updateFieldInCurrentTemplate: (state, action: PayloadAction<Partial<DocumentField> & { id: string }>) => {
            if (state.currentTemplate) {
                const fieldIndex = state.currentTemplate.fields.findIndex((field) => field.id === action.payload.id);
                if (fieldIndex !== -1) {
                    state.currentTemplate.fields[fieldIndex] = {
                        ...state.currentTemplate.fields[fieldIndex],
                        ...action.payload,
                    };
                }
            }
        },
        deleteFieldFromCurrentTemplate: (state, action: PayloadAction<string>) => {
            if (state.currentTemplate) {
                state.currentTemplate.fields = state.currentTemplate.fields.filter((field) => field.id !== action.payload);
                if (state.selectedFieldId === action.payload) {
                    state.selectedFieldId = null;
                }
            }
        },
        setSelectedField: (state, action: PayloadAction<string | null>) => {
            state.selectedFieldId = action.payload;
        },
        clearTemplateState: (state) => {
            state.currentTemplate = null;
            state.selectedFieldId = null;
            state.loading = false;
            state.error = null;
            state.isEditingTemplate = false;
        },
        setTemplateTitle: (state, action: PayloadAction<string>) => {
            if (state.currentTemplate) {
                state.currentTemplate.name = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        buildTemplateExtraReducers(builder);
    },
});

export const { setCurrentTemplate, addFieldToCurrentTemplate, updateFieldInCurrentTemplate, deleteFieldFromCurrentTemplate, setSelectedField, clearTemplateState, setTemplateTitle } =
    templateSlice.actions;

export default templateSlice.reducer;
