import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import { DocumentField as TemplateDocumentField } from './templateSlice';
import { Contact } from './contactSlice';
import { buildPackageExtraReducers } from '../extra-reducers/packageExtraReducers';

// Type Definitions
export type FieldRole = 'Signer' | 'FormFiller' | 'Approver' | 'Receiver';
export type SignatureMethod = 'Email OTP' | 'SMS OTP' | 'Both';
export type ConcreteSignatureMethod = 'Email OTP' | 'SMS OTP';

export interface AssignedUser {
    id: string;
    contactId: string;
    contactName: string;
    contactEmail: string;
    role: FieldRole;
    signatureMethods?: ConcreteSignatureMethod[];
    signed?: boolean;
}

export interface PackageReceiver {
    id: string;
    contactId: string;
    contactName: string;
    contactEmail: string;
}

export interface PackageField extends TemplateDocumentField {
    assignedUsers?: AssignedUser[];
    value?: any;
}

export interface PackageOptions {
    expiresAt: string | null;
    sendExpirationReminders: boolean;
    reminderPeriod: string | null;
    sendAutomaticReminders: boolean;
    firstReminderDays: number | null;
    repeatReminderDays: number | null;
    allowDownloadUnsigned: boolean;
    allowReassign: boolean;
}

export interface DocumentPackage {
    _id?: string;
    templateId?: string;
    attachment_uuid: string;
    name: string;
    fileUrl: string;
    s3Key?: string;
    downloadUrl?: string; // 👈 ADD THIS - Signed URL
    fileData?: ArrayBuffer;
    fields: PackageField[];
    receivers: PackageReceiver[];
    options: PackageOptions;
    customMessage?: string;
    status: 'Draft' | 'Sent' | 'Completed' | 'Archived' | 'Revoked' | 'Rejected' | 'Expired';
    createdAt?: string;
    updatedAt?: string;
}

export interface PackageState {
    packages: DocumentPackage[];
    currentPackage: DocumentPackage | null;
    selectedFieldId: string | null;
    loading: boolean;
    error: string | null;
    isCreatingOrEditingPackage: boolean;
    activeStep: number;
}

const defaultPackageOptions: PackageOptions = {
    expiresAt: null,
    sendExpirationReminders: false,
    reminderPeriod: null,
    sendAutomaticReminders: false,
    firstReminderDays: null,
    repeatReminderDays: null,
    allowDownloadUnsigned: true,
    allowReassign: true,
};

const initialState: PackageState = {
    packages: [],
    currentPackage: null,
    selectedFieldId: null,
    loading: false,
    error: null,
    isCreatingOrEditingPackage: false,
    activeStep: 0,
};

const packageSlice = createSlice({
    name: 'packages',
    initialState,
    reducers: {
        startPackageCreation: (state, action: PayloadAction<Partial<DocumentPackage>>) => {
            state.currentPackage = {
                _id: nanoid(),
                name: action.payload.name || 'Untitled Package',
                attachment_uuid: action.payload.attachment_uuid || '',
                fileUrl: action.payload.fileUrl || '',
                s3Key: action.payload.s3Key || '', // 👈 ADD THIS
                downloadUrl: action.payload.downloadUrl || '', // 👈 ADD THIS
                fileData: action.payload.fileData || undefined,
                templateId: action.payload.templateId || undefined,
                fields: action.payload.fields ? action.payload.fields.map((field) => ({ ...field, assignedUsers: field.assignedUsers || [] })) : [],
                receivers: [],
                options: defaultPackageOptions,
                customMessage: '',
                status: 'Draft',
            } as DocumentPackage;
            state.isCreatingOrEditingPackage = true;
            state.activeStep = 0;
        },
        setCurrentPackage: (state, action: PayloadAction<DocumentPackage | null>) => {
            state.currentPackage = action.payload;
            state.isCreatingOrEditingPackage = action.payload !== null;
            state.selectedFieldId = null;
        },
        setPackageTitle: (state, action: PayloadAction<string>) => {
            if (state.currentPackage) {
                state.currentPackage.name = action.payload;
            }
        },
        addFieldToCurrentPackage: (state, action: PayloadAction<Omit<PackageField, 'id' | 'assignedUsers'>>) => {
            if (state.currentPackage) {
                state.currentPackage.fields.push({
                    id: nanoid(),
                    assignedUsers: [],
                    ...action.payload,
                });
            }
        },
        updateFieldInCurrentPackage: (state, action: PayloadAction<Partial<PackageField> & { id: string }>) => {
            if (state.currentPackage) {
                const fieldIndex = state.currentPackage.fields.findIndex((field) => field.id === action.payload.id);
                if (fieldIndex !== -1) {
                    state.currentPackage.fields[fieldIndex] = {
                        ...state.currentPackage.fields[fieldIndex],
                        ...action.payload,
                    };
                }
            }
        },
        deleteFieldFromCurrentPackage: (state, action: PayloadAction<string>) => {
            if (state.currentPackage) {
                state.currentPackage.fields = state.currentPackage.fields.filter((field) => field.id !== action.payload);
                if (state.selectedFieldId === action.payload) {
                    state.selectedFieldId = null;
                }
            }
        },
        assignUserToField: (state, action: PayloadAction<{ fieldId: string; user: Omit<AssignedUser, 'id'> }>) => {
            if (state.currentPackage) {
                const field = state.currentPackage.fields.find((f) => f.id === action.payload.fieldId);
                if (field) {
                    if (!field.assignedUsers) field.assignedUsers = [];
                    const exists = field.assignedUsers.some((au) => au.contactId === action.payload.user.contactId && au.role === action.payload.user.role);
                    if (!exists) {
                        const newUser = { ...action.payload.user, id: nanoid() };
                        if (newUser.role !== 'Signer') {
                            delete newUser.signatureMethods;
                        }
                        field.assignedUsers.push(newUser);
                    }
                }
            }
        },
        removeUserFromField: (state, action: PayloadAction<{ fieldId: string; assignmentId: string }>) => {
            if (state.currentPackage) {
                const field = state.currentPackage.fields.find((f) => f.id === action.payload.fieldId);
                if (field && field.assignedUsers) {
                    field.assignedUsers = field.assignedUsers.filter((au) => au.id !== action.payload.assignmentId);
                }
            }
        },
        addReceiverToPackage: (state, action: PayloadAction<Omit<PackageReceiver, 'id'>>) => {
            if (state.currentPackage) {
                const exists = state.currentPackage.receivers.some((rec) => rec.contactId === action.payload.contactId);
                if (!exists) {
                    state.currentPackage.receivers.push({ ...action.payload, id: nanoid() });
                }
            }
        },
        removeReceiverFromPackage: (state, action: PayloadAction<string>) => {
            if (state.currentPackage) {
                state.currentPackage.receivers = state.currentPackage.receivers.filter((rec) => rec.id !== action.payload);
            }
        },
        updatePackageOptions: (state, action: PayloadAction<Partial<PackageOptions>>) => {
            if (state.currentPackage) {
                state.currentPackage.options = {
                    ...state.currentPackage.options,
                    ...action.payload,
                };
            }
        },
        setPackageCustomMessage: (state, action: PayloadAction<string>) => {
            if (state.currentPackage) {
                state.currentPackage.customMessage = action.payload;
            }
        },
        setSelectedPackageField: (state, action: PayloadAction<string | null>) => {
            state.selectedFieldId = action.payload;
        },
        setPackageActiveStep: (state, action: PayloadAction<number>) => {
            state.activeStep = action.payload;
        },
        clearPackageState: (state) => {
            Object.assign(state, initialState);
        },
        setPackageLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setPackageError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        buildPackageExtraReducers(builder);
    },
});

export const {
    startPackageCreation,
    setCurrentPackage,
    setPackageTitle,
    addFieldToCurrentPackage,
    updateFieldInCurrentPackage,
    deleteFieldFromCurrentPackage,
    assignUserToField,
    removeUserFromField,
    addReceiverToPackage,
    removeReceiverFromPackage,
    updatePackageOptions,
    setPackageCustomMessage,
    setSelectedPackageField,
    setPackageActiveStep,
    clearPackageState,
    setPackageLoading,
    setPackageError,
} = packageSlice.actions;

export default packageSlice.reducer;
