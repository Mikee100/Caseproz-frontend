import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/apiClient';

const sectionTypeLabels = {
  Product: 'Products',
  Category: 'Categories',
};

const HomeSections = () => {
  const [sections, setSections] = useState([]);
  const [archivedSections, setArchivedSections] = useState([]);
  const [viewMode, setViewMode] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalSection, setModalSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Product', description: '' });
  const [formError, setFormError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      setError(null);
      try {
        if (viewMode === 'archived') {
          const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections/archived/list`);
          setArchivedSections(Array.isArray(data) ? data : []);
        } else {
          const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections`);
          setSections(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch sections');
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [viewMode]);

  // Create section
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      const created = await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items: [] })
      });
      setSections((prev) => [...prev, created]);
      setForm({ name: '', type: 'Product', description: '' });
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create section');
    } finally {
      setCreating(false);
    }
  };

  // Open modal for managing items
  const openManageModal = (section) => {
    setModalSection({ ...section, items: section.items || [] });
    setShowModal(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Search for items to add
  const handleSearch = async (q, type) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const url = (type || modalSection?.type) === 'Product'
        ? `${import.meta.env.VITE_API_URL}/api/products?keyword=${encodeURIComponent(q)}&page=1&pageSize=24&sort=newest`
        : `${import.meta.env.VITE_API_URL}/api/categories`;
      const data = await apiFetch(url);
      let results = Array.isArray(data) ? data : (data.products || []);
      if ((type || modalSection?.type) === 'Category') {
        results = results.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
      }
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
    }
  };

  // Add/remove items
  const handleAddItem = (item) => {
    setModalSection((prev) => ({
      ...prev,
      items: prev.items.find(i => (i._id || i) === item._id) ? prev.items : [...prev.items, item]
    }));
  };
  const handleRemoveItem = (itemId) => {
    setModalSection((prev) => ({
      ...prev,
      items: prev.items.filter(i => (i._id || i) !== itemId)
    }));
  };

  // Save items
  const handleSaveItems = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections/${modalSection._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: modalSection.items.map(i => i._id || i) })
      });
      setSections(prev => prev.map(s => s._id === updated._id ? updated : s));
      setShowModal(false);
      setModalSection(null);
    } catch (err) {
      alert(err.message || 'Failed to save items');
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDelete = async (sectionId) => {
    if (!window.confirm('Archive this section? You can restore it later.')) return;
    setDeleting(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections/${sectionId}`, { method: 'DELETE' });
      setSections(prev => prev.filter(s => s._id !== sectionId));
    } catch (err) {
      alert(err.message || 'Failed to delete section');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (sectionId) => {
    if (!window.confirm('Restore this section?')) return;
    setDeleting(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections/${sectionId}/restore`, { method: 'PUT' });
      setArchivedSections((prev) => prev.filter((s) => s._id !== sectionId));
    } catch (err) {
      alert(err.message || 'Failed to restore section');
    } finally {
      setDeleting(false);
    }
  };

  const handlePurge = async (sectionId) => {
    if (!window.confirm('Permanently delete this section? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections/${sectionId}/purge`, { method: 'DELETE' });
      setArchivedSections((prev) => prev.filter((s) => s._id !== sectionId));
    } catch (err) {
      alert(err.message || 'Failed to permanently delete section');
    } finally {
      setDeleting(false);
    }
  };

  const visibleSections = viewMode === 'archived' ? archivedSections : sections;

  return (
    <div className="admin-section-page" style={{ padding: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>Home Sections</h1>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>Manage homepage sections like Trending, Just In, Budget Picks, Premium Picks, etc.</p>
        </div>
        <button
          onClick={() => setShowModal('create')}
          disabled={viewMode === 'archived'}
          style={{ background: viewMode === 'archived' ? '#9ca3af' : '#E41E26', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontWeight: 600, fontSize: 16, cursor: viewMode === 'archived' ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #e41e2622' }}
        >
          + Add Section
        </button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setViewMode('active')}
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: viewMode === 'active' ? '#111827' : '#fff',
            color: viewMode === 'active' ? '#fff' : '#374151',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setViewMode('archived')}
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: viewMode === 'archived' ? '#111827' : '#fff',
            color: viewMode === 'archived' ? '#fff' : '#374151',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Archived
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', margin: '48px 0' }}>Loading sections...</div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', margin: '48px 0' }}>{error}</div>
      ) : visibleSections.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '48px 0' }}>No sections found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }}>
            <thead style={{ background: '#f7f7fa' }}>
              <tr>
                <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: '#222', fontSize: 15 }}>Name</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: '#222', fontSize: 15 }}>Type</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: '#222', fontSize: 15 }}>Items</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: '#222', fontSize: 15 }}>Description</th>
                <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 600, color: '#222', fontSize: 15 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSections.map((section, idx) => (
                <tr key={section._id} style={{ background: idx % 2 === 0 ? '#fafbfc' : '#fff', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 500 }}>{section.name}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ background: section.type === 'Product' ? '#e6f4ea' : '#e6eaf4', color: section.type === 'Product' ? '#1a7f37' : '#1a3a7f', borderRadius: 12, padding: '4px 12px', fontWeight: 600, fontSize: 13 }}>
                      {sectionTypeLabels[section.type] || section.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>{section.items?.length || 0}</td>
                  <td style={{ padding: '14px 12px', color: '#555' }}>{section.description || '-'}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <button
                      onClick={() => openManageModal(section)}
                      disabled={viewMode === 'archived'}
                      style={{ background: '#f7f7fa', border: 'none', borderRadius: 6, padding: '7px 16px', marginRight: 8, cursor: 'pointer', fontWeight: 500 }}
                    >
                      <i className="fas fa-edit" style={{ marginRight: 6 }} />Manage
                    </button>
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => handleDelete(section._id)}
                        style={{ background: '#fff0f0', color: '#E41E26', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 500 }}
                        disabled={deleting}
                      >
                        <i className="fas fa-archive" style={{ marginRight: 6 }} />Archive
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(section._id)}
                          style={{ background: '#ecfdf5', color: '#166534', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 500, marginRight: 8 }}
                          disabled={deleting}
                        >
                          <i className="fas fa-undo" style={{ marginRight: 6 }} />Restore
                        </button>
                        <button
                          onClick={() => handlePurge(section._id)}
                          style={{ background: '#fff0f0', color: '#E41E26', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 500 }}
                          disabled={deleting}
                        >
                          <i className="fas fa-trash" style={{ marginRight: 6 }} />Purge
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for create or manage items */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px #0002', width: '100%', maxWidth: 900, padding: 32, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => { setShowModal(false); setModalSection(null); }} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 26, color: '#888', cursor: 'pointer' }}>&times;</button>
            {showModal === 'create' ? (
              <form onSubmit={handleCreate}>
                <h2 style={{ marginTop: 0 }}>Add New Section</h2>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontWeight: 500 }}>Name<br />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      style={{ marginTop: 4, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
                    />
                  </label>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontWeight: 500 }}>Type<br />
                    <select
                      name="type"
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      style={{ marginTop: 4, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
                    >
                      <option value="Product">Products</option>
                      <option value="Category">Categories</option>
                    </select>
                  </label>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontWeight: 500 }}>Description<br />
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      style={{ marginTop: 4, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={creating || !form.name}
                  style={{ background: '#E41E26', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 32px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 8 }}
                >
                  {creating ? 'Adding...' : 'Add Section'}
                </button>
                {formError && <div style={{ color: 'red', marginTop: 12 }}>{formError}</div>}
              </form>
            ) : modalSection ? (
              <div>
                <h2 style={{ marginTop: 0 }}>Manage Items for <span style={{ color: '#E41E26' }}>{modalSection.name}</span></h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
                  {/* Current Items */}
                  <div>
                    <h4 style={{ marginBottom: 8 }}>Current Items ({modalSection.items?.length || 0})</h4>
                    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, minHeight: 200, maxHeight: 400, overflowY: 'auto', background: '#fafbfc' }}>
                      {modalSection.items && modalSection.items.length > 0 ? (
                        modalSection.items.map(item => (
                          <div key={item._id || item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ fontSize: 14 }}>{item.name || item}</span>
                            <button onClick={() => handleRemoveItem(item._id || item)} style={{ color: '#E41E26', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer' }}>Remove</button>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#999', fontSize: 13 }}>No items yet.</p>
                      )}
                    </div>
                  </div>
                  {/* Add Items */}
                  <div>
                    <h4 style={{ marginBottom: 8 }}>Add {modalSection.type}s</h4>
                    <input
                      type="text"
                      placeholder={`Search ${modalSection.type}...`}
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
                    />
                    <div style={{ marginTop: 12, maxHeight: 350, overflowY: 'auto' }}>
                      {searchResults.length > 0 ? (
                        searchResults.map(item => (
                          <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ fontSize: 14 }}>{item.name}</span>
                            <button
                              onClick={() => handleAddItem(item)}
                              disabled={modalSection.items?.find(i => (i._id || i) === item._id)}
                              style={{ color: '#007bff', border: 'none', background: 'none', fontSize: 13, cursor: 'pointer' }}
                            >
                              {modalSection.items?.find(i => (i._id || i) === item._id) ? 'Added' : 'Add'}
                            </button>
                          </div>
                        ))
                      ) : searchQuery.length >= 2 ? (
                        <p style={{ color: '#999', fontSize: 13 }}>No {modalSection.type.toLowerCase()}s found.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button onClick={() => { setShowModal(false); setModalSection(null); }} style={{ padding: '10px 24px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontWeight: 500 }}>Cancel</button>
                  <button
                    onClick={handleSaveItems}
                    disabled={saving}
                    style={{ padding: '10px 32px', borderRadius: 6, border: 'none', background: '#E41E26', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSections;