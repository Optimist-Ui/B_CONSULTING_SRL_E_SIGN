import React from 'react';

interface MessageProps {
    message: {
        role: 'user' | 'assistant' | 'system';
        content: string;
        metadata?: {
            confidence?: number;
            tokens?: number;
        };
        createdAt: string;
    };
}

const Message: React.FC<MessageProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-full text-xs">
                    {message.content}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            {!isUser && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                </div>
            )}

            <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isUser
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                    }`}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>

                {/* Timestamp and Confidence */}
                <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        })}
                    </span>
                    
                    {!isUser && message.metadata?.confidence !== undefined && (
                        <div className="flex items-center gap-1">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    message.metadata.confidence >= 0.8
                                        ? 'bg-green-500'
                                        : message.metadata.confidence >= 0.6
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                }`}
                                title={`Confidence: ${(message.metadata.confidence * 100).toFixed(0)}%`}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default Message;