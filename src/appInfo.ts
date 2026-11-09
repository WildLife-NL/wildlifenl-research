// Build facts shown in the top bar, footer and sign-in page
import { API_BASE_URL } from './apiBaseUrl';

export const APP_VERSION = process.env.REACT_APP_VERSION || 'dev';
export const IS_TEST_ENVIRONMENT = API_BASE_URL.includes('test-api');
export const API_LABEL = IS_TEST_ENVIRONMENT ? 'test API' : 'live API';
export const LOGO_SRC = '/assets/loginlogo.png';
