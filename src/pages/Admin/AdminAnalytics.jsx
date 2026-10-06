import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Clock3, ExternalLink, FileText, MousePointerClick, RefreshCw, Search, SearchCheck, Smartphone, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';
import './AdminAnalytics.css';

const dayString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const getDateRange = (preset) => {
    const today = new Date();
    const to = dayString(today);
    if (preset === 'Today') return { from: to, to };
    if (preset === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: dayString(yesterday), to: dayString(yesterday) };
    }
    if (preset === 'This month') return { from: dayString(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    const days = preset === '7 days' ? 6 : preset === '90 days' ? 89 : 29;
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    return { from: dayString(from), to };
};

const number = (value) => Number(value || 0).toLocaleString('en-KE');
const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const position = (value) => Number(value || 0).toFixed(1);
const presetOptions = ['Today', 'Yesterday', '7 days', '30 days', '90 days', 'This month'];

const Trend = ({ current, previous }) => {
    if (current === null || current === undefined || previous === null || previous === undefined) return 'No prior comparison';
    if (previous === 0) return current === 0 ? 'No change vs prior period' : 'New in this period';
    const delta = ((current - previous) / previous) * 100;
    const Icon = delta >= 0 ? ArrowUpRight : ArrowDownRight;
    return <span className={`seo-trend ${delta >= 0 ? 'up' : 'down'}`}><Icon size={13} />{delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs prior period</span>;
};

const AdminAnalytics = () => {
    const { user } = useAuth();
    const initialRange = getDateRange('30 days');
    const [from, setFrom] = useState(initialRange.from);
    const [to, setTo] = useState(initialRange.to);
    const [activePreset, setActivePreset] = useState('30 days');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTick, setRefreshTick] = useState(0);
    const [granularity, setGranularity] = useState('day');
    const [topN, setTopN] = useState('30');
    const [queryFilter, setQueryFilter] = useState('');
    const [trendMetric, setTrendMetric] = useState('visitors');

    useEffect(() => {
        if (!user?.isAdmin) return undefined;
        let cancelled = false;
        const params = new URLSearchParams({ from, to, granularity, topN });
        apiFetch(`${import.meta.env.VITE_API_URL}/api/analytics/deep-dive?${params}`)
            .then((result) => { if (!cancelled) setData(result); })
            .catch((loadError) => { if (!cancelled) setError(loadError.message || 'Could not load SEO analytics.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user, from, to, granularity, topN, refreshTick]);

    const selectPreset = (preset) => {
        const range = getDateRange(preset);
        if (range.from !== from || range.to !== to) setLoading(true);
        setError('');
        setActivePreset(preset);
        setFrom(range.from);
        setTo(range.to);
    };

    const changeDate = (setter, value) => {
        setLoading(true);
        setError('');
        setter(value);
        setActivePreset('');
    };

    const refresh = () => {
        setLoading(true);
        setError('');
        setRefreshTick((tick) => tick + 1);
    };

    const search = data?.searchConsole;
    const audit = data?.seoAudit;
    const current = search?.current;
    const previous = search?.previous;
    const hasSearchData = search?.status === 'connected' && current !== null;
    const days = search?.timeseries || [];
    const maxImpressions = Math.max(1, ...days.map((row) => row.impressions));
    const maxClicks = Math.max(1, ...days.map((row) => row.clicks));
    const queries = search?.queries || [];
    const pages = search?.pages || [];
    const opportunities = queries.filter((row) => row.impressions > 0 && row.position >= 4 && row.position <= 20)
        .sort((a, b) => b.impressions - a.impressions).slice(0, 6);
    const homepageEvents = data?.eventTypes || [];
    const eventMax = Math.max(1, ...homepageEvents.map((row) => row.count));
    const behavior = data?.behavior;
    const behaviorTotals = behavior?.totals;
    const behaviorTrend = behavior?.trend || [];
    const behaviorSources = behavior?.sources || [];
    const behaviorDevices = behavior?.devices || [];
    const behaviorPages = behavior?.pages || [];
    const behaviorClicks = behavior?.clicks || [];
    const behaviorScroll = behavior?.scrollDepth || [];
    const maxSourceVisitors = Math.max(1, ...behaviorSources.map((row) => row.visitors));
    const queryRows = queries.filter((row) => row.key.toLowerCase().includes(queryFilter.trim().toLowerCase())).slice(0, Number(topN));
    const clickRows = behaviorClicks.slice(0, Number(topN));
    const pageRows = behaviorPages.slice(0, Number(topN));
    const formatDuration = (seconds) => {
        if (seconds === null || seconds === undefined) return 'Not collected';
        const minutes = Math.floor(seconds / 60);
        const remainder = Math.round(seconds % 60);
        return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
    };
    const trendMetrics = [
        { id: 'visitors', label: 'Visitors', value: (row) => row.visitors },
        { id: 'pageViews', label: 'Views', value: (row) => row.pageViews },
        { id: 'clicks', label: 'Clicks', value: (row) => row.clicks },
        { id: 'engagedSeconds', label: 'Engaged time', value: (row) => row.engagedSeconds },
    ];
    const selectedTrendMetric = trendMetrics.find((metric) => metric.id === trendMetric) || trendMetrics[0];
    const trendValues = behaviorTrend.map((row) => ({ ...row, value: selectedTrendMetric.value(row) }));
    const trendMaximum = Math.max(0, ...trendValues.map((row) => row.value));
    const trendPeak = trendValues.reduce((peak, row) => row.value > peak.value ? row : peak, { value: 0, period: '' });
    const axisMagnitude = 10 ** Math.floor(Math.log10(Math.max(1, trendMaximum)));
    const axisRatio = trendMaximum / axisMagnitude;
    const trendAxisMaximum = (axisRatio <= 1 ? 1 : axisRatio <= 2 ? 2 : axisRatio <= 5 ? 5 : 10) * axisMagnitude;
    const trendLabelStep = Math.max(1, Math.ceil((trendValues.length - 1) / 6));
    const trendLabelIndexes = trendValues.map((_, index) => index).filter((index) => index % trendLabelStep === 0 || index === trendValues.length - 1);
    const formatTrendValue = (value) => trendMetric === 'engagedSeconds' ? formatDuration(value) : number(value);
    const formatTrendPeriod = (period) => {
        if (granularity === 'day') return new Date(`${period}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
        if (granularity === 'week') return `W${period.slice(-2)}`;
        return new Date(`${period}-01T00:00:00`).toLocaleDateString('en-KE', { month: 'short' });
    };

    return (
        <div className="seo-analytics">
            <header className="seo-header">
                <div>
                    <p className="seo-eyebrow">CASEPROZ / SEARCH PERFORMANCE</p>
                    <h1>Analytics &amp; SEO intelligence</h1>
                    <p className="seo-subtitle">Google search visibility, product metadata, and real storefront discovery signals.</p>
                </div>
                <button className="seo-refresh" type="button" onClick={refresh} disabled={loading} aria-label="Refresh SEO analytics">
                    <RefreshCw size={15} className={loading ? 'seo-spinning' : ''} />
                    <span>{loading ? 'Refreshing' : 'Refresh'}</span>
                </button>
            </header>

            <section className="seo-controls" aria-label="Analytics date range">
                <div className="seo-presets" role="group" aria-label="Date range presets">
                    {presetOptions.map((preset) => <button key={preset} type="button" className={activePreset === preset ? 'active' : ''} onClick={() => selectPreset(preset)}>{preset}</button>)}
                </div>
                <div className="seo-date-range">
                    <label><span>From</span><input type="date" value={from} max={to} onChange={(event) => changeDate(setFrom, event.target.value)} /></label>
                    <span>to</span>
                    <label><span>To</span><input type="date" value={to} min={from} max={dayString(new Date())} onChange={(event) => changeDate(setTo, event.target.value)} /></label>
                    <CalendarDays size={15} />
                </div>
                <div className="seo-analysis-filters">
                    <label><span>Trend</span><select value={granularity} onChange={(event) => { setLoading(true); setGranularity(event.target.value); }}><option value="day">By day</option><option value="week">By week</option><option value="month">By month</option></select></label>
                    <label><span>Rows</span><select value={topN} onChange={(event) => setTopN(event.target.value)}><option value="15">Top 15</option><option value="30">Top 30</option><option value="50">Top 50</option><option value="100">Top 100</option></select></label>
                </div>
            </section>

            {error && <div className="seo-error" role="alert">{error}</div>}
            {data && (
                <>
                    <section className={`seo-connection ${search?.status === 'connected' ? 'connected' : 'disconnected'}`}>
                        <div className="seo-connection-icon"><SearchCheck size={17} /></div>
                        <div className="seo-connection-copy">
                            <strong>{search?.status === 'connected' ? 'Google Search Console connected' : search?.status === 'error' ? 'Search Console connection needs attention' : 'Google Search Console not connected'}</strong>
                            <span>{search?.status === 'connected'
                                ? `${search.siteUrl} · Search data can be delayed by Google.`
                                : search?.status === 'error'
                                    ? search.error
                                    : 'Search queries, clicks, impressions, and ranking data are unavailable until the backend connection is configured.'}</span>
                        </div>
                        {search?.status !== 'connected' && <span className="seo-config-hint">See backend/GOOGLE-SEARCH-CONSOLE-SETUP.md</span>}
                    </section>

                    <section className="seo-kpis" aria-label="Google search performance">
                        <article className="seo-kpi seo-kpi-clicks"><div><Search size={15} /> Clicks</div><strong>{hasSearchData ? number(current.clicks) : 'Not connected'}</strong><Trend current={current?.clicks} previous={previous?.clicks} /></article>
                        <article className="seo-kpi seo-kpi-impressions"><div><Activity size={15} /> Impressions</div><strong>{hasSearchData ? number(current.impressions) : 'Not connected'}</strong><Trend current={current?.impressions} previous={previous?.impressions} /></article>
                        <article className="seo-kpi seo-kpi-ctr"><div><ArrowUpRight size={15} /> Average CTR</div><strong>{hasSearchData ? percent(current.ctr) : 'Not connected'}</strong><span>Clicks ÷ impressions</span></article>
                        <article className="seo-kpi seo-kpi-position"><div><SearchCheck size={15} /> Average position</div><strong>{hasSearchData ? position(current.position) : 'Not connected'}</strong><span>Lower position is better</span></article>
                    </section>

                    {search?.status === 'connected' && !hasSearchData && <p className="seo-no-data">Search Console is connected, but has not returned finalized search data for this date range.</p>}

                    {behaviorTotals && <>
                        <section className="seo-behavior-overview">
                            <div className="seo-section-heading"><div><h2>Visitor behavior</h2><p>First-party events recorded by this store. New behavior history starts when the tracker is deployed.</p></div><span>{number(behaviorTotals.events)} events</span></div>
                            <div className="seo-behavior-kpis">
                                <article><div><Users size={15} /> Unique browsers</div><strong>{number(behaviorTotals.visitors)}</strong><span>Anonymous browser IDs</span></article>
                                <article><div><Activity size={15} /> Visits</div><strong>{number(behaviorTotals.sessions)}</strong><span>Tab-scoped sessions</span></article>
                                <article><div><Search size={15} /> Page views</div><strong>{number(behaviorTotals.pageViews)}</strong><span>Public storefront routes</span></article>
                                <article><div><MousePointerClick size={15} /> Click interactions</div><strong>{number(behaviorTotals.clicks)}</strong><span>Instrumented controls</span></article>
                                <article><div><Clock3 size={15} /> Avg. engaged time</div><strong>{formatDuration(behaviorTotals.pageViews ? behaviorTotals.engagedSeconds / behaviorTotals.pageViews : null)}</strong><span>Foreground time per view</span></article>
                            </div>
                        </section>

                        <section className="seo-panel seo-behavior-trend">
                            <div className="seo-panel-heading"><div><h2>Store activity over time</h2><p>Select one measure to inspect; exact period values are below.</p></div><span className="seo-source-label">{granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly'} · {from} – {to}</span></div>
                            <div className="seo-trend-toolbar">
                                <div className="seo-trend-metrics" role="group" aria-label="Trend measure">
                                    {trendMetrics.map((metric) => <button key={metric.id} type="button" aria-pressed={trendMetric === metric.id} className={trendMetric === metric.id ? 'active' : ''} onClick={() => setTrendMetric(metric.id)}>{metric.label}</button>)}
                                </div>
                                {trendMaximum > 0 && <span className="seo-trend-peak">Peak {formatTrendValue(trendPeak.value)} · {trendPeak.period}</span>}
                            </div>
                            {trendValues.length ? <>
                                {trendMaximum > 0 ? <div className={`seo-trend-graph metric-${trendMetric}`}>
                                    <svg viewBox="0 0 1000 230" preserveAspectRatio="none" role="img" aria-label={`${selectedTrendMetric.label} bar chart by ${granularity}`}>
                                        {[0, 1, 2, 3, 4].map((tick) => {
                                            const y = 18 + tick * 40;
                                            const value = trendAxisMaximum * (1 - tick / 4);
                                            return <g key={tick} className="seo-trend-gridline">
                                                <line x1="58" y1={y} x2="990" y2={y} />
                                                <text x="49" y={y + 3} textAnchor="end">{number(Math.round(value))}</text>
                                            </g>;
                                        })}
                                        {trendValues.map((row, index) => {
                                            const plotWidth = 932;
                                            const center = 58 + (trendValues.length <= 1 ? plotWidth / 2 : (index / (trendValues.length - 1)) * plotWidth);
                                            const barWidth = Math.min(22, Math.max(4, (plotWidth / Math.max(trendValues.length, 1)) * 0.62));
                                            const barHeight = row.value ? Math.max(2, (row.value / trendAxisMaximum) * 160) : 0;
                                            return <rect key={row.period} className="seo-trend-bar" x={center - barWidth / 2} y={178 - barHeight} width={barWidth} height={barHeight} rx="2">
                                                <title>{row.period}: {formatTrendValue(row.value)} {selectedTrendMetric.label.toLowerCase()}</title>
                                            </rect>;
                                        })}
                                        {trendLabelIndexes.map((index) => {
                                            const plotWidth = 932;
                                            const x = 58 + (trendValues.length <= 1 ? plotWidth / 2 : (index / (trendValues.length - 1)) * plotWidth);
                                            const anchor = index === 0 ? 'start' : index === trendValues.length - 1 ? 'end' : 'middle';
                                            return <text key={trendValues[index].period} className="seo-trend-date-label" x={x} y="211" textAnchor={anchor}>{formatTrendPeriod(trendValues[index].period)}</text>;
                                        })}
                                    </svg>
                                </div> : <p className="seo-empty">No {selectedTrendMetric.label.toLowerCase()} recorded in this range.</p>}
                                <details className="seo-trend-details">
                                    <summary>Show all period data ({number(trendValues.length)})</summary>
                                    <div className="seo-table-wrap"><table><thead><tr><th>Period</th><th>Visitors</th><th>Views</th><th>Clicks</th><th>Engaged time</th></tr></thead><tbody>
                                        {behaviorTrend.map((row) => <tr key={row.period}><td>{row.period}</td><td>{number(row.visitors)}</td><td>{number(row.pageViews)}</td><td>{number(row.clicks)}</td><td>{formatDuration(row.engagedSeconds)}</td></tr>)}
                                    </tbody></table></div>
                                </details>
                            </> : <p className="seo-empty">No tracked activity in this range yet. New analytics begin collecting after the tracker is deployed.</p>}
                        </section>
                    </>}

                    <section className="seo-panel seo-trend-panel">
                        <div className="seo-panel-heading"><div><h2>Search visibility trend</h2><p>Daily clicks and impressions returned by Google Search Console</p></div><span className="seo-source-label">{from} – {to}</span></div>
                        {days.length ? <>
                            <div className="seo-chart-legend"><span><i className="legend-impressions" /> Impressions</span><span><i className="legend-clicks" /> Clicks</span></div>
                            <div className="seo-chart-scroll" role="img" aria-label="Daily Google Search Console clicks and impressions">
                                <div className="seo-chart">{days.map((row) => <div className="seo-chart-day" key={row.key} title={`${row.key}: ${number(row.clicks)} clicks, ${number(row.impressions)} impressions`}>
                                    <div className="seo-chart-track"><div className="seo-chart-bar seo-bar-impressions" style={{ height: `${Math.max(row.impressions ? 3 : 0, (row.impressions / maxImpressions) * 100)}%` }} /><div className="seo-chart-bar seo-bar-clicks" style={{ height: `${Math.max(row.clicks ? 3 : 0, (row.clicks / maxClicks) * 100)}%` }} /></div>
                                    <span>{new Date(`${row.key}T00:00:00`).getDate()}</span>
                                </div>)}</div>
                            </div>
                        </> : <p className="seo-empty">No daily search data is available for this range.</p>}
                    </section>

                    <div className="seo-data-grid">
                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Google search queries</h2><p>Queries actually reported by Search Console</p></div><span className="seo-count">{number(queryRows.length)} rows</span></div>
                            <input className="seo-query-filter" type="search" value={queryFilter} onChange={(event) => setQueryFilter(event.target.value)} placeholder="Filter search queries" aria-label="Filter search queries" />
                            {queryRows.length ? <div className="seo-table-wrap"><table><thead><tr><th>Query</th><th>Clicks</th><th>Impr.</th><th>CTR</th><th>Position</th></tr></thead><tbody>
                                {queryRows.map((row) => <tr key={row.key}><td>{row.key || '(query withheld)'}</td><td>{number(row.clicks)}</td><td>{number(row.impressions)}</td><td>{percent(row.ctr)}</td><td>{position(row.position)}</td></tr>)}
                            </tbody></table></div> : <p className="seo-empty">{search?.status === 'connected' ? 'No query rows for this date range.' : 'Connect Search Console to see real query data.'}</p>}
                        </section>

                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Organic landing pages</h2><p>Pages appearing in Google search results</p></div><ExternalLink size={15} /></div>
                            {pages.length ? <div className="seo-table-wrap"><table><thead><tr><th>Landing page</th><th>Clicks</th><th>Impr.</th><th>Position</th></tr></thead><tbody>
                                {pages.map((row) => <tr key={row.key}><td><a href={row.key} target="_blank" rel="noreferrer">{row.key.replace(/^https?:\/\//, '')}</a></td><td>{number(row.clicks)}</td><td>{number(row.impressions)}</td><td>{position(row.position)}</td></tr>)}
                            </tbody></table></div> : <p className="seo-empty">{search?.status === 'connected' ? 'No landing-page rows for this date range.' : 'Connect Search Console to see real organic landing pages.'}</p>}
                        </section>
                    </div>

                    {behavior && <div className="seo-data-grid">
                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Acquisition source &amp; medium</h2><p>Attributed from first-touch referrer or UTM tags</p></div><span className="seo-count">{number(behaviorSources.length)} sources</span></div>
                            {behaviorSources.length ? <div className="seo-table-wrap"><table><thead><tr><th>Source</th><th>Medium</th><th>Campaign</th><th>Visitors</th><th>Visits</th><th>Views</th><th>Clicks</th></tr></thead><tbody>
                                {behaviorSources.slice(0, Number(topN)).map((row, index) => <tr key={`${row.source}-${row.medium}-${row.campaign}-${index}`}><td>{row.source}</td><td>{row.medium}</td><td>{row.campaign}</td><td>{number(row.visitors)}</td><td>{number(row.sessions)}</td><td>{number(row.pageViews)}</td><td>{number(row.clicks)}</td></tr>)}
                            </tbody></table></div> : <p className="seo-empty">No acquisition data has been recorded yet.</p>}
                            {behaviorSources.length > 0 && <div className="seo-inline-bars">{behaviorSources.slice(0, 8).map((row, index) => <div key={`${row.source}-${row.medium}-bar-${index}`}><span>{row.source} / {row.medium}</span><div className="seo-meter"><span style={{ width: `${(row.visitors / maxSourceVisitors) * 100}%` }} /></div></div>)}</div>}
                        </section>

                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Devices &amp; technology</h2><p>Device, browser, and operating system from request headers</p></div><Smartphone size={16} /></div>
                            {behaviorDevices.length ? <div className="seo-table-wrap"><table><thead><tr><th>Device</th><th>Visitors</th><th>Visits</th><th>Views</th><th>Clicks</th><th>Avg. time</th></tr></thead><tbody>
                                {behaviorDevices.map((row) => <tr key={row.device}><td>{row.device}</td><td>{number(row.visitors)}</td><td>{number(row.sessions)}</td><td>{number(row.pageViews)}</td><td>{number(row.clicks)}</td><td>{formatDuration(row.pageViews ? row.engagedSeconds / row.pageViews : null)}</td></tr>)}
                            </tbody></table></div> : <p className="seo-empty">No device data has been recorded yet.</p>}
                            <div className="seo-tech-splits"><div><h3>Browsers</h3>{(behavior.browsers || []).map((row) => <p key={row.browser}><span>{row.browser}</span><strong>{number(row.sessions)} visits</strong></p>)}</div><div><h3>Operating systems</h3>{(behavior.operatingSystems || []).map((row) => <p key={row.operatingSystem}><span>{row.operatingSystem}</span><strong>{number(row.sessions)} visits</strong></p>)}</div></div>
                        </section>
                    </div>}

                    {behavior && <div className="seo-data-grid">
                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Top pages &amp; engagement</h2><p>Views, click activity, scroll milestones, and foreground time</p></div><ExternalLink size={15} /></div>
                            {pageRows.length ? <div className="seo-table-wrap"><table><thead><tr><th>Page</th><th>Visitors</th><th>Views</th><th>Clicks</th><th>Avg. engaged</th><th>50% scrolls</th></tr></thead><tbody>
                                {pageRows.map((row) => <tr key={row.page}><td>{row.page}</td><td>{number(row.visitors)}</td><td>{number(row.pageViews)}</td><td>{number(row.clicks)}</td><td>{formatDuration(row.averageEngagedSeconds)}</td><td>{number(row.scroll50)}</td></tr>)}
                            </tbody></table></div> : <p className="seo-empty">Page engagement will appear as visits are recorded.</p>}
                        </section>

                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Click drilldown</h2><p>Destination and page for tracked links and controls</p></div><MousePointerClick size={16} /></div>
                            {clickRows.length ? <div className="seo-table-wrap"><table><thead><tr><th>Target</th><th>Page</th><th>Type</th><th>Clicks</th><th>Visitors</th></tr></thead><tbody>
                                {clickRows.map((row, index) => <tr key={`${row.page}-${row.destination}-${row.label}-${index}`}><td>{row.label || row.destination}</td><td>{row.page}</td><td>{row.element}</td><td>{number(row.clicks)}</td><td>{number(row.visitors)}</td></tr>)}
                            </tbody></table></div> : <p className="seo-empty">No UI click events recorded in this range yet.</p>}
                        </section>
                    </div>}

                    {behavior && <section className="seo-panel seo-scroll-panel">
                        <div className="seo-panel-heading"><div><h2>Scroll depth</h2><p>Sessions reaching each page-scroll milestone</p></div><Activity size={16} /></div>
                        {behaviorScroll.length ? <div className="seo-scroll-depth">{behaviorScroll.map((row) => <div key={row.percentage}><strong>{number(row.percentage)}%</strong><div className="seo-meter"><span style={{ width: `${Math.min(100, row.percentage)}%` }} /></div><span>{number(row.sessions)} sessions · {number(row.events)} events</span></div>)}</div> : <p className="seo-empty">Scroll milestones start appearing after the tracker records page scrolling.</p>}
                    </section>}

                    <div className="seo-data-grid">
                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Search opportunities</h2><p>Reported queries ranking 4–20, ordered by impressions</p></div><Search size={16} /></div>
                            {opportunities.length ? <div className="seo-opportunity-list">{opportunities.map((row) => <div className="seo-opportunity" key={row.key}>
                                <div><strong>{row.key || '(query withheld)'}</strong><span>{number(row.impressions)} impressions · position {position(row.position)}</span></div>
                                <span className="seo-opportunity-tag">Review page title</span>
                            </div>)}</div> : <p className="seo-empty">{search?.status === 'connected' ? 'No qualifying query opportunities in this date range.' : 'Search Console data is required to identify query opportunities.'}</p>}
                        </section>

                        <section className="seo-panel">
                            <div className="seo-panel-heading"><div><h2>Event mix</h2><p>Tracked event types recorded in this date range</p></div><Activity size={16} /></div>
                            {homepageEvents.length ? <div className="seo-event-list">{homepageEvents.map((event) => <div className="seo-event-row" key={event.eventName}>
                                <span>{event.eventName.replace(/_/g, ' ')}</span><strong>{number(event.count)}</strong><div className="seo-meter"><span style={{ width: `${(event.count / eventMax) * 100}%` }} /></div>
                            </div>)}</div> : <p className="seo-empty">No homepage interactions were recorded in this date range. These are clicks, not visitor or lead counts.</p>}
                        </section>
                    </div>

                    <section className="seo-panel seo-audit-panel">
                        <div className="seo-panel-heading"><div><h2>On-page SEO &amp; sitemap health</h2><p>Live product metadata and URLs included by this site’s sitemap endpoint</p></div><FileText size={16} /></div>
                        <div className="seo-audit-grid">
                            <div className="seo-coverage-block">
                                <h3>Product metadata</h3>
                                <div className="seo-coverage-line"><span>SEO titles</span><strong>{number(audit.productsWithTitle)} / {number(audit.activeProducts)}</strong></div>
                                <div className="seo-meter"><span style={{ width: `${audit.activeProducts ? (audit.productsWithTitle / audit.activeProducts) * 100 : 0}%` }} /></div>
                                <div className="seo-coverage-line"><span>Meta descriptions</span><strong>{number(audit.productsWithDescription)} / {number(audit.activeProducts)}</strong></div>
                                <div className="seo-meter seo-meter-green"><span style={{ width: `${audit.activeProducts ? (audit.productsWithDescription / audit.activeProducts) * 100 : 0}%` }} /></div>
                                {audit.missingProductTitles.length > 0 && <div className="seo-missing-list"><h4>Products missing SEO titles</h4>{audit.missingProductTitles.slice(0, 6).map((product) => <Link key={product._id} to={`/admin/product/${product._id}/edit`}>{product.name}</Link>)}</div>}
                                {audit.missingProductDescriptions.length > 0 && <div className="seo-missing-list"><h4>Products missing meta descriptions</h4>{audit.missingProductDescriptions.slice(0, 6).map((product) => <Link key={product._id} to={`/admin/product/${product._id}/edit`}>{product.name}</Link>)}</div>}
                            </div>
                            <div className="seo-coverage-block seo-sitemap-block">
                                <h3>Sitemap URL inventory</h3>
                                <div><span>Active product URLs</span><strong>{number(audit.sitemap.productUrls)}</strong></div>
                                <div><span>Category URLs</span><strong>{number(audit.sitemap.categoryUrls)}</strong></div>
                                <div><span>Brand URLs</span><strong>{number(audit.sitemap.brandUrls)}</strong></div>
                                <div><span>Static URLs</span><strong>{number(audit.sitemap.staticUrls)}</strong></div>
                                <div className="seo-sitemap-total"><span>Total URLs generated</span><strong>{number(audit.sitemap.totalUrls)}</strong></div>
                                <a href={`${import.meta.env.VITE_API_URL}/sitemap.xml`} target="_blank" rel="noreferrer">Open live sitemap <ExternalLink size={13} /></a>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default AdminAnalytics;