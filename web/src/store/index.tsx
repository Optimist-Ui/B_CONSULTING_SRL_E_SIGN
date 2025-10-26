import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './slices/themeConfigSlice';
import authReducer from './slices/authSlice';
import contactReducer from './slices/contactSlice';
import templateReducer from './slices/templateSlice';
import packageReducer from './slices/packageSlice';
import participantReducer from './slices/participantSlice';
import documentReducer from './slices/documentSlice';
import cookieSlice from './slices/cookieSlice';
import planReducer from './slices/planSlice';
import paymentMethodReducer from './slices/paymentMethodSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import reviewReducer from './slices/reviewSlice';
import chatbotReducer from './slices/chatbotSlice';

import api, { setupInterceptors } from '../utils/api';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authReducer,
    contacts: contactReducer,
    templates: templateReducer,
    packages: packageReducer,
    participant: participantReducer,
    documents: documentReducer,
    cookies: cookieSlice,
    plans: planReducer,
    paymentMethods: paymentMethodReducer,
    subscription: subscriptionReducer,
    reviews: reviewReducer,
    chatbot: chatbotReducer,
});

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: [
                    'templates.currentTemplate.fileData',
                    'templates.templates',
                    'packages.currentPackage.fileData',
                    'packages.packages',
                    'participant.packageData.fileData',
                    'documents.expandedRows',
                ],
                ignoredActions: [
                    'templates/uploadDocument/fulfilled',
                    'templates/fetchTemplates/fulfilled',
                    'templates/saveTemplate/fulfilled',
                    'templates/updateTemplate/fulfilled',
                    'templates/setCurrentTemplate',
                    'packages/fetchPackages/fulfilled',
                    'packages/savePackage/fulfilled',
                    'packages/updatePackage/fulfilled',
                    'packages/setCurrentPackage',
                    'packages/startPackageCreation',
                    'packages/setPackageLoading',
                    'packages/setPackageError',
                    'participant/fetchPackage/fulfilled',
                    'participant/setFieldValue',
                    'documents/fetchDocuments/fulfilled',
                    'documents/getDocumentById/fulfilled',
                    'documents/setExpandedRows',
                    'documents/toggleRowExpansion',
                    'documents/updateDocumentFromSocket',
                ],
            },
        }),
});

setupInterceptors(store);

export type IRootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default store;
