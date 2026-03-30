/** Jest runs with NODE_ENV=test; local/production builds use REACT_APP_BASE_URL. */
export const API_BASE_URL =
  process.env.NODE_ENV === 'test'
    ? 'https://test-api-wildlifenl.uu.nl'
    : (process.env.REACT_APP_BASE_URL as string);
