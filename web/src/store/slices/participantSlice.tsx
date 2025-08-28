import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PackageField, AssignedUser as BaseAssignedUser } from './packageSlice';
import { buildParticipantExtraReducers } from '../extra-reducers/participantExtraReducers';
import { buildSignatureExtraReducers } from '../extra-reducers/signatureExtraReducers';

// Define Signature Value Type
export interface SignatureValue {
    signedBy: string;
    email?: string;
    phone?: string;
    date: string;
    method: string;
}

// Define Rejection Details Type
export interface RejectionDetails {
    reason: string;
    rejectedAt: string;
    rejectedBy: {
        contactEmail: string;
        contactId: string;
        contactName: string;
    };
    rejectedIP: string;
}

// Extend AssignedUser with signature audit fields from the backend
export interface AssignedUser extends BaseAssignedUser {
    signed?: boolean;
    signedAt?: string;
    signedMethod?: 'Email OTP' | 'SMS OTP';
    signedIP?: string;
    contactPhone?: string; // Add a property for the user's phone number
    signatureMethod?: 'Email OTP' | 'SMS OTP' | 'Both'; // This is the required method for signing
}

// Create a more specific version of PackageField for the participant view
export interface ParticipantPackageField extends PackageField {
    isAssignedToCurrentUser: boolean;
    assignedUsers: AssignedUser[];
    value?: string | boolean | number | SignatureValue;
}

export interface AllParticipantInfo {
    contactId: string;
    contactName: string;
    contactEmail: string;
    roles: string[];
    status: 'Pending' | 'Completed' | 'Not Applicable';
}

export interface ParticipantPackageView {
    _id: string;
    name: string;
    fileUrl: string;
    fileData?: ArrayBuffer;
    fields: ParticipantPackageField[];
    status: 'Draft' | 'Sent' | 'Completed' | 'Archived' | 'Rejected' | 'Revoked' | 'Expired';
    options: {
        allowReassign: boolean;
        allowDownloadUnsigned: boolean;
    };
    currentUser: AssignedUser;
    owner: {
        firstName: string;
        lastName: string;
        email: string;
    };
    allParticipants: AllParticipantInfo[];
    rejectionDetails?: RejectionDetails; // Add rejection details to package view
}

export interface ReassignFormData {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    language: string;
    reason: string;
}

export interface ReassignmentContact {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface ParticipantState {
    packageData: ParticipantPackageView | null;
    fieldValues: { [key: string]: string | boolean | number | SignatureValue };
    loading: boolean;
    error: string | null;
    numPages: number;
    currentPage: number;
    zoomLevel: number;
    uiState: {
        hasAgreedToTerms: boolean;
        isRejectModalOpen: boolean;
        rejectionReason: string;
        isReassignDrawerOpen: boolean;
        reassignStep: 'select' | 'add' | 'confirm' | 'success' | 'failure';
        reassignFormData: ReassignFormData;
        reassignmentContacts: ReassignmentContact[];
        selectedReassignContact: ReassignmentContact | null;
        reassignmentLoading: boolean; // Use this for loading inside the drawer
        reassignmentError: string | null;
        isDownloading: boolean;
        isSigningDrawerOpen: boolean;
        signingStep: 'method' | 'identity' | 'otp' | 'success' | 'failure';
        signingMethod: 'email' | 'sms' | null;
        signingEmail: string;
        signingPhone: string;
        activeSigningFieldId: string | null;
        activeParticipantId: string | null;
        signatureLoading: boolean;
        signatureError: string | null;
    };
}

const initialReassignFormData: ReassignFormData = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    language: 'en',
    reason: '',
};

const initialState: ParticipantState = {
    packageData: null,
    fieldValues: {},
    loading: false,
    error: null,
    numPages: 0,
    currentPage: 1,
    zoomLevel: 100,
    uiState: {
        hasAgreedToTerms: false,
        isRejectModalOpen: false,
        rejectionReason: '',
        isReassignDrawerOpen: false,
        reassignStep: 'select', // Start at the 'select' contact step
        reassignFormData: initialReassignFormData,
        reassignmentContacts: [],
        selectedReassignContact: null,
        reassignmentLoading: false,
        reassignmentError: null,
        isDownloading: false,
        isSigningDrawerOpen: false,
        signingStep: 'method',
        signingMethod: null,
        signingEmail: '',
        signingPhone: '',
        activeSigningFieldId: null,
        activeParticipantId: null,
        signatureLoading: false,
        signatureError: null,
    },
};

const participantSlice = createSlice({
    name: 'participant',
    initialState,
    reducers: {
        setFieldValue: (state, action: PayloadAction<{ fieldId: string; value: any }>) => {
            state.fieldValues[action.payload.fieldId] = action.payload.value;
        },
        setRejectionReason: (state, action: PayloadAction<string>) => {
            state.uiState.rejectionReason = action.payload;
        },
        updateReassignFormField: (state, action: PayloadAction<{ field: keyof ReassignFormData; value: string }>) => {
            state.uiState.reassignFormData[action.payload.field] = action.payload.value;
        },
        setReassignmentReason: (state, action: PayloadAction<string>) => {
            state.uiState.reassignFormData.reason = action.payload;
        },
        setRejectModalOpen: (state, action: PayloadAction<boolean>) => {
            state.uiState.isRejectModalOpen = action.payload;
            if (!action.payload) {
                state.uiState.rejectionReason = '';
            }
        },
        setReassignStep: (state, action: PayloadAction<'select' | 'add' | 'confirm' | 'success' | 'failure'>) => {
            state.uiState.reassignStep = action.payload;
        },
        setSelectedReassignContact: (state, action: PayloadAction<ReassignmentContact | null>) => {
            state.uiState.selectedReassignContact = action.payload;
        },
        setReassignDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.uiState.isReassignDrawerOpen = action.payload;
            // Reset the entire reassignment flow when the drawer is closed
            if (!action.payload) {
                state.uiState.reassignStep = 'select';
                state.uiState.reassignFormData = initialReassignFormData;
                state.uiState.reassignmentContacts = [];
                state.uiState.selectedReassignContact = null;
                state.uiState.reassignmentError = null;
            }
        },
        setSigningMethod: (state, action: PayloadAction<'email' | 'sms' | null>) => {
            state.uiState.signingMethod = action.payload;
        },
        setSigningEmail: (state, action: PayloadAction<string>) => {
            state.uiState.signingEmail = action.payload;
        },
        setSigningPhone: (state, action: PayloadAction<string>) => {
            state.uiState.signingPhone = action.payload;
        },
        resetSigningState: (state) => {
            state.uiState.signingMethod = null;
            state.uiState.signingEmail = '';
            state.uiState.signingPhone = '';
            state.uiState.signatureError = null;
        },
        setSigningDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.uiState.isSigningDrawerOpen = action.payload;
            if (action.payload) {
                state.uiState.signingStep = 'method';
            } else {
                state.uiState.activeSigningFieldId = null;
                state.uiState.activeParticipantId = null;
                state.uiState.signatureError = null;
                // Reset new fields
                state.uiState.signingMethod = null;
                state.uiState.signingEmail = '';
                state.uiState.signingPhone = '';
            }
        },
        setSigningStep: (state, action: PayloadAction<'method' | 'identity' | 'otp' | 'success' | 'failure'>) => {
            state.uiState.signingStep = action.payload;
        },
        setIsDownloading: (state, action: PayloadAction<boolean>) => {
            state.uiState.isDownloading = action.payload;
        },
        setActiveSigningFieldId: (state, action: PayloadAction<string | null>) => {
            state.uiState.activeSigningFieldId = action.payload;
        },
        setActiveParticipantId: (state, action: PayloadAction<string | null>) => {
            state.uiState.activeParticipantId = action.payload;
        },
        setHasAgreedToTerms: (state, action: PayloadAction<boolean>) => {
            state.uiState.hasAgreedToTerms = action.payload;
        },
        setNumPages: (state, action: PayloadAction<number>) => {
            state.numPages = action.payload;
        },
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setZoomLevel: (state, action: PayloadAction<number>) => {
            state.zoomLevel = action.payload;
        },
        clearParticipantState: () => initialState,
    },
    extraReducers: (builder) => {
        buildParticipantExtraReducers(builder);
        buildSignatureExtraReducers(builder);
    },
});

export const {
    setFieldValue,
    setRejectModalOpen,
    setReassignDrawerOpen,
    setSigningDrawerOpen,
    setSigningStep,
    setSigningMethod,
    setSigningEmail,
    setSigningPhone,
    resetSigningState,
    clearParticipantState,
    setRejectionReason,
    updateReassignFormField,
    setReassignmentReason,
    setSelectedReassignContact,
    setReassignStep,
    setHasAgreedToTerms,
    setNumPages,
    setCurrentPage,
    setZoomLevel,
    setActiveSigningFieldId,
    setActiveParticipantId,
    setIsDownloading,
} = participantSlice.actions;

export default participantSlice.reducer;
