import React from 'react';

const HamburgerIcon = ({ isOpen }) => {
    return (
        <div className="w-6 h-5 flex flex-col justify-between cursor-pointer">
            <span className={`block h-0.5 w-full bg-current rounded-sm transition-all duration-300 ease-in-out ${
                isOpen ? 'translate-y-2 rotate-45' : ''
            }`}></span>
            <span className={`block h-0.5 w-full bg-current rounded-sm transition-all duration-300 ease-in-out ${
                isOpen ? 'opacity-0 scale-x-0' : ''
            }`}></span>
            <span className={`block h-0.5 w-full bg-current rounded-sm transition-all duration-300 ease-in-out ${
                isOpen ? '-translate-y-2 -rotate-45' : ''
            }`}></span>
        </div>
    );
};

export default HamburgerIcon;