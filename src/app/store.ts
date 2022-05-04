import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { soaFHIR } from '../features/soaFHIR/soaFHIR';

export const store = configureStore({
  reducer: {
    [soaFHIR.reducerPath] : soaFHIR.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([soaFHIR.middleware])
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
