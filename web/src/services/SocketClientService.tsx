// import { io, Socket } from 'socket.io-client';
// import { AppDispatch } from '../store';
// import { updateDocumentFromSocket } from '../store/slices/documentSlice';

// // The shape of the data received from the backend 'package_updated' event
// interface PackageUpdatePayload {
//     packageId: string;
//     changes: {
//         status?: 'Sent' | 'Completed' | 'Draft' | 'Rejected' | 'Expired';
//         // Add other potential real-time change fields here
//     };
//     // Include other properties from the backend payload if any
//     timestamp: string;
//     type: string;
// }

// class SocketService {
//     private socket: Socket | null = null;

//     /**
//      * Connects the client to the Socket.IO server.
//      * @param token The user's JWT for authentication.
//      */
//     connect(token: string): void {
//         // Prevent multiple connections
//         if (this.socket && this.socket.connected) {
//             return;
//         }

//         const SERVER_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

//         this.socket = io(SERVER_URL, {
//             auth: { token },
//             transports: ['websocket'], // Best for real-time performance
//         });

//         this.socket.on('connect', () => {
//             console.log('Socket connected successfully:', this.socket?.id);
//         });

//         this.socket.on('connect_error', (error) => {
//             console.error('Socket connection error:', error.message);
//         });
//     }

//     /**
//      * Listens for real-time package updates and dispatches them to the Redux store.
//      * @param dispatch The Redux store's dispatch function.
//      */
//     listenForPackageUpdates(dispatch: AppDispatch): void {
//         if (!this.socket) return;

//         this.socket.on('package_updated', (data: PackageUpdatePayload) => {
//             console.log('Received package update:', data);

//             // Dispatch an action to update the specific document in the store
//             dispatch(updateDocumentFromSocket(data));
//         });
//     }

//     /**
//      * Disconnects the client from the Socket.IO server.
//      */
//     disconnect(): void {
//         if (this.socket) {
//             this.socket.off('package_updated'); // Clean up listener
//             this.socket.disconnect();
//             console.log('Socket disconnected.');
//             this.socket = null;
//         }
//     }
// }

// // Export a singleton instance of the service
// export const socketService = new SocketService();
