'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface User {
  id: string
  email: string
  fullName: string
  role: 'collector' | 'brand'
  phone?: string
  isEmailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, phone?: string, role?: 'collector' | 'brand') => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = Cookies.get('auth-token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
        } else {
          Cookies.remove('auth-token')
        }
      } else {
        Cookies.remove('auth-token')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      Cookies.remove('auth-token')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign in')
    }

    if (data.success) {
      setUser(data.user)
      // Token is set in cookies by server
      router.push('/dashboard')
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role?: 'collector' | 'brand'
  ) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, phone, role: role || 'collector' }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up')
    }

    if (data.success) {
      setUser(data.user)
      // Token is set in cookies by server
      router.push('/dashboard')
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (error) {
      console.error('Signout error:', error)
    } finally {
      Cookies.remove('auth-token')
      setUser(null)
      router.push('/sign-in')
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

