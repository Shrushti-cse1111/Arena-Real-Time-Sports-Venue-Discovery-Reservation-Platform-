/**
 * ownerEarningsService.js
 * Simulates backend API for Arena Owner Earnings & Payouts:
 * - GET /owner/earnings/summary
 * - GET /owner/earnings/transactions
 * - GET /owner/payouts
 * - Server-side commission and net calculation (10% platform fee)
 * - Safe invoice document generation
 */

const PLATFORM_COMMISSION_PERCENT = 10; // Platform fee config (10%)

const MOCK_TRANSACTIONS = [
  {
    id: 'TXN-9021',
    date: '2026-10-01',
    time: '08:02 AM',
    bookingId: 'BK-1081',
    customer: 'Rahul Mehta',
    sport: 'Badminton',
    court: 'Court A',
    gross: 650,
    platformFee: 65,
    applicableDeductions: 0,
    net: 585,
    status: 'completed',
    invoiceNumber: 'INV-2026-9021',
    payoutBatchId: 'PAY-BATCH-401',
  },
  {
    id: 'TXN-9022',
    date: '2026-10-01',
    time: '10:05 AM',
    bookingId: 'BK-1082',
    customer: 'Priya Singh',
    sport: 'Tennis',
    court: 'Court B',
    gross: 1100,
    platformFee: 110,
    applicableDeductions: 0,
    net: 990,
    status: 'completed',
    invoiceNumber: 'INV-2026-9022',
    payoutBatchId: 'PAY-BATCH-401',
  },
  {
    id: 'TXN-9023',
    date: '2026-10-01',
    time: '01:00 PM',
    bookingId: 'BK-1084',
    customer: 'Sneha Patil',
    sport: 'Squash',
    court: 'Court C',
    gross: 750,
    platformFee: 0,
    applicableDeductions: 750,
    net: 0,
    status: 'refunded',
    refundReason: 'Customer cancellation within free window',
    invoiceNumber: 'INV-2026-9023-REF',
    payoutBatchId: null,
  },
  {
    id: 'TXN-9024',
    date: '2026-10-01',
    time: '03:30 PM',
    bookingId: 'BK-1085',
    customer: 'Vikram Joshi',
    sport: 'Tennis',
    court: 'Court B',
    gross: 1100,
    platformFee: 110,
    applicableDeductions: 0,
    net: 990,
    status: 'completed',
    invoiceNumber: 'INV-2026-9024',
    payoutBatchId: 'PAY-BATCH-402',
  },
  {
    id: 'TXN-9025',
    date: '2026-10-01',
    time: '05:15 PM',
    bookingId: 'BK-1086',
    customer: 'Ritu Sharma',
    sport: 'Badminton',
    court: 'Court A',
    gross: 650,
    platformFee: 65,
    applicableDeductions: 0,
    net: null, // DO NOT DISPLAY MISLEADING FINAL NET WHEN PROCESSING
    status: 'processing',
    invoiceNumber: 'INV-2026-9025-PENDING',
    payoutBatchId: null,
  },
  {
    id: 'TXN-9026',
    date: '2026-09-30',
    time: '07:10 PM',
    bookingId: 'BK-1070',
    customer: 'Siddharth Sen',
    sport: 'Cricket',
    court: 'Box Cricket',
    gross: 2400,
    platformFee: 240,
    applicableDeductions: 0,
    net: 2160,
    status: 'completed',
    invoiceNumber: 'INV-2026-9026',
    payoutBatchId: 'PAY-BATCH-401',
  },
  {
    id: 'TXN-9027',
    date: '2026-09-30',
    time: '09:20 AM',
    bookingId: 'BK-1068',
    customer: 'Naveen Kumar',
    sport: 'Badminton',
    court: 'Court A',
    gross: 650,
    platformFee: 0,
    applicableDeductions: 0,
    net: 0,
    status: 'failed',
    invoiceNumber: null,
    payoutBatchId: null,
  }
];

const MOCK_PAYOUTS = [
  {
    id: 'PO-771',
    date: 'Sep 25, 2026',
    amount: 28450,
    status: 'Completed',
    bankAccount: 'HDFC Bank ••••4182',
    utr: 'UTR_HDFC_992104882190',
  },
  {
    id: 'PO-770',
    date: 'Sep 18, 2026',
    amount: 32100,
    status: 'Completed',
    bankAccount: 'HDFC Bank ••••4182',
    utr: 'UTR_HDFC_991823901924',
  },
  {
    id: 'PO-769',
    date: 'Sep 11, 2026',
    amount: 24800,
    status: 'Completed',
    bankAccount: 'HDFC Bank ••••4182',
    utr: 'UTR_HDFC_991129983100',
  },
];

/**
 * GET /owner/earnings/summary
 */
export async function fetchEarningsSummary(venueId) {
  await new Promise((r) => setTimeout(r, 400));

  // Compute from backend ledger:
  const completedTxns = MOCK_TRANSACTIONS.filter((t) => t.status === 'completed');
  const totalEarned = completedTxns.reduce((acc, t) => acc + (t.net || 0), 0) + 85400; // includes previous periods
  const pendingPayout = completedTxns
    .filter((t) => t.payoutBatchId === 'PAY-BATCH-401' || t.payoutBatchId === 'PAY-BATCH-402')
    .reduce((acc, t) => acc + (t.net || 0), 0);

  return {
    success: true,
    data: {
      totalEarned,
      pendingPayout,
      currency: '₹',
      commissionRate: PLATFORM_COMMISSION_PERCENT,
      lastPayout: MOCK_PAYOUTS[0],
    }
  };
}

/**
 * GET /owner/earnings/transactions?page=&limit=
 */
export async function fetchEarningsTransactions({ page = 1, limit = 5 } = {}) {
  await new Promise((r) => setTimeout(r, 450));

  const total = MOCK_TRANSACTIONS.length;
  const startIndex = (page - 1) * limit;
  const items = MOCK_TRANSACTIONS.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    }
  };
}

/**
 * GET /owner/payouts
 */
export async function fetchPayoutsHistory(venueId) {
  await new Promise((r) => setTimeout(r, 350));
  return {
    success: true,
    data: MOCK_PAYOUTS,
  };
}

/**
 * Generates and triggers invoice receipt download
 */
export async function generateInvoiceDocument(txn) {
  // Simulate preparation delay
  await new Promise((r) => setTimeout(r, 1200));

  if (!txn || txn.status === 'failed') {
    throw new Error('Invoice cannot be generated for failed transactions.');
  }

  // Create clean invoice text file blob for client download
  const content = `
==================================================
              ARENA VENUE INVOICE
==================================================
Invoice Number:    ${txn.invoiceNumber || 'INV-' + txn.id}
Date & Time:       ${txn.date} ${txn.time}
Booking Reference: ${txn.bookingId}
Customer:          ${txn.customer}
Court & Sport:     ${txn.court} (${txn.sport})
Status:            ${txn.status.toUpperCase()}
--------------------------------------------------
Gross Booking:     ₹${txn.gross}
Platform Fee (10%): -₹${txn.platformFee}
Deductions/Refund: -₹${txn.applicableDeductions}
--------------------------------------------------
NET PAYOUT AMOUNT: ₹${txn.net !== null ? txn.net : 'PENDING'}
==================================================
Payment Security: Verified by Server Webhook
Razorpay Gateway Reference ID: rzp_sec_verified
Arena Venue Partner Network
==================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${txn.invoiceNumber || txn.id}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true };
}
