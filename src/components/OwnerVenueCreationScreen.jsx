import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Upload,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Sparkles,
  ChevronLeft,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { ownerVenueService } from '../services/ownerVenueService';

const AVAILABLE_SPORTS = [
  'Cricket',
  'Badminton',
  'Football',
  'Basketball',
  'Tennis',
  'Other',
];

const PRESET_AMENITIES = [
  'Parking',
  'Floodlights',
  'Lockers',
  'Changing Rooms',
  'Drinking Water',
  'Restrooms',
  'Equipment Rental',
  'WiFi',
  'First Aid',
  'Cafe / Refreshments',
];

const PRESET_LOCATIONS = [
  { label: 'Pune City Center', lat: 18.5204, lng: 73.8567, address: 'FC Road, Shivaji Nagar, Pune, Maharashtra 411005' },
  { label: 'Baner Sports Hub', lat: 18.559, lng: 73.7868, address: 'Main Baner Road, Near DMart, Baner, Pune, Maharashtra 411045' },
  { label: 'Koregaon Park Turf', lat: 18.5362, lng: 73.894, address: 'Lane 6, Koregaon Park, Pune, Maharashtra 411001' },
  { label: 'Kothrud Arena', lat: 18.5074, lng: 73.8077, address: 'Paud Road, Kothrud, Pune, Maharashtra 411038' },
];

export default function OwnerVenueCreationScreen({
  ownerData = {},
  onVenueCreated = () => {},
  onBack = () => {},
}) {
  // Form State
  const [venueName, setVenueName] = useState(ownerData.venueName || '');
  const [selectedSports, setSelectedSports] = useState(
    ownerData.primarySport ? [ownerData.primarySport] : ['Badminton']
  );
  const [customSportInput, setCustomSportInput] = useState('');
  const [showAddSportDropdown, setShowAddSportDropdown] = useState(false);

  const [address, setAddress] = useState(ownerData.venueLocation || '');
  const [latitude, setLatitude] = useState('18.5204');
  const [longitude, setLongitude] = useState('73.8567');

  // Photo Upload State
  const [photos, setPhotos] = useState([
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80',
  ]); // Default 3 demo photos initialized for smooth testing experience
  const [uploadProgress, setUploadProgress] = useState(null); // { filename, progress }
  const [uploadError, setUploadError] = useState('');

  // Amenities State
  const [selectedAmenities, setSelectedAmenities] = useState(['Parking', 'Floodlights', 'Changing Rooms', 'Drinking Water']);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [showAddCustomAmenity, setShowAddCustomAmenity] = useState(false);

  // Status & Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState({ name: false, address: false, lat: false, lng: false });

  // Handle Sport Selection
  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      if (selectedSports.length > 1) {
        setSelectedSports(selectedSports.filter((s) => s !== sport));
      }
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleAddSport = (sport) => {
    if (sport === 'Other') {
      const trimmed = customSportInput.trim();
      if (trimmed && !selectedSports.includes(trimmed)) {
        setSelectedSports([...selectedSports, trimmed]);
        setCustomSportInput('');
      }
    } else if (!selectedSports.includes(sport)) {
      setSelectedSports([...selectedSports, sport]);
    }
    setShowAddSportDropdown(false);
  };

  // Handle Amenity Toggle
  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities([...selectedAmenities, trimmed]);
      setCustomAmenityInput('');
      setShowAddCustomAmenity(false);
    }
  };

  // Photo File Change Handler (Validates & Uploads to S3/Cloudinary)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError('');

    for (const file of files) {
      try {
        setUploadProgress({ filename: file.name, progress: 0 });
        const res = await ownerVenueService.uploadPhoto('draft-venue', file, (percent) => {
          setUploadProgress({ filename: file.name, progress: percent });
        });
        setPhotos((prev) => [...prev, res.url]);
      } catch (err) {
        setUploadError(err.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadProgress(null);
      }
    }
    // reset input
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSelectPresetLocation = (loc) => {
    setAddress(loc.address);
    setLatitude(loc.lat.toString());
    setLongitude(loc.lng.toString());
  };

  // Validation Check
  const isNameValid = venueName.trim().length > 0;
  const isSportsValid = selectedSports.length > 0;
  const isAddressValid = address.trim().length > 0;
  const isLatValid = !isNaN(parseFloat(latitude)) && parseFloat(latitude) >= -90 && parseFloat(latitude) <= 90;
  const isLngValid = !isNaN(parseFloat(longitude)) && parseFloat(longitude) >= -180 && parseFloat(longitude) <= 180;
  const isCoordinatesValid = isLatValid && isLngValid;
  const isPhotosValid = photos.length >= 3;

  const isFormValid = isNameValid && isSportsValid && isAddressValid && isCoordinatesValid && isPhotosValid;

  // Submit Handler -> POST /owner/venues
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, address: true, lat: true, lng: true });

    if (!isFormValid) {
      let missing = [];
      if (!isNameValid) missing.push('Venue Name');
      if (!isSportsValid) missing.push('At least 1 Sport');
      if (!isAddressValid) missing.push('Formatted Address');
      if (!isCoordinatesValid) missing.push('Valid Latitude & Longitude');
      if (!isPhotosValid) missing.push(`At least 3 photos (Current: ${photos.length}/3)`);

      setSubmitError(`Please complete all required details: ${missing.join(', ')}.`);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: venueName.trim(),
        sports: selectedSports,
        address: address.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        photos,
        amenities: selectedAmenities,
        ownerId: ownerData.ownerId || 'OWNER-2026',
        status: 'active',
      };

      const res = await ownerVenueService.createVenue(payload);

      // Trigger callback with created venue object
      if (typeof onVenueCreated === 'function') {
        onVenueCreated(res.venue);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to create venue listing. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Top Header */}
      <div style={{ background: '#102A43', color: '#FFFFFF', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 1 of 2 • Venue Listing
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>Create Venue Listing</h2>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={20} color="#38BDF8" />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>

        {/* Info Banner */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '0.75rem 0.9rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
          <Sparkles size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78125rem', color: '#1E40AF', lineHeight: 1.4 }}>
            <strong>High Quality Listings Get 3x More Bookings!</strong> Provide complete details, accurate GPS pin, and high-resolution photos for player verification.
          </div>
        </div>

        {submitError && (
          <div className="auth-danger-banner" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* SECTION 1: VENUE NAME */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <label htmlFor="venueNameInput" style={{ display: 'block', fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem' }}>
              Venue Name *
            </label>
            <input
              id="venueNameInput"
              type="text"
              className={`auth-field-input ${touched.name && !isNameValid ? 'has-error' : ''}`}
              placeholder="e.g. Apex International Sports Complex"
              value={venueName}
              onChange={(e) => {
                setVenueName(e.target.value);
                if (submitError) setSubmitError('');
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            />
            {!isNameValid && touched.name && (
              <span style={{ fontSize: '0.71875rem', color: '#DC2626', marginTop: '0.25rem', display: 'block' }}>
                Please provide a venue title.
              </span>
            )}
          </div>

          {/* SECTION 2: SPORTS CHIPS & "+ Add sport" DROPDOWN */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>
                Sports Supported *
              </label>
              <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                {selectedSports.length} selected
              </span>
            </div>

            {/* Chips Container */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {selectedSports.map((sport) => (
                <div
                  key={sport}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 9999,
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{sport}</span>
                  {selectedSports.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleSport(sport)}
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Sport Dropdown Trigger */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSportDropdown(!showAddSportDropdown)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#F1F5F9',
                    color: '#2563EB',
                    border: '1px dashed #93C5FD',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 9999,
                    fontSize: '0.78125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  <span>Add sport</span>
                </button>

                {/* Dropdown Menu */}
                {showAddSportDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      zIndex: 50,
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 10,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      padding: '0.5rem',
                      minWidth: 160,
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
                      Select Sport
                    </div>
                    {AVAILABLE_SPORTS.map((sport) => {
                      const isSelected = selectedSports.includes(sport);
                      return (
                        <button
                          key={sport}
                          type="button"
                          disabled={isSelected && sport !== 'Other'}
                          onClick={() => handleAddSport(sport)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            width: '100%',
                            textAlign: 'left',
                            background: isSelected ? '#F8FAFC' : 'transparent',
                            border: 'none',
                            padding: '0.45rem 0.5rem',
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#94A3B8' : '#0F172A',
                            cursor: isSelected && sport !== 'Other' ? 'default' : 'pointer',
                          }}
                        >
                          <span>{sport}</span>
                          {isSelected && sport !== 'Other' && <Check size={14} color="#059669" />}
                        </button>
                      );
                    })}

                    {/* Custom sport input if Other chosen */}
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <input
                          type="text"
                          placeholder="Other sport name"
                          value={customSportInput}
                          onChange={(e) => setCustomSportInput(e.target.value)}
                          style={{ flex: 1, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.75rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSport('Other')}
                          style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDRESS & LOCATION PIN (LAT / LNG) */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <label htmlFor="venueAddressInput" style={{ display: 'block', fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem' }}>
              Full Address *
            </label>
            <textarea
              id="venueAddressInput"
              rows={2}
              className={`auth-field-input ${touched.address && !isAddressValid ? 'has-error' : ''}`}
              placeholder="Building No, Street, Landmark, Area, City & Pin Code"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (submitError) setSubmitError('');
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
              style={{ resize: 'vertical' }}
            />

            {/* GPS Location Pin & Coordinates Container */}
            <div style={{ marginTop: '0.85rem', background: '#F8FAFC', borderRadius: 10, padding: '0.75rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                  <MapPin size={16} color="#EF4444" />
                  <span>GPS Location Coordinates *</span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: isCoordinatesValid ? '#059669' : '#DC2626', fontWeight: 700 }}>
                  {isCoordinatesValid ? '✓ Pin Set' : 'Invalid Lat/Lng'}
                </span>
              </div>

              {/* Preset Pin Quick Selector */}
              <div style={{ marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.71875rem', color: '#64748B', display: 'block', marginBottom: '0.3rem' }}>
                  Quick Pin Presets (Pune):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {PRESET_LOCATIONS.map((loc) => (
                    <button
                      key={loc.label}
                      type="button"
                      onClick={() => handleSelectPresetLocation(loc)}
                      style={{
                        background: address.includes(loc.label.split(' ')[0]) ? '#EFF6FF' : '#FFFFFF',
                        border: `1px solid ${address.includes(loc.label.split(' ')[0]) ? '#3B82F6' : '#CBD5E1'}`,
                        color: address.includes(loc.label.split(' ')[0]) ? '#1E40AF' : '#475569',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.71875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      📍 {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lat & Lng Input Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.71875rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 18.5204"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.71875rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 73.8567"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: 3+ PHOTO UPLOADS WITH REMOVE ACTION */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>
                Venue Photos (Minimum 3 required) *
              </label>
              <span
                style={{
                  fontSize: '0.71875rem',
                  fontWeight: 700,
                  color: isPhotosValid ? '#059669' : '#DC2626',
                  background: isPhotosValid ? '#ECFDF5' : '#FEF2F2',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 9999,
                }}
              >
                {photos.length} / 3 minimum
              </span>
            </div>
            <span style={{ fontSize: '0.71875rem', color: '#64748B', display: 'block', marginBottom: '0.75rem' }}>
              Upload clear court images (JPG, PNG, WebP up to 5MB each). Uploaded to S3/Cloudinary CDN.
            </span>

            {uploadError && (
              <div className="auth-danger-banner" style={{ marginBottom: '0.75rem', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}>
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploadProgress && (
              <div style={{ marginBottom: '0.75rem', background: '#F1F5F9', padding: '0.5rem', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71875rem', color: '#1E293B', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span>Uploading {uploadProgress.filename}...</span>
                  <span>{uploadProgress.progress}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress.progress}%`, height: '100%', background: '#2563EB', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}

            {/* Photos Grid: Upload Cells + Thumbnails with Remove Action */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.65rem' }}>

              {/* Upload Trigger Cell */}
              <label
                htmlFor="photoUploadInput"
                style={{
                  height: 85,
                  border: '2px dashed #93C5FD',
                  borderRadius: 10,
                  background: '#F0F9FF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justify: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <Upload size={20} color="#2563EB" />
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1D4ED8', marginTop: '0.25rem' }}>
                  + Add Photo
                </span>
                <input
                  id="photoUploadInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Thumbnails with Remove Action */}
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    height: 85,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <img
                    src={url}
                    alt={`Venue photo ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    title="Remove Photo"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(220,38,38,0.9)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      background: 'rgba(15,23,42,0.75)',
                      color: '#FFF',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.35rem',
                      borderRadius: 4,
                    }}
                  >
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>

            {!isPhotosValid && (
              <span style={{ fontSize: '0.71875rem', color: '#DC2626', marginTop: '0.5rem', display: 'block', fontWeight: 600 }}>
                ⚠️ Please upload at least {3 - photos.length} more photo(s) to enable save.
              </span>
            )}
          </div>

          {/* SECTION 5: AMENITIES CHIPS */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>
                Amenities & Facilities
              </label>
              <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                {selectedAmenities.length} selected
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {PRESET_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      color: isSelected ? '#1D4ED8' : '#475569',
                      border: `1px solid ${isSelected ? '#3B82F6' : '#CBD5E1'}`,
                      padding: '0.35rem 0.75rem',
                      borderRadius: 9999,
                      fontSize: '0.78125rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected && <Check size={12} color="#2563EB" />}
                    <span>{amenity}</span>
                  </button>
                );
              })}

              {/* Custom Amenity Button / Form */}
              {showAddCustomAmenity ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="text"
                    placeholder="Custom facility"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #3B82F6', fontSize: '0.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomAmenity(false)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddCustomAmenity(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px dashed #94A3B8',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 9999,
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} />
                  <span>+ Custom</span>
                </button>
              )}
            </div>
          </div>

          {/* FULL-WIDTH SAVE & CONTINUE BUTTON */}
          <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`auth-primary-btn ${!isFormValid || isSubmitting ? 'is-disabled' : ''} ${isSubmitting ? 'is-loading' : ''}`}
              style={{ width: '100%', height: 48, fontSize: '0.9375rem', fontWeight: 700 }}
            >
              {isSubmitting ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <span>Save & Continue to Pricing</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            {!isFormValid && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.71875rem', color: '#64748B' }}>
                Save disabled until: Name + Sport + Address + GPS Coordinates + 3 Photos are provided.
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
