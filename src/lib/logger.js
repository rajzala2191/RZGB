export const logInfo = (workflow, action, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[INFO][${timestamp}][${workflow}] ${action}`, data ? data : '');
};

export const logError = (workflow, action, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR][${timestamp}][${workflow}] ${action}`, error);
  if (error?.stack) {
    console.error(error.stack);
  }
};