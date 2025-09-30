import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false
}) => {
    const getIcon = () => {
        switch (type) {
            case 'delete':
                return <FaExclamationTriangle className="confirm-icon delete" />;
            case 'warning':
                return <FaExclamationTriangle className="confirm-icon warning" />;
            case 'info':
            default:
                return <FaInfoCircle className="confirm-icon info" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'delete':
                return 'btn btn-danger';
            case 'warning':
                return 'btn btn-warning';
            case 'info':
            default:
                return 'btn btn-primary';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="confirm-dialog">
                <div className="confirm-header">
                    <div className="confirm-icon-container">
                        {getIcon()}
                    </div>
                    <h3 className="confirm-title">{title}</h3>
                </div>

                <div className="confirm-body">
                    <p className="confirm-message">{message}</p>
                </div>

                <div className="confirm-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={getButtonClass()}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
