import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

const AdminRoute = () => {
    const { user, initializing } = useAuth();

    // Wait until auth state is resolved before deciding to redirect
    if (initializing) {
        return (
            <div style={{ padding: '80px 0' }}>
                <LoadingState message="Checking access..." />
            </div>
        );
    }

    return user && user.isAdmin ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminRoute;
