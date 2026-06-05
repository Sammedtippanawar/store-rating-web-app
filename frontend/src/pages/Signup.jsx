import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateName, validateEmail, validatePassword, validateAddress } from '../utils/validation';
import '../styles/Auth.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Signup({ onSuccess, onLogin }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const ne = validateName(form.name); if (ne) errs.name = ne;
    const ee = validateEmail(form.email); if (ee) errs.email = ee;
    const ae = validateAddress(form.address); if (ae) errs.address = ae;
    const pe = validatePassword(form.password); if (pe) errs.password = pe;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setGeneralError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.address, form.password, form.role);
      if (onSuccess) onSuccess();
    } catch (err) {
      setGeneralError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-logo">
        <div className="auth-logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h1>RateHub</h1>
        <p>Store Rating Platform</p>
      </div>

      <div className="auth-card">
        <div className="auth-card-header">
          <h2>Create an account</h2>
          <p>Join thousands of users rating stores</p>
        </div>

        {generalError && (
          <div className="alert alert-error"><span>⚠</span><span>{generalError}</span></div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Full Name <span style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 400 }}>(20–60 chars)</span></label>
            <div className="input-wrap">
              <input name="name" placeholder="Your full name" value={form.name} onChange={handle} className={errors.name ? 'error-input' : ''} />
            </div>
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div className="form-field">
            <label>Email Address</label>
            <div className="input-wrap">
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} className={errors.email ? 'error-input' : ''} />
            </div>
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-field">
            <label>Address</label>
            <div className="input-wrap">
              <input name="address" placeholder="123 Main Street, City" value={form.address} onChange={handle} className={errors.address ? 'error-input' : ''} />
            </div>
            {errors.address && <div className="field-error">{errors.address}</div>}
          </div>

          <div className="form-field">
            <label>Password</label>
            <div className="input-wrap">
              <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={handle} className={`has-icon ${errors.password ? 'error-input' : ''}`} />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
            <div className="field-hint">8–16 chars, 1 uppercase, 1 special character</div>
          </div>

          <div className="form-field">
            <label>Account Type</label>
            <select name="role" value={form.role} onChange={handle} className="select-input">
              <option value="user">Regular User</option>
              <option value="store_owner">Store Owner</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-card-footer">
          Already have an account?
          <button type="button" onClick={onLogin}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
