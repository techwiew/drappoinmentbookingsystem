import axios from 'axios';

/** Turn API and network failures into text that is safe to show to a user. */
export const getApiErrorMessage = (error: unknown, fallback = 'Unable to complete this action. Please try again.') => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Network error. Check your connection and try again.';
    if (error.response.status === 503) return 'The service is temporarily unavailable. Please try again shortly.';
    if (error.response.status >= 500) return 'Something went wrong. Please try again later.';
    const body = error.response.data as { error?: { message?: string; details?: { message?: string }[] } } | undefined;
    const details = body?.error?.details;
    return details?.[0]?.message || body?.error?.message || fallback;
  }
  return fallback;
};
