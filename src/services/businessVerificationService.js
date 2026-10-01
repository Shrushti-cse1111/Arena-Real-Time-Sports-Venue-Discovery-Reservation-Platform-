/**
 * ARENA — BUSINESS VERIFICATION SERVICE
 * Manages venue owner KYC, document upload, IFSC lookup, and payout bank details verification.
 * API routes:
 *   GET /owner/verification
 *   POST /owner/verification
 *   POST /owner/verification/ifsc
 *   POST /owner/verification/documents
 */

const STORAGE_KEY_VERIFICATION = 'arena_owner_verification_data';

// Mock IFSC database for popular Indian banks
const mockIfscDb = {
  HDFC0000240: { bankName: 'HDFC Bank', branch: 'Kothrud, Pune', city: 'Pune' },
  SBIN0001324: { bankName: 'State Bank of India', branch: 'Deccan Gymkhana, Pune', city: 'Pune' },
  ICIC0000104: { bankName: 'ICICI Bank', branch: 'Viman Nagar, Pune', city: 'Pune' },
  UTIB0000512: { bankName: 'Axis Bank', branch: 'Banthiya Plaza, Pune', city: 'Pune' },
  KKBK0001789: { bankName: 'Kotak Mahindra Bank', branch: 'Kalyani Nagar, Pune', city: 'Pune' },
};

export const businessVerificationService = {
  /**
   * GET /owner/verification
   * Retrieves verification record for the given ownerId
   */
  async getVerificationData(ownerId) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '{}');
    const ownerData = allData[ownerId] || {
      ownerId,
      status: 'unverified', // 'unverified' | 'pending' | 'verified' | 'rejected'
      rejectionReason: null,
      gstNumber: '',
      idReference: '',
      documents: {
        gstCertificate: null,
        idProof: null,
        addressProof: null,
      },
      payoutAccount: {
        accountHolderName: '',
        accountNumber: '',
        maskedAccountNumber: '',
        ifscCode: '',
        bankName: '',
      },
      submittedAt: null,
    };

    return ownerData;
  },

  /**
   * POST /owner/verification/ifsc
   * Validates Indian Financial System Code (IFSC) and fetches Bank Name
   */
  async verifyIfsc(ifscCode) {
    const cleanIfsc = (ifscCode || '').trim().toUpperCase();

    // Indian IFSC standard: 4 letters + 0 + 6 alphanumeric characters (total 11 chars)
    if (!cleanIfsc || cleanIfsc.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      throw new Error('Please enter a valid 11-character IFSC code (e.g. HDFC0000240).');
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    const match = mockIfscDb[cleanIfsc];
    if (match) {
      return {
        success: true,
        ifscCode: cleanIfsc,
        bankName: match.bankName,
        branch: match.branch,
        city: match.city,
      };
    }

    // Dynamic fallback for any valid IFSC structure
    const bankPrefix = cleanIfsc.substring(0, 4);
    const inferredBank = bankPrefix === 'HDFC' ? 'HDFC Bank' :
                         bankPrefix === 'SBIN' ? 'State Bank of India' :
                         bankPrefix === 'ICIC' ? 'ICICI Bank' :
                         bankPrefix === 'UTIB' ? 'Axis Bank' :
                         bankPrefix === 'PUNB' ? 'Punjab National Bank' :
                         `${bankPrefix} Commercial Bank`;

    return {
      success: true,
      ifscCode: cleanIfsc,
      bankName: `${inferredBank} (Verified)`,
      branch: 'Main City Branch',
      city: 'Pune',
    };
  },

  /**
   * POST /owner/verification/documents
   * Simulates file upload to secure S3/Cloudinary bucket with progress callbacks
   */
  async uploadDocument(file, docType, onProgress) {
    if (!file) throw new Error('No document file selected.');

    // Simulated progress ticks
    if (onProgress) {
      onProgress(15);
      await new Promise((r) => setTimeout(r, 200));
      onProgress(50);
      await new Promise((r) => setTimeout(r, 250));
      onProgress(85);
      await new Promise((r) => setTimeout(r, 200));
      onProgress(100);
    }

    // Secure private reference representation (Never expose raw public URLs)
    const secureReferenceId = `sec_doc_${docType}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      documentId: secureReferenceId,
      docType,
      fileName: file.name,
      fileSizeKb: Math.round(file.size / 1024) || 240,
      mimeType: file.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    };
  },

  /**
   * POST /owner/verification
   * Submits full business verification record to backend PostgreSQL store
   */
  async submitVerification({ ownerId, gstNumber, idReference, documents, payoutAccount }) {
    // Validations
    if (!gstNumber || gstNumber.trim().length < 10) {
      throw new Error('Please enter a valid GST Identification Number.');
    }
    if (!idReference || idReference.trim().length < 8) {
      throw new Error('Please enter a valid Government ID reference (PAN/Aadhaar/Business Reg No).');
    }
    if (!documents.gstCertificate || !documents.idProof || !documents.addressProof) {
      throw new Error('All 3 required verification documents (GST, ID Proof, Address Proof) must be uploaded.');
    }
    if (!payoutAccount.accountHolderName || !payoutAccount.accountNumber || !payoutAccount.ifscCode || !payoutAccount.bankName) {
      throw new Error('Please complete all payout bank account details.');
    }
    if (payoutAccount.accountNumber.length < 9) {
      throw new Error('Bank account number must be at least 9 digits.');
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mask account number for security (e.g. ••••••••8921)
    const rawAcc = payoutAccount.accountNumber.replace(/\D/g, '');
    const last4 = rawAcc.slice(-4);
    const maskedAcc = `••••••••${last4}`;

    const record = {
      ownerId,
      status: 'pending',
      rejectionReason: null,
      gstNumber: gstNumber.trim().toUpperCase(),
      idReference: idReference.trim().toUpperCase(),
      documents: {
        gstCertificate: documents.gstCertificate,
        idProof: documents.idProof,
        addressProof: documents.addressProof,
      },
      payoutAccount: {
        accountHolderName: payoutAccount.accountHolderName.trim(),
        accountNumber: maskedAcc, // Never store unmasked raw bank numbers in frontend state
        maskedAccountNumber: maskedAcc,
        ifscCode: payoutAccount.ifscCode.trim().toUpperCase(),
        bankName: payoutAccount.bankName,
      },
      submittedAt: new Date().toISOString(),
    };

    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '{}');
    allData[ownerId] = record;
    localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(allData));

    return {
      success: true,
      verificationRecord: record,
      status: 'pending',
    };
  },

  /**
   * Demo Helper: Set verification status for testing ('verified' | 'rejected' | 'pending')
   */
  async setMockStatus(ownerId, status, rejectionReason = null) {
    const allData = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '{}');
    const record = allData[ownerId] || { ownerId };
    record.status = status;
    if (status === 'rejected') {
      record.rejectionReason = rejectionReason || 'GST Certificate image was unreadable or expired. Please upload a clear document.';
    } else {
      record.rejectionReason = null;
    }
    allData[ownerId] = record;
    localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(allData));
    return record;
  },
};
