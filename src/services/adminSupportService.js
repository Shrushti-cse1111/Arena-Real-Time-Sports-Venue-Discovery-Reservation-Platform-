/**
 * ARENA — ADMIN SUPPORT TICKETS & DISPUTES SERVICE
 * Complete ticket lifecycle with messages thread, internal notes, priority, and status updates.
 * 
 * Endpoints:
 *   GET   /admin/support/tickets
 *   GET   /admin/support/tickets/:id
 *   POST  /admin/support/tickets/:id/reply
 *   PATCH /admin/support/tickets/:id/status
 *   PATCH /admin/support/tickets/:id/priority
 */

const STORAGE_KEY_SUPPORT = 'arena_admin_support_tickets_master';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

const INITIAL_SUPPORT_TICKETS = [
  {
    id: 'TKT-9401',
    user: { id: 'USR-1001', name: 'Rahul Mehta', email: 'rahul.mehta@example.com', phone: '+91 98221 44551', role: 'Player' },
    subject: 'Double charged for Synthetic Court 1 on 29 Sep',
    category: 'Payment & Refund',
    priority: 'high', // 'low' | 'medium' | 'high'
    status: 'Resolved', // 'Open' | 'In Progress' | 'Resolved' | 'Closed'
    createdAt: '29 Sep 2026, 18:20',
    relatedBookingId: 'BK-1081',
    amount: '₹650',
    messages: [
      { id: 'M-1', sender: 'Rahul Mehta', senderType: 'user', time: '29 Sep, 18:20', text: 'I was charged twice on UPI for my booking yesterday.' },
      { id: 'M-2', sender: 'Sarah Connor (Support Admin)', senderType: 'admin', time: '29 Sep, 19:10', text: 'Verified with Razorpay logs. Second transaction reversed and ₹650 credited to your Arena Wallet.' },
    ],
    internalNotes: ['Verified duplicate gateway charge id: pay_292810. Refund dispatched via NEFT batch.'],
  },
  {
    id: 'TKT-9402',
    user: { id: 'OWN-201', name: 'Rajesh Nair', email: 'partner@smashpoint.in', phone: '+91 98123 45678', role: 'Venue Owner' },
    subject: 'Weekly payout settlement delay for Court 2',
    category: 'Payout & Settlements',
    priority: 'medium',
    status: 'In Progress',
    createdAt: '30 Sep 2026, 09:40',
    relatedBookingId: null,
    amount: '₹48,500',
    messages: [
      { id: 'M-1', sender: 'Rajesh Nair', senderType: 'user', time: '30 Sep, 09:40', text: 'Our weekly payout for 22-28 Sep has not reached HDFC account.' },
      { id: 'M-2', sender: 'Finance Bot', senderType: 'system', time: '30 Sep, 09:41', text: 'NEFT batch currently in clearing with RBI gateway.' },
    ],
    internalNotes: ['Finance team confirming batch release with HDFC nodal desk.'],
  },
  {
    id: 'TKT-9403',
    user: { id: 'USR-1005', name: 'Sneha Rao', email: 'sneha.rao@example.com', phone: '+91 97651 88990', role: 'Player' },
    subject: 'Court was occupied by walk-in player during booked slot',
    category: 'Booking Conflict',
    priority: 'high',
    status: 'Open',
    createdAt: '29 Sep 2026, 20:30',
    relatedBookingId: 'BK-1077',
    amount: '₹700',
    messages: [
      { id: 'M-1', sender: 'Sneha Rao', senderType: 'user', time: '29 Sep, 20:30', text: 'Venue manager allowed local tournament walk-in team to play during my reserved 8 PM slot.' },
    ],
    internalNotes: ['Contacted owner Priya Malhotra to investigate desk attendance.'],
  },
  {
    id: 'TKT-9404',
    user: { id: 'USR-1007', name: 'Aditya Roy', email: 'aditya.roy@example.com', phone: '+91 99231 11223', role: 'Player' },
    subject: 'Referral reward credits not added after friend booking',
    category: 'Arena Wallet',
    priority: 'low',
    status: 'Resolved',
    createdAt: '29 Sep 2026, 14:10',
    relatedBookingId: null,
    amount: '₹150',
    messages: [
      { id: 'M-1', sender: 'Aditya Roy', senderType: 'user', time: '29 Sep, 14:10', text: 'Referred friend completed first box cricket booking but reward was not credited.' },
      { id: 'M-2', sender: 'Sarah Connor', senderType: 'admin', time: '29 Sep, 15:00', text: 'Referral confirmed. ₹150 promo wallet credit added.' },
    ],
    internalNotes: [],
  },
];

function recordAuditEntry(action, details = {}) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN_AUDIT) || '[]');
    const newEntry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104 (TLS 1.3)',
      userAgent: navigator.userAgent.slice(0, 60) + '...',
      ...details,
    };
    const updated = [newEntry, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_ADMIN_AUDIT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log security audit:', e);
  }
}

export const adminSupportService = {
  getStoredTickets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUPPORT);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_SUPPORT, JSON.stringify(INITIAL_SUPPORT_TICKETS));
        return INITIAL_SUPPORT_TICKETS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_SUPPORT_TICKETS;
    }
  },

  saveTickets(tickets) {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPORT, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save support tickets:', e);
    }
  },

  async getTickets({ search = '', status = 'all', priority = 'all' } = {}) {
    await new Promise((r) => setTimeout(r, 200));

    let list = this.getStoredTickets();

    if (status && status !== 'all') {
      list = list.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    if (priority && priority !== 'all') {
      list = list.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.user.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    const all = this.getStoredTickets();

    return {
      success: true,
      total: list.length,
      counts: {
        all: all.length,
        open: all.filter((t) => t.status === 'Open').length,
        inProgress: all.filter((t) => t.status === 'In Progress').length,
        resolved: all.filter((t) => t.status === 'Resolved').length,
        closed: all.filter((t) => t.status === 'Closed').length,
      },
      tickets: list,
    };
  },

  async getTicketDetails(ticketId) {
    await new Promise((r) => setTimeout(r, 150));
    const list = this.getStoredTickets();
    const ticket = list.find((t) => t.id === ticketId);
    if (!ticket) throw new Error(`Ticket "${ticketId}" not found.`);
    return { success: true, ticket };
  },

  async addReply(ticketId, replyText, adminName = 'Sarah Connor') {
    if (!replyText || replyText.trim().length < 2) throw new Error('Reply message is required.');

    await new Promise((r) => setTimeout(r, 300));
    const list = this.getStoredTickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found.');

    const newMsg = {
      id: `M-${Date.now()}`,
      sender: `${adminName} (Support Admin)`,
      senderType: 'admin',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: replyText.trim(),
    };

    list[index].messages.push(newMsg);
    if (list[index].status === 'Open') {
      list[index].status = 'In Progress';
    }

    this.saveTickets(list);
    return { success: true, ticket: list[index] };
  },

  async updateTicketStatus(ticketId, newStatus, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    await new Promise((r) => setTimeout(r, 250));
    const list = this.getStoredTickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found.');

    list[index].status = newStatus;
    this.saveTickets(list);

    recordAuditEntry('TICKET_STATUS_UPDATED', { ticketId, newStatus, adminId, adminName });
    return { success: true, ticket: list[index] };
  },

  async updateTicketPriority(ticketId, newPriority) {
    await new Promise((r) => setTimeout(r, 200));
    const list = this.getStoredTickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found.');

    list[index].priority = newPriority;
    this.saveTickets(list);
    return { success: true, ticket: list[index] };
  },

  async addInternalNote(ticketId, noteText) {
    if (!noteText || noteText.trim().length < 2) throw new Error('Note text is required.');
    const list = this.getStoredTickets();
    const index = list.findIndex((t) => t.id === ticketId);
    if (index === -1) throw new Error('Ticket not found.');

    if (!list[index].internalNotes) list[index].internalNotes = [];
    list[index].internalNotes.push(noteText.trim());
    this.saveTickets(list);
    return { success: true, ticket: list[index] };
  },
};
