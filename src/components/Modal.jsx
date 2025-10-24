import React, { useEffect, useRef } from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true,
    type = 'default'
}) => {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Store the currently focused element
            previousActiveElement.current = document.activeElement;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Handle ESC key
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEsc);

            return () => {
                document.removeEventListener('keydown', handleEsc);
                document.body.style.overflow = 'unset';

                // Restore focus to the previously focused element
                if (previousActiveElement.current && previousActiveElement.current.focus) {
                    previousActiveElement.current.focus();
                }
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'small':
                return 'max-w-md';
            case 'large':
                return 'max-w-4xl';
            case 'extra-large':
                return 'max-w-6xl';
            default:
                return 'max-w-2xl';
        }
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    headerBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                    icon: <FaInfoCircle className="h-6 w-6 text-white" />
                };
            case 'warning':
                return {
                    headerBg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
                    icon: <FaInfoCircle className="h-6 w-6 text-white" />
                };
            case 'danger':
                return {
                    headerBg: 'bg-gradient-to-r from-red-500 to-pink-600',
                    icon: <FaInfoCircle className="h-6 w-6 text-white" />
                };
            default:
                return {
                    headerBg: 'bg-gradient-to-r from-blue-600 to-purple-600',
                    icon: <FaInfoCircle className="h-6 w-6 text-white" />
                };
        }
    };

    const typeStyles = getTypeStyles();

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div 
                ref={modalRef}
                className={`bg-white rounded-3xl shadow-2xl w-full ${getSizeClasses()} max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                {/* Modern Header */}
                {title && (
                    <div className={`${typeStyles.headerBg} p-6`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {typeStyles.icon}
                                <h2 id="modal-title" className="text-2xl font-bold text-white">
                                    {title}
                                </h2>
                            </div>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200 group"
                                    aria-label="Close modal"
                                >
                                    <FaTimes className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Modern Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;