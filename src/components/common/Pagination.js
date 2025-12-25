import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'items'
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  if (totalItems <= itemsPerPage) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '20px',
      padding: '16px 20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px'
    }}>
      <div style={{ fontSize: '14px', color: '#64748b' }}>
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} {itemName}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white',
            color: currentPage === 1 ? '#94a3b8' : '#1e293b',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          ← Previous
        </button>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: currentPage === page ? '#1976d2' : 'white',
                color: currentPage === page ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: currentPage === page ? '600' : '500',
                fontSize: '14px',
                minWidth: '40px',
                transition: 'all 0.2s'
              }}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white',
            color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
