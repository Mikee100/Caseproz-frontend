import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/apiClient';
import './Health.css';

const statusLabel = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
};

const Health = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHealth = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/analytics/health`);
            setHealth(data);
        } catch (err) {
            setError(err.message || 'Unable to load health summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const counts = useMemo(() => {
        const sectors = Array.isArray(health?.sectors) ? health.sectors : [];
        return {
            healthy: sectors.filter((s) => s.status === 'healthy').length,
            warning: sectors.filter((s) => s.status === 'warning').length,
            critical: sectors.filter((s) => s.status === 'critical').length,
        };
    }, [health]);

    if (loading) {
        return (
            <div className="health-page-state">
                <div className="loading-spinner large"></div>
                <p className="health-state-text">Loading system health...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="health-page-state health-error">
                <p>{error}</p>
                <button type="button" onClick={fetchHealth} className="health-action-btn">
                    Retry
                </button>
            </div>
        );
    }

    const sectors = Array.isArray(health?.sectors) ? health.sectors : [];

    return (
        <div className="health-page">
            <header className="health-header">
                <div>
                    <h1 className="health-title">System Health</h1>
                    <p className="health-subtitle">Operational status across critical admin sectors.</p>
                </div>
                <div className="health-header-actions">
                    <button type="button" onClick={fetchHealth} className="health-action-btn">
                        Refresh
                    </button>
                    <Link to="/admin/dashboard" className="health-link-btn">Back to dashboard</Link>
                </div>
            </header>

            <section className={`health-overview health-${health?.overallStatus || 'healthy'}`}>
                <div>
                    <p className="health-overview-label">Overall status</p>
                    <h2 className="health-overview-status">{statusLabel[health?.overallStatus] || 'Healthy'}</h2>
                </div>
                <div className="health-overview-meta">
                    <div>
                        <p className="health-metric-label">Generated</p>
                        <p className="health-metric-value">
                            {health?.generatedAt ? new Date(health.generatedAt).toLocaleString() : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="health-metric-label">Node uptime</p>
                        <p className="health-metric-value">{Number(health?.uptimeSeconds || 0).toLocaleString()}s</p>
                    </div>
                </div>
            </section>

            <section className="health-mini-stats">
                <div className="health-mini-card">
                    <span>Healthy</span>
                    <strong>{counts.healthy}</strong>
                </div>
                <div className="health-mini-card warning">
                    <span>Warning</span>
                    <strong>{counts.warning}</strong>
                </div>
                <div className="health-mini-card critical">
                    <span>Critical</span>
                    <strong>{counts.critical}</strong>
                </div>
            </section>

            <section className="health-grid">
                {sectors.map((sector) => (
                    <article key={sector.key} className={`health-card ${sector.status}`}>
                        <div className="health-card-head">
                            <h3>{sector.title}</h3>
                            <span className={`health-pill ${sector.status}`}>
                                {statusLabel[sector.status] || sector.status}
                            </span>
                        </div>
                        <p className="health-card-summary">{sector.summary}</p>
                        <div className="health-card-metrics">
                            {(sector.metrics || []).map((metric) => (
                                <div key={`${sector.key}-${metric.label}`} className="health-card-metric-row">
                                    <span>{metric.label}</span>
                                    <strong>{String(metric.value)}</strong>
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </section>

            {Array.isArray(health?.lowStockPreview) && health.lowStockPreview.length > 0 && (
                <section className="health-low-stock">
                    <div className="health-low-stock-head">
                        <h2>Low stock preview</h2>
                        <Link to="/admin/productlist">Open product list</Link>
                    </div>
                    <ul>
                        {health.lowStockPreview.map((item) => (
                            <li key={`${item._id}-${item.variantSku || 'base'}`}>
                                <span className="name">{item.name}</span>
                                <span className="stock">Stock {item.stock}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default Health;
