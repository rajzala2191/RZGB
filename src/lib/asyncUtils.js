// Retry logic for failed API calls
export const retryAsync = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Safe async wrapper that prevents unhandled promise rejections
export const safeAsync = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    console.error('Async operation failed:', error);
    return fallback;
  }
};

// Handle errors from Supabase calls
export const handleSupabaseError = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'object' && error.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An error occurred. Please try again.';
};

export default {
  retryAsync,
  safeAsync,
  handleSupabaseError
};
