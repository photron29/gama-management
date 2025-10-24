import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

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
                return <FaExclamationTriangle className="h-8 w-8 text-red-500" />;
            case 'warning':
                return <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />;
            case 'success':
                return <FaCheckCircle className="h-8 w-8 text-green-500" />;
            case 'info':
            default:
                return <FaInfoCircle className="h-8 w-8 text-blue-500" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'delete':
                return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-200';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white shadow-green-200';
            case 'info':
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200';
        }
    };

    const getHeaderBg = () => {
        switch (type) {
            case 'delete':
                return 'bg-gradient-to-r from-red-500 to-pink-600';
            case 'warning':
                return 'bg-gradient-to-r from-yellow-500 to-orange-500';
            case 'success':
                return 'bg-gradient-to-r from-green-500 to-emerald-600';
            case 'info':
            default:
                return 'bg-gradient-to-r from-blue-600 to-purple-600';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                {/* Modern Header */}
                <div className={`${getHeaderBg()} p-6 rounded-t-3xl`}>
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {getIcon()}
                        </div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                </div>

                {/* Modern Body */}
                <div className="p-6">
                    <p className="text-gray-700 text-base leading-relaxed">{message}</p>
                </div>

                {/* Modern Actions */}
                <div className="flex space-x-3 p-6 pt-0">
                    <button
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`flex-1 px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl ${getButtonClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </div>
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