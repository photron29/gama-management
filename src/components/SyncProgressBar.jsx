import React from 'react';
import LoadingAtom from './LoadingAtom';

const SyncProgressBar = ({ isVisible, progress, message = "Syncing data..." }) => {
    if (!isVisible) return null;

    // Ensure progress is a number and between 0-100
    const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 min-w-80">
                <div className="flex items-center space-x-3 mb-4">
                    <LoadingAtom size="small" />
                    <span className="text-gray-700 font-medium">{message}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${safeProgress}%` }}
                    ></div>
                </div>
                <div className="text-right text-sm font-semibold text-gray-600">
                    {safeProgress}%
                </div>
            </div>
        </div>
    );
};

export default SyncProgressBar;