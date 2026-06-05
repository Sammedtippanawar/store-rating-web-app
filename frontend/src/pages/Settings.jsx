import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/validation';
import '../styles/Dashboard.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const toggle = (f) => setShowPw(p => ({ ...p, [f]: !p[f] }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) { setError('All fields are required'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    const pe = validatePassword(form.newPassword);
    if (pe) { setError(pe); return; }
    setLoading(true);
    try {
      await updatePassword(form.oldPassword, form.newPassword);
      setSuccess('Password updated successfully!');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally { setLoading(false); }
  };

  const PwField = ({ name, label, field, placeholder }) => (
    <div className="form-group">
      <label>{label}</label>
      <div className="input-rel">
        <input
          name={name}
          type={showPw[field] ? 'text' : 'password'}
          placeholder={placeholder}
          value={form[name]}
          onChange={handle}
        />
        <button type="button" className="eye-btn" onClick={() => toggle(field)}>
          {showPw[field] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>
    </div>
  );

  const roleLabel = r => r === 'admin' ? 'Administrator' : r === 'store_owner' ? 'Store Owner' : 'Regular User';

  return (
    <div className="settings-wrap">
      <div className="page-header">
        <div className="page-title">
          <h2>Settings</h2>
          <p>Manage your account preferences</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Account Information</h3></div>
        <div className="card-body">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[['Name', user?.name], ['Email', user?.email], ['Address', user?.address],
                ['Role', roleLabel(user?.role)]].map(([label, val]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)', fontSize: 13, width: 120 }}>{label}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{val || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Change Password</h3></div>
        <div className="card-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><span>⚠</span><span>{error}</span></div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><span>✓</span><span>{success}</span></div>}
          <form onSubmit={submit} style={{ maxWidth: 360 }}>
            <PwField name="oldPassword" label="Current Password" field="old" placeholder="Enter current password" />
            <PwField name="newPassword" label="New Password" field="new" placeholder="Enter new password" />
            <div className="form-hint" style={{ marginTop: -10, marginBottom: 14 }}>8–16 chars, 1 uppercase, 1 special character</div>
            <PwField name="confirmPassword" label="Confirm New Password" field="confirm" placeholder="Confirm new password" />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
