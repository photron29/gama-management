import React from 'react';
import { Atom } from 'react-loading-indicators';
import { useTheme } from '../context/ThemeContext';

const LoadingAtom = ({ size = "medium", text = "", className = "" }) => {
    const { isDarkMode } = useTheme();

    return (
        <Atom
            color={isDarkMode ? "#60a5fa" : "#3231cc"}
            size={size}
            text={text}
            textColor=""
            className={className}
        />
    );
};

export default LoadingAtom;
