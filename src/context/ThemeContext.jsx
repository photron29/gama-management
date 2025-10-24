import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of the context data
// We are now providing a boolean (isDarkMode) and a toggle function
const ThemeContext = createContext();

// Helper to determine initial theme
const getInitialTheme = () => {
    if (typeof window === 'undefined') {
        return false; // Default to light mode (false) during server-side rendering
    }
    
    // 1. Check saved preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme === 'dark';
    }
    
    // 2. Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const ThemeProvider = ({ children }) => {
    // Set initial state using the helper function
    const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

    useEffect(() => {
        // Determine the class name string
        const theme = isDarkMode ? 'dark' : 'light';
        
        // 1. Save preference
        localStorage.setItem('theme', theme);

        // 2. Update document class for Tailwind dark mode
        const root = window.document.documentElement;
        
        // Ensure no redundant classes are present
        root.classList.remove('dark', 'light');

        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            // We don't need to explicitly add 'light' since Tailwind defaults to light
            // but we can add it for clarity if needed, or just let it inherit the default styles.
        }
        
    }, [isDarkMode]); // Re-run whenever the dark mode state changes

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    const value = {
        isDarkMode,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
