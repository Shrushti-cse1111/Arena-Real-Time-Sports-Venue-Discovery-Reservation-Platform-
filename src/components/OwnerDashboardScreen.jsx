import React, { useState, useEffect, useCallback } from "react";
import {
  Building2, CheckCircle2, Circle, TrendingUp, TrendingDown,
  Calendar, DollarSign, Users, XCircle, ChevronRight,
  Star, ArrowRight, Wifi, RefreshCw, PlusCircle, Ban,
  CalendarDays, X, Zap, RotateCcw, Clock, MapPin,
  MessageSquare, Tag, BarChart3, Bell, Settings
} from "lucide-react";
import {
  fetchDashboardSummary,
  fetchTodaySchedule,
  fetchUpcomingDaysSchedule,
  subscribeToDashboardEvents,
  addWalkInBooking,
  blockSlotMaintenance,
  clearScheduleForTesting,
  resetScheduleToDefault,
  triggerRealtimeBooking,
  formatRevenue,
  getStatusMeta,
} from "../services/ownerDashboardService";
import { ownerNotificationService } from "../services/ownerNotificationService";
import OwnerBottomNav from "./OwnerBottomNav";

/* ── Skeleton loaders ────────────────────────────────────────── */
function SkeletonBox({ w = "100%", h = 16, radius = 6 }) {
  return (
    <div
      className="owner-skeleton"
      style={{ width: w, height: h, borderRadius: radius }}
    />
  );
}

function StatsSkeletonGrid() {
  return (
    <div className="owner-stats-grid">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="stat-card">
          <SkeletonBox w="60%" h={11} />
          <SkeletonBox w="45%" h={26} radius={4} />
          <SkeletonBox w="55%" h={11} />
        </div>
      ))}
    </div>
  );
}

function ScheduleSkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #F1F5F9" }}>
          <SkeletonBox w="52px" h={13} />
          <SkeletonBox w="52px" h={13} />
          <SkeletonBox w="80px" h={13} />
          <div style={{ marginLeft: "auto" }}><SkeletonBox w="62px" h={20} radius={20} /></div>
        </div>
      ))}
    </div>
  );
}

/* ── Live toast notification ─────────────────────────────────── */
function LiveToast({ message, visible, onDismiss }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#0F172A",
        color: "#38BDF8",
        fontSize: "0.75rem",
        fontWeight: 700,
        padding: "0.55rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.45rem",
        transform: visible ? "translateY(0)" : "translateY(-60px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
        <Wifi size={13} />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* ── Single stat card ────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, iconColor, delta, deltaLabel, isNew }) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isNeutral = delta === 0 || delta === undefined;
  const DeltaIcon = isPositive ? TrendingUp : TrendingDown;
  const displayVal = value !== null && value !== undefined && value !== "" ? value : "0";

  return (
    <div className={`stat-card${isNew ? " stat-card--new" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="stat-label">{label}</span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={14} color={iconColor || "#64748B"} />
          </div>
        )}
      </div>
      <span className="stat-val" style={{ fontSize: "1.45rem", fontWeight: 800 }}>{displayVal}</span>
      {delta !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {!isNeutral && <DeltaIcon size={11} color={isPositive ? "#10B981" : "#EF4444"} />}
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: isNeutral ? "#64748B" : isPositive ? "#10B981" : "#EF4444",
            }}
          >
            {isNeutral ? "0%" : `${isPositive ? "+" : ""}${delta}%`} {deltaLabel}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Status badge ────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: meta.bg,
        color: meta.color,
        fontSize: "0.6875rem",
        fontWeight: 700,
        padding: "0.2rem 0.5rem",
        borderRadius: 9999,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, display: "inline-block" }} />
      {meta.label}
    </span>
  );
}

/* ── Today's schedule table with empty state ─────────────────── */
function ScheduleTable({ rows, isNew, onAddWalkIn, onViewUpcoming }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          background: "#F8FAFC",
          padding: "2rem 1.25rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#EFF6FF",
            color: "#2563EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "0.75rem",
          }}
        >
          <Calendar size={22} />
        </div>
        <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#1E293B", marginBottom: "0.25rem" }}>
          No bookings yet today
        </div>
        <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0, marginBottom: "1rem", maxWidth: 260 }}>
          Bookings will appear here as players reserve slots. You can also manually add walk-in bookings.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onAddWalkIn}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <PlusCircle size={14} />
            <span>Add Walk-in Booking</span>
          </button>
          <button
            type="button"
            onClick={onViewUpcoming}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              background: "#FFFFFF",
              color: "#334155",
              border: "1px solid #CBD5E1",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <CalendarDays size={14} />
            <span>View Upcoming Days</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table className="owner-schedule-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Court</th>
            <th>Customer</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id} className={isNew && idx === rows.length - 1 ? "schedule-row--new" : ""}>
              <td style={{ fontWeight: 700, whiteSpace: "nowrap", color: "#0F172A" }}>{row.time}</td>
              <td style={{ color: "#475569", whiteSpace: "nowrap" }}>{row.court}</td>
              <td style={{ color: "#334155" }}>{row.customer}</td>
              <td><StatusBadge status={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Walk-In Booking Modal ───────────────────────────────────── */
function WalkInModal({ isOpen, onClose, onBookingAdded }) {
  const [customer, setCustomer] = useState("");
  const [court, setCourt] = useState("Court A");
  const [sport, setSport] = useState("Badminton");
  const [time, setTime] = useState("4:00 PM");
  const [duration, setDuration] = useState("1 hr");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = addWalkInBooking({
      customer: customer.trim() || "Walk-in Guest",
      court,
      sport,
      time,
      duration,
    });
    onBookingAdded(res.booking);
    onClose();
  };

  return (
    <div className="owner-modal-backdrop" onClick={onClose}>
      <div className="owner-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="owner-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PlusCircle size={16} />
            </div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>
              Add Walk-in Booking
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="owner-modal-body">
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                Customer Name / Phone
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box" }}
                required
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Court
                </label>
                <select
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
                >
                  <option value="Court A">Court A</option>
                  <option value="Court B">Court B</option>
                  <option value="Court C">Court C</option>
                  <option value="Box Cricket">Box Cricket</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Sport
                </label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
                >
                  <option value="Badminton">Badminton</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Squash">Squash</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Start Time
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
                >
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
                >
                  <option value="1 hr">1 hr</option>
                  <option value="1.5 hrs">1.5 hrs</option>
                  <option value="2 hrs">2 hrs</option>
                </select>
              </div>
            </div>
          </div>
          <div className="owner-modal-footer">
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "0.5rem 0.85rem", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFF", color: "#475569", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#2563EB", color: "#FFF", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Block Slot Modal ────────────────────────────────────────── */
function BlockSlotModal({ isOpen, onClose, onSlotBlocked }) {
  const [court, setCourt] = useState("Court A");
  const [time, setTime] = useState("2:00 PM");
  const [reason, setReason] = useState("Court Maintenance");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = blockSlotMaintenance({ court, time, reason });
    onSlotBlocked(res.booking);
    onClose();
  };

  return (
    <div className="owner-modal-backdrop" onClick={onClose}>
      <div className="owner-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="owner-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ban size={16} />
            </div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>
              Block Slot / Maintenance
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="owner-modal-body">
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                Court to Block
              </label>
              <select
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
              >
                <option value="Court A">Court A</option>
                <option value="Court B">Court B</option>
                <option value="Court C">Court C</option>
                <option value="All Courts">All Courts</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                Time Slot
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
              >
                <option value="1:00 PM">1:00 PM - 2:00 PM</option>
                <option value="2:00 PM">2:00 PM - 3:00 PM</option>
                <option value="3:00 PM">3:00 PM - 4:00 PM</option>
                <option value="All Day">All Day Closure</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                Maintenance Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.5rem", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "0.8125rem", boxSizing: "border-box", background: "#FFF" }}
              >
                <option value="Court Floor Cleaning">Court Floor Cleaning</option>
                <option value="Lighting Repair">Lighting Repair</option>
                <option value="Net & Post Setup">Net & Post Setup</option>
                <option value="Private Booking Hold">Private Booking Hold</option>
                <option value="Weather / Rain">Weather / Rain Interruption</option>
              </select>
            </div>
          </div>
          <div className="owner-modal-footer">
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "0.5rem 0.85rem", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFF", color: "#475569", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#DC2626", color: "#FFF", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
            >
              Confirm Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Full Calendar / Upcoming Days Modal ──────────────────────── */
function CalendarModal({ isOpen, onClose }) {
  const [upcoming, setUpcoming] = useState([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchUpcomingDaysSchedule().then((res) => {
        if (res.success) setUpcoming(res.data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDayData = upcoming[selectedDayIdx];

  return (
    <div className="owner-modal-backdrop" onClick={onClose}>
      <div className="owner-modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="owner-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#F0FDF4", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarDays size={16} />
            </div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>
              Upcoming Schedule Calendar
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <div className="owner-modal-body" style={{ padding: "1rem" }}>
          {/* Day selection tabs */}
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #E2E8F0", paddingBottom: "0.75rem" }}>
            {upcoming.map((day, idx) => (
              <button
                key={day.day}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                style={{
                  flex: 1,
                  padding: "0.45rem 0.5rem",
                  borderRadius: 8,
                  border: selectedDayIdx === idx ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                  background: selectedDayIdx === idx ? "#EFF6FF" : "#F8FAFC",
                  color: selectedDayIdx === idx ? "#1D4ED8" : "#475569",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {day.date}
              </button>
            ))}
          </div>

          {/* Bookings for the day */}
          {currentDayData && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
                {currentDayData.bookings.length} upcoming reservations
              </div>
              {currentDayData.bookings.map((bk) => (
                <div
                  key={bk.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A" }}>
                      {bk.time} • {bk.court}
                    </div>
                    <div style={{ fontSize: "0.71875rem", color: "#64748B" }}>
                      {bk.customer} ({bk.sport})
                    </div>
                  </div>
                  <StatusBadge status={bk.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="owner-modal-footer">
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#2563EB", color: "#FFF", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function OwnerDashboardScreen({
  ownerData = {},
  venues = [],
  createdVenue = null,
  onResetFlow = () => {},
  onNavigateVerification = () => {},
  onNavigateVenueCreation = () => {},
  onNavigatePricingConfig = () => {},
  onNavigateBookings = () => {},
  onNavigateAvailability = () => {},
  onNavigateEarnings = () => {},
  onNavigateReviews = () => {},
  onNavigateCoupons = () => {},
  onNavigateAnalytics = () => {},
  onNavigateVenues = () => {},
  onNavigateStaff = () => {},
  onNavigateNotifications = () => {},
  onNavigateProfile = () => {},
}) {
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [newStatKey, setNewStatKey] = useState(null);
  const [newRowFlag, setNewRowFlag] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const vId = createdVenue?.id || ownerData.venueId || 'venue-101';
    setUnreadNotifs(ownerNotificationService.getUnreadCount(vId));
  }, [createdVenue, ownerData.venueId]);

  // Modal states
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isBlockSlotModalOpen, setIsBlockSlotModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const dismissToast = useCallback(() => setToast({ visible: false, message: "" }), []);
  const showToast = useCallback((msg) => setToast({ visible: true, message: msg }), []);

  // ── Initial data fetch ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchDashboardSummary().then((res) => {
      if (mounted && res.success) {
        setSummary(res.data);
        setSummaryLoading(false);
      }
    });
    fetchTodaySchedule().then((res) => {
      if (mounted && res.success) {
        setSchedule(res.data);
        setScheduleLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // ── Real-time subscription ───────────────────────────────────
  useEffect(() => {
    setIsConnected(true);
    const unsub = subscribeToDashboardEvents((event, payload) => {
      if (event === "NEW_BOOKING") {
        setSummary(payload.summary);
        setSchedule((prev) => {
          const exists = prev.some((b) => b.id === payload.booking.id);
          if (exists) return prev;
          return [...prev, payload.booking];
        });
        setNewRowFlag(true);
        setNewStatKey("bookings");
        showToast(`🟢 New booking — ${payload.booking.customer}, ${payload.booking.court} at ${payload.booking.time}`);
        setTimeout(() => {
          setNewRowFlag(false);
          setNewStatKey(null);
        }, 3000);
      } else if (event === "BOOKING_CANCELLED") {
        setSummary(payload.summary);
        setSchedule(payload.schedule);
        setNewStatKey("cancellations");
        showToast("🔴 Booking cancelled — counter updated");
        setTimeout(() => setNewStatKey(null), 3000);
      } else if (event === "SCHEDULE_CLEARED") {
        setSummary(payload.summary);
        setSchedule([]);
        showToast("ℹ️ Schedule cleared for zero-state verification");
      } else if (event === "SCHEDULE_RESET") {
        setSummary(payload.summary);
        setSchedule(payload.schedule);
        showToast("🔄 Schedule restored to default live data");
      }
    });
    return () => {
      unsub();
      setIsConnected(false);
    };
  }, [showToast]);

  // Handlers for manual testing
  const handleTriggerSimulatedBooking = () => {
    const res = triggerRealtimeBooking();
    showToast(`⚡ Real-time booking arrived: ${res.booking.customer} (${res.booking.court})`);
  };

  const handleTestZeroState = () => {
    clearScheduleForTesting();
  };

  const handleResetData = () => {
    resetScheduleToDefault();
  };

  // ── Derived venue info ───────────────────────────────────────
  const currentVenue =
    createdVenue ||
    venues.find(
      (v) =>
        (ownerData.venueId && v.id === ownerData.venueId) ||
        (v.name && ownerData.venueName && v.name.toLowerCase().includes(ownerData.venueName.toLowerCase()))
    ) ||
    null;

  const venueTitle = currentVenue?.name || ownerData.venueName || "Registered Sports Venue";
  const location = currentVenue?.address || currentVenue?.location || ownerData.venueLocation || "Pune, Maharashtra";
  const sport = currentVenue?.sports ? currentVenue.sports.join(", ") : ownerData.primarySport || "Multi-sport";
  const hasCreatedVenue = Boolean(currentVenue);

  // ── Venue reviews ────────────────────────────────────────────
  const ratingVal = currentVenue?.rating || 0;
  const totalReviews = currentVenue?.reviewsCount || (currentVenue?.reviews ? currentVenue.reviews.length : 0);
  const reviews = currentVenue?.reviews || [];

  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
      {/* ── Live toast ── */}
      <LiveToast message={toast.message} visible={toast.visible} onDismiss={dismissToast} />

      {/* ── Modals ── */}
      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onBookingAdded={(bk) => showToast(`Walk-in added: ${bk.customer} on ${bk.court}`)}
      />
      <BlockSlotModal
        isOpen={isBlockSlotModalOpen}
        onClose={() => setIsBlockSlotModalOpen(false)}
        onSlotBlocked={(bk) => showToast(`Blocked slot on ${bk.court} at ${bk.time}`)}
      />
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* ── Registration success banner ── */}
      <div style={{ background: "#ECFDF5", padding: "0.55rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #A7F3D0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78125rem", color: "#065F46", fontWeight: 600 }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>Venue Partner registered!</span>
        </div>
        <button onClick={onResetFlow} style={{ background: "none", border: "none", color: "#047857", fontSize: "0.71875rem", fontWeight: 700, cursor: "pointer" }}>
          Restart Flow
        </button>
      </div>

      {/* ── Header ── */}
      <div style={{ background: "#102A43", color: "#FFFFFF", padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Owner Portal
            </span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.15rem 0 0 0", color: "#FFFFFF" }}>
              {venueTitle}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onNavigateVenues}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
                fontSize: "0.6875rem",
                fontWeight: 700,
                padding: "0.22rem 0.55rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Building2 size={12} />
              <span>Switch Venue</span>
            </button>
            <button
              type="button"
              onClick={onNavigateNotifications}
              aria-label="Owner Notifications"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
                padding: "0.22rem 0.45rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Bell size={14} />
              {unreadNotifs > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#EF4444",
                    color: "#FFFFFF",
                    fontSize: "0.5625rem",
                    fontWeight: 800,
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid #102A43",
                  }}
                >
                  {unreadNotifs}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onNavigateProfile}
              aria-label="Owner Settings"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
                padding: "0.22rem 0.45rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={14} />
            </button>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.6875rem",
                fontWeight: 700,
                padding: "0.2rem 0.55rem",
                borderRadius: 9999,
                background: isConnected ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                color: isConnected ? "#34D399" : "#F87171",
                border: `1px solid ${isConnected ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"}`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isConnected ? "#34D399" : "#F87171", display: "inline-block" }} />
              {isConnected ? "Live Socket" : "Offline"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", fontSize: "0.75rem", color: "#CBD5E1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <MapPin size={13} color="#94A3B8" />
            <span>{location}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Building2 size={13} color="#94A3B8" />
            <span>{sport}</span>
          </div>
        </div>
      </div>

      {/* ── Content container ── */}
      <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
        
        {/* ── 1. Top stats (2x2 grid) ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="section-title-row" style={{ marginBottom: "0.65rem" }}>
            <span className="section-h3">Today&apos;s Performance</span>
            <button
              type="button"
              onClick={onNavigateEarnings}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: "0.71875rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.15rem",
                padding: 0
              }}
            >
              <span>Earnings</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {summaryLoading ? (
            <StatsSkeletonGrid />
          ) : (
            <div className="owner-stats-grid">
              <StatCard
                label="Today's Bookings"
                value={summary?.todayBookings ?? 0}
                icon={Calendar}
                iconColor="#3B82F6"
                delta={summary?.bookingDelta ?? 0}
                deltaLabel="vs yesterday"
                isNew={newStatKey === "bookings"}
              />
              <StatCard
                label="Revenue Today"
                value={formatRevenue(summary?.todayRevenue ?? 0)}
                icon={DollarSign}
                iconColor="#10B981"
                delta={summary?.revenueDelta ?? 0}
                deltaLabel="vs yesterday"
              />
              <StatCard
                label="Occupancy"
                value={`${summary?.occupancyRate ?? 0}%`}
                icon={Users}
                iconColor="#8B5CF6"
                delta={summary?.occupancyDelta ?? 0}
                deltaLabel="vs yesterday"
              />
              <StatCard
                label="Cancellations"
                value={summary?.cancellations ?? 0}
                icon={XCircle}
                iconColor="#EF4444"
                delta={summary?.cancellationDelta ?? 0}
                deltaLabel="vs yesterday"
                isNew={newStatKey === "cancellations"}
              />
            </div>
          )}
        </div>

        {/* ── 2. Today's schedule ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="section-title-row" style={{ marginBottom: "0.65rem" }}>
            <span className="section-h3">Today&apos;s Schedule</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {!scheduleLoading && (
                <span style={{ fontSize: "0.71875rem", color: "#64748B", fontWeight: 600 }}>
                  {schedule.length} booking{schedule.length !== 1 ? "s" : ""}
                </span>
              )}
              <button
                type="button"
                onClick={onNavigateBookings}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563EB",
                  fontSize: "0.71875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.15rem",
                  padding: 0
                }}
              >
                <span>Manage All</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            {scheduleLoading ? (
              <div style={{ padding: "1rem" }}>
                <ScheduleSkeletonRows />
              </div>
            ) : (
              <ScheduleTable
                rows={schedule}
                isNew={newRowFlag}
                onAddWalkIn={() => setIsWalkInModalOpen(true)}
                onViewUpcoming={onNavigateAvailability}
              />
            )}
          </div>
        </div>

        {/* ── 3. Bottom Quick Actions ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="section-title-row" style={{ marginBottom: "0.65rem" }}>
            <span className="section-h3">Quick Actions</span>
            <span style={{ fontSize: "0.71875rem", color: "#64748B", fontWeight: 600 }}>Operations</span>
          </div>
          <div className="owner-quick-actions-bar" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={() => setIsWalkInModalOpen(true)}
            >
              <div className="owner-quick-action-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                <PlusCircle size={18} />
              </div>
              <span>Walk-in</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateAnalytics}
            >
              <div className="owner-quick-action-icon" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                <BarChart3 size={18} />
              </div>
              <span>Analytics</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateVenues}
            >
              <div className="owner-quick-action-icon" style={{ background: "#ECFEFF", color: "#0891B2" }}>
                <Building2 size={18} />
              </div>
              <span>Venues</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateAvailability}
            >
              <div className="owner-quick-action-icon" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                <CalendarDays size={18} />
              </div>
              <span>Calendar</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateBookings}
            >
              <div className="owner-quick-action-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                <Calendar size={18} />
              </div>
              <span>Bookings</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateStaff}
            >
              <div className="owner-quick-action-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                <Users size={18} />
              </div>
              <span>Staff</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateReviews}
            >
              <div className="owner-quick-action-icon" style={{ background: "#FFFBEB", color: "#F59E0B" }}>
                <MessageSquare size={18} />
              </div>
              <span>Reviews</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateCoupons}
            >
              <div className="owner-quick-action-icon" style={{ background: "#FDF2F8", color: "#DB2777" }}>
                <Tag size={18} />
              </div>
              <span>Promos</span>
            </button>
            <button
              type="button"
              className="owner-quick-action-btn"
              onClick={onNavigateEarnings}
            >
              <div className="owner-quick-action-icon" style={{ background: "#F0FDF4", color: "#059669" }}>
                <DollarSign size={18} />
              </div>
              <span>Payouts</span>
            </button>
          </div>
        </div>

        {/* ── Interactive Edge Case & Real-time Simulation Toolbar ── */}
        <div style={{ background: "#F1F5F9", borderRadius: 10, padding: "0.65rem 0.85rem", marginBottom: "1.25rem", border: "1px dashed #CBD5E1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.45rem" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Testing & Simulation Controls
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleTriggerSimulatedBooking}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.3rem 0.55rem",
                borderRadius: 6,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "#1E293B",
                cursor: "pointer",
              }}
            >
              <Zap size={12} color="#EAB308" />
              <span>Simulate Real-time Booking</span>
            </button>
            <button
              type="button"
              onClick={handleTestZeroState}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.3rem 0.55rem",
                borderRadius: 6,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              <XCircle size={12} color="#94A3B8" />
              <span>Test Zero State</span>
            </button>
            <button
              type="button"
              onClick={handleResetData}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.3rem 0.55rem",
                borderRadius: 6,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "#2563EB",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={12} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        {/* ── 4. Venue listing card (if venue created) ── */}
        {hasCreatedVenue && (
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "1rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
              <span style={{ fontSize: "0.84375rem", fontWeight: 800, color: "#0F172A" }}>Active Venue Listing</span>
              <span style={{ fontSize: "0.6875rem", background: "#ECFDF5", color: "#059669", padding: "0.15rem 0.5rem", borderRadius: 9999, fontWeight: 700 }}>
                ● Published &amp; Live
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#334155", marginBottom: "0.4rem" }}>
              <strong>Address:</strong> {currentVenue.address || currentVenue.location}
            </div>
            {currentVenue.latitude && currentVenue.longitude && (
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "0.65rem" }}>
                📍 {currentVenue.latitude}, {currentVenue.longitude}
              </div>
            )}
            {currentVenue.photos && currentVenue.photos.length > 0 && (
              <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", marginBottom: "0.75rem" }}>
                {currentVenue.photos.slice(0, 4).map((imgUrl, i) => (
                  <img key={i} src={imgUrl} alt="Venue thumbnail" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #CBD5E1", flexShrink: 0 }} />
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={onNavigateVenueCreation} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, border: "1px solid #2563EB", background: "#EFF6FF", color: "#1D4ED8", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                Edit Venue Listing
              </button>
              <button type="button" onClick={onNavigatePricingConfig} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, border: "none", background: "#2563EB", color: "#FFFFFF", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                Manage Slot Pricing
              </button>
            </div>
          </div>
        )}

        {/* ── 5. Onboarding checklist ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="section-title-row" style={{ marginBottom: "0.65rem" }}>
            <span className="section-h3">Venue Onboarding Checklist</span>
            <span style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 700 }}>
              {hasCreatedVenue ? "Complete ✓" : "Step 3 of 5"}
            </span>
          </div>
          <div className="checklist-card">
            <div className="checklist-item">
              <div className="check-dot done"><CheckCircle2 size={14} /></div>
              <div style={{ flex: 1 }}>
                <span>Account Registration</span>
                <div style={{ fontSize: "0.71875rem", color: "#64748B" }}>Owner details provided</div>
              </div>
            </div>
            <div className="checklist-item">
              <div className="check-dot done"><CheckCircle2 size={14} /></div>
              <div style={{ flex: 1 }}>
                <span>Phone &amp; Email Verified</span>
                <div style={{ fontSize: "0.71875rem", color: "#64748B" }}>OTP verification complete</div>
              </div>
            </div>
            <div className="checklist-item" onClick={onNavigateVenueCreation}
              style={{ background: "#EFF6FF", borderRadius: 8, padding: "0.6rem 0.5rem", border: "1px solid #BFDBFE", cursor: "pointer" }}>
              <div className="check-dot" style={{ background: hasCreatedVenue ? "#059669" : "#2563EB", color: "#FFF" }}>
                {hasCreatedVenue ? <CheckCircle2 size={14} /> : <Circle size={10} fill="#FFF" />}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: "#1E40AF" }}>Venue Listing &amp; Photo Setup</span>
                <div style={{ fontSize: "0.71875rem", color: "#1E3A8A" }}>
                  {hasCreatedVenue ? "Listing details & 3+ photos added" : "Name, sports chips, address & 3+ photos"}
                </div>
              </div>
              <ChevronRight size={16} color="#2563EB" />
            </div>
            <div className="checklist-item" onClick={onNavigatePricingConfig}
              style={{ background: "#F8FAFC", borderRadius: 8, padding: "0.6rem 0.5rem", border: "1px solid #E2E8F0", cursor: "pointer" }}>
              <div className="check-dot" style={{ background: hasCreatedVenue ? "#2563EB" : "#94A3B8", color: "#FFF" }}>
                <Circle size={10} fill="#FFF" />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>Operating Hours &amp; Pricing Rules</span>
                <div style={{ fontSize: "0.71875rem", color: "#64748B" }}>Set off-peak &amp; peak rates per court</div>
              </div>
              <ChevronRight size={16} color="#475569" />
            </div>
          </div>
        </div>

        {/* ── 6. Player reviews section ── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="section-title-row" style={{ marginBottom: "0.65rem" }}>
            <span className="section-h3">Player Reviews &amp; Ratings</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: totalReviews > 0 ? "#B45309" : "#475569", background: totalReviews > 0 ? "#FEF3C7" : "#F1F5F9", padding: "0.15rem 0.5rem", borderRadius: 9999, fontWeight: 700 }}>
                {totalReviews > 0 ? `★ ${ratingVal} (${totalReviews})` : "New Venue"}
              </span>
              <button
                type="button"
                onClick={onNavigateReviews}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563EB",
                  fontSize: "0.71875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.15rem",
                  padding: 0
                }}
              >
                <span>Manage</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "0.85rem 1rem", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Star size={20} color={totalReviews > 0 ? "#F59E0B" : "#94A3B8"} />
                <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A" }}>{totalReviews > 0 ? ratingVal : "0.0"}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: "0.6875rem", color: "#64748B", marginTop: "0.15rem" }}>
                Based on {totalReviews} verified {totalReviews === 1 ? "match" : "matches"}
              </div>
            </div>
            <span style={{ fontSize: "0.6875rem", color: totalReviews > 0 ? "#059669" : "#64748B", background: totalReviews > 0 ? "#ECFDF5" : "#F1F5F9", padding: "0.2rem 0.5rem", borderRadius: 9999, fontWeight: 700 }}>
              {totalReviews > 0 ? `${Math.round((ratingVal / 5) * 100)}% Satisfied` : "New Venue"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {reviews.length > 0 ? (
              reviews.slice(0, 4).map((rev) => (
                <div key={rev.id} className="review-card-item">
                  <div className="review-header-row">
                    <div className="review-avatar-circle"><span>{(rev.author || "P").charAt(0)}</span></div>
                    <div className="review-meta-col">
                      <div className="review-author-line">
                        <span className="review-author-name">{rev.author}</span>
                        {rev.sport && <span className="review-sport-tag">{rev.sport}</span>}
                      </div>
                      <span className="review-date-text">{rev.courtName ? `${rev.courtName} • ` : ""}{rev.date}</span>
                    </div>
                    <div className="review-rating-pill">
                      <Star size={11} className="star-filled" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  {rev.tags && rev.tags.length > 0 && (
                    <div className="review-tags-mini-row">
                      {rev.tags.map((tag) => <span key={tag} className="review-mini-tag">{tag}</span>)}
                    </div>
                  )}
                  <p className="review-comment-body" style={{ margin: 0, marginTop: "0.35rem" }}>&quot;{rev.comment}&quot;</p>
                </div>
              ))
            ) : (
              <div className="review-card-item">
                <p className="review-comment-body" style={{ margin: 0, color: "#64748B" }}>
                  No player reviews received yet for this venue.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main CTA ── */}
        <div style={{ paddingBottom: "1.5rem" }}>
          <button type="button" onClick={onNavigateVenueCreation} className="btn-primary">
            <span>{hasCreatedVenue ? "Edit Venue Details" : "Start Venue Setup"}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Owner Bottom Navigation Bar */}
      <OwnerBottomNav
        activeTab="dashboard"
        onNavigate={(tab) => {
          if (tab === 'bookings') onNavigateBookings();
          else if (tab === 'analytics') onNavigateAnalytics();
          else if (tab === 'availability') onNavigateAvailability();
          else if (tab === 'venues') onNavigateVenues();
          else if (tab === 'earnings') onNavigateEarnings();
          else if (tab === 'reviews') onNavigateReviews();
          else if (tab === 'promotions') onNavigateCoupons();
          else if (tab === 'staff') onNavigateStaff();
        }}
      />
    </div>
  );
}
