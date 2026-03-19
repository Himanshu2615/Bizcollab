const isProd = 
  import.meta.env.PROD || 
  process.env.NODE_ENV === 'production' || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_SERVER) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_SERVER) ||
  (isProd ? '/api/' : 'http://localhost:8888/api/');

export const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FILE_BASE_URL) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FILE_BASE_URL) ||
  (isProd ? '/' : 'http://localhost:8888/');

export const WEBSITE_URL = isProd ? '/' : 'http://localhost:3000/';

export const DOWNLOAD_BASE_URL = BASE_URL + 'download/';
export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL = BASE_URL;

