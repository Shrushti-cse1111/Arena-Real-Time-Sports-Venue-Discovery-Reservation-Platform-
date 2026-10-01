import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Check,
  X,
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  Bell,
  Sparkles,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Camera,
  Activity,
  Award,
  Zap,
  Lock,
  Layers,
  Home,
  Calendar,
  Wallet,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { AVAILABLE_SPORTS } from '../data/mockVenues';

export default function UserProfileScreen({
  playerData,
  walletBalance = 0,
  onUpdateProfile,
  onNavigateTab,
  onOpenWallet,
  onOpenReferrals,
  onOpenSupport,
  onLogout,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: playerData?.fullName || '',
    email: playerData?.email || '',
    phoneNumber: playerData?.phoneNumber || '',
    countryCode: playerData?.countryCode || '+91',
    city: playerData?.city || '',
    skillLevel: playerData?.skillLevel || 'Intermediate',
    preferredSports: playerData?.preferredSports || [],
    notifications: playerData?.notifications || {
      whatsappAlerts: true,
      bookingConfirmations: true,
      promotions: false,
      matchReminders: true,
    },
  });

  const [savedPaymentMethods, setSavedPaymentMethods] = useState(
    playerData?.savedPaymentMethods || []
  );

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentType, setAddPaymentType] = useState('card'); // 'card' | 'upi'
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardBank, setNewCardBank] = useState('HDFC Bank');
  const [newCardName, setNewCardName] = useState(playerData?.fullName || '');
  const [newUpiVpa, setNewUpiVpa] = useState('');
  const [newUpiApp, setNewUpiApp] = useState('Google Pay');

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phoneNumber = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      errs.phoneNumber = 'Enter a valid 10-digit mobile number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = () => {
    if (!validate()) return;

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      const updatedPayload = {
        ...playerData,
        ...formData,
        savedPaymentMethods,
      };
      if (onUpdateProfile) {
        onUpdateProfile(updatedPayload);
      }
      showToast('Profile updated successfully!');
    }, 500);
  };

  const handleCancelEdit = () => {
    setFormData({
      fullName: playerData?.fullName || 'Player',
      email: playerData?.email || '',
      phoneNumber: playerData?.phoneNumber || '',
      countryCode: playerData?.countryCode || '+91',
      city: playerData?.city || 'Pune, Maharashtra',
      skillLevel: playerData?.skillLevel || 'Intermediate',
      preferredSports: playerData?.preferredSports || ['Badminton'],
      notifications: playerData?.notifications || {
        whatsappAlerts: true,
        bookingConfirmations: true,
        promotions: false,
        matchReminders: true,
      },
    });
    setErrors({});
    setIsEditing(false);
  };

  const toggleSportPreference = (sport) => {
    const current = formData.preferredSports;
    let updated;
    if (current.includes(sport)) {
      if (current.length === 1) {
        showToast('Please select at least one preferred sport.');
        return;
      }
      updated = current.filter((s) => s !== sport);
    } else {
      updated = [...current, sport];
    }
    setFormData((prev) => ({ ...prev, preferredSports: updated }));
    if (onUpdateProfile && !isEditing) {
      onUpdateProfile({ ...playerData, ...formData, preferredSports: updated, savedPaymentMethods });
    }
  };

  const toggleNotification = (key) => {
    const updated = {
      ...formData.notifications,
      [key]: !formData.notifications[key],
    };
    setFormData((prev) => ({ ...prev, notifications: updated }));
    if (onUpdateProfile && !isEditing) {
      onUpdateProfile({ ...playerData, ...formData, notifications: updated, savedPaymentMethods });
    }
  };

  // Saved Payment Handlers
  const handleSetDefaultPayment = (id) => {
    const updated = savedPaymentMethods.map((pm) => ({
      ...pm,
      isDefault: pm.id === id,
    }));
    setSavedPaymentMethods(updated);
    if (onUpdateProfile) {
      onUpdateProfile({ ...playerData, ...formData, savedPaymentMethods: updated });
    }
    showToast('Default payment method updated.');
  };

  const handleRemovePaymentMethod = (id) => {
    if (savedPaymentMethods.length <= 1) {
      showToast('You must have at least one saved payment method.');
      return;
    }
    const updated = savedPaymentMethods.filter((pm) => pm.id !== id);
    if (!updated.some((pm) => pm.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setSavedPaymentMethods(updated);
    if (onUpdateProfile) {
      onUpdateProfile({ ...playerData, ...formData, savedPaymentMethods: updated });
    }
    showToast('Payment method removed.');
  };

  const handleAddPaymentMethod = () => {
    if (addPaymentType === 'card') {
      const cleanCard = newCardNumber.replace(/\D/g, '');
      if (cleanCard.length < 4) {
        showToast('Please enter a valid 16-digit card number.');
        return;
      }
      const last4 = cleanCard.slice(-4);
      const isMaster = cleanCard.startsWith('5');
      const isRupay = cleanCard.startsWith('6');
      const cardBrand = isMaster ? 'Mastercard' : isRupay ? 'RuPay' : 'Visa';

      const newMethod = {
        id: `pm-${Date.now()}`,
        type: 'card',
        cardBrand,
        bankName: newCardBank || 'Bank Card',
        last4,
        expiry: newCardExpiry || '12/28',
        cardholderName: newCardName || formData.fullName,
        isDefault: savedPaymentMethods.length === 0,
      };

      const updated = [...savedPaymentMethods, newMethod];
      setSavedPaymentMethods(updated);
      if (onUpdateProfile) {
        onUpdateProfile({ ...playerData, ...formData, savedPaymentMethods: updated });
      }
      showToast(`Saved token for ${cardBrand} card •••• ${last4}`);
    } else {
      if (!newUpiVpa.includes('@')) {
        showToast('Please enter a valid UPI VPA (e.g. name@bank).');
        return;
      }
      const newMethod = {
        id: `pm-${Date.now()}`,
        type: 'upi',
        vpa: newUpiVpa.trim().toLowerCase(),
        app: newUpiApp || 'UPI',
        isDefault: savedPaymentMethods.length === 0,
      };

      const updated = [...savedPaymentMethods, newMethod];
      setSavedPaymentMethods(updated);
      if (onUpdateProfile) {
        onUpdateProfile({ ...playerData, ...formData, savedPaymentMethods: updated });
      }
      showToast(`Saved UPI VPA ${newMethod.vpa}`);
    }

    setShowAddPaymentModal(false);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewUpiVpa('');
  };

  const avatarInitials = formData.fullName
    ? formData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AM';

  return (
    <div className="profile-container fade-in">
      {/* PROFILE HEADER */}
      <header className="profile-header">
        <div className="profile-header-row">
          <div>
            <h1 className="profile-page-title">My Profile</h1>
            <p className="profile-page-subtitle">Personal info, saved payments & preferences</p>
          </div>
          <button
            type="button"
            className="btn-logout-header"
            onClick={() => setShowLogoutModal(true)}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="booking-toast-alert fade-in">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div className="profile-scroll-content">
        {/* HERO PROFILE CARD */}
        <div className="profile-hero-card">
          <div className="profile-hero-top">
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                <span>{avatarInitials}</span>
              </div>
              <button
                type="button"
                className="avatar-edit-badge"
                onClick={() => showToast('Avatar upload simulated. Initials updated from name.')}
                title="Change Photo"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="profile-hero-info">
              <h2 className="profile-user-name">{formData.fullName}</h2>
              <div className="profile-meta-line">
                <Mail size={13} className="meta-icon" />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="profile-meta-line">
                <Phone size={13} className="meta-icon" />
                <span>{formData.countryCode} {formData.phoneNumber}</span>
              </div>
            </div>
          </div>

          <div className="profile-badges-row">
            <span className="profile-pill-badge skill">
              <Zap size={12} />
              <span>{formData.skillLevel} Player</span>
            </span>
            <span className="profile-pill-badge location">
              <MapPin size={12} />
              <span>{formData.city}</span>
            </span>
          </div>

          <div className="profile-card-footer">
            {!isEditing ? (
              <button
                type="button"
                className="btn-edit-profile-toggle"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={15} />
                <span>Edit Profile Information</span>
              </button>
            ) : (
              <div className="edit-actions-dual">
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X size={15} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className="btn-save-edit"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EDIT PROFILE FORM (Shown when isEditing === true) */}
        {isEditing && (
          <div className="profile-section-card edit-form-card fade-in">
            <div className="card-header-line">
              <Edit3 size={18} className="section-icon" />
              <h3 className="section-card-title">Edit Account Details</h3>
            </div>

            <div className="profile-form-grid">
              {/* Full Name */}
              <div className="input-group">
                <label className="input-group-label" htmlFor="edit-fullname">
                  Full Name
                </label>
                <input
                  id="edit-fullname"
                  type="text"
                  className={`modal-text-input ${errors.fullName ? 'error' : ''}`}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                />
                {errors.fullName && <span className="input-err-msg">{errors.fullName}</span>}
              </div>

              {/* Email Address */}
              <div className="input-group">
                <label className="input-group-label" htmlFor="edit-email">
                  Email Address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className={`modal-text-input ${errors.email ? 'error' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. user@example.com"
                />
                {errors.email && <span className="input-err-msg">{errors.email}</span>}
              </div>

              {/* Phone Number */}
              <div className="input-group">
                <label className="input-group-label" htmlFor="edit-phone">
                  Phone Number
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    disabled
                    value={formData.countryCode}
                    style={{ width: '60px', textAlign: 'center' }}
                    className="modal-text-input"
                  />
                  <input
                    id="edit-phone"
                    type="tel"
                    className={`modal-text-input ${errors.phoneNumber ? 'error' : ''}`}
                    value={formData.phoneNumber}
                    maxLength={10}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="9876543210"
                  />
                </div>
                {errors.phoneNumber && <span className="input-err-msg">{errors.phoneNumber}</span>}
              </div>

              {/* City / Location */}
              <div className="input-group">
                <label className="input-group-label" htmlFor="edit-city">
                  City & Area
                </label>
                <input
                  id="edit-city"
                  type="text"
                  className="modal-text-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Pune, Maharashtra"
                />
              </div>

              {/* Skill Level Selector */}
              <div className="input-group">
                <label className="input-group-label">Skill Level</label>
                <div className="skill-selector-grid">
                  {['Beginner', 'Intermediate', 'Advanced', 'Tournament Pro'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`skill-chip ${formData.skillLevel === lvl ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, skillLevel: lvl })}
                    >
                      <span>{lvl}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARENA WALLET & REFUNDS SECTION */}
        <div
          className="profile-section-card wallet-profile-banner fade-in"
          onClick={onOpenWallet}
          role="button"
          tabIndex={0}
        >
          <div className="wallet-profile-left">
            <div className="wallet-profile-icon-wrap">
              <Wallet size={20} />
            </div>
            <div className="wallet-profile-details">
              <div className="wallet-profile-head">
                <span className="wallet-profile-title">Arena Wallet & Refunds</span>
                <span className="wallet-profile-badge">Active</span>
              </div>
              <span className="wallet-profile-sub">
                Balance: <strong>₹{Number(walletBalance).toLocaleString('en-IN')}</strong> • Tap to manage refunds & top up
              </span>
            </div>
          </div>
          <div className="wallet-profile-chevron">
            <ChevronRight size={18} />
          </div>
        </div>

        {/* REFERRAL & INVITE FRIENDS CARD */}
        <div
          className="profile-section-card wallet-profile-banner fade-in"
          onClick={onOpenReferrals}
          role="button"
          tabIndex={0}
          style={{ background: 'linear-gradient(135deg, #0A192F 0%, #0F2744 100%)', color: '#FFFFFF', border: '1.5px solid #38BDF8' }}
        >
          <div className="wallet-profile-left">
            <div className="wallet-profile-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }}>
              <Gift size={20} />
            </div>
            <div className="wallet-profile-details">
              <div className="wallet-profile-head">
                <span className="wallet-profile-title" style={{ color: '#FFFFFF' }}>Refer & Earn ₹150</span>
                <span className="default-pill" style={{ background: 'rgba(245, 158, 11, 0.22)', color: '#FDE68A', border: '1px solid rgba(245, 158, 11, 0.5)' }}>
                  Give ₹100, Get ₹150
                </span>
              </div>
              <span className="wallet-profile-sub" style={{ color: '#BAE6FD' }}>
                Invite friends to Arena & earn wallet rewards
              </span>
            </div>
          </div>
          <div className="wallet-profile-chevron" style={{ color: '#FFFFFF' }}>
            <ChevronRight size={18} />
          </div>
        </div>

        {/* 24/7 HELP & SUPPORT CENTER */}
        <div
          className="profile-section-card wallet-profile-banner fade-in"
          onClick={onOpenSupport}
          role="button"
          tabIndex={0}
        >
          <div className="wallet-profile-left">
            <div className="wallet-profile-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <HelpCircle size={20} />
            </div>
            <div className="wallet-profile-details">
              <div className="wallet-profile-head">
                <span className="wallet-profile-title">24/7 Help & Support Center</span>
                <span className="default-pill" style={{ background: '#ECFDF5', color: '#065F46' }}>Live Chat</span>
              </div>
              <span className="wallet-profile-sub">
                FAQs, Raise Ticket & Instant Live Chat Assistant
              </span>
            </div>
          </div>
          <div className="wallet-profile-chevron">
            <ChevronRight size={18} />
          </div>
        </div>

        {/* SAVED PAYMENT METHODS */}
        <div className="profile-section-card">
          <div className="card-header-line-split">
            <div className="card-header-left">
              <CreditCard size={18} className="section-icon" />
              <h3 className="section-card-title">Saved Payment Methods</h3>
            </div>
            <button
              type="button"
              className="btn-add-payment-pill"
              onClick={() => setShowAddPaymentModal(true)}
            >
              <Plus size={14} />
              <span>Add Method</span>
            </button>
          </div>

          <div className="saved-methods-list">
            {savedPaymentMethods.length > 0 ? (
              savedPaymentMethods.map((pm) => (
                <div key={pm.id} className={`saved-method-row ${pm.isDefault ? 'default' : ''}`}>
                  <div className="method-left-info">
                    <div className="method-icon-box">
                      {pm.type === 'card' ? <CreditCard size={18} /> : <Zap size={18} />}
                    </div>
                    <div className="method-details-col">
                      <div className="method-title-line">
                        <span className="method-name">
                          {pm.type === 'card'
                            ? `${pm.bankName} ${pm.cardBrand} •••• ${pm.last4}`
                            : `${pm.app} (${pm.vpa})`}
                        </span>
                        {pm.isDefault && <span className="default-pill">Default</span>}
                      </div>
                      <span className="method-sub">
                        {pm.type === 'card'
                          ? `Expires ${pm.expiry} • ${pm.cardholderName}`
                          : 'Instant 1-Click UPI Payment'}
                      </span>
                    </div>
                  </div>

                  <div className="method-actions-col">
                    {!pm.isDefault && (
                      <button
                        type="button"
                        className="btn-set-default"
                        onClick={() => handleSetDefaultPayment(pm.id)}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-remove-method"
                      onClick={() => handleRemovePaymentMethod(pm.id)}
                      title="Remove Payment Method"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                No saved payment methods. Tap "Add Method" to securely save a card or UPI ID.
              </div>
            )}
          </div>

          <div className="rbi-compliance-note">
            <ShieldCheck size={13} className="shield-icon" />
            <span>
              RBI Tokenization Compliant. Raw card credentials and CVVs are never saved on servers.
            </span>
          </div>
        </div>

        {/* SPORTS & GAME PREFERENCES */}
        <div className="profile-section-card">
          <div className="card-header-line">
            <Activity size={18} className="section-icon" />
            <h3 className="section-card-title">Preferred Sports</h3>
          </div>
          <p className="section-card-desc">
            Select the sports you play to get personalized venue recommendations and match alerts.
          </p>

          <div className="sports-pref-grid">
            {AVAILABLE_SPORTS.filter((s) => s !== 'All').map((sport) => {
              const isSelected = formData.preferredSports.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  className={`sport-pref-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleSportPreference(sport)}
                >
                  <span className={`pref-dot ${isSelected ? 'active' : ''}`} />
                  <span>{sport}</span>
                  {isSelected && <Check size={12} className="check-icon" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* NOTIFICATION PREFERENCES */}
        <div className="profile-section-card">
          <div className="card-header-line">
            <Bell size={18} className="section-icon" />
            <h3 className="section-card-title">Notification Settings</h3>
          </div>

          <div className="notification-options-list">
            <label className="notif-toggle-row">
              <div className="notif-info-col">
                <span className="notif-title">WhatsApp Match Passes</span>
                <span className="notif-sub">Receive instant entry QR codes & court details on WhatsApp</span>
              </div>
              <input
                type="checkbox"
                className="switch-toggle"
                checked={formData.notifications.whatsappAlerts}
                onChange={() => toggleNotification('whatsappAlerts')}
              />
            </label>

            <label className="notif-toggle-row">
              <div className="notif-info-col">
                <span className="notif-title">Booking Confirmations</span>
                <span className="notif-sub">Email receipts, tax invoices & slot lock confirmations</span>
              </div>
              <input
                type="checkbox"
                className="switch-toggle"
                checked={formData.notifications.bookingConfirmations}
                onChange={() => toggleNotification('bookingConfirmations')}
              />
            </label>

            <label className="notif-toggle-row">
              <div className="notif-info-col">
                <span className="notif-title">1-Hour Match Reminders</span>
                <span className="notif-sub">Timely push alerts before your court slot begins</span>
              </div>
              <input
                type="checkbox"
                className="switch-toggle"
                checked={formData.notifications.matchReminders}
                onChange={() => toggleNotification('matchReminders')}
              />
            </label>

            <label className="notif-toggle-row">
              <div className="notif-info-col">
                <span className="notif-title">Turf Offers & Promo Codes</span>
                <span className="notif-sub">Seasonal discounts and partner tournament updates</span>
              </div>
              <input
                type="checkbox"
                className="switch-toggle"
                checked={formData.notifications.promotions}
                onChange={() => toggleNotification('promotions')}
              />
            </label>
          </div>
        </div>

        {/* APP INFO & SIGN OUT BUTTON */}
        <div className="profile-footer-links">
          <div className="app-version-line">
            <span>Project Arena v2.4.0 • Build 2026.09</span>
          </div>
          <button
            type="button"
            className="btn-danger-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} />
            <span>Sign Out of Arena</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: ADD PAYMENT METHOD
          ========================================================================= */}
      {showAddPaymentModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setShowAddPaymentModal(false)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <CreditCard size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Add Saved Payment Method</h3>
                <span className="modal-sub">Secure tokenized gateway storage</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddPaymentModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              {/* TYPE TOGGLE TABS */}
              <div className="bookings-tabs-segment" style={{ marginBottom: '0.65rem' }}>
                <button
                  type="button"
                  className={`booking-tab-btn ${addPaymentType === 'card' ? 'active' : ''}`}
                  onClick={() => setAddPaymentType('card')}
                >
                  <CreditCard size={14} />
                  <span>Debit / Credit Card</span>
                </button>
                <button
                  type="button"
                  className={`booking-tab-btn ${addPaymentType === 'upi' ? 'active' : ''}`}
                  onClick={() => setAddPaymentType('upi')}
                >
                  <Zap size={14} />
                  <span>UPI ID / VPA</span>
                </button>
              </div>

              {addPaymentType === 'card' ? (
                <div className="profile-form-grid">
                  <div className="input-group">
                    <label className="input-group-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="modal-text-input"
                      value={newCardName}
                      onChange={(e) => setNewCardName(e.target.value)}
                      placeholder="Name on card"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-group-label">Card Number</label>
                    <input
                      type="text"
                      className="modal-text-input"
                      value={newCardNumber}
                      maxLength={19}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
                        setNewCardNumber(formatted);
                      }}
                      placeholder="4532 •••• •••• 4021"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="input-group">
                      <label className="input-group-label">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className="modal-text-input"
                        value={newCardExpiry}
                        maxLength={5}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                          setNewCardExpiry(v);
                        }}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-group-label">Issuing Bank</label>
                      <select
                        className="modal-text-input"
                        value={newCardBank}
                        onChange={(e) => setNewCardBank(e.target.value)}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="SBI Bank">State Bank of India</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Bank">Kotak Mahindra</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="profile-form-grid">
                  <div className="input-group">
                    <label className="input-group-label">UPI ID / VPA</label>
                    <input
                      type="text"
                      className="modal-text-input"
                      value={newUpiVpa}
                      onChange={(e) => setNewUpiVpa(e.target.value)}
                      placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-group-label">Primary UPI App</label>
                    <select
                      className="modal-text-input"
                      value={newUpiApp}
                      onChange={(e) => setNewUpiApp(e.target.value)}
                    >
                      <option value="Google Pay">Google Pay (GPay)</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm UPI</option>
                      <option value="BHIM UPI">BHIM UPI</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setShowAddPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={handleAddPaymentMethod}
              >
                Save Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIRM SIGN OUT
          ========================================================================= */}
      {showLogoutModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge danger">
                <LogOut size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Sign Out of Project Arena?</h3>
                <span className="modal-sub">You can sign back in with your mobile number anytime</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem 0' }}>
              Are you sure you want to end your session as <strong>{formData.fullName}</strong>?
            </p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={() => {
                  setShowLogoutModal(false);
                  if (onLogout) onLogout();
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav-bar" aria-label="Main Navigation">
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('bookings')}
        >
          <Calendar size={20} />
          <span>Bookings</span>
        </button>

        <button
          type="button"
          className="nav-item active"
          onClick={() => {}}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
