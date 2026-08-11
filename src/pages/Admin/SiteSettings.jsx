import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { apiFetch } from '../../utils/apiClient';

const emptySlide = () => ({
    title: '',
    subtitle: '',
    image: '',
    cta: '',
    link: '',
    color: '#E1261C',
    active: true,
});

const emptyCollection = () => ({
    id: '',
    title: '',
    tagline: '',
    query: '',
});

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');
const fromCsv = (value) =>
    String(value || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

const SiteSettings = () => {
    const { user } = useAuth();
    const { config, setConfig } = useSiteConfig();

    const [taxRate, setTaxRate] = useState(16);
    const [promoBarText, setPromoBarText] = useState('');
    const [promoBarLink, setPromoBarLink] = useState('');
    const [heroSlides, setHeroSlides] = useState([]);
    const [curatedCollections, setCuratedCollections] = useState([]);
    const [homeShowcaseCategories, setHomeShowcaseCategories] = useState('');
    const [globalLowStockThreshold, setGlobalLowStockThreshold] = useState(5);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!config) return;

        setTaxRate(
            typeof config.taxRate === 'number'
                ? Math.round(config.taxRate * 100)
                : 16
        );
        setPromoBarText(config.promoBarText || '');
        setPromoBarLink(config.promoBarLink || '');
        setHeroSlides(
            Array.isArray(config.heroSlides) && config.heroSlides.length
                ? config.heroSlides
                : [emptySlide()]
        );
        setCuratedCollections(
            Array.isArray(config.curatedCollections) && config.curatedCollections.length
                ? config.curatedCollections
                : []
        );
        setHomeShowcaseCategories(toCsv(config.homeShowcaseCategories));
        setGlobalLowStockThreshold(
            typeof config.globalLowStockThreshold === 'number' ? config.globalLowStockThreshold : 5
        );
    }, [config]);

    const updateSlide = (index, field, value) => {
        setHeroSlides((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addSlide = () => setHeroSlides((prev) => [...prev, emptySlide()]);
    const removeSlide = (index) =>
        setHeroSlides((prev) => prev.filter((_, i) => i !== index));

    const moveSlide = (index, direction) => {
        setHeroSlides((prev) => {
            const next = [...prev];
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= next.length) return prev;
            const tmp = next[index];
            next[index] = next[newIndex];
            next[newIndex] = tmp;
            return next;
        });
    };

    const updateCollection = (index, field, value) => {
        setCuratedCollections((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addCollection = () =>
        setCuratedCollections((prev) => [...prev, emptyCollection()]);
    const removeCollection = (index) =>
        setCuratedCollections((prev) => prev.filter((_, i) => i !== index));

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage('');
        setError('');

        try {
            const body = {
                taxRate: Number(taxRate) / 100,
                promoBarText,
                promoBarLink,
                heroSlides,
                curatedCollections,
                homeShowcaseCategories: fromCsv(homeShowcaseCategories),
                globalLowStockThreshold: Number(globalLowStockThreshold),
            };

            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/site-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            setConfig(data);
            setMessage('Settings updated successfully.');
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const styles = {
        card: {
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #eee',
            marginBottom: '24px',
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#1a1a1a',
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontWeight: 600,
            color: '#374151',
            fontSize: '13px',
        },
        input: {
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
        },
    };

    return (
        <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '20px', color: '#111827' }}>
                Site Settings & Promotions
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
                Control tax rate, global promo bar, homepage hero slider, and curated collections
                without redeploying.
            </p>

            {error && (
                <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </div>
            )}
            {message && (
                <div style={{ backgroundColor: '#ecfdf3', color: '#166534', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {message}
                </div>
            )}

            <form onSubmit={submitHandler}>
                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Store basics</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={styles.label}>Tax rate (VAT %) </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                style={styles.input}
                            />
                            <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                Used on the checkout page to compute tax. Example: 16 for 16% VAT.
                            </p>
                        </div>
                        <div>
                            <label style={styles.label}>Top promo bar text</label>
                            <input
                                type="text"
                                value={promoBarText}
                                onChange={(e) => setPromoBarText(e.target.value)}
                                placeholder="Enter promo message"
                                style={styles.input}
                            />
                            <label style={{ ...styles.label, marginTop: '10px' }}>Promo bar link (optional)</label>
                            <input
                                type="text"
                                value={promoBarLink}
                                onChange={(e) => setPromoBarLink(e.target.value)}
                                placeholder="/delivery or full https:// URL"
                                style={styles.input}
                            />
                        </div>
                        <div>
                            <label style={styles.label}>Global low-stock threshold</label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                step="1"
                                value={globalLowStockThreshold}
                                onChange={(e) => setGlobalLowStockThreshold(e.target.value)}
                                style={styles.input}
                            />
                            <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                Applies to all products/variants unless a product overrides it.
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label style={styles.label}>Homepage Top Categories (comma separated)</label>
                        <input
                            type="text"
                            value={homeShowcaseCategories}
                            onChange={(e) => setHomeShowcaseCategories(e.target.value)}
                            placeholder="iPhone Cases, Audio & Headphones, Phones & Tablets, Samsung Cases"
                            style={styles.input}
                        />
                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                            These categories will be prioritized in the Top Categories block on homepage.
                        </p>
                    </div>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Homepage hero slider</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                        These slides power the large hero carousel on the homepage. If left empty,
                        the default hard-coded slides will be used.
                    </p>
                    {heroSlides.map((slide, index) => (
                        <div
                            key={index}
                            style={{
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                padding: '14px',
                                marginBottom: '12px',
                                backgroundColor: '#f9fafb',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px',
                                }}
                            >
                                <strong style={{ fontSize: '13px', color: '#374151' }}>
                                    Slide #{index + 1}
                                </strong>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => moveSlide(index, -1)}
                                        disabled={index === 0}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '11px',
                                            color: index === 0 ? '#d1d5db' : '#6b7280',
                                            cursor: index === 0 ? 'default' : 'pointer',
                                        }}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveSlide(index, 1)}
                                        disabled={index === heroSlides.length - 1}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '11px',
                                            color:
                                                index === heroSlides.length - 1
                                                    ? '#d1d5db'
                                                    : '#6b7280',
                                            cursor:
                                                index === heroSlides.length - 1
                                                    ? 'default'
                                                    : 'pointer',
                                        }}
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeSlide(index)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '11px',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '10px' }}>
                                <div>
                                    <label style={styles.label}>Title</label>
                                    <input
                                        type="text"
                                        value={slide.title || ''}
                                        onChange={(e) => updateSlide(index, 'title', e.target.value)}
                                        style={styles.input}
                                    />
                                    <label style={{ ...styles.label, marginTop: '8px' }}>
                                        Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        value={slide.subtitle || ''}
                                        onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
                                        style={styles.input}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Image URL</label>
                                    <input
                                        type="text"
                                        value={slide.image || ''}
                                        onChange={(e) => updateSlide(index, 'image', e.target.value)}
                                        style={styles.input}
                                    />
                                    <label style={{ ...styles.label, marginTop: '8px' }}>
                                        CTA Label
                                    </label>
                                    <input
                                        type="text"
                                        value={slide.cta || ''}
                                        onChange={(e) => updateSlide(index, 'cta', e.target.value)}
                                        placeholder="e.g. Shop Now"
                                        style={styles.input}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>CTA Link</label>
                                    <input
                                        type="text"
                                        value={slide.link || ''}
                                        onChange={(e) => updateSlide(index, 'link', e.target.value)}
                                        placeholder="/category/Accessories"
                                        style={styles.input}
                                    />
                                    <label style={{ ...styles.label, marginTop: '8px' }}>
                                        Accent Color
                                    </label>
                                    <input
                                        type="color"
                                        value={slide.color || '#E1261C'}
                                        onChange={(e) => updateSlide(index, 'color', e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: 0,
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                        }}
                                    />
                                    <label style={{ ...styles.label, marginTop: '8px' }}>
                                        Active
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={slide.active !== false}
                                        onChange={(e) =>
                                            updateSlide(index, 'active', e.target.checked)
                                        }
                                    />{' '}
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Show this slide
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSlide}
                        style={{
                            marginTop: '8px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px dashed #d1d5db',
                            backgroundColor: '#f9fafb',
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        + Add slide
                    </button>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Curated collections</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                        These power the “CURATED SETUPS” cards on the homepage. Each collection
                        links to a pre-filtered search.
                    </p>
                    {curatedCollections.map((collection, index) => (
                        <div
                            key={index}
                            style={{
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                padding: '14px',
                                marginBottom: '12px',
                                backgroundColor: '#f9fafb',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px',
                                }}
                            >
                                <strong style={{ fontSize: '13px', color: '#374151' }}>
                                    Collection #{index + 1}
                                </strong>
                                <button
                                    type="button"
                                    onClick={() => removeCollection(index)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '11px',
                                        color: '#dc2626',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={styles.label}>ID (internal)</label>
                                    <input
                                        type="text"
                                        value={collection.id || ''}
                                        onChange={(e) =>
                                            updateCollection(index, 'id', e.target.value)
                                        }
                                        placeholder="work-essentials"
                                        style={styles.input}
                                    />
                                    <label style={{ ...styles.label, marginTop: '8px' }}>
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={collection.title || ''}
                                        onChange={(e) =>
                                            updateCollection(index, 'title', e.target.value)
                                        }
                                        placeholder="Work & Study Essentials"
                                        style={styles.input}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Tagline</label>
                                    <input
                                        type="text"
                                        value={collection.tagline || ''}
                                        onChange={(e) =>
                                            updateCollection(index, 'tagline', e.target.value)
                                        }
                                        placeholder="Laptops, tablets, and accessories for productive days."
                                        style={styles.input}
                                    />
                                    <label style={{ ...styles.label, marginTop: '8px' }}>
                                        Search query
                                    </label>
                                    <input
                                        type="text"
                                        value={collection.query || ''}
                                        onChange={(e) =>
                                            updateCollection(index, 'query', e.target.value)
                                        }
                                        placeholder="office, creator, gaming, etc."
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addCollection}
                        style={{
                            marginTop: '8px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px dashed #d1d5db',
                            backgroundColor: '#f9fafb',
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        + Add collection
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#E41E26',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '16px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 5px 20px rgba(228, 30, 38, 0.3)',
                    }}
                >
                    {saving ? 'Saving...' : 'Save settings'}
                </button>
            </form>
        </div>
    );
};

export default SiteSettings;

