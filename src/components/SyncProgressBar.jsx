import React from 'react';
import LoadingAtom from './LoadingAtom';

const SyncProgressBar = ({ isVisible, progress, message = "Syncing data..." }) => {
    if (!isVisible) return null;

    // Ensure progress is a number and between 0-100
    const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

    return (
        <div className="floating-progress">
            <div className="progress-container">
                <div className="progress-header">
                    <LoadingAtom size="small" />
                    <span>{message}</span>
                </div>
                <div className="custom-progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${safeProgress}%` }}
                    ></div>
                </div>
                <div className="progress-percentage">
                    {safeProgress}%
                </div>
            </div>
        </div>
    );
};

export default SyncProgressBar;
