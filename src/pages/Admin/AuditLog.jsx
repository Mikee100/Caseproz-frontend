import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../utils/apiClient';
import LoadingState from '../../components/LoadingState';
import ErrorBanner from '../../components/ErrorBanner';

const pageSize = 30;

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [action, setAction] = useState('');
    const [entityType, setEntityType] = useState('');
    const [actorEmail, setActorEmail] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0, totalPages: 1 });

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (q.trim()) params.set('q', q.trim());
        if (action.trim()) params.set('action', action.trim());
        if (entityType.trim()) params.set('entityType', entityType.trim());
        if (actorEmail.trim()) params.set('actorEmail', actorEmail.trim());
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return params.toString();
    }, [page, q, action, entityType, actorEmail, from, to]);

    useEffect(() => {
        let mounted = true;

        const fetchAuditLogs = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/analytics/audit-logs?${queryString}`);
                if (!mounted) return;
                setLogs(Array.isArray(data?.items) ? data.items : []);
                setPagination(data?.pagination || { page: 1, pageSize, total: 0, totalPages: 1 });
            } catch (err) {
                if (!mounted) return;
                if (err instanceof ApiError) {
                    setError(err.message || 'Failed to load audit logs.');
                } else {
                    setError('Failed to load audit logs.');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchAuditLogs();

        return () => {
            mounted = false;
        };
    }, [queryString]);

    const resetFilters = () => {
        setQ('');
        setAction('');
        setEntityType('');
        setActorEmail('');
        setFrom('');
        setTo('');
        setPage(1);
    };

    return (
        <div>
            <div style={{ marginBottom: '14px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#111827' }}>Audit Log</h1>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Track critical actions across orders and admin workflows.
                </p>
            </div>

            <ErrorBanner message={error} onClose={() => setError('')} />

            <section
                style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    padding: '12px',
                    marginBottom: '12px',
                }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search action, entity, actor"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px' }}
                    />
                    <input
                        type="text"
                        value={action}
                        onChange={(e) => {
                            setAction(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Action"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px' }}
                    />
                    <input
                        type="text"
                        value={entityType}
                        onChange={(e) => {
                            setEntityType(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Entity type"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px' }}
                    />
                    <input
                        type="text"
                        value={actorEmail}
                        onChange={(e) => {
                            setActorEmail(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Actor email"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px' }}
                    />
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => {
                            setFrom(e.target.value);
                            setPage(1);
                        }}
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px' }}
                    />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => {
                            setTo(e.target.value);
                            setPage(1);
                        }}
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '13px' }}
                    />
                    <button
                        type="button"
                        onClick={resetFilters}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '7px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}
                    >
                        Reset
                    </button>
                </div>
            </section>

            <section
                style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                }}
            >
                {loading ? (
                    <div style={{ padding: '20px' }}>
                        <LoadingState message="Loading audit logs..." compact />
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
                            {pagination.total.toLocaleString()} total log entries
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                        <th style={{ padding: '9px 10px', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                                        <th style={{ padding: '9px 10px', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                                        <th style={{ padding: '9px 10px', borderBottom: '1px solid #e5e7eb' }}>Entity</th>
                                        <th style={{ padding: '9px 10px', borderBottom: '1px solid #e5e7eb' }}>Actor</th>
                                        <th style={{ padding: '9px 10px', borderBottom: '1px solid #e5e7eb' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '14px 10px', color: '#6b7280' }}>
                                                No audit logs found for current filters.
                                            </td>
                                        </tr>
                                    )}
                                    {logs.map((log) => {
                                        const detailsText = log?.details
                                            ? JSON.stringify(log.details)
                                            : '';
                                        return (
                                            <tr key={log._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                                    {formatDateTime(log.createdAt)}
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '999px', background: '#eef2ff', color: '#3730a3', fontWeight: 600 }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    <div style={{ fontWeight: 600, color: '#111827' }}>{log.entityType}</div>
                                                    {log.entityId && (
                                                        <div style={{ marginTop: '3px', color: '#6b7280' }}>
                                                            {log.entityType === 'order' ? (
                                                                <Link to={`/admin/order/${log.entityId}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                                                    {String(log.entityId)}
                                                                </Link>
                                                            ) : (
                                                                String(log.entityId)
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                                    <div style={{ color: '#111827' }}>{log?.actor?.name || 'System'}</div>
                                                    <div style={{ marginTop: '3px', color: '#6b7280' }}>{log?.actor?.email || '—'}</div>
                                                </td>
                                                <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#374151', maxWidth: '440px' }}>
                                                    <div
                                                        style={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            fontFamily: 'Consolas, Menlo, Monaco, monospace',
                                                            fontSize: '11px',
                                                        }}
                                                        title={detailsText}
                                                    >
                                                        {detailsText || '—'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '7px',
                                        background: '#fff',
                                        cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '7px',
                                        background: '#fff',
                                        cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default AuditLog;
