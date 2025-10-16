import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { buildChatbotExtraReducers } from '../extra-reducers/chatbotExtraReducers';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
        confidence?: number;
        tokens?: number;
        model?: string;
    };
    createdAt: string;
}

export interface ChatSession {
    sessionId: string;
    messages: Message[];
    language: string;
    status: 'active' | 'resolved' | 'escalated' | 'abandoned';
}

export interface ChatbotState {
    currentSession: ChatSession | null;
    isOpen: boolean;
    isMinimized: boolean;
    isTyping: boolean;
    loading: boolean;
    error: string | null;
    shouldShowHelpForm: boolean;
    shouldShowRating: boolean;
}

const initialState: ChatbotState = {
    currentSession: null,
    isOpen: false,
    isMinimized: false,
    isTyping: false,
    loading: false,
    error: null,
    shouldShowHelpForm: false,
    shouldShowRating: false,
};

const chatbotSlice = createSlice({
    name: 'chatbot',
    initialState,
    reducers: {
        toggleChatWidget: (state) => {
            state.isOpen = !state.isOpen;
            if (!state.isOpen) {
                state.isMinimized = false;
            }
        },
        minimizeChat: (state) => {
            state.isMinimized = true;
        },
        maximizeChat: (state) => {
            state.isMinimized = false;
        },
        setTyping: (state, action: PayloadAction<boolean>) => {
            state.isTyping = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            if (state.currentSession) {
                state.currentSession.messages.push(action.payload);
            }
        },
        addUserMessage: (state, action: PayloadAction<string>) => {
            if (state.currentSession) {
                state.currentSession.messages.push({
                    role: 'user',
                    content: action.payload,
                    createdAt: new Date().toISOString(),
                });
            }
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        showHelpForm: (state) => {
            state.shouldShowHelpForm = true;
        },
        hideHelpForm: (state) => {
            state.shouldShowHelpForm = false;
        },
        showRatingModal: (state) => {
            state.shouldShowRating = true;
        },
        hideRatingModal: (state) => {
            state.shouldShowRating = false;
        },
        resetChat: (state) => {
            state.currentSession = null;
            state.isOpen = false;
            state.isMinimized = false;
            state.isTyping = false;
            state.shouldShowHelpForm = false;
            state.shouldShowRating = false;
            state.error = null;
        },
        openChat: (state) => {
            state.isOpen = true;
        },
    },
    extraReducers: buildChatbotExtraReducers,
});

export const {
    toggleChatWidget,
    minimizeChat,
    maximizeChat,
    setTyping,
    addMessage,
    addUserMessage,
    setError,
    clearError,
    showHelpForm,
    hideHelpForm,
    showRatingModal,
    hideRatingModal,
    resetChat,
    openChat,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;
