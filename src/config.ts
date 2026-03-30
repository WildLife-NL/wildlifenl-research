import { API_BASE_URL } from './apiBaseUrl';

export const getBaseUrl = (): string => {
  return window.ENV?.BASE_URL ?? API_BASE_URL;
};
