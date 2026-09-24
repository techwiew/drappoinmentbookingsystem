import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error: AxiosError): boolean => {
  // Network errors or timeout errors
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors (except 501 Not Implemented and 505 HTTP Version Not Supported)
  const status = error.response.status;
  if (status >= 500 && status < 600 && status !== 501 && status !== 505) {
    return true;
  }

  // Retry on 429 Too Many Requests (rate limiting)
  if (status === 429) {
    return true;
  }

  // Don't retry on 4xx errors (except 429) or other specific cases
  return false;
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("MediNovel_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh on 401 and Retry Logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  async (response) => {
    // Validate Content-Type before processing JSON response
    if (response.data && typeof response.data === 'object') {
      const contentType = response.headers['content-type'];
      if (typeof contentType === 'string' && contentType && !contentType.includes('application/json')) {
        // If the response is not JSON but we got an object, it might be a parsing issue
        // Convert to appropriate format or handle as needed
        // For now, we'll log a warning but continue since the data is already parsed
        console.warn('Expected JSON response but got different Content-Type:', contentType);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Handle 500+ errors by modifying response data (keep existing behavior)
    if (error.response && error.response.status >= 500) {
      const unavailable = error.response.status === 503;
      error.response.data = {
        error: {
          code: unavailable ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_SERVER_ERROR',
          message: unavailable
            ? 'The service is temporarily unavailable. Please try again shortly.'
            : 'Something went wrong. Please try again later.',
        },
      };
    }

    // Handle 401 errors with token refresh (existing behavior)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("MediNovel_refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("MediNovel_token");
        localStorage.removeItem("MediNovel_refresh_token");
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem("MediNovel_token", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("MediNovel_refresh_token", newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("MediNovel_token");
        localStorage.removeItem("MediNovel_refresh_token");
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle retry logic for retryable errors
    if (isRetryableError(error) && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;

      // Calculate delay with exponential backoff and jitter
      const delay = RETRY_DELAY_BASE * Math.pow(2, originalRequest._retryCount - 1) +
                   Math.random() * 1000; // Add jitter

      // Wait for the delay period
      await sleep(delay);

      // Retry the request
      return apiClient(originalRequest);
    } else if (isRetryableError(error) && originalRequest._retryCount !== undefined && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount++;

      // Calculate delay with exponential backoff and jitter
      const delay = RETRY_DELAY_BASE * Math.pow(2, originalRequest._retryCount - 1) +
                   Math.random() * 1000; // Add jitter

      // Wait for the delay period
      await sleep(delay);

      // Retry the request
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
