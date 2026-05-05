import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

import http from "../services/http";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);

  // Use a ref to keep track of the latest token without re-running the interceptor effect
  const tokenRef = React.useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);


  const storeToken = useCallback((token) => {
    setAccessToken(token);
    sessionStorage.setItem("accessToken", token);
    const decoded = decodeToken(token);
    if (decoded) setUser(decoded);
  }, []);

  const clearToken = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem("accessToken");
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await http.post("/auth/login", credentials);
    const { token, mfaRequired } = response.data;

    if (mfaRequired) {
      return response.data;
    }

    storeToken(token);
    return response.data;
  }, [storeToken]);

  const loginWithMFA = useCallback(async (userId, totpCode, tempToken) => {
    const response = await http.post("/mfa/verify-login", {
      userId,
      totpCode,
      tempToken,
    });
    storeToken(response.data.token);
    return response.data;
  }, [storeToken]);

  const googleLogin = useCallback((token) => {
    storeToken(token);
  }, [storeToken]);

  const logout = useCallback(async () => {
    try {
      await http.post("/auth/logout");
    } catch {}
    clearToken();
  }, [clearToken]);

  // Ref to track an ongoing refresh request to avoid multiple concurrent refreshes (preventing 429s)
  const refreshPromiseRef = React.useRef(null);

  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const response = await http.post("/auth/refresh");
        const token = response.data.token;
        storeToken(token);
        return token;
      } catch {
        clearToken();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [storeToken, clearToken]);

  useEffect(() => {
    const interceptor = http.interceptors.request.use((config) => {
      // Always look for the freshest token: state ref first, then sessionStorage
      const token = tokenRef.current || sessionStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      return config;
    });

    return () => http.interceptors.request.eject(interceptor);
  }, [csrfToken]); // Removed accessToken from dependencies to keep the interceptor stable


  useEffect(() => {
    const interceptor = http.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
          originalRequest._retry = true;
          
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return http(originalRequest);
            }
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => http.interceptors.response.eject(interceptor);
  }, [refreshAccessToken]);

  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      const savedToken = sessionStorage.getItem("accessToken");

      if (urlToken) {
        // If there's a token in the URL (Google Auth), prioritize it
        storeToken(urlToken);
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (savedToken) {
        storeToken(savedToken);
      } else {
        // Only try refresh if no token exists at all
        const newToken = await refreshAccessToken();
        if (newToken) {
          storeToken(newToken);
        }
      }
      setLoading(false);
    };
    init();
  }, [storeToken, refreshAccessToken]);



  const isAuthenticated = !!accessToken;

  const value = {
    accessToken,
    user,
    isAuthenticated,
    loading,
    login,
    loginWithMFA,
    googleLogin,
    logout,
    refreshAccessToken,
    storeToken,
    setCsrfToken,
    api: http,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { http as authApi };
export default AuthContext;
