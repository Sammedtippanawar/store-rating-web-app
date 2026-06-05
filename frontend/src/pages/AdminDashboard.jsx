import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { validateName, validateEmail, validatePassword, validateAddress } from '../utils/validation';
import '../styles/Dashboard.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const EMPTY_USER = { name: '', email: '', address: '', password: '', role: 'user' };
const EMPTY_STORE = { name: '', address: '', description: '' };

const Stars = ({ n }) => (
  <span className="stars">
    {'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}
    <span>{parseFloat(n || 0).toFixed(1)}</span>
  </span>
);

const RoleBadge = ({ role }) => {
  const map = { admin: ['badge-blue', 'Admin'], store_owner: ['badge-orange', 'Store Owner'], user: ['badge-gray', 'User'] };
  const [cls, label] = map[role] || ['badge-gray', role];
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function AdminDashboard({ currentPage, setCurrentPage }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingStore, setEditingStore] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [storeForm, setStoreForm] = useState(EMPTY_STORE);
  const [userErrors, setUserErrors] = useState({});
  const [storeErrors, setStoreErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

  const loadUsers = useCallback(async () => {
    try { const d = await apiCall('/users', 'GET', null, token); setUsers(d); setStats(s => ({ ...s, totalUsers: d.length })); } catch (e) { console.error(e); }
  }, [token]);
  const loadStores = useCallback(async () => {
    try { const d = await apiCall('/stores', 'GET', null, token); setStores(d); setStats(s => ({ ...s, totalStores: d.length })); } catch (e) { console.error(e); }
  }, [token]);
  const loadRatings = useCallback(async () => {
    try { const d = await apiCall('/ratings', 'GET', null, token); setRatings(d); setStats(s => ({ ...s, totalRatings: d.length })); } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { loadUsers(); loadStores(); loadRatings(); }, [loadUsers, loadStores, loadRatings]);

  const openAddUser = (role = 'user') => { setEditingUser(null); setUserForm({ ...EMPTY_USER, role }); setUserErrors({}); setApiError(''); setShowPassword(false); setShowUserModal(true); };
  const openEditUser = (u) => { setEditingUser(u); setUserForm({ name: u.name, email: u.email, address: u.address, password: '', role: u.role }); setUserErrors({}); setApiError(''); setShowPassword(false); setShowUserModal(true); };

  const saveUser = async () => {
    const errs = {};
    const ne = validateName(userForm.name); if (ne) errs.name = ne;
    const ee = validateEmail(userForm.email); if (ee) errs.email = ee;
    const ae = validateAddress(userForm.address); if (ae) errs.address = ae;
    if (!editingUser) { const pe = validatePassword(userForm.password); if (pe) errs.password = pe; }
    if (Object.keys(errs).length) { setUserErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      if (editingUser) await apiCall(`/users/${editingUser.id}`, 'PUT', { name: userForm.name, email: userForm.email, address: userForm.address, role: userForm.role }, token);
      else await apiCall('/users', 'POST', userForm, token);
      await loadUsers(); setShowUserModal(false);
    } catch (err) { setApiError(err.message); } finally { setSaving(false); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await apiCall(`/users/${id}`, 'DELETE', null, token); await loadUsers(); } catch (e) { alert(e.message); }
  };

  const openAddStore = () => { setEditingStore(null); setStoreForm(EMPTY_STORE); setStoreErrors({}); setApiError(''); setShowStoreModal(true); };
  const openEditStore = (s) => { setEditingStore(s); setStoreForm({ name: s.name, address: s.address || '', description: s.description || '' }); setStoreErrors({}); setApiError(''); setShowStoreModal(true); };

  const saveStore = async () => {
    const errs = {};
    if (!storeForm.name.trim()) errs.name = 'Store name is required';
    if (!storeForm.address.trim()) errs.address = 'Address is required';
    if (Object.keys(errs).length) { setStoreErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      if (editingStore) await apiCall(`/stores/${editingStore.id}`, 'PUT', storeForm, token);
      else await apiCall('/stores', 'POST', storeForm, token);
      await loadStores(); setShowStoreModal(false);
    } catch (err) { setApiError(err.message); } finally { setSaving(false); }
  };

  const deleteStore = async (id) => {
    if (!window.confirm('Delete this store?')) return;
    try { await apiCall(`/stores/${id}`, 'DELETE', null, token); await loadStores(); } catch (e) { alert(e.message); }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.address?.toLowerCase().includes(q);
    const matchRole = !userRoleFilter || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredStores = stores.filter(s => {
    const q = storeSearch.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q);
  });

  const UserModal = () => (
    <Modal title={editingUser ? 'Edit User' : 'Add New User'} onClose={() => setShowUserModal(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={saveUser} disabled={saving}>{saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}</button>
      </>}>
      {apiError && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠</span><span>{apiError}</span></div>}
      <div className="form-group">
        <label>Full Name <span style={{ color: 'var(--text-3)', fontSize: 11 }}>(20–60 chars)</span></label>
        <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className={userErrors.name ? 'error' : ''} />
        {userErrors.name && <div className="form-error">{userErrors.name}</div>}
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={userErrors.email ? 'error' : ''} />
        {userErrors.email && <div className="form-error">{userErrors.email}</div>}
      </div>
      <div className="form-group">
        <label>Address</label>
        <textarea value={userForm.address} onChange={e => setUserForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" rows={2} className={userErrors.address ? 'error' : ''} />
        {userErrors.address && <div className="form-error">{userErrors.address}</div>}
      </div>
      {!editingUser && (
        <div className="form-group">
          <label>Password <span style={{ color: 'var(--text-3)', fontSize: 11 }}>(8–16 chars, 1 uppercase, 1 special)</span></label>
          <div className="input-rel">
            <input type={showPassword ? 'text' : 'password'} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Create password" className={userErrors.password ? 'error' : ''} />
            <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>{showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}</button>
          </div>
          {userErrors.password && <div className="form-error">{userErrors.password}</div>}
        </div>
      )}
      <div className="form-group">
        <label>Role</label>
        <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
          <option value="user">Regular User</option>
          <option value="store_owner">Store Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </Modal>
  );

  const StoreModal = () => (
    <Modal title={editingStore ? 'Edit Store' : 'Add New Store'} onClose={() => setShowStoreModal(false)}
      footer={<>
        <button className="btn btn-secondary" onClick={() => setShowStoreModal(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={saveStore} disabled={saving}>{saving ? 'Saving…' : editingStore ? 'Save Changes' : 'Create Store'}</button>
      </>}>
      {apiError && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>⚠</span><span>{apiError}</span></div>}
      <div className="form-group">
        <label>Store Name</label>
        <input value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} placeholder="Store name" className={storeErrors.name ? 'error' : ''} />
        {storeErrors.name && <div className="form-error">{storeErrors.name}</div>}
      </div>
      <div className="form-group">
        <label>Address / Location</label>
        <textarea value={storeForm.address} onChange={e => setStoreForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" rows={2} className={storeErrors.address ? 'error' : ''} />
        {storeErrors.address && <div className="form-error">{storeErrors.address}</div>}
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
        <div className="page-title"><h2>Admin Dashboard</h2><p>Overview of platform activity</p></div>
      </div>
      <div className="stats-grid">
        {[['👤', 'Total Users', stats.totalUsers, 'users'],
          ['🏬', 'Total Stores', stats.totalStores, 'stores'],
          ['★', 'Total Ratings', stats.totalRatings, 'ratings']].map(([icon, label, val, page]) => (
          <div className="stat-card" key={label} onClick={() => setCurrentPage(page)} style={{ cursor: 'pointer' }}>
            <div className="stat-label">{icon} {label}</div>
            <div className="stat-number">{val}</div>
            <div className="stat-sub">View all →</div>
          </div>
        ))}
      </div>
  <div className="card">
  <div className="card-header">
    <h3>Quick Actions</h3>
  </div>

  <div
    className="card-body"
    style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <button
      className="btn btn-primary"
      style={{ flex: 1 }}
      onClick={() => {
        setCurrentPage('users');
        setTimeout(() => openAddUser('user'), 100);
      }}
    >
      + Add User
    </button>

    <button
      className="btn btn-primary"
      style={{ flex: 1 }}
      onClick={() => {
        setCurrentPage('users');
        setTimeout(() => openAddUser('admin'), 100);
      }}
    >
      + Add Admin
    </button>

    <button
      className="btn btn-primary"
      style={{ flex: 1 }}
      onClick={() => {
        setCurrentPage('stores');
        setTimeout(openAddStore, 100);
      }}
    >
      + Add Store
    </button>
  </div>
</div>
      {showUserModal && <UserModal />}
      {showStoreModal && <StoreModal />}
    </div>
  );

  if (currentPage === 'users') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>User Management</h2><p>{users.length} total users</p></div>
        <button className="btn btn-primary" onClick={() => openAddUser()}>+ Add User</button>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="toolbar">
            <input className="search-input" placeholder="Search by name, email, address…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <select className="select-sm" value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="store_owner">Store Owner</option>
              <option value="user">Regular User</option>
            </select>
            {(userSearch || userRoleFilter) && <button className="btn btn-ghost btn-sm" onClick={() => { setUserSearch(''); setUserRoleFilter(''); }}>Clear</button>}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Address</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredUsers.length === 0
                ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👤</div><h4>No users found</h4><p>Try adjusting your search filters</p></div></td></tr>
                : filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-2)' }}>{u.email}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.address}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ color: 'var(--text-3)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td><div className="actions-row">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditUser(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {showUserModal && <UserModal />}
    </div>
  );

  if (currentPage === 'stores') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>Store Management</h2><p>{stores.length} total stores</p></div>
        <button className="btn btn-primary" onClick={openAddStore}>+ Add Store</button>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="toolbar">
            <input className="search-input" placeholder="Search by name or address…" value={storeSearch} onChange={e => setStoreSearch(e.target.value)} />
            {storeSearch && <button className="btn btn-ghost btn-sm" onClick={() => setStoreSearch('')}>Clear</button>}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Store Name</th><th>Address</th><th>Owner</th><th>Avg Rating</th><th>Reviews</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredStores.length === 0
                ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">🏬</div><h4>No stores found</h4></div></td></tr>
                : filteredStores.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{s.address}</td>
                    <td style={{ color: 'var(--text-2)' }}>{s.owner_name || '—'}</td>
                    <td><Stars n={s.average_rating || 0} /></td>
                    <td style={{ color: 'var(--text-2)' }}>{s.total_ratings || 0}</td>
                    <td><div className="actions-row">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditStore(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteStore(s.id)}>Delete</button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {showStoreModal && <StoreModal />}
    </div>
  );

  if (currentPage === 'ratings') return (
    <div className="page">
      <div className="page-header">
        <div className="page-title"><h2>Ratings & Reviews</h2><p>{ratings.length} total ratings</p></div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Store</th><th>User</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
            <tbody>
              {ratings.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">★</div><h4>No ratings yet</h4></div></td></tr>
                : ratings.map(r => (
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
    </div>
  );

  return null;
}
