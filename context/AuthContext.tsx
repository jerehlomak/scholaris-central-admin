'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { CentralAdmin } from '@/types'

interface AuthContextType {
    admin: CentralAdmin | null
    token: string | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    admin: null, token: null, loading: true,
    login: async () => { }, logout: () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<CentralAdmin | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('centralAdmin')
        const storedToken = localStorage.getItem('centralAdminToken')
        if (stored && storedToken) {
            setAdmin(JSON.parse(stored))
            setToken(storedToken)
        }
        setLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password })
        const { token: t, admin: a } = res.data
        localStorage.setItem('centralAdminToken', t)
        localStorage.setItem('centralAdmin', JSON.stringify(a))
        setToken(t)
        setAdmin(a)
        router.push('/')
    }

    const logout = () => {
        localStorage.removeItem('centralAdminToken')
        localStorage.removeItem('centralAdmin')
        setAdmin(null)
        setToken(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ admin, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
