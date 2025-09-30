import React from 'react';
import './HamburgerIcon.css';

const HamburgerIcon = ({ isOpen }) => {
    return (
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
        </div>
    );
};

export default HamburgerIcon;
