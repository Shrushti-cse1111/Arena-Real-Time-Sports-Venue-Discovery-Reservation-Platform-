import React, { useState, useEffect } from 'react';
import {
  Layers,
  Image,
  Bell,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Radio,
  RefreshCw,
  X
} from 'lucide-react';
import { adminContentService } from '../services/adminContentService';

export default function AdminContentScreen({
  adminSession,
  onBackToDashboard,
}) {
  const [activeSubTab, setActiveSubTab] = useState('banners'); // 'banners' | 'announcements' | 'broadcast'
  const [banners, setBanners] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Banner Modal
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    cta: 'Book Now',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2026-12-31',
  });

  // Announcement Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', message: '' });

  // Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    audience: 'All Users',
  });
  const [isSending, setIsSending] = useState(false);

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [bRes, aRes, bcRes] = await Promise.all([
        adminContentService.getBanners(),
        adminContentService.getAnnouncements(),
        adminContentService.getBroadcasts(),
      ]);

      if (bRes.success) setBanners(bRes.banners);
      if (aRes.success) setAnnouncements(aRes.announcements);
      if (bcRes.success) setBroadcasts(bcRes.broadcasts);
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    try {
      const res = await adminContentService.createBanner(bannerForm, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        setShowBannerModal(false);
        loadContent();
      }
    } catch (err) {
      alert(err.message || 'Failed to create banner.');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete this banner from mobile carousel?')) return;
    try {
      const res = await adminContentService.deleteBanner(id, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        loadContent();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete banner.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await adminContentService.createAnnouncement(annForm, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        setShowAnnModal(false);
        setAnnForm({ title: '', message: '' });
        loadContent();
      }
    } catch (err) {
      alert(err.message || 'Failed to publish announcement.');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await adminContentService.sendBroadcastNotification(broadcastForm, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        setShowBroadcastModal(false);
        setBroadcastForm({ title: '', message: '', audience: 'All Users' });
        loadContent();
      }
    } catch (err) {
      alert(err.message || 'Broadcast failed.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-content-screen fade-in">
      {actionNotice && (
        <div className="admin-action-toast fade-in">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice('')} className="toast-close-btn">✕</button>
        </div>
      )}

      <div className="admin-content-card">
        <div className="card-header-row">
          <div className="card-header-title-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-title-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Layers size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Content & Communications Management</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Manage promotional hero carousels, network announcements & broadcast push alerts
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {activeSubTab === 'banners' && (
              <button type="button" className="btn-primary" onClick={() => setShowBannerModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}>
                <Plus size={14} /> Add Banner
              </button>
            )}
            {activeSubTab === 'announcements' && (
              <button type="button" className="btn-primary" onClick={() => setShowAnnModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}>
                <Plus size={14} /> New Announcement
              </button>
            )}
            {activeSubTab === 'broadcast' && (
              <button type="button" className="btn-primary" onClick={() => setShowBroadcastModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}>
                <Send size={14} /> New Broadcast
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="user-modal-nav-tabs" style={{ marginTop: '0.75rem' }}>
          {[
            { id: 'banners', label: `Promotional Banners (${banners.length})` },
            { id: 'announcements', label: `Announcements (${announcements.length})` },
            { id: 'broadcast', label: `Broadcast Log (${broadcasts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`user-modal-tab-btn ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BANNERS */}
        {activeSubTab === 'banners' && (
          <div className="user-complaints-list" style={{ marginTop: '1rem' }}>
            {banners.map((b) => (
              <div key={b.id} className="user-complaint-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img src={b.imageUrl} alt={b.title} style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="ledger-id-tag">{b.id}</span>
                    <span className="status-badge-sm active">{b.status}</span>
                  </div>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#0F172A' }}>{b.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{b.description}</p>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>CTA: {b.cta} • {b.startDate} to {b.endDate}</span>
                </div>
                <button type="button" className="btn-action-sm btn-block-user" onClick={() => handleDeleteBanner(b.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: ANNOUNCEMENTS */}
        {activeSubTab === 'announcements' && (
          <div className="user-complaints-list" style={{ marginTop: '1rem' }}>
            {announcements.map((a) => (
              <div key={a.id} className="user-complaint-card">
                <div className="complaint-card-header">
                  <span className="complaint-id-tag">{a.id}</span>
                  <span className="status-badge-sm active">{a.status}</span>
                </div>
                <h4 style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#0F172A' }}>{a.title}</h4>
                <p style={{ margin: '0.25rem 0', fontSize: '0.78rem', color: '#334155' }}>{a.message}</p>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Published: {a.publishDate}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: BROADCASTS */}
        {activeSubTab === 'broadcast' && (
          <div className="user-complaints-list" style={{ marginTop: '1rem' }}>
            {broadcasts.map((bc) => (
              <div key={bc.id} className="user-complaint-card">
                <div className="complaint-card-header">
                  <span className="complaint-id-tag">{bc.id} • Audience: {bc.audience}</span>
                  <span className="status-badge-sm active">Delivered ({bc.deliveredCount.toLocaleString()})</span>
                </div>
                <h4 style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#0F172A' }}>{bc.title}</h4>
                <p style={{ margin: '0.25rem 0', fontSize: '0.78rem', color: '#334155' }}>{bc.message}</p>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Sent on {new Date(bc.sentAt).toLocaleString()} by {bc.sentBy}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE BANNER MODAL */}
      {showBannerModal && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container user-details-modal-container" style={{ maxWidth: '440px' }}>
            <div className="user-modal-header">
              <h3 className="modal-title" style={{ margin: 0 }}>Add Promotional Carousel Banner</h3>
              <button type="button" className="close-notice-btn" onClick={() => setShowBannerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBanner} style={{ marginTop: '0.85rem' }}>
              <label className="input-label">Banner Title *</label>
              <input type="text" className="input-field" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required style={{ marginTop: '0.25rem' }} />
              <label className="input-label" style={{ marginTop: '0.5rem' }}>Description</label>
              <input type="text" className="input-field" value={bannerForm.description} onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })} style={{ marginTop: '0.25rem' }} />
              <label className="input-label" style={{ marginTop: '0.5rem' }}>Button CTA</label>
              <input type="text" className="input-field" value={bannerForm.cta} onChange={(e) => setBannerForm({ ...bannerForm, cta: e.target.value })} style={{ marginTop: '0.25rem' }} />
              <div className="info-two-col-grid" style={{ marginTop: '0.5rem' }}>
                <div>
                  <label className="input-label">Start Date *</label>
                  <input type="date" className="input-field" value={bannerForm.startDate} onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })} required style={{ marginTop: '0.25rem' }} />
                </div>
                <div>
                  <label className="input-label">End Date *</label>
                  <input type="date" className="input-field" value={bannerForm.endDate} onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })} required style={{ marginTop: '0.25rem' }} />
                </div>
              </div>
              <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBannerModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Publish Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAnnModal && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container user-details-modal-container" style={{ maxWidth: '440px' }}>
            <div className="user-modal-header">
              <h3 className="modal-title" style={{ margin: 0 }}>Publish Platform Announcement</h3>
              <button type="button" className="close-notice-btn" onClick={() => setShowAnnModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAnnouncement} style={{ marginTop: '0.85rem' }}>
              <label className="input-label">Title *</label>
              <input type="text" className="input-field" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} required style={{ marginTop: '0.25rem' }} />
              <label className="input-label" style={{ marginTop: '0.5rem' }}>Announcement Content *</label>
              <textarea className="reason-textarea" rows={3} value={annForm.message} onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })} required style={{ width: '100%', marginTop: '0.25rem' }} />
              <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAnnModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container user-details-modal-container" style={{ maxWidth: '440px' }}>
            <div className="user-modal-header">
              <h3 className="modal-title" style={{ margin: 0 }}>Dispatch Broadcast Push Alert</h3>
              <button type="button" className="close-notice-btn" onClick={() => setShowBroadcastModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSendBroadcast} style={{ marginTop: '0.85rem' }}>
              <label className="input-label">Audience *</label>
              <select className="filter-select" value={broadcastForm.audience} onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })} style={{ width: '100%', marginTop: '0.25rem', height: '36px' }}>
                <option value="All Users">All Users (Players & Owners)</option>
                <option value="Players Only">Players Only</option>
                <option value="Owners Only">Venue Partners Only</option>
              </select>
              <label className="input-label" style={{ marginTop: '0.5rem' }}>Push Notification Title *</label>
              <input type="text" className="input-field" value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} required style={{ marginTop: '0.25rem' }} />
              <label className="input-label" style={{ marginTop: '0.5rem' }}>Message Body *</label>
              <textarea className="reason-textarea" rows={3} value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} required style={{ width: '100%', marginTop: '0.25rem' }} />
              <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSending}>
                  {isSending ? 'Dispatching...' : 'Send Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
