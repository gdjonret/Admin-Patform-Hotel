import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@mui/material';
import './staff.css';
import '../../styles/shared/modern-table.css';
import '../../features/reservations/components/modern-reservations-header.css';
import '../../styles/shared/status-badge.css';
import '../../styles/shared/modern-modal.css';
import { MdClose, MdEdit, MdVisibility, MdDelete, MdAdd, MdPerson, MdEmail, MdPhone, MdWork, MdCalendarToday, MdCheckCircle } from 'react-icons/md';
import MenuPortal from '../../components/MenuPortal';
import Pagination from '../../components/common/Pagination';
import ActionMenuButton from '../../components/common/ActionMenuButton';
import { todayYmdTZ } from '../../lib/dates';
import { toast } from '../../utils/toast';
import { getAllStaff, createStaff, updateStaff, deleteStaff } from '../../api/staff';

// French translations
const TRANSLATIONS = {
  // Page header
  pageTitle: "Personnel",
  addStaffBtn: "+ Ajouter Personnel",
  
  // Search and filters
  searchPlaceholder: "Rechercher personnel...",
  statusLabel: "Statut:",
  allStatus: "Tous",
  
  // Status values
  active: "Actif",
  onLeave: "En Cong\u00e9",
  terminated: "Termin\u00e9",
  
  // Table headers
  id: "ID",
  name: "Nom",
  position: "Poste",
  salary: "Salaire",
  phone: "T\u00e9l\u00e9phone",
  joinDate: "Date d'Embauche",
  status: "Statut",
  actions: "Actions",
  
  // Action menu
  edit: "Modifier",
  view: "Voir",
  delete: "Supprimer",
  
  // Empty states
  noStaffFound: "Aucun personnel trouv\u00e9",
  noActiveStaff: "Aucun personnel actif",
  noStaffOnLeave: "Aucun personnel en cong\u00e9",
  noTerminatedStaff: "Aucun personnel termin\u00e9",
  noMatchSearch: "Aucun personnel ne correspond \u00e0",
  tryDifferentSearch: "Essayez un autre terme de recherche.",
  adjustFilters: "Essayez d'ajuster vos filtres pour voir plus de r\u00e9sultats.",
  clickAddStaff: 'Cliquez sur le bouton "Ajouter Personnel" pour ajouter votre premier membre du personnel.',
  
  // Modals
  addNewStaff: "Ajouter Nouveau Personnel",
  registerNewStaff: "Enregistrer un nouveau membre du personnel",
  editStaff: "Modifier Personnel",
  updateStaffInfo: "Mettre \u00e0 jour les informations du personnel",
  
  // Form sections
  personalInfo: "Informations Personnelles",
  employmentDetails: "D\u00e9tails de l'Emploi",
  
  // Form fields
  firstName: "Pr\u00e9nom",
  firstNamePlaceholder: "Entrez le pr\u00e9nom",
  lastName: "Nom de Famille",
  lastNamePlaceholder: "Entrez le nom de famille",
  emailAddress: "Adresse Email",
  emailPlaceholder: "email@exemple.com",
  phoneNumber: "Num\u00e9ro de T\u00e9l\u00e9phone",
  phonePlaceholder: "+237 6XX XX XX XX",
  positionLabel: "Poste",
  positionPlaceholder: "Entrez le poste",
  salaryLabel: "Salaire",
  salaryPlaceholder: "Entrez le salaire",
  joinDateLabel: "Date d'Embauche",
  employmentStatus: "Statut d'Emploi",
  
  // Buttons
  cancel: "Annuler",
  addStaff: "Ajouter Personnel",
  updateStaff: "Mettre \u00e0 Jour Personnel",
  close: "Fermer",
  
  // View modal
  emailAddressLabel: "Adresse Email",
  phoneNumberLabel: "Num\u00e9ro de T\u00e9l\u00e9phone",
  positionViewLabel: "Poste",
  salaryViewLabel: "Salaire",
  joinDateViewLabel: "Date d'Embauche",
  employmentStatusLabel: "Statut d'Emploi",
  
  // Toast messages
  staffAdded: "Personnel ajout\u00e9 avec succ\u00e8s",
  staffUpdated: "Personnel mis \u00e0 jour avec succ\u00e8s",
  staffDeleted: "Personnel supprim\u00e9 avec succ\u00e8s",
  failedToLoad: "\u00c9chec du chargement du personnel",
  failedToAdd: "\u00c9chec de l'ajout du personnel",
  failedToUpdate: "\u00c9chec de la mise \u00e0 jour du personnel",
  failedToDelete: "\u00c9chec de la suppression du personnel",
  
  // Confirmation
  deleteConfirm: "\u00cates-vous s\u00fbr de vouloir supprimer ce membre du personnel?",
  
  // Pagination
  staff: "personnel"
};

// Status mapping for logic (English) to display (French)
const STATUS_DISPLAY = {
  "Active": TRANSLATIONS.active,
  "On Leave": TRANSLATIONS.onLeave,
  "Terminated": TRANSLATIONS.terminated
};

const Staff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const buttonRefs = useRef({});
  
  // Form state for adding/editing staff
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    joinDate: todayYmdTZ('Africa/Ndjamena'),
    status: 'Active'
  });
  const statuses = ['Active', 'On Leave', 'Terminated']; // Keep English for logic

  // Fetch staff from backend
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const data = await getAllStaff();
      setStaffMembers(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error(TRANSLATIONS.failedToLoad);
    } finally {
      setIsLoading(false);
    }
  };

  // Load staff on component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffMembers
    .filter(staff => filterStatus === 'All' ? true : staff.status === filterStatus)
    .filter(staff => {
      const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) ||
        staff.position.toLowerCase().includes(search) ||
        staff.email.toLowerCase().includes(search) ||
        staff.phone.includes(searchTerm);
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);
    
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Open add staff modal
  const handleAddClick = () => {
    setFormData({
      name: '',
      position: '',
      email: '',
      phone: '',
      joinDate: todayYmdTZ('Africa/Ndjamena'),
      status: 'Active'
    });
    setIsAddModalOpen(true);
  };
  
  // Open edit staff modal
  const handleEditClick = (staff) => {
    setCurrentStaff(staff);
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      position: staff.position,
      email: staff.email,
      phone: staff.phone,
      salary: staff.salary,
      joinDate: staff.joinDate,
      status: staff.status
    });
    setIsEditModalOpen(true);
  };
  
  // Open view staff modal
  const handleViewClick = (staff) => {
    setCurrentStaff(staff);
    setIsViewModalOpen(true);
  };
  
  // Add new staff member
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const staffData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || null,
        phone: formData.phone,
        position: formData.position,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        joinDate: formData.joinDate,
        status: formData.status
      };
      
      await createStaff(staffData);
      toast.success(TRANSLATIONS.staffAdded);
      setIsAddModalOpen(false);
      fetchStaff(); // Refresh the list
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error(error.response?.data || TRANSLATIONS.failedToAdd);
    }
  };
  
  // Update existing staff member
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      const staffData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || null,
        phone: formData.phone,
        position: formData.position,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        joinDate: formData.joinDate,
        status: formData.status
      };
      
      await updateStaff(currentStaff.id, staffData);
      toast.success(TRANSLATIONS.staffUpdated);
      setIsEditModalOpen(false);
      fetchStaff(); // Refresh the list
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error(error.response?.data || TRANSLATIONS.failedToUpdate);
    }
  };
  
  // Delete staff member
  const handleDeleteStaff = async (id) => {
    if (window.confirm(TRANSLATIONS.deleteConfirm)) {
      try {
        await deleteStaff(id);
        toast.success(TRANSLATIONS.staffDeleted);
        fetchStaff(); // Refresh the list
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast.error(TRANSLATIONS.failedToDelete);
      }
    }
    setActiveMenu(null);
  };

  // Toggle action menu
  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && 
          buttonRefs.current[activeMenu] && 
          !buttonRefs.current[activeMenu].contains(event.target)) {
        // Check if the click is outside the menu portal
        const portalElement = document.querySelector('.action-menu-portal');
        if (!portalElement || !portalElement.contains(event.target)) {
          setActiveMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  return (
    <div className="staff-container">
      {/* Modern Header Section */}
      <div className="modern-page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">{TRANSLATIONS.pageTitle}</h1>
          </div>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddClick}
            sx={{ 
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
              }
            }}
          >
            {TRANSLATIONS.addStaffBtn}
          </Button>
        </div>
      </div>

      {/* Modern Filters Section */}
      <div className="modern-controls-section">
        <div className="modern-filter-row">
          <div className="modern-search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="modern-search-input"
              placeholder={TRANSLATIONS.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="modern-filter-group">
            <label className="filter-label">{TRANSLATIONS.statusLabel}</label>
            <select className="modern-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">{TRANSLATIONS.allStatus}</option>
              {statuses.map((status, index) => (
                <option key={index} value={status}>{STATUS_DISPLAY[status]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="modern-table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>{TRANSLATIONS.id}</th>
              <th>{TRANSLATIONS.name}</th>
              <th>{TRANSLATIONS.position}</th>
              <th>{TRANSLATIONS.salary}</th>
              <th>{TRANSLATIONS.phone}</th>
              <th>{TRANSLATIONS.joinDate}</th>
              <th>{TRANSLATIONS.status}</th>
              <th>{TRANSLATIONS.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                    {searchTerm ? TRANSLATIONS.noStaffFound : 
                     filterStatus === 'Active' ? TRANSLATIONS.noActiveStaff :
                     filterStatus === 'On Leave' ? TRANSLATIONS.noStaffOnLeave :
                     filterStatus === 'Terminated' ? TRANSLATIONS.noTerminatedStaff :
                     TRANSLATIONS.noStaffFound}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {searchTerm ? `${TRANSLATIONS.noMatchSearch} "${searchTerm}". ${TRANSLATIONS.tryDifferentSearch}` :
                     filterStatus !== 'All' ? TRANSLATIONS.adjustFilters :
                     TRANSLATIONS.clickAddStaff}
                  </div>
                </td>
              </tr>
            ) : (
            paginatedStaff.map(staff => (
              <tr 
                key={staff.id}
                onClick={(e) => {
                  // Don't open modal if clicking on action menu or buttons
                  if (e.target.closest('.action-cell') || e.target.closest('button')) {
                    return;
                  }
                  handleViewClick(staff);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td>{staff.id}</td>
                <td>{staff.firstName} {staff.lastName}</td>
                <td>{staff.position}</td>
                <td>{staff.salary ? `${staff.salary.toLocaleString('fr-FR')} FCFA` : '-'}</td>
                <td>{staff.phone}</td>
                <td>{staff.joinDate}</td>
                <td>
                  <span className={`status-badge ${staff.status.toLowerCase().replace(' ', '-')}`}>
                    {STATUS_DISPLAY[staff.status]}
                  </span>
                </td>
                <td className="action-cell">
                  <div className="action-menu-container">
                    <ActionMenuButton
                      onClick={() => toggleMenu(staff.id)}
                      buttonRef={el => buttonRefs.current[staff.id] = el}
                      isActive={activeMenu === staff.id}
                    />
                    
                    <MenuPortal isOpen={activeMenu === staff.id} buttonRef={buttonRefs} activeId={staff.id}>
                      <div className="action-menu">
                        <button className="menu-item" onClick={() => handleEditClick(staff)}>
                          <MdEdit /> {TRANSLATIONS.edit}
                        </button>
                        <button className="menu-item" onClick={() => handleViewClick(staff)}>
                          <MdVisibility /> {TRANSLATIONS.view}
                        </button>
                        <button className="menu-item delete" onClick={() => handleDeleteStaff(staff.id)}>
                          <MdDelete /> {TRANSLATIONS.delete}
                        </button>
                      </div>
                    </MenuPortal>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStaff.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName={TRANSLATIONS.staff}
        />
      </div>
      
      {/* Add Staff Modal */}
      {isAddModalOpen && createPortal(
        <div className="modern-modal-overlay">
          <div className="modern-modal-container">
            <div className="modern-modal-header">
              <h2>{TRANSLATIONS.addNewStaff}</h2>
              <p>{TRANSLATIONS.registerNewStaff}</p>
            </div>
            <div className="modern-modal-body">
              <form onSubmit={handleAddStaff}>
                {/* Personal Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>{TRANSLATIONS.personalInfo}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="firstName">{TRANSLATIONS.firstName} *</label>
                      <input 
                        type="text" 
                        id="firstName" 
                        name="firstName" 
                        value={formData.firstName || ''} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={TRANSLATIONS.firstNamePlaceholder}
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="lastName">{TRANSLATIONS.lastName} *</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        name="lastName" 
                        value={formData.lastName || ''} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={TRANSLATIONS.lastNamePlaceholder}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="phone">{TRANSLATIONS.phoneNumber} *</label>
                      <input 
                        type="text" 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={TRANSLATIONS.phonePlaceholder}
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="email">{TRANSLATIONS.emailAddress}</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email || ''} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.emailPlaceholder}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Employment Details Section */}
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>{TRANSLATIONS.employmentDetails}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="position">{TRANSLATIONS.positionLabel} *</label>
                      <input 
                        type="text" 
                        id="position" 
                        name="position" 
                        value={formData.position} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={TRANSLATIONS.positionPlaceholder}
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="salary">{TRANSLATIONS.salaryLabel}</label>
                      <input 
                        type="number" 
                        id="salary" 
                        name="salary" 
                        value={formData.salary || ''} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.salaryPlaceholder}
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="joinDate">{TRANSLATIONS.joinDateLabel} *</label>
                      <input 
                        type="date" 
                        id="joinDate" 
                        name="joinDate" 
                        value={formData.joinDate} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="status">{TRANSLATIONS.employmentStatus} *</label>
                      <select 
                        id="status" 
                        name="status" 
                        value={formData.status} 
                        onChange={handleInputChange} 
                        required
                      >
                        {statuses.map((status, index) => (
                          <option key={index} value={status}>{STATUS_DISPLAY[status]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modern-modal-footer">
              <button type="button" className="modern-modal-btn-secondary" onClick={() => setIsAddModalOpen(false)}>{TRANSLATIONS.cancel}</button>
              <button type="submit" className="modern-modal-btn-primary" onClick={handleAddStaff}>{TRANSLATIONS.addStaff}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Edit Staff Modal */}
      {isEditModalOpen && currentStaff && createPortal(
        <div className="modern-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <MdEdit size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'white' }}>{TRANSLATIONS.editStaff}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>{TRANSLATIONS.updateStaffInfo}</p>
                </div>
              </div>
            </div>
            <div className="modern-modal-body">
              <form onSubmit={handleUpdateStaff}>
                {/* Personal Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>{TRANSLATIONS.personalInfo}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-firstName">{TRANSLATIONS.firstName} *</label>
                      <input 
                        type="text" 
                        id="edit-firstName" 
                        name="firstName" 
                        value={formData.firstName || ''} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.firstNamePlaceholder}
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-lastName">{TRANSLATIONS.lastName} *</label>
                      <input 
                        type="text" 
                        id="edit-lastName" 
                        name="lastName" 
                        value={formData.lastName || ''} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.lastNamePlaceholder}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-phone">{TRANSLATIONS.phoneNumber} *</label>
                      <input 
                        type="text" 
                        id="edit-phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.phonePlaceholder}
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-email">{TRANSLATIONS.emailAddress}</label>
                      <input 
                        type="email" 
                        id="edit-email" 
                        name="email" 
                        value={formData.email || ''} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.emailPlaceholder}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Employment Details Section */}
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>{TRANSLATIONS.employmentDetails}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-position">{TRANSLATIONS.positionLabel} *</label>
                      <input 
                        type="text" 
                        id="edit-position" 
                        name="position" 
                        value={formData.position} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.positionPlaceholder}
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-salary">{TRANSLATIONS.salaryLabel}</label>
                      <input 
                        type="number" 
                        id="edit-salary" 
                        name="salary" 
                        value={formData.salary || ''} 
                        onChange={handleInputChange} 
                        placeholder={TRANSLATIONS.salaryPlaceholder}
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="modern-form-group">
                      <label htmlFor="edit-joinDate">{TRANSLATIONS.joinDateLabel} *</label>
                      <input 
                        type="date" 
                        id="edit-joinDate" 
                        name="joinDate" 
                        value={formData.joinDate} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="modern-form-group">
                      <label htmlFor="edit-status">{TRANSLATIONS.employmentStatus} *</label>
                      <select 
                        id="edit-status" 
                        name="status" 
                        value={formData.status} 
                        onChange={handleInputChange} 
                        required
                      >
                        {statuses.map((status, index) => (
                          <option key={index} value={status}>{STATUS_DISPLAY[status]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modern-modal-footer">
              <button type="button" className="modern-modal-btn-secondary" onClick={() => setIsEditModalOpen(false)}>{TRANSLATIONS.cancel}</button>
              <button type="submit" className="modern-modal-btn-primary" onClick={handleUpdateStaff}>
                <MdCheckCircle size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                {TRANSLATIONS.updateStaff}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* View Staff Modal */}
      {isViewModalOpen && currentStaff && createPortal(
        <div className="modern-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <MdPerson size={32} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'white' }}>
                    {currentStaff.firstName} {currentStaff.lastName}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {currentStaff.position}
                  </p>
                </div>
              </div>
            </div>
            <div className="modern-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Personal Information Section */}
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>{TRANSLATIONS.personalInfo}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MdPhone size={20} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>{TRANSLATIONS.phoneNumberLabel}</div>
                        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{currentStaff.phone}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MdEmail size={20} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>{TRANSLATIONS.emailAddressLabel}</div>
                        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>{currentStaff.email || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Employment Details Section */}
                <div>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>{TRANSLATIONS.employmentDetails}</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MdWork size={18} color="#64748b" />
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{TRANSLATIONS.positionViewLabel}</div>
                      </div>
                      <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{currentStaff.position}</div>
                    </div>
                    
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MdWork size={18} color="#64748b" />
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{TRANSLATIONS.salaryViewLabel}</div>
                      </div>
                      <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>
                        {currentStaff.salary ? `${currentStaff.salary.toLocaleString('fr-FR')} FCFA` : '-'}
                      </div>
                    </div>
                    
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MdCalendarToday size={18} color="#64748b" />
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{TRANSLATIONS.joinDateViewLabel}</div>
                      </div>
                      <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{currentStaff.joinDate}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '2px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <MdCheckCircle size={18} color="#64748b" />
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{TRANSLATIONS.employmentStatusLabel}</div>
                    </div>
                    <span className={`status-badge ${currentStaff.status.toLowerCase().replace(' ', '-')}`}>
                      {STATUS_DISPLAY[currentStaff.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modern-modal-footer">
              <button className="modern-modal-btn-secondary" onClick={() => setIsViewModalOpen(false)}>{TRANSLATIONS.close}</button>
              <button 
                className="modern-modal-btn-primary" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditClick(currentStaff);
                }}
              >
                <MdEdit size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                {TRANSLATIONS.edit}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Staff;
