'use client'

import { createContext, useContext } from 'react'

export const MobileMenuContext = createContext<{
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (v: boolean) => void;
}>({
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: () => { }
});

export const useMobileMenu = () => useContext(MobileMenuContext);
