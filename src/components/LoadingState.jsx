import React from 'react';

const LoadingState = ({ message = 'Loading...', compact = false, size = 'large', className = '' }) => {
    const containerClass = compact
        ? 'loading-state-shell loading-state-shell--compact'
        : 'loading-state-shell';

    return (
        <div className={`${containerClass} ${className}`.trim()} role="status" aria-live="polite">
            <div className={`loading-spinner ${size}`} aria-hidden="true"></div>
            {message ? <p className="loading-state-message">{message}</p> : null}
        </div>
    );
};

export default LoadingState;
