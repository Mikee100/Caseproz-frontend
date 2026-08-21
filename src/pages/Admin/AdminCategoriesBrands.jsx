import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/apiClient';

const AdminCategoriesBrands = () => {
  const [categories, setCategories] = useState([]);
  const [archivedCategories, setArchivedCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [archivedBrands, setArchivedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'brands'
  const [tabView, setTabView] = useState({ categories: 'active', brands: 'active' });

  // Form states
  const [newCategory, setNewCategory] = useState('');
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState({}); // { [catId]: value }
  const [editSubCategory, setEditSubCategory] = useState({}); // { id, catId, name }
  const [newBrand, setNewBrand] = useState('');
  const [editBrandId, setEditBrandId] = useState(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');

  // UI helpers
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch categories and brands
  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes, archivedCatRes, archivedBrandRes] = await Promise.all([
        apiFetch(`${import.meta.env.VITE_API_URL}/api/categories`),
        apiFetch(`${import.meta.env.VITE_API_URL}/api/brands`),
        apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/archived/list`),
        apiFetch(`${import.meta.env.VITE_API_URL}/api/brands/archived/list`),
      ]);
      
      // Fix: apiFetch returns the parsed body directly (usually an array for these endpoints)
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes);
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : brandRes);
      setArchivedCategories(Array.isArray(archivedCatRes.data) ? archivedCatRes.data : archivedCatRes);
      setArchivedBrands(Array.isArray(archivedBrandRes.data) ? archivedBrandRes.data : archivedBrandRes);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Category handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory })
      });
      setNewCategory('');
      await fetchData();
    } catch (err) {
      setError('Failed to add category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = (cat) => {
    setEditCategoryId(cat._id);
    setEditCategoryName(cat.name);
  };

  const handleUpdateCategory = async (catId) => {
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCategoryName })
      });
      setEditCategoryId(null);
      setEditCategoryName('');
      await fetchData();
    } catch (err) {
      setError('Failed to update category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Archive this category? You can restore it later.')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${catId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  // Subcategory handlers
  const handleAddSubCategory = async (catId) => {
    if (!newSubCategory[catId] || !newSubCategory[catId].trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${catId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubCategory[catId] })
      });
      setNewSubCategory((prev) => ({ ...prev, [catId]: '' }));
      await fetchData();
    } catch (err) {
      setError('Failed to add subcategory');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubCategory = (catId, sub) => {
    setEditSubCategory({ id: sub._id, catId, name: sub.name });
  };

  const handleUpdateSubCategory = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${editSubCategory.catId}/subcategories/${editSubCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSubCategory.name })
      });
      setEditSubCategory({});
      await fetchData();
    } catch (err) {
      setError('Failed to update subcategory');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubCategory = async (catId, subId) => {
    if (!window.confirm('Delete this subcategory?')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${catId}/subcategories/${subId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to delete subcategory');
    } finally {
      setActionLoading(false);
    }
  };

  // Brand handlers
  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrand })
      });
      setNewBrand('');
      await fetchData();
    } catch (err) {
      setError('Failed to add brand');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBrand = (brand) => {
    setEditBrandId(brand._id);
    setEditBrandName(brand.name);
    setEditBrandDesc(brand.description || '');
  };

  const handleUpdateBrand = async (brandId) => {
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/brands/${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editBrandName, description: editBrandDesc })
      });
      setEditBrandId(null);
      setEditBrandName('');
      setEditBrandDesc('');
      await fetchData();
    } catch (err) {
      setError('Failed to update brand');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Archive this brand? You can restore it later.')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/brands/${brandId}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to delete brand');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreCategory = async (catId) => {
    if (!window.confirm('Restore this category?')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${catId}/restore`, { method: 'PUT' });
      await fetchData();
    } catch (err) {
      setError('Failed to restore category');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurgeCategory = async (catId) => {
    if (!window.confirm('Permanently delete this category? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/categories/${catId}/purge`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to permanently delete category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBrand = async (brandId) => {
    if (!window.confirm('Restore this brand?')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/brands/${brandId}/restore`, { method: 'PUT' });
      await fetchData();
    } catch (err) {
      setError('Failed to restore brand');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurgeBrand = async (brandId) => {
    if (!window.confirm('Permanently delete this brand? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/brands/${brandId}/purge`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      setError('Failed to permanently delete brand');
    } finally {
      setActionLoading(false);
    }
  };

  const styles = {
    container: {
      padding: '40px',
    },
    header: {
      marginBottom: '40px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#1a1a1a',
      margin: 0,
    },
    subtitle: {
      color: '#666',
      marginTop: '8px',
      fontSize: '15px',
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      borderBottom: '1px solid #eee',
      paddingBottom: '15px',
    },
    tab: (isActive) => ({
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      backgroundColor: isActive ? '#E41E26' : 'transparent',
      color: isActive ? 'white' : '#666',
      transition: 'all 0.3s',
      border: 'none',
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '24px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: 0,
    },
    actionBtn: (color = '#666') => ({
      padding: '8px',
      color: color,
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '14px',
      transition: 'color 0.2s',
    }),
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #e0e0e0',
      fontSize: '14px',
      outline: 'none',
      marginBottom: '10px',
    },
    submitBtn: {
      padding: '12px 20px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      cursor: 'pointer',
      fontSize: '14px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '99px',
      fontSize: '12px',
      color: '#666',
      fontWeight: '600',
    },
    subList: {
      listStyle: 'none',
      padding: 0,
      marginTop: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    subItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      fontSize: '14px',
    }
  };

  if (loading) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <div className="loading-spinner"></div>
      <p style={{ marginTop: '20px', color: '#666' }}>Loading setup...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Categories & Brands</h1>
        <p style={styles.subtitle}>Organize your product taxonomy. Control what appears in the megamenu and filters.</p>
      </header>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '15px', borderRadius: '8px', marginBottom: '30px', fontSize: '14px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>
          <i className="fas fa-layer-group" style={{ marginRight: '8px' }}></i> Categories
        </button>
        <button style={styles.tab(activeTab === 'brands')} onClick={() => setActiveTab('brands')}>
          <i className="fas fa-tags" style={{ marginRight: '8px' }}></i> Brands
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setTabView((prev) => ({ ...prev, [activeTab]: 'active' }))}
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: tabView[activeTab] === 'active' ? '#111827' : '#fff',
            color: tabView[activeTab] === 'active' ? '#fff' : '#374151',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setTabView((prev) => ({ ...prev, [activeTab]: 'archived' }))}
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: tabView[activeTab] === 'archived' ? '#111827' : '#fff',
            color: tabView[activeTab] === 'archived' ? '#fff' : '#374151',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Archived
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div style={{ display: 'grid', gap: '40px' }}>
          {/* Add Category Form */}
          {tabView.categories === 'active' && <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>Create New Root Category</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="e.g. Power & Charging"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              />
              <button type="submit" disabled={actionLoading} style={styles.submitBtn}>
                {actionLoading ? '...' : 'ADD CATEGORY'}
              </button>
            </form>
          </div>}

          <div style={styles.grid}>
            {(tabView.categories === 'archived' ? archivedCategories : categories).map((cat) => (
              <div key={cat._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  {tabView.categories === 'active' && editCategoryId === cat._id ? (
                    <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={e => setEditCategoryName(e.target.value)}
                        style={{ ...styles.input, marginBottom: 0 }}
                        autoFocus
                      />
                      <button onClick={() => handleUpdateCategory(cat._id)} style={{ ...styles.submitBtn, padding: '8px 12px' }}>Save</button>
                      <button onClick={() => setEditCategoryId(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <h4 style={styles.cardTitle}>{cat.name}</h4>
                      <div>
                        {tabView.categories === 'active' ? (
                          <>
                            <button title="Edit" onClick={() => handleEditCategory(cat)} style={styles.actionBtn()}><i className="fas fa-edit"></i></button>
                            <button title="Archive" onClick={() => handleDeleteCategory(cat._id)} style={styles.actionBtn('#dc2626')}><i className="fas fa-archive"></i></button>
                          </>
                        ) : (
                          <>
                            <button title="Restore" onClick={() => handleRestoreCategory(cat._id)} style={styles.actionBtn('#16a34a')}><i className="fas fa-undo"></i></button>
                            <button title="Purge" onClick={() => handlePurgeCategory(cat._id)} style={styles.actionBtn('#dc2626')}><i className="fas fa-trash"></i></button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <span style={styles.badge}>{cat.subCategories?.length || 0} Subcategories</span>
                  {tabView.categories === 'active' && <ul style={styles.subList}>
                    {(cat.subCategories || []).map((sub) => (
                      <li key={sub._id} style={styles.subItem}>
                        {editSubCategory.id === sub._id ? (
                          <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                            <input
                              type="text"
                              value={editSubCategory.name}
                              onChange={e => setEditSubCategory({ ...editSubCategory, name: e.target.value })}
                              style={{ ...styles.input, padding: '5px 8px', marginBottom: 0 }}
                              autoFocus
                            />
                            <button onClick={handleUpdateSubCategory} style={{ background: 'none', border: 'none', color: '#1a1a1a', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                          </div>
                        ) : (
                          <>
                            <span>{sub.name}</span>
                            <div>
                                <button title="Edit" onClick={() => handleEditSubCategory(cat._id, sub)} style={{ ...styles.actionBtn(), padding: '4px' }}><i className="fas fa-pencil-alt"></i></button>
                                <button title="Delete" onClick={() => handleDeleteSubCategory(cat._id, sub._id)} style={{ ...styles.actionBtn('#dc2626'), padding: '4px' }}><i className="fas fa-times"></i></button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>}
                </div>

                {tabView.categories === 'active' && <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                   <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add subcategory..."
                      value={newSubCategory[cat._id] || ''}
                      onChange={e => setNewSubCategory({ ...newSubCategory, [cat._id]: e.target.value })}
                      style={{ ...styles.input, padding: '8px 12px', fontSize: '13px', marginBottom: 0 }}
                    />
                    <button onClick={() => handleAddSubCategory(cat._id)} style={{ background: '#eee', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}>
                        <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '40px' }}>
             {/* Add Brand Form */}
             {tabView.brands === 'active' && <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>Add New Brand</h3>
                <form onSubmit={handleAddBrand} style={{ display: 'flex', gap: '12px' }}>
                <input
                    type="text"
                    placeholder="Brand name (e.g. Logitech)"
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                />
                <button type="submit" disabled={actionLoading} style={styles.submitBtn}>
                    {actionLoading ? '...' : 'ADD BRAND'}
                </button>
                </form>
              </div>}

            <div style={styles.grid}>
                {(tabView.brands === 'archived' ? archivedBrands : brands).map((brand) => (
                    <div key={brand._id} style={{ ...styles.card, padding: '20px' }}>
                    {tabView.brands === 'active' && editBrandId === brand._id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={editBrandName}
                                    onChange={e => setEditBrandName(e.target.value)}
                                    style={styles.input}
                                />
                                <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={editBrandDesc}
                                    onChange={e => setEditBrandDesc(e.target.value)}
                                    style={styles.input}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleUpdateBrand(brand._id)} style={{ ...styles.submitBtn, flex: 1 }}>Save</button>
                                    <button onClick={() => setEditBrandId(null)} style={{ ...styles.submitBtn, backgroundColor: '#eee', color: '#666', flex: 1 }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ ...styles.cardTitle, marginBottom: '4px' }}>{brand.name}</h4>
                                    {brand.description && <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{brand.description}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {tabView.brands === 'active' ? (
                                      <>
                                        <button onClick={() => handleEditBrand(brand)} style={styles.actionBtn()}><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleDeleteBrand(brand._id)} style={styles.actionBtn('#dc2626')}><i className="fas fa-archive"></i></button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => handleRestoreBrand(brand._id)} style={styles.actionBtn('#16a34a')}><i className="fas fa-undo"></i></button>
                                        <button onClick={() => handlePurgeBrand(brand._id)} style={styles.actionBtn('#dc2626')}><i className="fas fa-trash"></i></button>
                                      </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {(tabView.brands === 'archived' ? archivedBrands : brands).length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #ddd', color: '#999' }}>
                    {tabView.brands === 'archived' ? 'No archived brands.' : 'No brands added yet.'}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesBrands;
