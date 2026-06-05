import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import '../styles/Dashboard.css';

const Stars = ({ n }) => (
  <span className="stars">
    {'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}
    <span>{parseFloat(n || 0).toFixed(1)}</span>
  </span>
);

export default function StoreOwnerDashboard({ currentPage, setCurrentPage }) {
  const { user, token } = useAuth();
  const [stores, setStores] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [storeForm, setStoreForm] = useState({ name: '', address: '', description: '' });
  const [stats, setStats] = useState({ totalStores: 0, totalReviews: 0, avgRating: 0 });

  const loadStores = useCallback(async () => {
    try { const d = await apiCall('/stores/mine', 'GET', null, token); setStores(d); setStats(s => ({ ...s, totalStores: d.length })); } catch (e) { console.error(e); }
  }, [token]);
  const loadReviews = useCallback(async () => {
    try {
      const d = await apiCall('/ratings/owner/mine', 'GET', null, token);
      setReviews(d);
      const avg = d.length > 0 ? d.reduce((sum, r) => sum + r.rating, 0) / d.length : 0;
      setStats(s => ({ ...s, totalReviews: d.length, avgRating: avg }));
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { loadStores(); loadReviews(); }, [loadStores, loadReviews]);

  const openAdd = () => { setEditingStore(null); setStoreForm({ name: '', address: '', description: '' }); setApiError(''); setShowModal(true); };
  const openEdit = (s) => { setEditingStore(s); setStoreForm({ name: s.name, address: s.address || '', description: s.description || '' }); setApiError(''); setShowModal(true); };

  const saveStore = async () => {
    if (!storeForm.name.trim() || !storeForm.address.trim()) { setApiError('Name and address are required'); return; }
    setSaving(true); setApiError('');
    try {
      if (editingStore) await apiCall(`/stores/${editingStore.id}`, 'PUT', storeForm, token);
      else await apiCall('/stores', 'POST', storeForm, token);
      await loadStores(); setShowModal(false);
    } catch (err) { setApiError(err.message); } finally { setSaving(false); }
  };

  const deleteStore = async (id) => {
    if (!window.confirm('Delete this store? All ratings will also be removed.')) return;
    try { await apiCall(`/stores/${id}`, 'DELETE', null, token); await loadStores(); await loadReviews(); } catch (e) { alert(e.message); }
  };

  const StoreModal = () => (
    <Modal title={editingStore ? 'Edit Store' : 'Add New Store'} onClose={() => setShowModal(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={saveStore} disabled={saving}>{saving ? 'Saving…' : editingStore ? 'Save Changes' : 'Add Store'}</button>
      </>}>
      {apiError && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠</span><span>{apiError}</span></div>}
      <div className="form-group">
        <label>Store Name</label>
        <input value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} placeholder="Store name" />
      </div>
      <div className="form-group">
        <label>Address / Location</label>
        <textarea value={storeForm.address} onChange={e => setStoreForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" rows={2} />
      </div>
      <div className="form-group">
        <label>Description <span style={{ color: 'var(--text-3)', fontSize: 11 }}>(optional)</span></label>
        <textarea value={storeForm.description} onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} />
      </div>
    </Modal>
  );

  if (currentPage === 'dashboard') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>Store Owner Dashboard</h2><p>Welcome back, {user?.name?.split(' ')[0]}</p></div>
        <button className="btn btn-primary" onClick={() => { setCurrentPage('my-stores'); setTimeout(openAdd, 100); }}>+ Add Store</button>
      </div>
      <div className="stats-grid">
        {[['🏬', 'My Stores', stats.totalStores, 'my-stores'],
          ['💬', 'Total Reviews', stats.totalReviews, 'reviews'],
          ['★', 'Avg Rating', stats.avgRating.toFixed(1), 'reviews']].map(([icon, label, val, page]) => (
          <div className="stat-card" key={label} onClick={() => setCurrentPage(page)} style={{ cursor: 'pointer' }}>
            <div className="stat-label">{icon} {label}</div>
            <div className="stat-number">{val}</div>
            <div className="stat-sub">View all →</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (currentPage === 'my-stores') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>My Stores</h2><p>{stores.length} stores</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Store</button>
      </div>
      {stores.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">🏬</div><h4>No stores yet</h4><p>Add your first store to start receiving ratings</p><button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}>Add Your First Store</button></div>
        : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Store Name</th><th>Address</th><th>Avg Rating</th><th>Reviews</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {stores.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{s.address}</td>
                      <td><Stars n={s.average_rating || 0} /></td>
                      <td style={{ color: 'var(--text-2)' }}>{s.total_ratings || 0}</td>
                      <td style={{ color: 'var(--text-3)' }}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
                      <td><div className="actions-row">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteStore(s.id)}>Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      {showModal && <StoreModal />}
    </div>
  );

  if (currentPage === 'reviews') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>Customer Reviews</h2><p>{reviews.length} reviews across all stores</p></div>
      </div>
      {reviews.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">💬</div><h4>No reviews yet</h4><p>Reviews will appear here when customers rate your stores</p></div>
        : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Store</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.store_name}</td>
                      <td style={{ color: 'var(--text-2)' }}>{r.user_name}</td>
                      <td><Stars n={r.rating} /></td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 240 }}>{r.comment}</td>
                      <td style={{ color: 'var(--text-3)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );

  return null;
}
