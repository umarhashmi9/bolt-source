import { toast } from 'react-toastify';

// Export a wrapped version of toast with configured defaults
export const configuredToast = {
  success: (message: string, options = {}) => toast.success(message, { autoClose: 3000, ...options }),
  error: (message: string, options = {}) => toast.error(message, { autoClose: 3000, ...options }),
  info: (message: string, options = {}) => toast.info(message, { autoClose: 3000, ...options }),
  warning: (message: string, options = {}) => toast.warning(message, { autoClose: 3000, ...options }),
  loading: (message: string, options = {}) => toast.loading(message, { autoClose: 3000, ...options }),
};

// Export the original toast for cases where specific configuration is needed
export { toast };
