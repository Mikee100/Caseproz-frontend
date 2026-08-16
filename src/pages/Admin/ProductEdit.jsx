

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../utils/apiClient';

const toList = (value) => {
    if (!value) return [];
    return String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
};

const createEmptyVariant = () => ({
    label: '',
    color: '',
    style: '',
    image: '',
    price: '',
    stock: '',
    sku: '',
});

const ProductEdit = () => {
        // Variants state
        const [variants, setVariants] = useState([]);
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [originalPrice, setOriginalPrice] = useState(0);
    const [image, setImage] = useState('');
    const [images, setImages] = useState([]);
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [categoriesText, setCategoriesText] = useState('');
    const [sku, setSku] = useState('');
    const [brand, setBrand] = useState('');
    const [variantGroup, setVariantGroup] = useState('');
    const [variantLabel, setVariantLabel] = useState('');
    const [featureHeadline, setFeatureHeadline] = useState('');
    const [featureSubtext, setFeatureSubtext] = useState('');
    const [notes, setNotes] = useState([]);
    const [stock, setStock] = useState(0);
    const [lowStockThreshold, setLowStockThreshold] = useState(5);
    const [description, setDescription] = useState('');
    const [onSale, setOnSale] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);
    const [heroOrder, setHeroOrder] = useState(100);
    const [isActive, setIsActive] = useState(true);
    const [keyFeatures, setKeyFeatures] = useState([]);
    const [specs, setSpecs] = useState([]);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [slugOverride, setSlugOverride] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [availableCategories, setAvailableCategories] = useState({});
    const [availableBrands, setAvailableBrands] = useState([]);
    const [draggedImageIndex, setDraggedImageIndex] = useState(null);
    const [dragOverImageIndex, setDragOverImageIndex] = useState(null);
    
    // UI State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        hero: false,
        notes: false,
        highlights: false,
        specs: false,
        seo: false
    });

    const descriptionEditorRef = useRef(null);

    const subCategoryOptions = useMemo(() => {
        if (!category) return [];
        return availableCategories[category] || [];
    }, [category, availableCategories]);

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const [catRes, brandRes] = await Promise.all([
                    apiFetch(`${import.meta.env.VITE_API_URL}/api/categories`),
                    apiFetch(`${import.meta.env.VITE_API_URL}/api/brands`),
                ]);
                
                const cats = Array.isArray(catRes.data) ? catRes.data : catRes;
                const formattedCats = {};
                cats.forEach(c => {
                    formattedCats[c.name] = (c.subCategories || []).map(s => s.name);
                });
                setAvailableCategories(formattedCats);
                
                const brands = Array.isArray(brandRes.data) ? brandRes.data : brandRes;
                setAvailableBrands(brands.map(b => typeof b === 'string' ? b : b.name));
            } catch (err) {
                console.error('Failed to fetch form data:', err);
            }
        };
        fetchFormData();
    }, []);


    useEffect(() => {
        if (!isEditMode) return;

        const fetchProduct = async () => {
            setLoading(true);
            setError('');
            try {
                const product = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/id/${id}`);

                setName(product.name || '');
                setPrice(Number(product.price || 0));
                setOriginalPrice(Number(product.originalPrice || 0));
                setImage(product.images?.[0] || '');
                setImages(product.images || []);
                setCategory(product.category || '');
                setSubCategory(product.subCategory || '');
                setCategoriesText((product.categories || []).join(', '));
                setSku(product.sku || '');
                setBrand(product.brand || '');
                setVariantGroup(product.variantGroup || '');
                setVariantLabel(product.variantLabel || '');
                setFeatureHeadline(product.featureHeadline || '');
                setFeatureSubtext(product.featureSubtext || '');
                setNotes(product.notes || []);
                setStock(Number(product.stock || 0));
                setLowStockThreshold(
                    product.lowStockThreshold !== undefined && product.lowStockThreshold !== null
                        ? Number(product.lowStockThreshold)
                        : 5
                );
                setDescription(product.description || '');
                setOnSale(Boolean(product.onSale));
                setIsFeatured(Boolean(product.isFeatured));
                setHeroOrder(
                    product.heroOrder !== undefined && product.heroOrder !== null
                        ? Number(product.heroOrder)
                        : 100
                );
                setKeyFeatures(product.keyFeatures || []);
                setSpecs(product.specs || []);
                setIsActive(
                    product.isActive === undefined || product.isActive === null
                        ? true
                        : Boolean(product.isActive)
                );
                setMetaTitle(product.metaTitle || '');
                setMetaDescription(product.metaDescription || '');
                setSlugOverride(product.slug || '');

                setVariants(product.variants || []);

                // Set the contentEditable div's content directly after loading
                if (descriptionEditorRef.current) {
                    descriptionEditorRef.current.innerHTML = product.description || '';
                }
            } catch (err) {
                setError('Failed to fetch product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, isEditMode]);

    const uploadFileHandler = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);

        try {
            const uploadedUrls = [];

            for (const file of files) {
                const formData = new FormData();
                formData.append('image', file);

                const url = await apiFetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                }, { parseJson: false }); // Assuming upload returns plain text URL or JSON. Let's check apiFetch.
                uploadedUrls.push(url);
            }

            if (uploadedUrls.length) {
                // Use the first uploaded image as the main URL field
                setImage((prev) => prev || uploadedUrls[0]);
                setImages((prev) => [...prev, ...uploadedUrls]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
            // Allow selecting the same file(s) again by resetting the input
            e.target.value = '';
        }
    };

    const addKeyFeatureHandler = () => setKeyFeatures([...keyFeatures, '']);
    const removeKeyFeatureHandler = (index) => setKeyFeatures(keyFeatures.filter((_, i) => i !== index));
    const keyFeatureChangeHandler = (index, value) => {
        const next = [...keyFeatures];
        next[index] = value;
        setKeyFeatures(next);
    };

    const addSpecHandler = () => setSpecs([...specs, { key: '', value: '' }]);
    const removeSpecHandler = (index) => setSpecs(specs.filter((_, i) => i !== index));
    const specChangeHandler = (index, field, value) => {
        const next = [...specs];
        next[index][field] = value;
        setSpecs(next);
    };

    const addNoteHandler = () => {
        setNotes([...notes, '']);
        setExpandedSections(prev => ({ ...prev, notes: true }));
    };
    const removeNoteHandler = (index) => setNotes(notes.filter((_, i) => i !== index));
    const noteChangeHandler = (index, value) => {
        const next = [...notes];
        next[index] = value;
        setNotes(next);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const addImageUrlHandler = () => {
        const url = image.trim();
        if (!url) return;
        setImages((prev) => [...prev, url]);
        // If no main image is set yet, use this as the main one
        setImage('');
    };

    const addVariant = () => {
        setVariants((prev) => [...prev, createEmptyVariant()]);
    };

    const removeVariant = (index) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    };

    const updateVariant = (index, field, value) => {
        setVariants((prev) => {
            const next = [...prev];
            next[index] = { ...(next[index] || createEmptyVariant()), [field]: value };
            return next;
        });
    };

    const addVariantOption = (variantIdx) => {
        setVariants((prev) => {
            const next = [...prev];
            next[variantIdx] = next[variantIdx] || createEmptyVariant();
            next[variantIdx].options = next[variantIdx].options || [];
            next[variantIdx].options.push({ key: '', value: '' });
            return next;
        });
    };

    const removeVariantOption = (variantIdx, optIdx) => {
        setVariants((prev) => {
            const next = [...prev];
            if (!next[variantIdx]?.options) return prev;
            next[variantIdx].options.splice(optIdx, 1);
            return next;
        });
    };

    const updateVariantOption = (variantIdx, optIdx, field, value) => {
        setVariants((prev) => {
            const next = [...prev];
            if (!next[variantIdx]?.options?.[optIdx]) return prev;
            next[variantIdx].options[optIdx][field] = value;
            return next;
        });
    };

    const moveImage = (index, direction) => {
        setImages((prev) => {
            const next = [...prev];
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= next.length) return prev;
            const temp = next[index];
            next[index] = next[newIndex];
            next[newIndex] = temp;
            return next;
        });
    };

    const reorderImages = (fromIndex, toIndex) => {
        if (
            fromIndex === toIndex ||
            fromIndex === null ||
            toIndex === null ||
            fromIndex < 0 ||
            toIndex < 0
        ) {
            return;
        }

        setImages((prev) => {
            if (fromIndex >= prev.length || toIndex >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const handleImageDragStart = (index) => {
        setDraggedImageIndex(index);
    };

    const handleImageDrop = (dropIndex) => {
        reorderImages(draggedImageIndex, dropIndex);
        setDraggedImageIndex(null);
        setDragOverImageIndex(null);
    };

    const handleImageDragEnd = () => {
        setDraggedImageIndex(null);
        setDragOverImageIndex(null);
    };

    const execDescriptionCommand = (command, value = null) => {
        if (!descriptionEditorRef.current) return;
        descriptionEditorRef.current.focus();
        document.execCommand(command, false, value);
        setDescription(descriptionEditorRef.current.innerHTML);
    };


    // Keep contentEditable in sync with state on mount and when description changes (for new product)
    useEffect(() => {
        if (descriptionEditorRef.current && !isEditMode) {
            // Only set innerHTML if the content is different (prevents cursor jump)
            if (descriptionEditorRef.current.innerHTML !== (description || '')) {
                descriptionEditorRef.current.innerHTML = description || '';
            }
        }
    }, [description, isEditMode]);

    const handleDescriptionInput = () => {
        if (!descriptionEditorRef.current) return;
        // Only update state if content actually changed
        const html = descriptionEditorRef.current.innerHTML;
        if (html !== description) setDescription(html);
    };

    const insertDescriptionTemplate = (html) => {
        if (!descriptionEditorRef.current) {
            setDescription((prev) => `${prev}${html}`);
            return;
        }
        descriptionEditorRef.current.focus();
        document.execCommand('insertHTML', false, html);
        setDescription(descriptionEditorRef.current.innerHTML);
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const slugSource = slugOverride && slugOverride.trim().length > 0 ? slugOverride : name;
        const slug = slugSource
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');

        const normalizedVariants = (variants || [])
            .map((variant) => ({
                label: String(variant.label || variant.color || '').trim(),
                color: String(variant.color || '').trim(),
                style: String(variant.style || '').trim(),
                image: String(variant.image || '').trim(),
                price: Number(variant.price),
                stock: Number(variant.stock),
                sku: String(variant.sku || '').trim(),
            }))
            .filter((variant) => variant.label || variant.sku);

        const hasInvalidVariant = normalizedVariants.some(
            (variant) =>
                !variant.label ||
                !variant.sku ||
                !Number.isFinite(variant.price) ||
                !Number.isFinite(variant.stock) ||
                variant.price < 0 ||
                variant.stock < 0
        );

        if (hasInvalidVariant) {
            setError('Each variant must include label/color, SKU, price, and stock.');
            setLoading(false);
            return;
        }

        const skuSet = new Set(normalizedVariants.map((variant) => variant.sku.toLowerCase()));
        if (skuSet.size !== normalizedVariants.length) {
            setError('Variant SKU values must be unique.');
            setLoading(false);
            return;
        }

        const productData = {
            name,
            slug,
            price,
            originalPrice,
            images: images.length > 0 ? images : [image].filter(Boolean),
            category,
            subCategory,
            categories: toList(categoriesText),
            sku,
            brand,
            variantGroup,
            variantLabel,
            featureHeadline,
            featureSubtext,
            notes,
            stock,
            lowStockThreshold,
            description,
            onSale,
            isFeatured,
            heroOrder,
            isActive,
            keyFeatures,
            specs,
            metaTitle,
            metaDescription,
            variants: normalizedVariants,
        };

        try {
            const url = isEditMode
                ? `${import.meta.env.VITE_API_URL}/api/products/${id}`
                : `${import.meta.env.VITE_API_URL}/api/products`;
            const method = isEditMode ? 'PUT' : 'POST';

            await apiFetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });

            navigate('/admin/productlist');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
        setSubCategory('');
    };

    const styles = {
        card: {
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #eee'
        },
        label: {
            display: 'block',
            marginBottom: '10px',
            fontWeight: '600',
            color: '#333',
            fontSize: '14px'
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            fontSize: '15px',
            transition: 'border-color 0.3s',
            outline: 'none'
        },
        row: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px'
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        collapsibleHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '10px',
            border: '1px solid #eee',
            transition: 'background-color 0.2s'
        },
        collapsibleBody: {
            padding: '20px',
            border: '1px solid #eee',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            marginBottom: '20px',
            backgroundColor: '#fff'
        }
    };

    return (
        <div className="admin-product-edit">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>
                        {isEditMode ? 'Edit Product' : 'Create New Product'}
                    </h1>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                        Add the details that power the new product page (SKU, Brand, Categories, Hero banner, Notes).
                    </p>
                </div>
                <Link to="/admin/productlist" style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    textDecoration: 'none',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>
                    Cancel
                </Link>
            </div>

            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={submitHandler} style={styles.card}>
                {/* 1. Basic Essentials */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-star" style={{ color: '#E41E26' }}></i> 
                        Essential Details
                    </h2>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <label style={styles.label}>Product Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Anker Soundcore Liberty 5" style={styles.input} />
                    </div>

                    <div style={styles.row}>
                        <div>
                            <label style={styles.label}>Category *</label>
                             <select value={category} onChange={handleCategoryChange} required style={styles.input}>
                                <option value="">Select Category</option>
                                {Object.keys(availableCategories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Subcategory</label>
                            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} style={styles.input} disabled={!category}>
                                <option value="">{category ? 'Select Subcategory' : 'Select category first'}</option>
                                {subCategoryOptions.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div>
                            <label style={styles.label}>Price (KSh) *</label>
                            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required style={styles.input} />
                        </div>
                        <div>
                            <label style={styles.label}>Original Price (KSh) - <span style={{ fontWeight: 'normal', color: '#666' }}>optional</span></label>
                            <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} style={styles.input} />
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div>
                            <label style={styles.label}>Stock Quantity *</label>
                            <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} required style={styles.input} />
                        </div>
                        <div>
                            <label style={styles.label}>Low Stock Threshold</label>
                            <input type="number" value={lowStockThreshold} min={0} onChange={(e) => setLowStockThreshold(Number(e.target.value))} style={styles.input} />
                            {Number(stock) <= Number(lowStockThreshold) && (
                                <div style={{ color: '#E41E26', fontWeight: 600, marginTop: 6, fontSize: 13 }}>
                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }}></i>
                                    Warning: Stock is at or below the low-stock threshold!
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '6px', padding: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fafafa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                            <div>
                                <label style={{ ...styles.label, marginBottom: '8px' }}>Homepage Visibility</label>
                                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#334155' }}>
                                        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                                        Show in Hero Carousel
                                    </label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#334155' }}>
                                        <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} />
                                        Mark as On Sale
                                    </label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#334155' }}>
                                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                        Active Product
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label style={styles.label}>Hero Order (lower shows first)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={heroOrder}
                                    onChange={(e) => setHeroOrder(Number(e.target.value))}
                                    disabled={!isFeatured}
                                    style={{
                                        ...styles.input,
                                        backgroundColor: isFeatured ? '#fff' : '#f3f4f6',
                                        color: isFeatured ? '#111827' : '#9ca3af'
                                    }}
                                />
                                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                    Example: 1 appears before 5 in the homepage hero.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Media Section */}
                <div style={{ marginBottom: '40px', padding: '25px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h2 style={{ ...styles.sectionTitle, marginBottom: '15px' }}>
                        <i className="fas fa-images" style={{ color: '#E41E26' }}></i> 
                        Product Media
                    </h2>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Paste Image URL" style={{ ...styles.input, flex: 1, backgroundColor: 'white' }} />
                            <button
                                type="button"
                                onClick={addImageUrlHandler}
                                style={{
                                    padding: '0 18px',
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ADD URL
                            </button>
                            <label style={{
                                padding: '0 25px',
                                backgroundColor: '#1a1a1a',
                                color: 'white',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {uploading ? '...' : 'UPLOAD'}
                                <input type="file" multiple onChange={uploadFileHandler} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                    {images.length > 0 && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {images.map((img, i) => (
                                <div
                                    key={`${img}-${i}`}
                                    draggable
                                    onDragStart={() => handleImageDragStart(i)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverImageIndex(i);
                                    }}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        setDragOverImageIndex(i);
                                    }}
                                    onDrop={() => handleImageDrop(i)}
                                    onDragEnd={handleImageDragEnd}
                                    style={{
                                        position: 'relative',
                                        width: '94px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: dragOverImageIndex === i ? '2px solid #E41E26' : '1px solid #ddd',
                                        backgroundColor: '#fff',
                                        cursor: 'grab',
                                        boxShadow: draggedImageIndex === i ? '0 6px 18px rgba(0,0,0,0.18)' : 'none'
                                    }}
                                    title="Drag to reorder"
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            zIndex: 2,
                                            backgroundColor: 'rgba(0,0,0,0.65)',
                                            color: '#fff',
                                            fontSize: '10px',
                                            padding: '2px 5px',
                                            borderBottomRightRadius: '6px'
                                        }}
                                    >
                                        {i === 0 ? 'Cover' : `#${i + 1}`}
                                    </div>
                                    <img src={img} alt="" style={{ width: '100%', height: '60px', objectFit: 'cover' }} />
                                    <div style={{ display: 'flex', borderTop: '1px solid #eee' }}>
                                        <button
                                            type="button"
                                            onClick={() => moveImage(i, -1)}
                                            disabled={i === 0}
                                            style={{
                                                flex: 1,
                                                border: 'none',
                                                background: i === 0 ? '#f8f8f8' : '#fafafa',
                                                color: '#444',
                                                fontSize: '11px',
                                                padding: '4px 0',
                                                cursor: i === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                            title="Move left"
                                        >
                                            ←
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveImage(i, 1)}
                                            disabled={i === images.length - 1}
                                            style={{
                                                flex: 1,
                                                border: 'none',
                                                borderLeft: '1px solid #eee',
                                                background: i === images.length - 1 ? '#f8f8f8' : '#fafafa',
                                                color: '#444',
                                                fontSize: '11px',
                                                padding: '4px 0',
                                                cursor: i === images.length - 1 ? 'not-allowed' : 'pointer'
                                            }}
                                            title="Move right"
                                        >
                                            →
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            backgroundColor: 'rgba(228, 30, 38, 0.8)',
                                            color: 'white',
                                            border: 'none',
                                            width: '20px',
                                            height: '20px',
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Product Grouping (Variants) */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-layer-group" style={{ color: '#E41E26' }}></i> 
                        Product Family & Variants
                    </h2>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px', marginTop: '-10px' }}>
                        Connect different colors/sizes of the same product.
                    </p>
                    <div style={styles.row}>
                        <div>
                            <label style={styles.label}>Family Name (Link Variants)</label>
                            <input
                                type="text"
                                value={variantGroup}
                                onChange={(e) => setVariantGroup(e.target.value)}
                                placeholder="e.g. liberty-5"
                                style={styles.input}
                            />
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                Use the <strong>same name</strong> for all options (e.g. "liberty-5" for both Black and White models).
                            </div>
                        </div>
                        <div>
                            <label style={styles.label}>Variation Type (e.g. Color)</label>
                            <input
                                type="text"
                                value={variantLabel}
                                onChange={(e) => setVariantLabel(e.target.value)}
                                placeholder="e.g. White"
                                style={styles.input}
                            />
                        </div>
                    </div>
                </div>

                {/* 3b. Product Variants */}
                <div style={{ marginBottom: '40px', padding: '25px', backgroundColor: '#f3f4f6', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h2 style={{ ...styles.sectionTitle, marginBottom: '15px' }}>
                        <i className="fas fa-th-large" style={{ color: '#E41E26' }}></i>
                        Product Variants
                    </h2>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px', marginTop: '-10px' }}>
                        Add different options for this product (e.g. color, style, etc).
                    </p>
                    <button type="button" onClick={addVariant} style={{ marginBottom: '18px', padding: '8px 18px', backgroundColor: '#E41E26', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>+ Add Variant</button>
                    {variants.length === 0 && <div style={{ color: '#999', fontSize: '13px', marginBottom: '10px' }}>No variants added yet.</div>}
                    <div style={{ display: 'grid', gap: '18px' }}>
                        {variants.map((variant, idx) => (
                            <div key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px', position: 'relative' }}>
                                <button type="button" onClick={() => removeVariant(idx)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#E41E26', fontSize: '18px', cursor: 'pointer' }} title="Remove Variant">×</button>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={styles.label}>Label *</label>
                                        <input type="text" value={variant.label || ''} onChange={e => updateVariant(idx, 'label', e.target.value)} placeholder="e.g. White" style={styles.input} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Color</label>
                                        <input type="text" value={variant.color || ''} onChange={e => updateVariant(idx, 'color', e.target.value)} placeholder="e.g. White" style={styles.input} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Style</label>
                                        <input type="text" value={variant.style || ''} onChange={e => updateVariant(idx, 'style', e.target.value)} placeholder="e.g. Matte" style={styles.input} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={styles.label}>Image URL</label>
                                        <input type="text" value={variant.image || ''} onChange={e => updateVariant(idx, 'image', e.target.value)} placeholder="Paste image URL" style={styles.input} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>SKU *</label>
                                        <input type="text" value={variant.sku || ''} onChange={e => updateVariant(idx, 'sku', e.target.value)} placeholder="e.g. CASE-IPH15-WHT" style={styles.input} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Price *</label>
                                        <input type="number" value={variant.price || ''} onChange={e => updateVariant(idx, 'price', e.target.value)} placeholder="e.g. 1200" style={styles.input} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={styles.label}>Stock *</label>
                                        <input type="number" value={variant.stock || ''} onChange={e => updateVariant(idx, 'stock', e.target.value)} placeholder="e.g. 10" style={styles.input} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Other Options</label>
                                        <button type="button" onClick={() => addVariantOption(idx)} style={{ marginLeft: '10px', padding: '4px 10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Add Option</button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                                    {(variant.options || []).map((opt, optIdx) => (
                                        <div key={optIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input type="text" value={opt.key} onChange={e => updateVariantOption(idx, optIdx, 'key', e.target.value)} placeholder="Option Name (e.g. Material)" style={{ ...styles.input, flex: 1 }} />
                                            <input type="text" value={opt.value} onChange={e => updateVariantOption(idx, optIdx, 'value', e.target.value)} placeholder="Option Value (e.g. Silicone)" style={{ ...styles.input, flex: 1 }} />
                                            <button type="button" onClick={() => removeVariantOption(idx, optIdx)} style={{ padding: '6px', color: '#E41E26', cursor: 'pointer', border: 'none', background: 'none', fontSize: '16px' }} title="Remove Option"><i className="fas fa-times"></i></button>
                                        </div>
                                    ))}
                                    {(variant.options || []).length === 0 && <div style={{ color: '#aaa', fontSize: '12px' }}>No extra options.</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Brand & SKU */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={styles.row}>
                         <div>
                            <label style={styles.label}>Brand</label>
                            <select value={brand} onChange={(e) => setBrand(e.target.value)} style={styles.input}>
                                <option value="">Select Brand</option>
                                {availableBrands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                                {!availableBrands.includes(brand) && brand && (
                                    <option value={brand}>{brand}</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>SKU (Optional)</label>
                            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. SC-LIB5-WHT" style={styles.input} />
                        </div>
                    </div>
                </div>

                {/* 5. Description */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={styles.sectionTitle}><i className="fas fa-align-left" style={{ color: '#E41E26' }}></i> Full Description</h2>
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Editor Toolbar */}
                        <button type="button" onClick={() => execDescriptionCommand('bold')} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #eee', cursor: 'pointer', fontWeight: '700' }}>B</button>
                        <button type="button" onClick={() => execDescriptionCommand('italic')} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #eee', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
                        <button type="button" onClick={() => execDescriptionCommand('insertUnorderedList')} style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #eee', cursor: 'pointer' }}>• List</button>
                        <span style={{ width: '1px', backgroundColor: '#eee', margin: '0 5px' }} />
                        <button type="button" onClick={() => insertDescriptionTemplate('<h4>Specifications</h4><ul><li>Detail 1</li><li>Detail 2</li></ul>')} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '999px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' }}>+ Add Specs List</button>
                    </div>
                    <div
                        ref={descriptionEditorRef}
                        contentEditable
                        onInput={handleDescriptionInput}
                        style={{
                            ...styles.input,
                            minHeight: '200px',
                            lineHeight: 1.6,
                            overflowY: 'auto',
                            backgroundColor: '#fff'
                        }}
                        data-placeholder="Detailed product story and features..."
                        suppressContentEditableWarning={true}
                    />
                </div>

                {/* Optional / Advanced Sections */}
                <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '30px', marginTop: '50px' }}>
                    <div 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            cursor: 'pointer',
                            color: showAdvanced ? '#E41E26' : '#666',
                            marginBottom: '25px'
                        }}
                    >
                        <i className={`fas fa-chevron-${showAdvanced ? 'down' : 'right'}`}></i>
                        <span style={{ fontWeight: '800', fontSize: '16px' }}>
                            {showAdvanced ? 'HIDE OPTIONAL SECTIONS' : 'SHOW OPTIONAL SECTIONS (Notes, SEO, Specs, etc.)'}
                        </span>
                    </div>

                    {showAdvanced && (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            
                            {/* Notes Accordion */}
                            <div>
                                <div style={styles.collapsibleHeader} onClick={() => toggleSection('notes')}>
                                    <span style={{ fontWeight: '600' }}><i className="fas fa-sticky-note" style={{ color: '#E41E26', marginRight: '8px' }}></i> Product Notes (e.g. Disclaimers)</span>
                                    <i className={`fas fa-chevron-${expandedSections.notes ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSections.notes && (
                                    <div style={styles.collapsibleBody}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Small notes shown at the top of the product page.</p>
                                            <button type="button" onClick={addNoteHandler} style={{ padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Add Row</button>
                                        </div>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {notes.map((note, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" placeholder="e.g. This item is not returnable" value={note} onChange={(e) => noteChangeHandler(index, e.target.value)} style={styles.input} />
                                                    <button type="button" onClick={() => removeNoteHandler(index)} style={{ padding: '10px', color: '#E41E26', cursor: 'pointer', border: 'none', background: 'none' }}><i className="fas fa-times"></i></button>
                                                </div>
                                            ))}
                                            {notes.length === 0 && <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px', color: '#999', fontSize: '13px' }}>No notes added yet. Click "+ Add Row" to add one.</div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Highlights Accordion */}
                            <div>
                                <div style={styles.collapsibleHeader} onClick={() => toggleSection('highlights')}>
                                    <span style={{ fontWeight: '600' }}><i className="fas fa-check-circle" style={{ color: '#E41E26', marginRight: '8px' }}></i> Key Highlights (Bullet points)</span>
                                    <i className={`fas fa-chevron-${expandedSections.highlights ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSections.highlights && (
                                    <div style={styles.collapsibleBody}>
                                        <button type="button" onClick={addKeyFeatureHandler} style={{ marginBottom: '15px', padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Add Bullet Point</button>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {keyFeatures.map((feature, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" placeholder="e.g. 50-Hour Playtime" value={feature} onChange={(e) => keyFeatureChangeHandler(index, e.target.value)} style={styles.input} />
                                                    <button type="button" onClick={() => removeKeyFeatureHandler(index)} style={{ padding: '10px', color: '#E41E26', cursor: 'pointer', border: 'none', background: 'none' }}><i className="fas fa-times"></i></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Technical Specs Accordion */}
                            <div>
                                <div style={styles.collapsibleHeader} onClick={() => toggleSection('specs')}>
                                    <span style={{ fontWeight: '600' }}><i className="fas fa-list-ul" style={{ color: '#E41E26', marginRight: '8px' }}></i> Technical Specifications</span>
                                    <i className={`fas fa-chevron-${expandedSections.specs ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSections.specs && (
                                    <div style={styles.collapsibleBody}>
                                        <button type="button" onClick={addSpecHandler} style={{ marginBottom: '15px', padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Add Spec Row</button>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {specs.map((spec, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" placeholder="Property (e.g. Weight)" value={spec.key} onChange={(e) => specChangeHandler(index, 'key', e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                                    <input type="text" placeholder="Value (e.g. 250g)" value={spec.value} onChange={(e) => specChangeHandler(index, 'value', e.target.value)} style={{ ...styles.input, flex: 1 }} />
                                                    <button type="button" onClick={() => removeSpecHandler(index)} style={{ padding: '10px', color: '#E41E26', cursor: 'pointer', border: 'none', background: 'none' }}><i className="fas fa-times"></i></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SEO & URL Accordion */}
                            <div>
                                <div style={styles.collapsibleHeader} onClick={() => toggleSection('seo')}>
                                    <span style={{ fontWeight: '600' }}><i className="fas fa-search" style={{ color: '#E41E26', marginRight: '8px' }}></i> Search Engine Optimization (SEO) & URL</span>
                                    <i className={`fas fa-chevron-${expandedSections.seo ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSections.seo && (
                                    <div style={styles.collapsibleBody}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={styles.label}>URL Slug Override</label>
                                            <input type="text" value={slugOverride} onChange={(e) => setSlugOverride(e.target.value)} placeholder="anker-liberty-5-white" style={styles.input} />
                                            <p style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>Leave empty to auto-generate from name.</p>
                                        </div>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={styles.label}>SEO Meta Title</label>
                                            <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Google Search Title" style={styles.input} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>SEO Meta Description</label>
                                            <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Short summary for Google results" style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Hero Banner Accordion (Edit Mode Only Usually, but let's keep it here) */}
                            {isEditMode && (
                                <div>
                                    <div style={styles.collapsibleHeader} onClick={() => toggleSection('hero')}>
                                        <span style={{ fontWeight: '600' }}><i className="fas fa-bullhorn" style={{ color: '#E41E26', marginRight: '8px' }}></i> Hero Banner Text</span>
                                        <i className={`fas fa-chevron-${expandedSections.hero ? 'up' : 'down'}`}></i>
                                    </div>
                                    {expandedSections.hero && (
                                        <div style={styles.collapsibleBody}>
                                            <div style={styles.row}>
                                                <div>
                                                    <label style={styles.label}>Headline</label>
                                                    <input type="text" value={featureHeadline} onChange={(e) => setFeatureHeadline(e.target.value)} placeholder="e.g. Silence the World" style={styles.input} />
                                                </div>
                                                <div>
                                                    <label style={styles.label}>Subtext</label>
                                                    <input type="text" value={featureSubtext} onChange={(e) => setFeatureSubtext(e.target.value)} placeholder="e.g. Adaptive ANC 2.0" style={styles.input} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '18px',
                        backgroundColor: '#E41E26',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '18px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 5px 20px rgba(228, 30, 38, 0.3)',
                        transition: 'all 0.3s'
                    }}
                >
                    {loading ? 'PROCESSING...' : isEditMode ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}
                </button>
            </form>
        </div>
    );
};

export default ProductEdit;

