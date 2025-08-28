import { useState } from 'react';
import axios from 'axios';

export interface DocumentPayload {
    title: string;
    fileUrl: string;
    status: string;
    initiator: string;
    email: string;
    owner: string;
    approvers: any[];
    formFillers: Array<{
        date: Date;
        email: string;
        name: string;
        status: string;
    }>;
    receivers: any[];
    signatureSpots: Array<{
        page: number;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        signer: {
            email: string;
            name: string;
            phone: string;
            role: string;
        } | null;
        textContent: string | null;
        type: string;
    }>;
    signers: Array<{
        date: Date;
        email: string;
        name: string;
        status: string;
    }>;
}

const BASE_URL = `${import.meta.env.VITE_BASE_URL}`;

const useUploadDoc = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [document, setDocument] = useState<DocumentPayload | null>(null);
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const clearStates = () => {
        setError(null);
        setSuccess(null);
    };

    const uploadDocument = async (documentData: DocumentPayload) => {
        console.log(documentData);
        try {
            setLoading(true);
            clearStates();

            const base64Data = documentData.fileUrl.split(',')[1];
            const blob = await fetch(documentData.fileUrl).then((r) => r.blob());

            const formData = new FormData();
            formData.append('file', blob, documentData.title);
            formData.append('title', documentData.title);
            formData.append('email', documentData.email);
            formData.append('initiator', documentData.initiator);
            formData.append('owner', userId || ''); // Add owner field

            // Add other metadata
            const metadata = {
                status: documentData.status,
                approvers: documentData.approvers,
                formFillers: documentData.formFillers,
                receivers: documentData.receivers,
                signatureSpots: documentData.signatureSpots,
                signers: documentData.signers,
            };

            formData.append('metadata', JSON.stringify(metadata));

            const response = await axios.post(`${BASE_URL}/api/documents/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setSuccess('Document uploaded successfully!');
                setDocument(response.data.data);
            }

            return response.data;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Document upload failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        uploadDocument,
        loading,
        error,
        success,
        document,
    };
};

export default useUploadDoc;
