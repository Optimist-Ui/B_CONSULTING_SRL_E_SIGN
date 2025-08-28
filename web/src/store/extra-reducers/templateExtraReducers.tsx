import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { TemplateState } from '../slices/templateSlice';
import { uploadDocument, saveTemplate, fetchTemplates, updateTemplate, deleteTemplate, getTemplateById, saveOrUpdateTemplateFromPackage } from '../thunk/templateThunks';

export const buildTemplateExtraReducers = (builder: ActionReducerMapBuilder<TemplateState>) => {
    builder
        .addCase(uploadDocument.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(uploadDocument.fulfilled, (state) => {
            state.loading = false;
            state.isEditingTemplate = true;
        })
        .addCase(uploadDocument.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            state.currentTemplate = null;
            state.isEditingTemplate = false;
        })

        .addCase(saveTemplate.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(saveTemplate.fulfilled, (state, action) => {
            state.loading = false;
            const savedTemplate = action.payload;

            // Merge server response (_id, etc.) with existing state (fileData, etc.)
            const updatedTemplate = { ...state.currentTemplate, ...savedTemplate };

            state.currentTemplate = updatedTemplate;

            const index = state.templates.findIndex((t) => t._id === savedTemplate._id);
            if (index !== -1) {
                state.templates[index] = updatedTemplate;
            } else {
                state.templates.unshift(updatedTemplate);
            }
        })
        .addCase(saveTemplate.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        .addCase(fetchTemplates.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchTemplates.fulfilled, (state, action) => {
            state.loading = false;
            state.templates = action.payload;
        })
        .addCase(fetchTemplates.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        .addCase(updateTemplate.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateTemplate.fulfilled, (state, action) => {
            state.loading = false;
            state.templates = state.templates.map((t) => (t._id === action.payload._id ? action.payload : t));
            if (state.currentTemplate?._id === action.payload._id) {
                state.currentTemplate = action.payload;
            }
        })
        .addCase(updateTemplate.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        .addCase(deleteTemplate.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteTemplate.fulfilled, (state, action) => {
            state.loading = false;
            state.templates = state.templates.filter((t) => t._id !== action.payload.templateId);
            if (state.currentTemplate?._id === action.payload.templateId) {
                state.currentTemplate = null;
                state.isEditingTemplate = false;
                state.selectedFieldId = null;
            }
        })
        .addCase(deleteTemplate.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        .addCase(getTemplateById.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getTemplateById.fulfilled, (state, action) => {
            state.loading = false;
            state.currentTemplate = action.payload;
            state.isEditingTemplate = true;
        })
        .addCase(getTemplateById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            state.currentTemplate = null;
            state.isEditingTemplate = false;
        })
        .addCase(saveOrUpdateTemplateFromPackage.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(saveOrUpdateTemplateFromPackage.fulfilled, (state, action) => {
            state.loading = false;
            const savedTemplate = action.payload;

            // Check if the template already exists in the list to either update it or add it
            const index = state.templates.findIndex((t) => t._id === savedTemplate._id);
            if (index !== -1) {
                state.templates[index] = savedTemplate;
            } else {
                state.templates.unshift(savedTemplate); // Add new template to the top
            }

            // Optionally, set it as the current template if needed for immediate editing
            state.currentTemplate = savedTemplate;
        })
        .addCase(saveOrUpdateTemplateFromPackage.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
};
