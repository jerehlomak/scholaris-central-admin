'use client'

import { Bell, Search, RefreshCw, Menu, Sun, Moon, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useMobileMenu } from '@/context/MobileMenuContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
    title: string
    subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
    const { admin, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const { setIsMobileMenuOpen } = useMobileMenu()

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 gap-4 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden -ml-2 text-muted-foreground"
                >
                    <Menu className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold leading-tight text-foreground">{title}</h1>
                    {subtitle && <p className="text-xs hidden sm:block text-muted-foreground">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-muted/50 border border-border">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <Input
                        placeholder="Quick search…"
                        className="border-0 bg-transparent p-0 h-auto w-40 text-xs shadow-none focus-visible:ring-0 text-muted-foreground placeholder:text-muted-foreground"
                    />
                </div>

                {/* Refresh */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="text-muted-foreground">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                </Tooltip>

                {/* Theme Toggle */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {isDark
                                ? <Sun className="w-4 h-4 text-amber-400" />
                                : <Moon className="w-4 h-4 text-slate-600" />
                            }
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</TooltipContent>
                </Tooltip>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary" />
                </Button>

                {/* Avatar menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="shrink-0 rounded-full">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-bold">
                                    {admin?.name?.[0] || 'A'}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <p className="text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
                            <p className="text-xs font-normal text-muted-foreground truncate">{admin?.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="gap-2">
                            <User className="w-4 h-4" />
                            {admin?.role || 'SUPER_ADMIN'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="gap-2 text-red-400 focus:text-red-300">
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
