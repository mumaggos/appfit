import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from './services/api'; // Adjust path as necessary

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: number; username: string; email?: string } | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: number; username: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // To check initial auth status

  useEffect(() => {
    // Check for existing session on app load (e.g., from a cookie or localStorage)
    // This is a simplified check. In a real app, you might verify the token with the backend.
    const checkAuthStatus = async () => {
      try {
        // Attempt to get user profile or a protected route to verify session
        // For now, we'll rely on the backend session cookie being present and valid
        // A better approach would be a /api/auth/status endpoint
        const response = await apiClient.get("/profile/"); // Example: fetch profile
        if (response.status === 200 && response.data.user_id) {
          // Assuming profile endpoint returns user data or confirms session
          // This part needs to be adjusted based on actual backend response for a status check
          // For now, if /profile/ works, we assume logged in. This is not ideal.
          // Let's simulate fetching user data if a token/session is conceptually active
          // This part is tricky without a dedicated /auth/status endpoint
          // For now, we'll assume if a cookie was set, it's valid until logout
          // A more robust check would be to verify a token or session with the backend
          // Let's assume if we have a conceptual token (e.g. from a previous login during the session)
          // we are authenticated. This will be improved by actual login setting this state.
          
          // This effect is more about rehydrating state if the page reloads and a session exists.
          // The actual login function will set isAuthenticated and user.
        } 
      } catch (error) {
        // console.log("Not authenticated on load or error checking status");
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    // checkAuthStatus(); // We will rely on login/logout to set state for now to avoid complexity without a proper status endpoint
    setIsLoading(false); // Assume not loading initially, login will change this
  }, []);

  const login = (token: string, userData: any) => {
    // In a real app, you might store the token (e.g., localStorage or HttpOnly cookie handled by backend)
    // For this example, we'll just set the auth state.
    // The backend sets an HttpOnly cookie, so frontend doesn't need to store a token.
    localStorage.setItem('fitnessAppUser', JSON.stringify(userData)); // Store user data for UI
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
      // Still proceed with frontend logout
    }
    localStorage.removeItem('fitnessAppUser');
    setIsAuthenticated(false);
    setUser(null);
    // Cookies are HttpOnly, backend handles their removal. Frontend clears its state.
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

