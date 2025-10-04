import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true
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
    }, [isOpen]); // Removed onClose from dependencies

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const sizeClasses = {
        small: 'modal-small',
        medium: 'modal-medium',
        large: 'modal-large'
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div
                className={`modal-container ${sizeClasses[size]}`}
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                {title && (
                    <div className="modal-header">
                        <h2 id="modal-title" className="modal-title">{title}</h2>
                        {showCloseButton && (
                            <button
                                className="modal-close"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
