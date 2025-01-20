export const getBaseUrl = (): string => {
  return window.ENV?.BASE_URL ?? '';
};