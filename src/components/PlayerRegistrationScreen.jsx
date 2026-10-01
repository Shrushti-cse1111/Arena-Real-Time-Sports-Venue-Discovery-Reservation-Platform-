import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

export default function PlayerRegistrationScreen({ formData, setFormData, onSubmit, onNavigateLogin }) {
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
    }
    if (!formData.city?.trim()) {
      newErrors.city = 'City or location is required';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit();
  };

  const quickCities = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai'];

  return (
    <div className="screen-body fade-in">
      <h1 className="screen-title">Create your account</h1>
      <p className="screen-subtitle">Start booking your favourite sports venues.</p>

      <form onSubmit={validateAndSubmit}>
        <div className="form-group-list">
          {/* 1. Full Name */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="fullName" className="form-label">Full Name *</label>
            </div>
            <div className="input-wrapper">
              <input
                id="fullName"
                type="text"
                className={`input-field ${errors.fullName ? 'has-error' : ''}`}
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
            </div>
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          {/* 2. Phone Number with Country Code */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="phoneNumber" className="form-label">Phone Number *</label>
            </div>
            <div className="phone-input-container">
              <select
                className="country-code-select"
                value={formData.countryCode || '+91'}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+65">🇸🇬 +65</option>
              </select>
              <div style={{ flex: 1 }}>
                <input
                  id="phoneNumber"
                  type="tel"
                  className={`input-field ${errors.phoneNumber ? 'has-error' : ''}`}
                  placeholder="98765 43210"
                  maxLength={10}
                  value={formData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>

          {/* 3. Email Address (Optional) */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="email" className="form-label">Email Address</label>
              <span className="optional-tag">(Optional)</span>
            </div>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? 'has-error' : ''}`}
                placeholder="user@example.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* 4. City or Location */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="city" className="form-label">City or Location *</label>
            </div>
            <div className="input-wrapper">
              <input
                id="city"
                type="text"
                className={`input-field ${errors.city ? 'has-error' : ''}`}
                placeholder="Search or enter your city"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            {errors.city && <span className="error-text">{errors.city}</span>}
            <div className="location-chips">
              {quickCities.map((city) => (
                <button
                  type="button"
                  key={city}
                  className={`chip-btn ${formData.city === city ? 'active' : ''}`}
                  onClick={() => handleInputChange('city', city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Referral Code (Optional - Earn ₹100 Bonus) */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="referralCode" className="form-label">Referral Code 🎁</label>
              <span className="optional-tag">(Get ₹100 Bonus)</span>
            </div>
            <div className="input-wrapper">
              <input
                id="referralCode"
                type="text"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
                className="input-field"
                placeholder="e.g. FRIEND2026"
                value={formData.referralCode || ''}
                onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
              />
            </div>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              Enter a friend's referral code to unlock ₹100 promo credit on your 1st game.
            </span>
          </div>
        </div>

        <div className="bottom-action-container">
          <button type="submit" className="btn-primary">
            <span>Create Account</span>
            <ArrowRight size={18} />
          </button>

          <p className="form-footer-link">
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={() => onNavigateLogin && onNavigateLogin('player')}>
              Log In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
