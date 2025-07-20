import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../lib/api'
import { User } from '../types/user'
import { LoginCredentials } from '../types/auth'

interface AuthContextType {
  user: User | null
  tokens: { accessToken: string; refreshToken: string } | null
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (details: any) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { i18n } = useTranslation();

  // Compute isAuthenticated based on user and tokens
  const isAuthenticated = !!(user && tokens?.accessToken)

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem('user')
      const storedTokens = window.localStorage.getItem('tokens')
      if (storedUser && storedTokens) {
        const parsedUser = JSON.parse(storedUser);
        const parsedTokens = JSON.parse(storedTokens);
        setUser(parsedUser)
        setTokens(parsedTokens)
        api.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.accessToken}`;
        console.log('Auth restored from localStorage:', { user: parsedUser, hasToken: !!parsedTokens.accessToken });
      } else {
        console.log('No auth data in localStorage');
      }
    } catch (e) {
      console.error('Failed to parse auth data from storage', e)
      window.localStorage.removeItem('user')
      window.localStorage.removeItem('tokens')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post('/auth/login', credentials)
      const { user, tokens } = response.data.data
      setUser(user)
      setTokens(tokens)
      window.localStorage.setItem('user', JSON.stringify(user))
      window.localStorage.setItem('tokens', JSON.stringify(tokens))
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      console.log('Login successful, navigating to dashboard');
      navigate(`/${i18n.language}/dashboard`, { replace: true })
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (details: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', details);
      const { user, tokens } = response.data.data;
      setUser(user);
      setTokens(tokens);
      window.localStorage.setItem('user', JSON.stringify(user));
      window.localStorage.setItem('tokens', JSON.stringify(tokens));
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      console.log('Signup successful, navigating to dashboard');
      navigate(`/${i18n.language}/dashboard`, { replace: true });
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out...');
    setUser(null)
    setTokens(null)
    window.localStorage.removeItem('user')
    window.localStorage.removeItem('tokens')
    delete api.defaults.headers.common['Authorization']
    navigate(`/${i18n.language}/login`, { replace: true });
  }

  const contextValue = useMemo(
    () => ({
      user,
      tokens,
      login,
      signup,
      logout,
      isLoading,
      error,
      isAuthenticated,
    }),
    [user, tokens, isLoading, error, isAuthenticated]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 