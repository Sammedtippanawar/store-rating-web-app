import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import '../styles/Dashboard.css';

const Stars = ({ n, size = 13 }) => (
  <span className="stars" style={{ fontSize: size }}>
    {'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}
    <span>{parseFloat(n || 0).toFixed(1)}</span>
  </span>
);

const StarPicker = ({ value, onChange }) => (
  <div className="rating-input">
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" className="star-btn"
        style={{ color: value >= n ? '#f59e0b' : 'var(--border-strong)' }}
        onClick={() => onChange(n)}>★</button>
    ))}
    <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-2)' }}>{value} star{value !== 1 ? 's' : ''}</span>
  </div>
);

export default function UserDashboard({ currentPage, setCurrentPage }) {
  const { user, token } = useAuth();
  const [stores, setStores] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [modalMode, setModalMode] = useState('submit');
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalStores: 0, myRatings: 0, avgRating: '0.0' });

  const loadStores = useCallback(async () => {
    try { const d = await apiCall('/stores'); setStores(d); setStats(s => ({ ...s, totalStores: d.length })); } catch (e) { console.error(e); }
  }, []);
  const loadMyRatings = useCallback(async () => {
    try {
      const d = await apiCall('/ratings/user/mine', 'GET', null, token);
      setMyRatings(d);
      const avg = d.length > 0 ? (d.reduce((sum, r) => sum + r.rating, 0) / d.length).toFixed(1) : '0.0';
      setStats(s => ({ ...s, myRatings: d.length, avgRating: avg }));
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { loadStores(); loadMyRatings(); }, [loadStores, loadMyRatings]);

  const openSubmit = (store) => { setSelectedStore(store); setEditingRating(null); setRatingForm({ rating: 5, comment: '' }); setModalMode('submit'); setApiError(''); setShowModal(true); };
  const openEdit = (rating) => {
    const store = stores.find(s => s.id === rating.store_id);
    setSelectedStore(store || { name: rating.store_name, address: rating.store_address });
    setEditingRating(rating); setRatingForm({ rating: rating.rating, comment: rating.comment || '' });
    setModalMode('edit'); setApiError(''); setShowModal(true);
  };

  const saveRating = async () => {
    if (!ratingForm.comment.trim()) { setApiError('Please add a comment'); return; }
    setSaving(true); setApiError('');
    try {
      await apiCall('/ratings', 'POST', { store_id: selectedStore.id || editingRating?.store_id, rating: parseInt(ratingForm.rating), comment: ratingForm.comment }, token);
      await loadMyRatings(); await loadStores(); setShowModal(false);
    } catch (err) { setApiError(err.message); } finally { setSaving(false); }
  };

  const deleteRating = async (id) => {
    if (!window.confirm('Delete this rating?')) return;
    try { await apiCall(`/ratings/${id}`, 'DELETE', null, token); await loadMyRatings(); await loadStores(); setShowModal(false); }
    catch (err) { alert(err.message); }
  };

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const RatingModal = () => (
    <Modal title={modalMode === 'edit' ? 'Edit Your Rating' : 'Rate This Store'} onClose={() => setShowModal(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
        {modalMode === 'edit' && editingRating && (
          <button className="btn btn-danger" onClick={() => deleteRating(editingRating.id)}>Delete</button>
        )}
        <button className="btn btn-primary" onClick={saveRating} disabled={saving}>{saving ? 'Saving…' : modalMode === 'edit' ? 'Update' : 'Submit'}</button>
      </>}>
      {selectedStore && (
        <>
          <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 6, marginBottom: 18, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{selectedStore.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{selectedStore.address}</div>
          </div>
          {apiError && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠</span><span>{apiError}</span></div>}
          <div className="form-group">
            <label>Your Rating</label>
            <StarPicker value={ratingForm.rating} onChange={n => setRatingForm(f => ({ ...f, rating: n }))} />
          </div>
          <div className="form-group">
            <label>Comment</label>
            <textarea value={ratingForm.comment} onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience…" rows={4} style={{ resize: 'vertical' }} />
          </div>
        </>
      )}
    </Modal>
  );

  if (currentPage === 'dashboard') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>Welcome back, {user?.name?.split(' ')[0]}!</h2><p>Browse and rate stores in your area</p></div>
      </div>
      <div className="stats-grid">
        {[['🏬', 'Available Stores', stats.totalStores, 'stores'],
          ['★', 'My Ratings', stats.myRatings, 'my-ratings'],
          ['📊', 'Avg Given', stats.avgRating, 'my-ratings']].map(([icon, label, val, page]) => (
          <div className="stat-card" key={label} onClick={() => setCurrentPage(page)} style={{ cursor: 'pointer' }}>
            <div className="stat-label">{icon} {label}</div>
            <div className="stat-number">{val}</div>
            <div className="stat-sub">View all →</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (currentPage === 'stores') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>Browse Stores</h2><p>{filteredStores.length} stores available</p></div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <input className="search-input" style={{ width: '100%', maxWidth: 420 }} placeholder="Search by name or address…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      {filteredStores.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">🏬</div><h4>No stores found</h4><p>Try a different search term</p></div>
        : (
          <div className="store-grid">
            {filteredStores.map(store => {
              const myRating = myRatings.find(r => r.store_id === store.id);
              return (
                <div key={store.id} className="store-card">
                  <div className="store-card-name">{store.name}</div>
                  <div className="store-card-addr">📍 {store.address}</div>
                  <div className="store-card-rating">
                    <Stars n={store.average_rating || 0} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{store.total_ratings || 0} reviews</span>
                  </div>
                  {myRating && (
                    <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,91,227,0.15)', borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 12 }}>
                      <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>Your review: {'★'.repeat(myRating.rating)}</div>
                      <div style={{ color: 'var(--text-2)' }}>"{myRating.comment}"</div>
                    </div>
                  )}
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => myRating ? openEdit(myRating) : openSubmit(store)}>
                    {myRating ? 'Edit Your Rating' : 'Rate this Store'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      {showModal && <RatingModal />}
    </div>
  );

  if (currentPage === 'my-ratings') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>My Ratings</h2><p>{myRatings.length} ratings submitted</p></div>
        <button className="btn btn-primary" onClick={() => setCurrentPage('stores')}>Browse Stores</button>
      </div>
      {myRatings.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">★</div><h4>No ratings yet</h4><p>Start browsing stores and share your feedback</p><button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setCurrentPage('stores')}>Browse Stores</button></div>
        : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Store</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {myRatings.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.store_name}</td>
                      <td><Stars n={r.rating} /></td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 240 }}>{r.comment}</td>
                      <td style={{ color: 'var(--text-3)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      <td><div className="actions-row">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteRating(r.id)}>Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      {showModal && <RatingModal />}
    </div>
  );

  return null;
}
