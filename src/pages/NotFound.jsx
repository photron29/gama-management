import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Error Icon */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle className="text-4xl text-red-600" />
                    </div>
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Page Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                        <FaHome className="h-4 w-4" />
                        <span>Go to Dashboard</span>
                    </button>
                    
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-200 hover:border-gray-300"
                    >
                        <FaArrowLeft className="h-4 w-4" />
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Additional Help */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        If you believe this is an error, please contact support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
