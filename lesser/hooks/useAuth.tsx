import { useState, useEffect, createContext, useContext } from 'react';
import React from 'react';
import { loginUser, registerUser, logoutUser, Mode, UserProfile } from '@/services/auth';

export type { Mode };

interface AuthState {
  isOnboarded: boolean;
  /** True if user has explicitly logged in OR explicitly skipped */
  authCompleted: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  mode: Mode;
  user: UserProfile | null;
  username: string | null;
  completeOnboarding: (mode: Mode) => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  skipAuth: () => void;
  logout: () => void;
  setMode: (mode: Mode) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setModeState] = useState<Mode>('mid');
  const [user, setUser] = useState<UserProfile | null>(null);

  // [FIREBASE] In real app: subscribe to onAuthStateChanged here and set state accordingly
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  //     if (firebaseUser) { setUser(...); setIsLoggedIn(true); setAuthCompleted(true); }
  //     else { setUser(null); setIsLoggedIn(false); }
  //   });
  //   return unsubscribe;
  // }, []);

  const completeOnboarding = (selectedMode: Mode) => {
    setModeState(selectedMode);
    setIsOnboarded(true);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await loginUser(username, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsLoggedIn(true);
        setAuthCompleted(true);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await registerUser(username, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsLoggedIn(true);
        setAuthCompleted(true);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const skipAuth = () => {
    setAuthCompleted(true);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsLoggedIn(false);
    setAuthCompleted(false); // Force back to auth screen
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    // [FIREBASE] saveSettings(user?.uid, { mode: newMode });
  };

  return (
    <AuthContext.Provider
      value={{
        isOnboarded,
        authCompleted,
        isLoggedIn,
        isLoading,
        mode,
        user,
        username: user?.username ?? null,
        completeOnboarding,
        login,
        register,
        skipAuth,
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
