import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSync, FaExclamationCircle } from 'react-icons/fa';

const ErrorPage = ({ error, resetError }) => {
    const navigate = useNavigate();

    const handleRefresh = () => {
        if (resetError) {
            resetError();
        } else {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full">
                {/* Error Icon */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaExclamationCircle className="text-4xl text-red-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Oops!</h1>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        We encountered an unexpected error. Don't worry, our team has been notified.
                    </p>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800 font-mono">
                                {error.message || 'An unknown error occurred'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={handleRefresh}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                        <FaSync className="h-4 w-4" />
                        <span>Try Again</span>
                    </button>
                    
                    <button
                        onClick={handleGoHome}
                        className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-200 hover:border-gray-300"
                    >
                        <FaHome className="h-4 w-4" />
                        <span>Go to Dashboard</span>
                    </button>
                </div>

                {/* Additional Help */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        If this problem persists, please contact support with the error details above.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
