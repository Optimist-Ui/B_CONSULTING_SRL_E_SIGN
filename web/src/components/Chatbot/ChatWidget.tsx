import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState, AppDispatch } from '../../store';
import { toggleChatWidget, minimizeChat, maximizeChat, resetChat } from '../../store/slices/chatbotSlice';
import { openChatAndStartSession, startChatSession } from '../../store/thunk/chatbotThunks';
import ChatWindow from './ChatWindow';
import HelpRequestModal from './HelpRequestModal';
import RatingModal from './RatingModal';
import { initializeChatSocket, disconnectChatSocket } from '../../utils/chatbotSocket';

const ChatWidget: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isOpen, isMinimized, currentSession, shouldShowHelpForm, shouldShowRating } = useSelector((state: IRootState) => state.chatbot);

    useEffect(() => {
        // Initialize socket when widget opens and session exists
        if (isOpen && currentSession?.sessionId) {
            const socket = initializeChatSocket(currentSession.sessionId, dispatch);

            return () => {
                disconnectChatSocket(currentSession.sessionId);
            };
        }
    }, [isOpen, currentSession?.sessionId, dispatch]);

    useEffect(() => {
        dispatch(openChatAndStartSession());
    }, []);

    const handleToggleWidget = async () => {
        if (!isOpen && !currentSession) {
            // Start new session when opening for the first time
            await dispatch(startChatSession({ page: window.location.pathname }));
        }
        dispatch(toggleChatWidget());
    };

    const handleMinimize = () => {
        dispatch(minimizeChat());
    };

    const handleMaximize = () => {
        dispatch(maximizeChat());
    };

    const handleClose = () => {
        dispatch(toggleChatWidget());
    };

    return (
        <>
            {/* Chat Widget Button - Fixed at bottom right */}
            {!isOpen && (
                <button
                    onClick={handleToggleWidget}
                    className="fixed bottom-6 right-6 z-50 group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-600/50 transition-all duration-300 hover:scale-110 transform"
                    aria-label="Open chat"
                >
                    <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>

                    {/* Notification dot - optional */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${isMinimized ? 'w-80' : 'w-[380px] md:w-[420px]'}`}>
                    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[600px]'}`}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                            />
                                        </svg>
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                                </div>
                                {!isMinimized && (
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">AI Assistant</h3>
                                        <p className="text-blue-100 text-xs">Online • Typically replies instantly</p>
                                    </div>
                                )}
                            </div>

                            {/* Header Actions */}
                            <div className="flex items-center gap-2">
                                {!isMinimized ? (
                                    <>
                                        <button onClick={handleMinimize} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors" aria-label="Minimize chat">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors" aria-label="Close chat">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleMaximize} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors" aria-label="Maximize chat">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Chat Content */}
                        {!isMinimized && <ChatWindow />}
                    </div>
                </div>
            )}

            {/* Help Request Modal */}
            {shouldShowHelpForm && currentSession && <HelpRequestModal sessionId={currentSession.sessionId} />}

            {/* Rating Modal */}
            {shouldShowRating && currentSession && <RatingModal sessionId={currentSession.sessionId} />}
        </>
    );
};

export default ChatWidget;
