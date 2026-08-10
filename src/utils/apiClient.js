export class ApiError extends Error {
    constructor(message, options = {}) {
        super(message || 'Something went wrong. Please try again.');
        this.name = 'ApiError';
        this.status = options.status;
        this.code = options.code;
        this.details = options.details;
    }
}

export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

    const finalOptions = {
        // Always send/receive cookies for cross-origin API calls
        credentials: 'include',
        ...options,
        headers: {
            ...authHeader,
            ...options.headers,
        },
    };

    let response;
    try {
        response = await fetch(url, finalOptions);
    } catch (networkErr) {
        // Preserve aborted requests so callers can handle cancellation gracefully.
        if (networkErr?.name === 'AbortError') {
            throw networkErr;
        }
        throw new ApiError('Unable to reach the server. Please check your connection and try again.', {
            code: 'NETWORK_ERROR',
        });
    }

    let data = null;
    let isJson = true;
    try {
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
            isJson = false;
        }
    } catch {
        // Fallback if text() also fails
    }

    if (!response.ok) {
        const message =
            (isJson && data?.message) ||
            (response.status >= 500
                ? 'We are having trouble on our side. Please try again in a moment.'
                : 'We could not complete that action. Please review and try again.');

        throw new ApiError(message, {
            status: response.status,
            code: isJson ? data?.code : undefined,
            details: data,
        });
    }

    return data;
};

