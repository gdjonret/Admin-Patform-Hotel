import React, { useMemo, useReducer, useState, forwardRef } from "react";
import "./reservation-form.css";
import { createBookingFromPublicForm } from "../../../api/bookings";
import { MdPerson, MdPhone, MdEmail, MdHome, MdCalendarToday, MdPeople, MdPayment, MdComment, MdArrowForward, MdArrowBack, MdCheck, MdHotel, MdEventAvailable } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useRooms } from "../../../context/RoomContext";
import { todayYmdTZ, parseYmd } from "../../../lib/dates";
import { useTaxCalculation } from "../../../hooks/useTaxCalculation";

/**
 * Key improvements:
 * - useReducer for predictable state updates
 * - stronger validation with cross-field checks (dates, guests)
 * - computed nights & live summary panel
 * - accessibility: aria-invalid, aria-describedby, role="alert" for errors
 * - harder to double-submit; button shows spinner state
 * - consistent local date helpers & min/max date rules
 * - added roomType & rooms (common booking fields)
 * - small honeypot anti-bot field & terms checkbox
 */

const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <input className="form-input" onClick={onClick} value={value || ""} placeholder={placeholder} readOnly ref={ref} />
));

const Field = ({ id, label, error, children, required = false, icon }) => (
  <div className="form-field">
    <label className={`form-label ${required ? "required" : ""}`} htmlFor={id}>
      {icon && <span className="field-icon">{icon}</span>}
      {label}
    </label>
    {children}
    {error && (
      <p className="form-error" id={`${id}-error`} role="alert">
        {error}
      </p>
    )}
  </div>
);

const initialState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
  zipCode: "",
  country: "",
  arrivalDate: "",
  departureDate: "",
  adults: "1",
  kids: "0",
  paymentMethod: "",
  roomType: "",
  rooms: "1",
  specialRequest: "",
  // anti-bot honeypot
  company: "",
  // price calculation
  totalPrice: 0,
  // wizard step
  currentStep: 1,
};

function reducer(state, action) {
  if (action.type === "set") return { ...state, [action.name]: action.value };
  if (action.type === "reset") return initialState;
  if (action.type === "nextStep") return { ...state, currentStep: Math.min(state.currentStep + 1, 3) };
  if (action.type === "prevStep") return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
  if (action.type === "setStep") return { ...state, currentStep: action.step };
  return state;
}

// Convert Date object to YYYY-MM-DD string
const toDateStrLocal = (dateObj) => {
  if (!dateObj || !(dateObj instanceof Date)) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Convert YYYY-MM-DD string to Date object
const parseDateStrLocal = (str) => {
  if (!str || typeof str !== 'string') return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Get today in Chad timezone as Date object
const getTodayChad = () => {
  const todayYmd = todayYmdTZ('Africa/Ndjamena');
  return parseYmd(todayYmd);
};

const todayLocal = getTodayChad();

// FIXED: Improved phone validation
const isPhoneValid = (e164) => {
  if (!e164 || !e164.startsWith("+")) return false;
  const digits = e164.replace(/\D/g, "");
  // Valid international phone: 10-15 digits (covers most countries)
  return digits.length >= 10 && digits.length <= 15;
};

function validateStep(state, step) {
  const e = {};
  
  if (step === 1) {
    // Step 1: Guest Information
    if (!state.firstName.trim()) e.firstName = "Le prénom est requis";
    if (!state.lastName.trim()) e.lastName = "Le nom de famille est requis";
    // FIXED: Improved email validation regex
    if (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email)) {
      e.email = "Email valide requis (ex: nom@exemple.com)";
    }
    if (!isPhoneValid(state.phone)) e.phone = "Numéro de téléphone international valide requis (ex: +235 XX XX XX XX)";
  }
  
  if (step === 2) {
    // Step 2: Stay Details
    if (!state.arrivalDate) e.arrivalDate = "Date d'arrivée requise";
    if (!state.departureDate) e.departureDate = "Date de départ requise";
    if (state.arrivalDate && state.departureDate) {
      if (parseDateStrLocal(state.departureDate) <= parseDateStrLocal(state.arrivalDate)) {
        e.departureDate = "Le départ doit être après l'arrivée";
      }
    }
    if (!state.adults || Number(state.adults) < 1) e.adults = "Le nombre d'adultes doit être ≥ 1";
    if (!state.roomType) e.roomType = "Sélectionnez un type de chambre";
  }
  
  if (step === 3) {
    // Step 3: Payment & Confirmation
    if (!state.paymentMethod) e.paymentMethod = "Choisissez un mode de paiement";
  }
  
  // Honey pot (always check)
  if (state.company && state.company.trim().length > 0) e.company = "Bot détecté";
  
  return e;
}

function validate(state) {
  // Validate all steps for final submission
  return {
    ...validateStep(state, 1),
    ...validateStep(state, 2),
    ...validateStep(state, 3),
  };
}

export default function ReservationForm({ onClose, onSubmitSuccess }) {
  const { getRoomTypes, getRoomPrice } = useRooms();
  const { calculateTaxes, taxes, loading: taxesLoading } = useTaxCalculation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const roomTypes = getRoomTypes();

  const arrivalDateObj = useMemo(() => parseDateStrLocal(state.arrivalDate), [state.arrivalDate]);
  const departureDateObj = useMemo(() => parseDateStrLocal(state.departureDate), [state.departureDate]);
  const nights = useMemo(() => {
    if (!arrivalDateObj || !departureDateObj) return 0;
    const diff = (departureDateObj - arrivalDateObj) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  }, [arrivalDateObj, departureDateObj]);
  
  // Calculate price with taxes
  const priceCalculation = useMemo(() => {
    if (!state.roomType || !nights) {
      return { roomRate: 0, subtotal: 0, taxes: [], totalTaxes: 0, grandTotal: 0 };
    }
    const pricePerNight = getRoomPrice(state.roomType);
    const totalRoomRate = pricePerNight; // Single room only
    console.log('🔢 Recalculating prices:', { pricePerNight, totalRoomRate, nights, taxesLoaded: !taxesLoading, taxCount: taxes.length });
    return calculateTaxes(totalRoomRate, nights, 0);
  }, [state.roomType, nights, getRoomPrice, calculateTaxes, taxes, taxesLoading]);
  
  // For backward compatibility
  const totalPrice = priceCalculation.grandTotal;

  function setField(name, value) {
    dispatch({ type: "set", name, value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Update total price when relevant fields change (FIXED: now includes taxes)
    if (name === 'roomType') {
      const newState = { ...state, [name]: value };
      if (newState.roomType && nights) {
        const pricePerNight = getRoomPrice(newState.roomType);
        const totalRoomRate = pricePerNight; // Single room only
        // Calculate with taxes
        const taxCalc = calculateTaxes(totalRoomRate, nights, 0);
        // Store total price WITH taxes (this is what gets sent to backend)
        dispatch({ type: "set", name: "totalPrice", value: taxCalc.grandTotal });
      }
    }
  }

  function handleNext() {
    const stepErrors = validateStep(state, state.currentStep);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      dispatch({ type: "nextStep" });
      setErrors({});
      // Scroll to top of modal content when moving to next step
      setTimeout(() => {
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
          modalBody.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  }

  function handleBack() {
    dispatch({ type: "prevStep" });
    setErrors({});
    // Scroll to top of modal content when going back
    setTimeout(() => {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(state);
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setSubmitting(true);
      const payload = { ...state };
      // never send honeypot
      delete payload.company;

      const saved = await createBookingFromPublicForm(payload);
      const normalizedReservation = {
        id: String(saved.id),
        reference: saved.bookingReference,
        guestName: saved.guestName || `${state.firstName} ${state.lastName}`.trim(),
        roomType: saved.roomType || state.roomType || "Standard",
        roomNumber: saved.roomNumber || "",
        checkIn: saved.checkInDate || state.arrivalDate,
        checkOut: saved.checkOutDate || state.departureDate,
        status: saved.status || "PENDING",
        balance: Number(saved.balance || 0),
        paymentStatus: saved.paymentStatus || (state.paymentMethod === "CARD" ? "PAID" : "UNPAID"),
        paymentMethod: state.paymentMethod,
        email: state.email,
        phone: state.phone,
        city: state.city,
        zipCode: state.zipCode,
        country: state.country,
        guests: { adults: Number(state.adults), kids: 0 },
        specialRequest: state.specialRequest?.trim() || null,
        createdAt: new Date().toISOString(),
        nights,
        rooms: 1,
      };

      onSubmitSuccess?.(normalizedReservation);
      onClose?.();
    } catch (err) {
      console.error("Error submitting form:", err);
      const message = err?.response?.data?.message || err?.message || "Échec de la création de la réservation. Veuillez réessayer.";
      setErrors((prev) => ({ ...prev, __form: message }));
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { number: 1, label: "Informations Client", icon: <MdPerson /> },
    { number: 2, label: "Détails du Séjour", icon: <MdHotel /> },
    { number: 3, label: "Vérification", icon: <MdCheck /> },
  ];

  return (
    <div className="modern-form-container">
      {/* Progress Steps */}
      <div className="wizard-progress">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className={`wizard-step ${state.currentStep === step.number ? 'active' : ''} ${state.currentStep > step.number ? 'completed' : ''}`}>
              <div className="wizard-step-circle">
                {state.currentStep > step.number ? <MdCheck /> : step.icon}
              </div>
              <span className="wizard-step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className="wizard-connector" />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={onSubmit} className="modern-form-body" noValidate>
          {/* Step 1: Guest Information */}
          {state.currentStep === 1 && (
            <div className="wizard-step-content">
              <div className="step-header">
                <MdPerson className="step-icon" />
                <h2 className="step-title">Informations du Client</h2>
                <p className="step-description">Dites-nous qui séjourne</p>
              </div>

              <div className="form-grid form-grid-2">
                <Field id="firstName" label="Prénom" error={errors.firstName} required icon={<MdPerson />}>
                  <input
                    id="firstName"
                    className="form-input"
                    name="firstName"
                    value={state.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    placeholder="Dupont"
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    autoComplete="given-name"
                  />
                </Field>

                <Field id="lastName" label="Nom de Famille" error={errors.lastName} required icon={<MdPerson />}>
                  <input
                    id="lastName"
                    className="form-input"
                    name="lastName"
                    value={state.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    placeholder="Smith"
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    autoComplete="family-name"
                  />
                </Field>
              </div>

              <div className="form-grid form-grid-2">
                <Field id="phone" label="Numéro de Téléphone" error={errors.phone} required icon={<MdPhone />}>
                  <div className="phone-input-container">
                    <PhoneInput
                      country={"td"}
                      enableSearch
                      value={state.phone.replace(/^\+/, "")}
                      onChange={(val) => setField("phone", val ? `+${val}` : "")}
                      containerClass="phone-container"
                      inputProps={{ name: "phone", required: true, id: "phone", "aria-invalid": !!errors.phone }}
                    />
                  </div>
                </Field>

                <Field id="email" label="Email" error={errors.email} required icon={<MdEmail />}>
                  <input
                    id="email"
                    className="form-input"
                    type="email"
                    name="email"
                    value={state.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="exemple@email.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    autoComplete="email"
                  />
                </Field>
              </div>

              <div className="optional-section">
                <h3 className="optional-title">
                  <MdHome /> Adresse (Optionnel)
                </h3>
                
                <div className="form-grid form-grid-3">
                  <Field id="country" label="Pays">
                    <input id="country" className="form-input" name="country" value={state.country} onChange={(e) => setField("country", e.target.value)} placeholder="Pays" autoComplete="country" />
                  </Field>
                  <Field id="city" label="Ville">
                    <input id="city" className="form-input" name="city" value={state.city} onChange={(e) => setField("city", e.target.value)} placeholder="Ville" autoComplete="address-level2" />
                  </Field>
                  <Field id="zipCode" label="Code Postal">
                    <input id="zipCode" className="form-input" name="zipCode" value={state.zipCode} onChange={(e) => setField("zipCode", e.target.value)} placeholder="Code Postal" autoComplete="postal-code" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Stay Details */}
          {state.currentStep === 2 && (
            <div className="wizard-step-content">
              <div className="step-header">
                <MdHotel className="step-icon" />
                <h2 className="step-title">Détails du Séjour</h2>
                <p className="step-description">Choisissez vos dates et préférences de chambre</p>
              </div>

              {/* Date Selection */}
              <div className="date-selection-card">
                <div className="form-grid form-grid-2">
                  <Field id="arrivalDate" label="Date d'Arrivée" error={errors.arrivalDate} required icon={<MdCalendarToday />}>
                    <DatePicker
                      selected={arrivalDateObj}
                      onChange={(date) => {
                        if (date) {
                          setField("arrivalDate", toDateStrLocal(date));
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Sélectionnez la date d'arrivée"
                      minDate={todayLocal}
                      customInput={<CustomInput />}
                      isClearable={false}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                    />
                    <p className="hint">Arrivée à partir de 12:00</p>
                  </Field>

                  <Field id="departureDate" label="Date de Départ" error={errors.departureDate} required icon={<MdCalendarToday />}>
                    <DatePicker
                      selected={departureDateObj}
                      onChange={(date) => {
                        if (date) {
                          setField("departureDate", toDateStrLocal(date));
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Sélectionnez la date de départ"
                      minDate={arrivalDateObj || todayLocal}
                      customInput={<CustomInput />}
                      isClearable={false}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                    />
                    <p className="hint">Départ avant 12:00</p>
                  </Field>
                </div>

                {nights > 0 && (
                  <div className="nights-badge">
                    <MdEventAvailable />
                    <span>{nights} nuit{nights > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Room Type Selection */}
              <div className="room-type-section">
                <h3 className="subsection-title">Sélectionnez le Type de Chambre</h3>
                <div className="room-type-cards">
                  {roomTypes.map((roomType) => (
                    <div
                      key={roomType.type}
                      className={`room-type-card ${state.roomType === roomType.type ? 'selected' : ''}`}
                      onClick={() => setField("roomType", roomType.type)}
                    >
                      <div className="room-type-header">
                        <h4>{roomType.type}</h4>
                        {state.roomType === roomType.type && <MdCheck className="check-icon" />}
                      </div>
                      <div className="room-type-price">
                        <span className="price-amount">{roomType.price.toLocaleString()} FCFA</span>
                        <span className="price-period">par nuit</span>
                      </div>
                      <div className="room-type-features">
                        <span><MdPeople /> Jusqu'à {roomType.capacity || 2} personnes</span>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.roomType && <p className="form-error" role="alert">{errors.roomType}</p>}
              </div>

              {/* Guests */}
              <div className="guests-rooms-grid">
                <Field id="adults" label="Adultes" error={errors.adults} required icon={<MdPeople />}>
                  <input id="adults" className="form-input" type="number" min={1} name="adults" value={state.adults} onChange={(e) => setField("adults", e.target.value)} placeholder="1" aria-invalid={!!errors.adults} aria-describedby={errors.adults ? "adults-error" : undefined} />
                </Field>
              </div>

              {/* Special Requests */}
              <Field id="specialRequest" label="Demandes Spéciales (Optionnel)" icon={<MdComment />}>
                <textarea id="specialRequest" className="form-textarea" name="specialRequest" value={state.specialRequest} onChange={(e) => setField("specialRequest", e.target.value.slice(0, 800))} rows={3} placeholder="Transfert aéroport, besoins d'accessibilité, exigences alimentaires..." />
                <p className="hint">{state.specialRequest.length}/800 caractères</p>
              </Field>
            </div>
          )}

          {/* Step 3: Review & Payment */}
          {state.currentStep === 3 && (
            <div className="wizard-step-content">
              <div className="step-header">
                <MdCheck className="step-icon" />
                <h2 className="step-title">Vérifier et Confirmer</h2>
                <p className="step-description">Veuillez vérifier les détails de votre réservation</p>
              </div>

              {/* Reservation Summary */}
              <div className="review-summary">
                <div className="review-section">
                  <h3 className="review-section-title">
                    <MdPerson /> Informations du Client
                  </h3>
                  <div className="review-details">
                    <div className="review-item">
                      <span className="review-label">Nom:</span>
                      <span className="review-value">{state.firstName} {state.lastName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Email:</span>
                      <span className="review-value">{state.email}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Téléphone:</span>
                      <span className="review-value">{state.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <h3 className="review-section-title">
                    <MdHotel /> Détails du Séjour
                  </h3>
                  <div className="review-details">
                    <div className="review-item">
                      <span className="review-label">Check-in:</span>
                      <span className="review-value">{state.arrivalDate}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Check-out:</span>
                      <span className="review-value">{state.departureDate}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Durée:</span>
                      <span className="review-value">{nights} nuit{nights > 1 ? 's' : ''}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Type de Chambre:</span>
                      <span className="review-value">{state.roomType}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Adultes:</span>
                      <span className="review-value">{state.adults} adulte{Number(state.adults) > 1 ? 's' : ''}</span>
                    </div>
                    {state.specialRequest && (
                      <div className="review-item">
                        <span className="review-label">Demandes Spéciales:</span>
                        <span className="review-value">{state.specialRequest}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary with Taxes */}
                {totalPrice > 0 && (
                  <div className="price-summary-card">
                    <div className="price-breakdown-row">
                      <span>Tarif chambre ({getRoomPrice(state.roomType).toLocaleString()} FCFA × {nights} nuit{nights > 1 ? 's' : ''})</span>
                      <span>{(priceCalculation?.roomRate || 0).toLocaleString()} FCFA</span>
                    </div>
                    
                    {/* Tax Breakdown */}
                    {priceCalculation?.taxes && priceCalculation.taxes.length > 0 && (
                      <>
                        <div className="price-divider"></div>
                        {priceCalculation.taxes.map((tax, index) => (
                          <div key={index} className="price-breakdown-row tax-row">
                            <span>{tax.name} ({tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `${tax.rate.toLocaleString()} FCFA`})</span>
                            <span>{(tax.amount || 0).toLocaleString()} FCFA</span>
                          </div>
                        ))}
                        <div className="price-breakdown-row subtotal-row">
                          <span>Total Taxes</span>
                          <span>{(priceCalculation?.totalTaxes || 0).toLocaleString()} FCFA</span>
                        </div>
                      </>
                    )}
                    
                    <div className="price-divider"></div>
                    <div className="price-total-row">
                      <span>Montant Total</span>
                      <span className="total-amount">{(totalPrice || 0).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="payment-section">
                <h3 className="subsection-title">
                  <MdPayment /> Méthode de Paiement
                </h3>
                <Field id="paymentMethod" label="" error={errors.paymentMethod} required>
                  <div className="payment-options">
                    {[
                      { id: "cash", label: "Espèces", value: "CASH", description: "Payer à l'hôtel" },
                      { id: "card", label: "Carte de Crédit/Débit", value: "CARD", description: "Paiement en ligne sécurisé" },
                    ].map((opt) => (
                      <div className="payment-card" key={opt.id}>
                        <input type="radio" id={opt.id} name="paymentMethod" value={opt.value} checked={state.paymentMethod === opt.value} onChange={(e) => setField("paymentMethod", e.target.value)} />
                        <label htmlFor={opt.id}>
                          <span className="payment-label">{opt.label}</span>
                          <span className="payment-description">{opt.description}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Honeypot */}
              <div style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" value={state.company} onChange={(e) => setField("company", e.target.value)} />
              </div>
            </div>
          )}

          {/* Form-level error */}
          {errors.__form && (
            <div className="form-alert" role="alert">
              {errors.__form}
            </div>
          )}

          {/* Wizard Navigation */}
          <div className="wizard-actions">
            <div className="wizard-actions-left">
              {state.currentStep > 1 && (
                <button className="btn btn-secondary" type="button" onClick={handleBack} disabled={submitting}>
                  <MdArrowBack /> Retour
                </button>
              )}
            </div>
            <div className="wizard-actions-right">
              <button className="btn btn-ghost" type="button" onClick={() => onClose?.()} disabled={submitting}>
                Annuler
              </button>
              {state.currentStep < 3 ? (
                <button className="btn btn-primary" type="button" onClick={handleNext}>
                  Continuer <MdArrowForward />
                </button>
              ) : (
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Traitement..." : "Confirmer la Réservation"}
                </button>
              )}
            </div>
          </div>
        </form>
    </div>
  );
}
