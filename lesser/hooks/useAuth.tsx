import { useState, useEffect, createContext, useContext } from 'react';
import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, rtdb } from '@/services/firebase';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  updateUserProfile,
  Mode, 
  UserProfile 
} from '@/services/auth';

export type { Mode };

interface AuthState {
  isOnboarded: boolean;
  authCompleted: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  lastError: string | null;
  mode: Mode;
  user: UserProfile | null;
  username: string | null;
  completeOnboarding: (mode: Mode) => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  logout: () => void;
  setMode: (mode: Mode) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>('mid');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await get(ref(rtdb, `users/${firebaseUser.uid}`));
          const data = snap.val();
          
          if (data) {
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              username: data.username ?? firebaseUser.email?.split('@')[0] ?? 'User',
              email: firebaseUser.email ?? undefined,
              mode: data.mode ?? 'mid',
              streakDays: data.streakDays ?? 0,
              createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            };

            setUser(profile);
            setModeState(profile.mode);
            setIsLoggedIn(true);
            setAuthCompleted(true);
            setIsOnboarded(true);
          } else {
            // Document doesn't exist yet (e.g. registration failed mid-way or ghost auth)
            setUser(null);
            setIsLoggedIn(false);
            setAuthCompleted(false);
          }
        } catch (error) {
          console.error("Error fetching user profile from RTDB:", error);
          setUser(null);
          setIsLoggedIn(false);
          setAuthCompleted(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setAuthCompleted(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const completeOnboarding = (selectedMode: Mode) => {
    setModeState(selectedMode);
    setIsOnboarded(true);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setLastError(null);
    try {
      const result = await loginUser(username, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsLoggedIn(true);
        setAuthCompleted(true);
        return true;
      }
      setLastError(result.error ?? 'Error de inicio de sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setLastError(null);
    try {
      const result = await registerUser(username, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsLoggedIn(true);
        setAuthCompleted(true);
        return true;
      }
      setLastError(result.error ?? 'Error de registro');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    setLastError(null);
    try {
      const result = await updateUserProfile(user.uid, data);
      if (result.success && result.user) {
        setUser(result.user);
        if (data.mode) setModeState(data.mode);
        return true;
      }
      setLastError(result.error ?? 'Error al actualizar perfil');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsLoggedIn(false);
    setAuthCompleted(false);
    // Note: We don't reset isOnboarded so they don't see the carousel again, 
    // unless you want them to. Usually onboarded means they finished the intro.
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    if (user) updateProfile({ mode: newMode });
  };

  return (
    <AuthContext.Provider
      value={{
        isOnboarded,
        authCompleted,
        isLoggedIn,
        isLoading,
        lastError,
        mode,
        user,
        username: user?.username ?? null,
        completeOnboarding,
        login,
        register,
        updateProfile,
        logout,
        setMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
