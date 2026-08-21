import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';

const UserList = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [archivedUsers, setArchivedUsers] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [searchName, setSearchName] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const endpoint = showArchived ? '/api/users/archived/list' : '/api/users';
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}${endpoint}`);
                if (showArchived) {
                    setArchivedUsers(Array.isArray(data) ? data : []);
                } else {
                    setUsers(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                setError(err.message || 'Something went wrong. Could not load users.');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.isAdmin) {
            setLoading(true);
            fetchUsers();
        }
    }, [user, showArchived]);

    const deleteHandler = async (id) => {
        if (window.confirm('Archive this user? You can restore later from Archived view.')) {
            try {
                await apiFetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                    method: 'DELETE',
                });
                setUsers(users.filter(u => u._id !== id));
            } catch (err) {
                alert(err.message || 'Something went wrong while deleting user.');
            }
        }
    };

    const restoreHandler = async (id) => {
        if (!window.confirm('Restore this user?')) return;
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/users/${id}/restore`, {
                method: 'PUT',
            });
            setArchivedUsers((prev) => prev.filter((u) => u._id !== id));
        } catch (err) {
            alert(err.message || 'Failed to restore user.');
        }
    };

    const purgeHandler = async (id) => {
        if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/users/${id}/purge`, {
                method: 'DELETE',
            });
            setArchivedUsers((prev) => prev.filter((u) => u._id !== id));
        } catch (err) {
            alert(err.message || 'Failed to permanently delete user.');
        }
    };

    if (loading)
        return (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#6b7280' }}>
                <div className="loading-spinner large"></div>
                <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading users...</p>
            </div>
        );
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    const visibleUsers = showArchived ? archivedUsers : users;

    const filteredUsers = visibleUsers.filter((u) => {
        const matchEmail = searchEmail
            ? u.email.toLowerCase().includes(searchEmail.toLowerCase())
            : true;
        const matchName = searchName
            ? (u.name || '').toLowerCase().includes(searchName.toLowerCase())
            : true;
        return matchEmail && matchName;
    });

    const getRoleLabel = (u) => {
        if (u.role) return u.role;
        return u.isAdmin ? 'MANAGER' : 'CUSTOMER';
    };

    return (
        <div>
            <h1 style={{ fontSize: '28px', marginBottom: '20px', color: '#333' }}>Users</h1>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <button
                    type="button"
                    onClick={() => setShowArchived(false)}
                    style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: showArchived ? '#fff' : '#111827',
                        color: showArchived ? '#374151' : '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Active
                </button>
                <button
                    type="button"
                    onClick={() => setShowArchived(true)}
                    style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: showArchived ? '#111827' : '#fff',
                        color: showArchived ? '#fff' : '#374151',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Archived
                </button>
            </div>

            <div
                style={{
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                }}
            >
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Search by email</label>
                    <input
                        type="text"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="customer@example.com"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>Search by name</label>
                    <input
                        type="text"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="Customer name"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                    />
                </div>
                <div style={{ alignSelf: 'flex-end', fontSize: '13px', color: '#6b7280' }}>
                    Showing {filteredUsers.length} of {visibleUsers.length} users
                </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '12px', color: '#666', fontSize: '14px' }}>ID</th>
                            <th style={{ padding: '12px', color: '#666', fontSize: '14px' }}>NAME</th>
                            <th style={{ padding: '12px', color: '#666', fontSize: '14px' }}>EMAIL</th>
                            <th style={{ padding: '12px', color: '#666', fontSize: '14px' }}>ROLE</th>
                            <th style={{ padding: '12px', color: '#666', fontSize: '14px' }}>ADMIN</th>
                            <th style={{ padding: '12px', color: '#666', fontSize: '14px' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((currentUser) => (
                            <tr key={currentUser._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{currentUser._id}</td>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{currentUser.name}</td>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                                    <a href={`mailto:${currentUser.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{currentUser.email}</a>
                                </td>
                                <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        backgroundColor: currentUser.isAdmin ? '#eef2ff' : '#f3f4f6',
                                        color: currentUser.isAdmin ? '#4f46e5' : '#4b5563',
                                        textTransform: 'uppercase'
                                    }}>
                                        {getRoleLabel(currentUser)}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                    {currentUser.isAdmin ? (
                                        <i className="fas fa-check" style={{ color: '#10b981' }}></i>
                                    ) : (
                                        <i className="fas fa-times" style={{ color: '#ef4444' }}></i>
                                    )}
                                </td>
                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {!showArchived ? (
                                            <>
                                                <Link to={`/admin/user/${currentUser._id}/edit`} style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '4px', textDecoration: 'none', fontSize: '12px' }}>
                                                    <i className="fas fa-edit"></i> Edit
                                                </Link>
                                                <button
                                                    onClick={() => deleteHandler(currentUser._id)}
                                                    style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    <i className="fas fa-archive"></i> Archive
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => restoreHandler(currentUser._id)}
                                                    style={{ padding: '6px 12px', backgroundColor: '#ecfdf5', color: '#166534', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    <i className="fas fa-undo"></i> Restore
                                                </button>
                                                <button
                                                    onClick={() => purgeHandler(currentUser._id)}
                                                    style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    <i className="fas fa-trash"></i> Purge
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;
