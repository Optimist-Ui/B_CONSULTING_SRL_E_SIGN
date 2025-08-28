import { TypedUseSelectorHook, useSelector } from 'react-redux';
import type { IRootState } from '../index';

export const useAppSelector: TypedUseSelectorHook<IRootState> = useSelector;