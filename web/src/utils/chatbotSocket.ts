// src/utils/chatbotSocket.ts

import { io, Socket } from 'socket.io-client';
import { AppDispatch } from '../store';
import { setTyping, addMessage } from '../store/slices/chatbotSlice';

const SOCKET_URL = import.meta.env.VITE_BASE_URL;

let socket: Socket | null = null;

export const initializeChatSocket = (sessionId: string, dispatch: AppDispatch): Socket => {
    const token = localStorage.getItem('authToken');

    socket = io(SOCKET_URL, {
        auth: { token: token || null },
    });

    socket.on('connect', () => {
        console.log('Chat socket connected');
        socket!.emit('join_chat_session', sessionId);
    });

    socket.on('chat_session_joined', (data) => {
        console.log('Joined chat session:', data.sessionId);
    });

    socket.on('bot_typing', () => {
        dispatch(setTyping(true));
    });

    socket.on('bot_stopped_typing', () => {
        dispatch(setTyping(false));
    });

    socket.on('bot_message', (data) => {
        dispatch(setTyping(false));
        dispatch(
            addMessage({
                role: 'assistant',
                content: data.message.content,
                metadata: data.message.metadata,
                createdAt: data.timestamp,
            })
        );
    });

    socket.on('session_status_changed', (data) => {
        console.log('Session status changed:', data.status);
    });

    socket.on('chat_escalated', (data) => {
        console.log('Chat escalated to support:', data.helpRequestId);
    });

    socket.on('disconnect', () => {
        console.log('Chat socket disconnected');
    });

    return socket;
};

export const disconnectChatSocket = (sessionId: string) => {
    if (socket) {
        socket.emit('leave_chat_session', sessionId);
        socket.disconnect();
        socket = null;
    }
};

export const getChatSocket = () => socket;