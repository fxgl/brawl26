import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Helper functions for default values
const generateUUID = (): string => uuidv4();
const generateRandomName = (): string => `User_${Math.floor(Math.random() * 10000)}`;
const getCurrentTimestamp = (): string => new Date().toISOString();

export interface UserProfile {
    id: string;
    username: string;
    avatar?: string;
    createdAt: string;
    lastLogin: string;
}

interface UserProfileState {
    profile: UserProfile | null;
    setProfile: (profile: UserProfile) => void;
    updateUsername: (username: string) => void;
    updateAvatar: (avatar: string) => void;
    clearProfile: () => void;
    // Add a function to update lastLogin
    updateLastLogin: () => void;
}

// Create default profile
const createDefaultProfile = (): UserProfile => ({
    id: generateUUID(),
    username: generateRandomName(),
    avatar: '',
    createdAt: getCurrentTimestamp(),
    lastLogin: getCurrentTimestamp()
});

// Define persistence configuration
const persistConfig: PersistOptions<UserProfileState> = {
    name: 'user-profile-storage',
    storage: createJSONStorage(() => localStorage),
    // Don't use partialize to ensure all state is saved
    onRehydrateStorage: () => {
        console.log('Hydration starts');
        return (state, error) => {
            if (error) {
                console.error('Error during hydration:', error);
            } else {
                console.log('Hydration finished');
                // Update last login time when rehydrating
                if (state?.profile) {
                    state.updateLastLogin();
                }
            }
        };
    },
};

// Create the store with persistence
export const useUserProfileStore = create<UserProfileState>()(
    persist(
        (set) => ({
            profile: createDefaultProfile(),
            setProfile: (profile) => set({ profile }),
            updateUsername: (username) =>
                set((state) => ({
                    profile: state.profile ? { ...state.profile, username } : null
                })),
            updateAvatar: (avatar) =>
                set((state) => ({
                    profile: state.profile ? { ...state.profile, avatar } : null
                })),
            clearProfile: () => set({ profile: null }),
            updateLastLogin: () => set((state) => ({
                profile: state.profile
                    ? { ...state.profile, lastLogin: getCurrentTimestamp() }
                    : null
            })),
        }),
        persistConfig
    )
);

// Test function to verify persistence is working
export const testProfilePersistence = () => {
    const currentStore = useUserProfileStore.getState();
    console.log('Current store state:', currentStore);

    // Force a state update to trigger persistence
    currentStore.updateLastLogin();

    // Check localStorage after update
    setTimeout(() => {
        console.log('Updated localStorage content:', localStorage.getItem('user-profile-storage'));
    }, 100);
};

// Call the test function if in browser environment
if (typeof window !== 'undefined') {
    console.log('Initial localStorage content:', localStorage.getItem('user-profile-storage'));
    // Wait for next tick to test persistence
    setTimeout(testProfilePersistence, 500);
}
