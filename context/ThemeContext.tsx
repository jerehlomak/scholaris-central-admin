'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('ca-theme') as Theme | null
        if (stored === 'light' || stored === 'dark') {
            setTheme(stored)
        }
    }, [])

    // Apply theme class to <html>
    useEffect(() => {
        const root = document.documentElement
        if (theme === 'light') {
            root.classList.remove('dark')
            root.classList.add('light')
        } else {
            root.classList.remove('light')
            root.classList.add('dark')
        }
        localStorage.setItem('ca-theme', theme)
    }, [theme])

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
