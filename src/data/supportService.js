/**
 * Arena Help & Support / Live Chat Service
 * Backend simulation for FAQs, Support Ticket lifecycle, and 24/7 Live Chat
 * with real-time agent updates, typing simulation, and booking context auto-association.
 */

// Comprehensive FAQ Database
const FAQ_DATABASE = [
  {
    id: 'faq-1',
    category: 'bookings',
    categoryLabel: 'Bookings & Rescheduling',
    question: 'How do I cancel or reschedule my turf booking?',
    answer: 'You can cancel or reschedule any upcoming booking up to 2 hours before the slot time directly from "My Bookings" -> "Booking Details". Cancellation fees depend on venue policies, and instant refunds are credited to your Arena Wallet.',
    tags: ['cancellation', 'reschedule', 'refund'],
    helpfulCount: 142,
  },
  {
    id: 'faq-2',
    category: 'bookings',
    categoryLabel: 'Bookings & Rescheduling',
    question: 'What is the slot locking period during checkout?',
    answer: 'When you select a slot, Arena holds and locks the slot exclusively for 10 minutes so no other player can double-book it while you complete your payment or split payment.',
    tags: ['slot lock', 'hold', 'timer'],
    helpfulCount: 98,
  },
  {
    id: 'faq-3',
    category: 'payments',
    categoryLabel: 'Payments & Refunds',
    question: 'How long does a refund take to reach my account?',
    answer: 'Arena Wallet refunds are 100% instant! Bank and UPI refunds take 24–48 business hours to reflect in your original payment source.',
    tags: ['refund time', 'instant', 'upi', 'wallet'],
    helpfulCount: 230,
  },
  {
    id: 'faq-4',
    category: 'payments',
    categoryLabel: 'Payments & Refunds',
    question: 'What happens if money is deducted but my booking failed?',
    answer: 'Don\'t worry! Payment gateway security auto-reconciles failed transactions within 15 minutes. The full amount will be credited to your Arena Wallet immediately or returned to your bank account.',
    tags: ['payment failure', 'deducted', 'auto refund'],
    helpfulCount: 310,
  },
  {
    id: 'faq-5',
    category: 'venues',
    categoryLabel: 'Venues & Amenities',
    question: 'Can I rent sports equipment (rackets, balls, bibs) at the venue?',
    answer: 'Yes! Most partner venues offer equipment rentals. You can add rackets, shuttles, balls, and team bibs directly during booking checkout under "Equipment & Add-ons".',
    tags: ['rackets', 'equipment', 'rentals', 'addons'],
    helpfulCount: 175,
  },
  {
    id: 'faq-6',
    category: 'venues',
    categoryLabel: 'Venues & Amenities',
    question: 'What footwear is allowed on Synthetic vs Acrylic courts?',
    answer: 'BWF synthetic badminton mats require Non-Marking rubber shoes. Acrylic tennis courts require standard tennis sneakers. Metal studs are strictly prohibited on FIFA Astro Turf football pitches.',
    tags: ['shoes', 'non-marking', 'footwear', 'turf rules'],
    helpfulCount: 215,
  },
  {
    id: 'faq-7',
    category: 'wallet',
    categoryLabel: 'Account & Wallet',
    question: 'How do I use my Arena Wallet balance during checkout?',
    answer: 'Your Arena Wallet balance is automatically applied as a 1-tap payment option during checkout. You can also combine wallet credits with UPI or cards.',
    tags: ['wallet balance', 'checkout', 'pay'],
    helpfulCount: 184,
  },
];

// Initial Support Tickets Store
let userSupportTickets = [];

// Live Chat Sessions Store
let liveChatSessions = {};


export const supportService = {
  /**
   * Search FAQs by keyword & category
   */
  getFAQs(category = 'all', searchQuery = '') {
    return FAQ_DATABASE.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  },

  /**
   * Vote on FAQ helpfulness
   */
  incrementFAQHelpful(faqId) {
    const faq = FAQ_DATABASE.find((f) => f.id === faqId);
    if (faq) {
      faq.helpfulCount += 1;
      return faq.helpfulCount;
    }
    return 0;
  },

  /**
   * Get tickets for current authenticated user
   */
  getUserTickets(userId = '') {
    return userSupportTickets.filter((t) => t.userId === userId);
  },

  /**
   * Create a new support ticket with server-side validation
   */
  createTicket(payload) {
    const { userId = 'user-1', userName = 'Player', userContact = '', category, subject, description, relatedBooking, priority = 'medium' } = payload;

    if (!category || !subject.trim() || !description.trim()) {
      return { success: false, error: 'Category, subject, and description are required.' };
    }

    const newTicket = {
      id: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      userName,
      userContact,
      category,
      subject: subject.trim(),
      description: description.trim(),
      relatedBooking: relatedBooking || null,
      priority,
      status: 'Open',
      createdAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: 'Today',
      responses: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          senderName: userName,
          message: description.trim(),
          timestamp: 'Just now',
        },
      ],
    };

    userSupportTickets = [newTicket, ...userSupportTickets];
    return { success: true, ticket: newTicket };
  },

  /**
   * Add a user reply to an existing ticket
   */
  addTicketReply(ticketId, userId = '', messageText) {
    const ticketIndex = userSupportTickets.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket not found.' };
    }

    const ticket = userSupportTickets[ticketIndex];
    if (ticket.userId && ticket.userId !== userId) {
      return { success: false, error: 'Unauthorized ticket access.' };
    }


    const newReply = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: ticket.userName,
      message: messageText.trim(),
      timestamp: 'Just now',
    };

    const updatedResponses = [...ticket.responses, newReply];
    userSupportTickets[ticketIndex] = {
      ...ticket,
      status: 'In Progress',
      updatedAt: 'Today',
      responses: updatedResponses,
    };

    return { success: true, responses: updatedResponses };
  },

  /**
   * Get or initialize live chat session for user
   */
  getLiveChat(userId = 'user-1', bookingContext = null) {
    if (!liveChatSessions[userId]) {
      liveChatSessions[userId] = {
        conversationId: `conv-${userId}`,
        userId,
        status: 'active',
        agent: {
          id: 'agent-101',
          name: 'Rohan Sharma',
          role: 'Arena Support Specialist',
          avatar: 'RS',
          status: 'online',
        },
        messages: [
          {
            id: 'cmsg-1',
            sender: 'agent',
            senderName: 'Rohan Sharma',
            text: '👋 Hello! Welcome to Arena 24/7 Live Support. How can I assist you with your turf bookings, refunds, or slots today?',
            timestamp: 'Just now',
            status: 'read',
          },
        ],
        subscribers: [],
      };
    }

    const session = liveChatSessions[userId];

    // Auto-inject booking context message if first time viewing with booking
    if (bookingContext && !session.messages.some((m) => m.bookingRef === bookingContext.bookingId)) {
      const contextMsg = {
        id: `cmsg-ctx-${Date.now()}`,
        sender: 'system',
        senderName: 'Booking Reference',
        text: `Attached Context: ${bookingContext.venueName} (${bookingContext.courtName || 'Court Slot'}) • ${bookingContext.dateFormatted || bookingContext.date} • ${bookingContext.bookingId || bookingContext.id}`,
        bookingRef: bookingContext.bookingId || bookingContext.id,
        timestamp: 'Just now',
        status: 'read',
      };
      session.messages.push(contextMsg);
    }

    return session;
  },

  /**
   * Send live chat message with simulated real-time agent typing & response
   */
  sendChatMessage(userId = 'user-1', text, bookingContext = null, onTypingStatusChange, onNewMessage) {
    const session = this.getLiveChat(userId, bookingContext);

    const userMsg = {
      id: `cmsg-${Date.now()}`,
      sender: 'user',
      senderName: 'Player',
      text: text.trim(),
      timestamp: 'Just now',
      status: 'sent',
    };

    session.messages.push(userMsg);
    if (onNewMessage) onNewMessage(userMsg);

    // Simulate agent delivery & typing after 1 second
    setTimeout(() => {
      userMsg.status = 'read';
      if (onTypingStatusChange) onTypingStatusChange(true);
    }, 1000);

    // Simulate intelligent context-aware agent response after 2.5 seconds
    setTimeout(() => {
      if (onTypingStatusChange) onTypingStatusChange(false);

      const q = text.toLowerCase();
      let replyText = 'I have received your query regarding your turf reservation. Our support team is verifying the details and will ensure complete resolution!';

      if (q.includes('refund') || q.includes('money') || q.includes('wallet')) {
        replyText = 'I checked your refund log! Arena Wallet refunds are processed instantly (Ref: ARN-RFND-98210). For bank UPI refunds, please allow 24–48 hours for your bank settlement.';
      } else if (q.includes('cancel') || q.includes('reschedule')) {
        replyText = 'You can cancel or reschedule any booking up to 2 hours before your slot starts from "My Bookings" screen. Would you like me to guide you through it?';
      } else if (q.includes('equipment') || q.includes('racket') || q.includes('shoes')) {
        replyText = 'Equipment rentals (rackets, shuttles, footballs, bibs) are available directly at venue reception! Non-marking shoes are required for indoor synthetic mats.';
      } else if (bookingContext) {
        replyText = `I see your message regarding booking ${bookingContext.bookingId || '#ARN-2026'} at ${bookingContext.venueName || 'the venue'}. I have flagged this directly with the turf manager!`;
      }

      const agentMsg = {
        id: `cmsg-agent-${Date.now()}`,
        sender: 'agent',
        senderName: session.agent.name,
        text: replyText,
        timestamp: 'Just now',
        status: 'read',
      };

      session.messages.push(agentMsg);
      if (onNewMessage) onNewMessage(agentMsg);
    }, 2800);

    return userMsg;
  },
};
