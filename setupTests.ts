// setupTests.ts

import 'cross-fetch/polyfill'; // Polyfill fetch and Response

import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// Polyfill TextEncoder and TextDecoder if they are not defined
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = NodeTextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = NodeTextDecoder;
}

import '@testing-library/jest-dom';
