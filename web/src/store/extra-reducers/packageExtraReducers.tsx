import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { PackageState } from '../slices/packageSlice';
import { fetchPackages, savePackage, updatePackage, deletePackage } from '../thunk/packageThunks';

export const buildPackageExtraReducers = (builder: ActionReducerMapBuilder<PackageState>) => {
    builder
        .addCase(fetchPackages.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchPackages.fulfilled, (state, action) => {
            state.loading = false;
            state.packages = action.payload;
        })
        .addCase(fetchPackages.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(savePackage.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(savePackage.fulfilled, (state, action) => {
            state.loading = false;
            const savedPackage = action.payload;
            state.currentPackage = savedPackage;
            const existingIndex = state.packages.findIndex((pkg) => pkg._id === savedPackage._id);
            if (existingIndex === -1) {
                state.packages.unshift(savedPackage);
            } else {
                state.packages[existingIndex] = savedPackage;
            }
        })
        .addCase(savePackage.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(updatePackage.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updatePackage.fulfilled, (state, action) => {
            state.loading = false;
            state.packages = state.packages.map((pkg) => (pkg._id === action.payload._id ? action.payload : pkg));
            if (state.currentPackage?._id === action.payload._id) {
                state.currentPackage = action.payload;
            }
        })
        .addCase(updatePackage.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(deletePackage.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deletePackage.fulfilled, (state, action) => {
            state.loading = false;
            state.packages = state.packages.filter((pkg) => pkg._id !== action.payload.packageId);
            if (state.currentPackage?._id === action.payload.packageId) {
                state.currentPackage = null;
                state.isCreatingOrEditingPackage = false;
                state.selectedFieldId = null;
            }
        })
        .addCase(deletePackage.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
};
