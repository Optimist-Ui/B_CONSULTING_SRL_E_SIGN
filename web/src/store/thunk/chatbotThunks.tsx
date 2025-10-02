// src/store/thunk/chatbotThunks.ts - CORRECTED VERSION

import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { IRootState } from '..';
import { openChat } from '../slices/chatbotSlice';

interface StartSessionArgs {
    page?: string;
}

interface SendMessageArgs {
    sessionId: string;
    message: string;
    page?: string;
}

interface HelpRequestArgs {
    sessionId: string;
    email: string;
    name?: string;
    phone?: string;
    category: string;
    subject: string;
    description: string;
}

interface RateSessionArgs {
    sessionId: string;
    rating: number;
    feedback?: string;
}

// Start a new chat session - FIXED: accepts optional args or undefined
export const startChatSession = createAsyncThunk('chatbot/startSession', async (args: StartSessionArgs = {}, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/chatbot/session/start', {
            page: args.page || window.location.pathname,
        });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to start chat session');
    }
});

// Send a message
export const sendChatMessage = createAsyncThunk('chatbot/sendMessage', async (args: SendMessageArgs, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/chatbot/message', {
            sessionId: args.sessionId,
            message: args.message,
            page: args.page || window.location.pathname,
        });
        return response.data.data;
    } catch (error: any) {
        if (error.response?.status === 429) {
            return rejectWithValue('Please wait a moment before sending more messages.');
        }
        return rejectWithValue(error.response?.data?.error || 'Failed to send message');
    }
});

// Submit help request
export const submitHelpRequest = createAsyncThunk('chatbot/submitHelpRequest', async (args: HelpRequestArgs, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/chatbot/help-request', args);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to submit help request');
    }
});

// Rate session
export const rateChatSession = createAsyncThunk('chatbot/rateSession', async (args: RateSessionArgs, { rejectWithValue }) => {
    try {
        const response = await api.post(`/api/chatbot/session/${args.sessionId}/rate`, {
            rating: args.rating,
            feedback: args.feedback,
        });
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to submit rating');
    }
});

// Get session history
export const getChatHistory = createAsyncThunk('chatbot/getHistory', async (sessionId: string, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/chatbot/session/${sessionId}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch chat history');
    }
});

// Clear session
export const clearChatSession = createAsyncThunk('chatbot/clearSession', async (sessionId: string, { rejectWithValue }) => {
    try {
        const response = await api.delete(`/api/chatbot/session/${sessionId}`);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to clear session');
    }
});

export const openChatAndStartSession = createAsyncThunk('chatbot/openAndStart', async (_: void = void 0, { getState, dispatch }) => {
    const { chatbot } = getState() as IRootState;

    if (!chatbot.currentSession) {
        await dispatch(startChatSession({ page: window.location.pathname }));
    }
    dispatch(openChat());
});
