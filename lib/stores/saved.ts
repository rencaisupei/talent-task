import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SavedState {
  savedGigIds: string[];
  toggleSaved: (gigId: string) => 'added' | 'removed';
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedGigIds: [],

      toggleSaved: (gigId) => {
        const { savedGigIds } = get();
        if (savedGigIds.includes(gigId)) {
          set({ savedGigIds: savedGigIds.filter((id) => id !== gigId) });
          return 'removed';
        }
        set({ savedGigIds: [gigId, ...savedGigIds] });
        return 'added';
      },
    }),
    {
      name: 'instantgig-saved',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
