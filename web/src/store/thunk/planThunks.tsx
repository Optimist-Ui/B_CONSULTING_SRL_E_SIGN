import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Assuming your api instance is here
import { Plan } from '../slices/planSlice'; // We will create this type next

// No arguments needed for fetching all plans
export const fetchPlans = createAsyncThunk<Plan[]>('plans/fetchPlans', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/plans');
        return response.data.data; // The backend returns plans in the 'data' field
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans.');
    }
});