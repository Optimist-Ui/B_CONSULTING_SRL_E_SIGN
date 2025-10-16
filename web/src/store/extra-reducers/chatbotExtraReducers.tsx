// src/store/extra-reducers/chatbotExtraReducers.ts

import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ChatbotState } from '../slices/chatbotSlice';
import {
    startChatSession,
    sendChatMessage,
    submitHelpRequest,
    rateChatSession,
    getChatHistory,
    clearChatSession,
} from '../thunk/chatbotThunks';

export const buildChatbotExtraReducers = (builder: ActionReducerMapBuilder<ChatbotState>) => {
    builder
        // Start session
        .addCase(startChatSession.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startChatSession.fulfilled, (state, action) => {
            state.loading = false;
            state.currentSession = {
                sessionId: action.payload.sessionId,
                messages: [
                    {
                        role: 'assistant',
                        content: action.payload.greeting,
                        createdAt: new Date().toISOString(),
                    },
                ],
                language: action.payload.language,
                status: 'active',
            };
        })
        .addCase(startChatSession.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Send message
        .addCase(sendChatMessage.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(sendChatMessage.fulfilled, (state, action) => {
            state.loading = false;
            if (state.currentSession) {
                state.currentSession.messages.push({
                    role: 'assistant',
                    content: action.payload.message,
                    metadata: {
                        confidence: action.payload.confidence,
                        tokens: action.payload.metadata.tokensUsed,
                    },
                    createdAt: new Date().toISOString(),
                });

                // Show help form if confidence is low
                if (action.payload.shouldEscalate) {
                    state.shouldShowHelpForm = true;
                }
            }
        })
        .addCase(sendChatMessage.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Submit help request
        .addCase(submitHelpRequest.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(submitHelpRequest.fulfilled, (state) => {
            state.loading = false;
            state.shouldShowHelpForm = false;
            if (state.currentSession) {
                state.currentSession.status = 'escalated';
            }
        })
        .addCase(submitHelpRequest.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Rate session
        .addCase(rateChatSession.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(rateChatSession.fulfilled, (state) => {
            state.loading = false;
            if (state.currentSession) {
                state.currentSession.status = 'resolved';
            }
        })
        .addCase(rateChatSession.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Get history
        .addCase(getChatHistory.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getChatHistory.fulfilled, (state, action) => {
            state.loading = false;
            state.currentSession = action.payload;
        })
        .addCase(getChatHistory.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Clear session
        .addCase(clearChatSession.fulfilled, (state) => {
            state.currentSession = null;
            state.shouldShowHelpForm = false;
        });
};