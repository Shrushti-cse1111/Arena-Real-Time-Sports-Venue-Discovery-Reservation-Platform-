import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  XCircle,
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Building2,
  CreditCard,
  Search,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { businessVerificationService } from '../services/businessVerificationService';
import { ownerAuthService } from '../services/ownerAuthService';

export default function OwnerBusinessVerificationScreen({
  ownerSession,
  onVerificationSuccess = () => {},
  onBack = () => {},
}) {
  const currentOwnerId = ownerSession?.ownerId || 'OWNER-DEFAULT';

  // Loading & Record states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ifscVerifying, setIfscVerifying] = useState(false);

  // Status: 'unverified' | 'pending' | 'verified' | 'rejected'
  const [status, setStatus] = useState('unverified');
  const [rejectionReason, setRejectionReason] = useState(null);

  // Business Details Form
  const [gstNumber, setGstNumber] = useState('');
  const [idReference, setIdReference] = useState('');

  // 3 Document Dropzone states
  const [documents, setDocuments] = useState({
    gstCertificate: null,
    idProof: null,
    addressProof: null,
  });
  const [uploadProgress, setUploadProgress] = useState({
    gstCertificate: 0,
    idProof: 0,
    addressProof: 0,
  });

  // Bank Payout Form
  const [accountHolderName, setAccountHolderName] = useState(ownerSession?.businessName || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscVerified, setIfscVerified] = useState(false);

  // Feedback Banners
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial verification data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await businessVerificationService.getVerificationData(currentOwnerId);
        setStatus(data.status || 'unverified');
        setRejectionReason(data.rejectionReason || null);
        if (data.gstNumber) setGstNumber(data.gstNumber);
        if (data.idReference) setIdReference(data.idReference);
        if (data.documents) setDocuments(data.documents);
        if (data.payoutAccount) {
          if (data.payoutAccount.accountHolderName) setAccountHolderName(data.payoutAccount.accountHolderName);
          if (data.payoutAccount.accountNumber) setAccountNumber(data.payoutAccount.accountNumber);
          if (data.payoutAccount.ifscCode) setIfscCode(data.payoutAccount.ifscCode);
          if (data.payoutAccount.bankName) {
            setBankName(data.payoutAccount.bankName);
            setIfscVerified(true);
          }
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load verification status.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentOwnerId]);

  // IFSC Lookup Handler
  const handleVerifyIfsc = async () => {
    if (!ifscCode.trim()) {
      setErrorMessage('Please enter an 11-character IFSC code.');
      return;
    }
    setErrorMessage('');
    setIfscVerifying(true);
    try {
      const res = await businessVerificationService.verifyIfsc(ifscCode);
      setBankName(res.bankName);
      setIfscVerified(true);
      setSuccessMessage(`Bank verified: ${res.bankName} (${res.branch})`);
    } catch (err) {
      setIfscVerified(false);
      setBankName('');
      setErrorMessage(err.message || 'Invalid IFSC code.');
    } finally {
      setIfscVerifying(false);
    }
  };

  // Document Dropzone File Upload Handler
  const handleFileSelect = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setUploadProgress((prev) => ({ ...prev, [docType]: 10 }));

    try {
      const uploadedDoc = await businessVerificationService.uploadDocument(file, docType, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [docType]: pct }));
      });

      setDocuments((prev) => ({ ...prev, [docType]: uploadedDoc }));
    } catch (err) {
      setErrorMessage(`Failed to upload ${docType}: ${err.message}`);
    } finally {
      setUploadProgress((prev) => ({ ...prev, [docType]: 0 }));
    }
  };

  const handleRemoveDocument = (docType) => {
    setDocuments((prev) => ({ ...prev, [docType]: null }));
  };

  // Form Submit Handler
  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isFieldsDisabled) return;

    setSubmitting(true);
    try {
      const res = await businessVerificationService.submitVerification({
        ownerId: currentOwnerId,
        gstNumber,
        idReference,
        documents,
        payoutAccount: {
          accountHolderName,
          accountNumber,
          ifscCode,
          bankName,
        },
      });

      setStatus('pending');
      setRejectionReason(null);
      setSuccessMessage('Business verification submitted successfully! Your account is now under review.');
      ownerAuthService.updateOwnerVerificationStatus('pending');
      onVerificationSuccess('pending');
    } catch (err) {
      setErrorMessage(err.message || 'Submission failed. Please check all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Unlock fields on rejection re-submit
  const handleResubmit = () => {
    setStatus('unverified');
    setRejectionReason(null);
    setErrorMessage('');
    setSuccessMessage('Form unlocked. Please update invalid details or documents and submit again.');
  };

  // Demo status switcher helper for testing
  const handleDemoStatusChange = async (newStatus) => {
    const reason = newStatus === 'rejected' ? 'GST Certificate image was unreadable. Please upload a high-resolution PDF/Image.' : null;
    const rec = await businessVerificationService.setMockStatus(currentOwnerId, newStatus, reason);
    setStatus(rec.status);
    setRejectionReason(rec.rejectionReason);
    ownerAuthService.updateOwnerVerificationStatus(rec.status);
  };

  const isFieldsDisabled = status === 'pending' || status === 'verified';
  const isFormValid =
    gstNumber.trim().length >= 10 &&
    idReference.trim().length >= 8 &&
    documents.gstCertificate &&
    documents.idProof &&
    documents.addressProof &&
    accountHolderName.trim().length > 0 &&
    accountNumber.trim().length >= 9 &&
    ifscVerified &&
    bankName;

  if (loading) {
    return (
      <div className="screen-body fade-in" style={{ justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div className="auth-spinner" style={{ width: 32, height: 32, borderColor: '#BFDBFE', borderTopColor: '#2563EB' }} />
        <span style={{ marginTop: '1rem', fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
          Loading verification status...
        </span>
      </div>
    );
  }

  return (
    <div className="screen-body fade-in" style={{ paddingBottom: '2.5rem' }}>

      {/* Screen Title & Subtitle */}
      <h1 className="screen-title">Business Verification</h1>
      <p className="screen-subtitle">
        Verify your venue business & payout details to receive automated slot earnings.
      </p>

      {/* Demo Tester Tool (Fast Status Testing) */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, color: '#1E40AF' }}>Simulate Status:</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => handleDemoStatusChange('pending')} style={{ padding: '2px 6px', fontSize: '10px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 4, cursor: 'pointer' }}>Pending</button>
          <button type="button" onClick={() => handleDemoStatusChange('verified')} style={{ padding: '2px 6px', fontSize: '10px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 4, cursor: 'pointer' }}>Verified</button>
          <button type="button" onClick={() => handleDemoStatusChange('rejected')} style={{ padding: '2px 6px', fontSize: '10px', background: '#FEF2F2', border: '1px solid #EF4444', borderRadius: 4, cursor: 'pointer' }}>Rejected</button>
        </div>
      </div>

      {/* STATUS BADGE BANNER CARD */}
      <div
        className="auth-stacked-card"
        style={{
          backgroundColor:
            status === 'verified' ? '#ECFDF5' :
            status === 'pending' ? '#FEF3C7' :
            status === 'rejected' ? '#FEF2F2' : '#FFFFFF',
          borderColor:
            status === 'verified' ? '#A7F3D0' :
            status === 'pending' ? '#FDE68A' :
            status === 'rejected' ? '#FCA5A5' : '#E2E8F0',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {status === 'verified' && <CheckCircle2 size={22} color="#10B981" />}
            {status === 'pending' && <Clock size={22} color="#F59E0B" />}
            {status === 'rejected' && <XCircle size={22} color="#EF4444" />}
            {status === 'unverified' && <ShieldCheck size={22} color="#2563EB" />}

            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#64748B' }}>
                Verification Status
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {status === 'verified' && 'Verified Venue Partner'}
                {status === 'pending' && 'Verification Pending Review'}
                {status === 'rejected' && 'Verification Rejected'}
                {status === 'unverified' && 'Action Required — Unverified'}
              </h3>
            </div>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor:
                status === 'verified' ? '#10B981' :
                status === 'pending' ? '#F59E0B' :
                status === 'rejected' ? '#EF4444' : '#2563EB',
              color: '#FFFFFF',
            }}
          >
            {status.toUpperCase()}
          </span>
        </div>

        {/* Status Messages */}
        {status === 'pending' && (
          <p style={{ fontSize: '12px', color: '#B45309', marginTop: '0.65rem', lineHeight: 1.45, fontWeight: 500 }}>
            Your documents & bank details have been submitted. Our compliance team usually completes verification within 24–48 hours.
          </p>
        )}

        {status === 'verified' && (
          <p style={{ fontSize: '12px', color: '#047857', marginTop: '0.65rem', lineHeight: 1.45, fontWeight: 500 }}>
            Congratulations! Your venue business is fully verified. Automated earnings payouts are active.
          </p>
        )}

        {status === 'rejected' && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991B1B', fontSize: '12px', fontWeight: 600 }}>
              <AlertCircle size={15} />
              <span>Reason: {rejectionReason || 'Uploaded document was unreadable.'}</span>
            </div>
            <button
              type="button"
              onClick={handleResubmit}
              className="auth-secondary-btn"
              style={{ marginTop: '0.65rem', height: '36px', fontSize: '12px', borderColor: '#EF4444', color: '#DC2626' }}
            >
              <RefreshCw size={14} />
              <span>Re-submit Verification Data</span>
            </button>
          </div>
        )}
      </div>

      {/* Error & Success Notification Banners */}
      {errorMessage && (
        <div className="auth-danger-banner">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="auth-danger-banner" style={{ backgroundColor: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitVerification}>

        {/* CARD 1: BUSINESS DETAILS */}
        <div className="auth-stacked-card" style={{ marginBottom: '1rem' }}>
          <h2 className="auth-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={18} color="#2563EB" />
            <span>Business Identification</span>
          </h2>
          <p className="auth-card-subtitle">Enter your official GSTIN & government ID reference.</p>

          <div className="auth-field-group">
            <label htmlFor="gstNumber" className="auth-field-label">
              GST Number (GSTIN) *
            </label>
            <input
              id="gstNumber"
              type="text"
              disabled={isFieldsDisabled}
              className="auth-field-input"
              placeholder="e.g. 27AAAAA0000A1Z5"
              maxLength={15}
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            />
          </div>

          <div className="auth-field-group">
            <label htmlFor="idReference" className="auth-field-label">
              Government ID Reference (PAN / Aadhaar / Business Reg) *
            </label>
            <input
              id="idReference"
              type="text"
              disabled={isFieldsDisabled}
              className="auth-field-input"
              placeholder="e.g. ABCDE1234F"
              maxLength={20}
              value={idReference}
              onChange={(e) => setIdReference(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* CARD 2: DOCUMENT DROPZONES (3 REQUIRED DOCS) */}
        <div className="auth-stacked-card" style={{ marginBottom: '1rem' }}>
          <h2 className="auth-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={18} color="#2563EB" />
            <span>Verification Documents (3 Required)</span>
          </h2>
          <p className="auth-card-subtitle">Upload clear PDF, PNG, or JPG copies of your documents.</p>

          {/* Doc 1: GST Certificate */}
          <DocumentDropzone
            label="1. GST Certificate *"
            docType="gstCertificate"
            doc={documents.gstCertificate}
            progress={uploadProgress.gstCertificate}
            disabled={isFieldsDisabled}
            onSelect={(e) => handleFileSelect(e, 'gstCertificate')}
            onRemove={() => handleRemoveDocument('gstCertificate')}
          />

          {/* Doc 2: Owner ID Proof */}
          <DocumentDropzone
            label="2. Owner Government ID Proof (PAN/Aadhaar) *"
            docType="idProof"
            doc={documents.idProof}
            progress={uploadProgress.idProof}
            disabled={isFieldsDisabled}
            onSelect={(e) => handleFileSelect(e, 'idProof')}
            onRemove={() => handleRemoveDocument('idProof')}
          />

          {/* Doc 3: Address Proof */}
          <DocumentDropzone
            label="3. Address Proof / Venue Property Document *"
            docType="addressProof"
            doc={documents.addressProof}
            progress={uploadProgress.addressProof}
            disabled={isFieldsDisabled}
            onSelect={(e) => handleFileSelect(e, 'addressProof')}
            onRemove={() => handleRemoveDocument('addressProof')}
          />
        </div>

        {/* CARD 3: BANK PAYOUT DETAILS */}
        <div className="auth-stacked-card" style={{ marginBottom: '1.25rem' }}>
          <h2 className="auth-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CreditCard size={18} color="#2563EB" />
            <span>Bank Payout Account</span>
          </h2>
          <p className="auth-card-subtitle">Receiving account for automated weekly & instant payouts.</p>

          <div className="auth-field-group">
            <label htmlFor="accountHolderName" className="auth-field-label">
              Account Holder Name *
            </label>
            <input
              id="accountHolderName"
              type="text"
              disabled={isFieldsDisabled}
              className="auth-field-input"
              placeholder="e.g. Apex Sports Arena LLP"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />
          </div>

          <div className="auth-field-group">
            <label htmlFor="accountNumber" className="auth-field-label">
              Account Number *
            </label>
            <input
              id="accountNumber"
              type="password"
              disabled={isFieldsDisabled}
              className="auth-field-input"
              placeholder="Enter full bank account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            />
            {isFieldsDisabled && accountNumber && (
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: 4 }}>
                Saved Masked Number: <strong style={{ color: '#0F172A' }}>{accountNumber}</strong>
              </span>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="ifscCode" className="auth-field-label">
              IFSC Code *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="ifscCode"
                type="text"
                disabled={isFieldsDisabled}
                className="auth-field-input"
                placeholder="e.g. HDFC0000240"
                maxLength={11}
                value={ifscCode}
                onChange={(e) => {
                  setIfscCode(e.target.value.toUpperCase());
                  setIfscVerified(false);
                }}
              />
              <button
                type="button"
                disabled={isFieldsDisabled || ifscVerifying || !ifscCode}
                onClick={handleVerifyIfsc}
                className="auth-secondary-btn"
                style={{ width: '120px', height: '44px', marginTop: 0, flexShrink: 0 }}
              >
                {ifscVerifying ? <span className="auth-spinner" style={{ width: 14, height: 14 }} /> : 'Verify IFSC'}
              </button>
            </div>

            {bankName && (
              <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={14} />
                <span>Bank: {bankName}</span>
              </div>
            )}
          </div>
        </div>

        {/* PRIMARY SUBMIT BUTTON */}
        {!isFieldsDisabled && (
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className={`auth-primary-btn ${!isFormValid || submitting ? 'is-disabled' : ''} ${submitting ? 'is-loading' : ''}`}
          >
            {submitting ? (
              <span className="auth-spinner" />
            ) : (
              <>
                <span>Submit Verification Request</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}

// Sub-component: Document Dropzone Item
function DocumentDropzone({ label, docType, doc, progress, disabled, onSelect, onRemove }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label className="auth-field-label">{label}</label>

      {doc ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <FileText size={18} color="#2563EB" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {doc.fileName}
              </span>
              <span style={{ fontSize: '10px', color: '#64748B' }}>
                {doc.fileSizeKb} KB • Reference: {doc.documentId}
              </span>
            </div>
          </div>

          {!disabled && (
            <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="file"
            disabled={disabled}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={onSelect}
            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: disabled ? 'not-allowed' : 'pointer', zIndex: 2 }}
          />
          <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: 8, padding: '0.75rem', textAlign: 'center', background: '#FFFFFF', transition: 'all 0.15s ease' }}>
            {progress > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>Uploading... {progress}%</span>
                <div style={{ width: '100%', maxWidth: '180px', height: '4px', background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#2563EB', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748B' }}>
                <Upload size={16} color="#2563EB" />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  {disabled ? 'Document locked' : 'Click or drop PDF/Image here'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
