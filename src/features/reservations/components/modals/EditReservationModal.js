// src/components/reservations/modals/EditReservationModal.js
import React, { useState, useEffect, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Button, Stack, IconButton } from "@mui/material";
import { MdClose, MdPerson, MdPhone, MdEmail, MdHome, MdCalendarToday, MdPeople, MdPayment, MdComment } from "react-icons/md";
import LoadingSpinner from "../../../../components/common/LoadingSpinner";
import "../../../../styles/shared/modern-form.css";
import { todayYmdTZ, parseYmd } from "../../../../lib/dates";

// DATE PICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// PHONE INPUT
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/** Custom input for react-datepicker */
const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <input
    className="form-input"
    onClick={onClick}
    value={value || ""}
    placeholder={placeholder}
    readOnly
    ref={ref}
  />
));

const Field = ({ label, error, children, required = false, icon }) => (
  <div className="form-field">
    <label className={`form-label ${required ? 'required' : ''}`}>
      {icon && <span className="field-icon">{icon}</span>}
      {label}
    </label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);

export default function EditReservationModal({ open, reservation, onClose, onSave, onAssignRoom }) {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ ...reservation });
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomTypeChanged, setRoomTypeChanged] = useState(false);

  // Determine if reservation details can be edited based on status
  const isCheckedIn = formData.status === 'CHECKED_IN';
  const isCheckedOut = formData.status === 'CHECKED_OUT';
  const isCancelled = formData.status === 'CANCELLED';
  const canEditReservationDetails = !isCheckedIn && !isCheckedOut && !isCancelled;

  useEffect(() => {
    if (reservation) {
      setFormData({ ...reservation });
    }
    
    // Fetch room types from backend
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/room-types');
        const data = await response.json();
        setRoomTypes(data.filter(rt => rt.active)); // Only show active room types
      } catch (error) {
        console.error('Error fetching room types:', error);
        // Fallback to hardcoded values if API fails
        setRoomTypes([
          { id: 1, name: 'STANDARD SINGLE ROOM' },
          { id: 2, name: 'DELUXE SINGLE ROOM' },
          { id: 3, name: 'Isla' }
        ]);
      }
    };
    
    if (open) {
      fetchRoomTypes();
    }
  }, [reservation, open]);

  if (!open || !reservation) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If room type is changed, clear the assigned room
    if (name === 'roomType' && value !== formData.roomType) {
      const hadRoomAssigned = formData.roomNumber != null;
      setFormData(prev => ({
        ...prev,
        [name]: value,
        roomNumber: null,  // Clear room number
        roomId: null       // Clear room ID
      }));
      // Show notification if room was previously assigned
      if (hadRoomAssigned) {
        setRoomTypeChanged(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setRoomTypeChanged(false), 5000);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    // Store address fields directly, not as nested object
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuestsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      guests: {
        ...prev.guests,
        [name]: Number(value)
      }
    }));
  };

  const validate = () => {
    const e = {};
    if (!formData.guestName?.trim()) e.guestName = "Guest name is required";
    if (!formData.email || !formData.email.includes("@")) e.email = "Valid email required";
    if (!formData.checkIn) e.checkIn = "Check-in date required";
    if (!formData.checkOut) e.checkOut = "Check-out date required";
    if (!formData.roomType) e.roomType = "Room type is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  /* ---------- LOCAL DATE HELPERS ---------- */
  const parseDateStrLocal = (str) => {
    if (!str || typeof str !== 'string') return null;
    const [y, m, d] = str.split("-").map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const toDateStrLocal = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date)) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  if (!open || !reservation) return null;

  // Parse dates - will update when formData changes
  const checkInDate = parseDateStrLocal(formData.checkIn);
  const checkOutDate = parseDateStrLocal(formData.checkOut);

  const portalTarget = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="modal-overlay">
      <div className="reservation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier la Réservation #{formData.id}</h2>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <MdClose />
          </IconButton>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form-body">
            {/* Guest Information */}
            <div className="form-section">
              <h2 className="section-title">Informations du Client</h2>
              
              <Field label="Nom du Client" error={errors.guestName} required={true} icon={<MdPerson />}>
                <input 
                  className="form-input" 
                  name="guestName" 
                  value={formData.guestName || ""} 
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                />
              </Field>
              
              <div className="form-grid form-grid-2">
                <Field label="Email" error={errors.email} required={true} icon={<MdEmail />}>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="example@email.com"
                  />
                </Field>

                <Field label="Numéro de Téléphone" icon={<MdPhone />}>
                  <div className="phone-input-container">
                    <PhoneInput
                      country={"us"}
                      enableSearch
                      value={(formData.phone || "").replace(/^\+/, "")}
                      onChange={(value) => {
                        const withPlus = value ? `+${value}` : "";
                        setFormData(prev => ({ ...prev, phone: withPlus }));
                      }}
                      containerClass="phone-container"
                      inputProps={{ name: "phone" }}
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Reservation Details */}
            <div className="form-section">
              <h2 className="section-title">Détails de la Réservation</h2>
              
              <div className="form-grid form-grid-2">
                <Field label="Type de Chambre" error={errors.roomType} required={true}>
                  <select 
                    className="form-input" 
                    name="roomType" 
                    value={formData.roomType || ""} 
                    onChange={handleChange}
                    disabled={!canEditReservationDetails}
                  >
                    <option value="">Sélectionner le Type de Chambre</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.name}>{rt.name}</option>
                    ))}
                  </select>
                </Field>
                
                <Field label="Numéro de Chambre">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        className="form-input" 
                        name="roomNumber" 
                        value={formData.roomNumber || "Non assignée"} 
                        readOnly
                        style={{ flex: 1, backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                      {canEditReservationDetails && onAssignRoom && (
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => onAssignRoom(formData)}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Assigner Chambre
                        </Button>
                      )}
                    </div>
                    {roomTypeChanged && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>⚠️</span>
                        <span>Le type de chambre a changé. Veuillez réassigner une chambre.</span>
                      </div>
                    )}
                  </div>
                </Field>
              </div>
              
              <div className="form-grid form-grid-2">
                <Field label="Date d'Arrivée" error={errors.checkIn} required={true} icon={<MdCalendarToday />}>
                  <DatePicker
                    selected={checkInDate}
                    onChange={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, checkIn: toDateStrLocal(date) }));
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Sélectionner la date d'arrivée"
                    minDate={parseYmd(todayYmdTZ('Africa/Ndjamena'))}
                    customInput={<CustomInput />}
                    disabled={!canEditReservationDetails}
                    isClearable={false}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                  />
                </Field>

                <Field label="Date de Départ" error={errors.checkOut} required={true} icon={<MdCalendarToday />}>
                  <DatePicker
                    selected={checkOutDate}
                    onChange={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, checkOut: toDateStrLocal(date) }));
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Sélectionner la date de départ"
                    minDate={checkInDate || parseYmd(todayYmdTZ('Africa/Ndjamena'))}
                    customInput={<CustomInput />}
                    disabled={!canEditReservationDetails}
                    isClearable={false}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                  />
                </Field>
              </div>
              
              <div className="form-grid form-grid-2">
                <Field label="Nombre d'Adultes" icon={<MdPeople />}>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    name="adults"
                    value={formData.guests?.adults || 1}
                    onChange={handleGuestsChange}
                  />
                </Field>
                
                <Field label="Nombre d'Enfants" icon={<MdPeople />}>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    name="kids"
                    value={formData.guests?.kids || 0}
                    onChange={handleGuestsChange}
                  />
                </Field>
              </div>
              
              <div className="form-grid form-grid-2">
                <Field label="Statut">
                  <div className="status-badge-container" style={{ padding: '10px 12px', backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                    <span className={`status-badge status-${(formData.status || 'CONFIRMED').toLowerCase()}`} style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: 
                        formData.status === 'CONFIRMED' ? '#e3f2fd' :
                        formData.status === 'CHECKED_IN' ? '#e8f5e9' :
                        formData.status === 'CHECKED_OUT' ? '#f3e5f5' :
                        formData.status === 'CANCELLED' ? '#ffebee' : '#f5f5f5',
                      color:
                        formData.status === 'CONFIRMED' ? '#1976d2' :
                        formData.status === 'CHECKED_IN' ? '#388e3c' :
                        formData.status === 'CHECKED_OUT' ? '#7b1fa2' :
                        formData.status === 'CANCELLED' ? '#d32f2f' : '#666'
                    }}>
                      {formData.status === 'CHECKED_IN' ? 'Enregistré' :
                       formData.status === 'CHECKED_OUT' ? 'Parti' :
                       formData.status === 'CANCELLED' ? 'Annulé' : 'Confirmé'}
                    </span>
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '4px', marginBottom: 0 }}>Le statut change via les actions de workflow</p>
                  </div>
                </Field>
                
                <Field label="Statut de Paiement">
                  <select 
                    className="form-input" 
                    name="paymentStatus" 
                    value={formData.paymentStatus || "PENDING"} 
                    onChange={handleChange}
                  >
                    <option value="PENDING">En Attente</option>
                    <option value="PARTIAL">Partiel</option>
                    <option value="PAID">Payé</option>
                    <option value="REFUNDED">Remboursé</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h2 className="section-title">Informations d'Adresse</h2>
              
              <div className="form-grid form-grid-3">
                <Field label="Pays" icon={<MdHome />}>
                  <input 
                    className="form-input" 
                    name="country" 
                    value={formData.country || ""} 
                    onChange={handleChange}
                    placeholder="Pays"
                  />
                </Field>
                
                <Field label="Ville" icon={<MdHome />}>
                  <input 
                    className="form-input" 
                    name="city" 
                    value={formData.city || ""} 
                    onChange={handleChange}
                    placeholder="Ville"
                  />
                </Field>
                
                <Field label="Code Postal" icon={<MdHome />}>
                  <input 
                    className="form-input" 
                    name="zipCode" 
                    value={formData.zipCode || ""} 
                    onChange={handleChange}
                    placeholder="Code Postal"
                  />
                </Field>
              </div>
            </div>

            {/* Special Requests */}
            <div className="form-section">
              <h2 className="section-title">Demandes Spéciales</h2>
              
              <Field label="Demandes Spéciales" icon={<MdComment />}>
                <textarea
                  className="form-textarea"
                  name="specialRequest"
                  value={formData.specialRequest || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Demandes spéciales ou notes"
                />
              </Field>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          {!canEditReservationDetails && (
            <p style={{ fontSize: '13px', color: '#f57c00', marginRight: 'auto', marginBottom: 0 }}>
              ⚠️ Détails de réservation verrouillés. Seules les informations du client peuvent être mises à jour.
            </p>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ marginLeft: 'auto' }}>
            <Button variant="outlined" color="inherit" onClick={onClose}>Annuler</Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>Mettre à Jour</Button>
          </Stack>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
