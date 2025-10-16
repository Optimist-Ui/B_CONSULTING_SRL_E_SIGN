import { useState, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [confirmText, setConfirmText] = useState('');

    const handleConfirm = () => {
        if (confirmText === 'REMOVE MY ACCOUNT') {
            onConfirm();
        }
    };

    // Handle Enter key for confirmation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && confirmText === 'REMOVE MY ACCOUNT') {
            onConfirm();
        }
    };

    // Reset confirmText when modal closes
    useEffect(() => {
        if (!isOpen) {
            setConfirmText('');
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-75"
                    role="dialog"
                    aria-labelledby="delete-account-title"
                    aria-modal="true"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md mx-4"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                            </svg>
                            <h2 id="delete-account-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                                Confirm Account Deletion
                            </h2>
                        </div>
                        <p className="mb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                            This action is <span className="font-medium text-red-600 dark:text-red-400">irreversible</span>. Your account and all associated data will be deactivated. To proceed, type{' '}
                            <span className="font-semibold text-gray-800 dark:text-gray-200">"REMOVE MY ACCOUNT"</span> below:
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                            placeholder="Type REMOVE MY ACCOUNT"
                            aria-label="Confirm account deletion by typing REMOVE MY ACCOUNT"
                            autoFocus
                        />
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={confirmText !== 'REMOVE MY ACCOUNT'}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Delete Account
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DeleteAccountModal;
