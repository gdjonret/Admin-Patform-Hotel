// src/utils/toast.js
import { toast as toastify } from 'react-toastify';

/**
 * Centralized toast notification utilities
 * Replaces alert() and provides consistent styling
 */

const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const toast = {
  success: (message, options = {}) => {
    toastify.success(message, { ...defaultOptions, ...options });
  },
  
  error: (message, options = {}) => {
    toastify.error(message, { ...defaultOptions, autoClose: 5000, ...options });
  },
  
  info: (message, options = {}) => {
    toastify.info(message, { ...defaultOptions, ...options });
  },
  
  warning: (message, options = {}) => {
    toastify.warning(message, { ...defaultOptions, ...options });
  },
  
  loading: (message) => {
    return toastify.loading(message, { ...defaultOptions, autoClose: false });
  },
  
  update: (toastId, options) => {
    toastify.update(toastId, options);
  },
  
  dismiss: (toastId) => {
    toastify.dismiss(toastId);
  }
};

// Convenience methods for common operations
export const showSuccess = (operation, entity) => {
  toast.success(`${entity} ${operation} successfully`);
};

export const showError = (operation, error) => {
  const message = error?.response?.data?.message || error?.message || `Failed to ${operation}`;
  toast.error(message);
};

export const showOperationToast = async (operation, promise, successMessage) => {
  const toastId = toast.loading(`${operation}...`);
  
  try {
    const result = await promise;
    toast.update(toastId, {
      render: successMessage,
      type: 'success',
      isLoading: false,
      autoClose: 3000
    });
    return result;
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Operation failed';
    toast.update(toastId, {
      render: errorMsg,
      type: 'error',
      isLoading: false,
      autoClose: 5000
    });
    throw error;
  }
};
