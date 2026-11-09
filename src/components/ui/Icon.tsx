// Inline stroke icons that take the text colour, replacing the coloured SVG files in public/assets
import { ReactNode } from 'react';

interface IconDefinition {
  viewBox: string;
  strokeWidth: number;
  body: ReactNode;
}

export type IconName =
  | 'plus'
  | 'search'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-right'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'close'
  | 'check'
  | 'info'
  | 'alert'
  | 'download'
  | 'menu'
  | 'filter'
  | 'copy'
  | 'sign-out'
  | 'user';

const ICONS: Record<IconName, IconDefinition> = {
  plus: { viewBox: '0 0 16 16', strokeWidth: 2, body: <path d="M8 3v10M3 8h10" /> },
  search: {
    viewBox: '0 0 16 16',
    strokeWidth: 1.6,
    body: (
      <>
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </>
    ),
  },
  'chevron-down': { viewBox: '0 0 12 12', strokeWidth: 1.6, body: <path d="M2.5 4.5 6 8l3.5-3.5" /> },
  'chevron-up': { viewBox: '0 0 12 12', strokeWidth: 1.6, body: <path d="M2.5 7.5 6 4l3.5 3.5" /> },
  'chevron-right': { viewBox: '0 0 12 12', strokeWidth: 1.8, body: <path d="m4.5 2.5 3.5 3.5-3.5 3.5" /> },
  'arrow-left': { viewBox: '0 0 16 16', strokeWidth: 1.8, body: <path d="M13 8H3M7 4 3 8l4 4" /> },
  'arrow-right': { viewBox: '0 0 16 16', strokeWidth: 1.8, body: <path d="M3 8h10M9 4l4 4-4 4" /> },
  'arrow-up': { viewBox: '0 0 12 12', strokeWidth: 1.6, body: <path d="M6 9.5v-7M3 5.5l3-3 3 3" /> },
  'arrow-down': { viewBox: '0 0 12 12', strokeWidth: 1.6, body: <path d="M6 2.5v7M3 6.5l3 3 3-3" /> },
  close: { viewBox: '0 0 14 14', strokeWidth: 1.8, body: <path d="M3 3l8 8M11 3l-8 8" /> },
  check: { viewBox: '0 0 12 12', strokeWidth: 2, body: <path d="m2.5 6.5 2.5 2.5 4.5-5" /> },
  info: {
    viewBox: '0 0 14 14',
    strokeWidth: 1.6,
    body: (
      <>
        <circle cx="7" cy="7" r="5.5" />
        <path d="M7 6.5V10M7 4.2v.2" />
      </>
    ),
  },
  alert: {
    viewBox: '0 0 14 14',
    strokeWidth: 1.6,
    body: (
      <>
        <circle cx="7" cy="7" r="5.5" />
        <path d="M7 4v3.5M7 9.8v.2" />
      </>
    ),
  },
  download: { viewBox: '0 0 16 16', strokeWidth: 1.8, body: <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M3 13h10" /> },
  menu: { viewBox: '0 0 20 14', strokeWidth: 2, body: <path d="M1 1h18M1 7h18M1 13h18" /> },
  filter: { viewBox: '0 0 14 14', strokeWidth: 1.6, body: <path d="M1 3h12M3.5 7h7M6 11h2" /> },
  copy: {
    viewBox: '0 0 16 16',
    strokeWidth: 1.5,
    body: (
      <>
        <rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1.5" />
        <path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2" />
      </>
    ),
  },
  'sign-out': {
    viewBox: '0 0 16 16',
    strokeWidth: 1.6,
    body: <path d="M6 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2H6M10.5 11.5 14 8l-3.5-3.5M14 8H6" />,
  },
  user: {
    viewBox: '0 0 16 16',
    strokeWidth: 1.6,
    body: (
      <>
        <circle cx="8" cy="5.5" r="3" />
        <path d="M2.5 14c.8-2.8 3-4.5 5.5-4.5s4.7 1.7 5.5 4.5" />
      </>
    ),
  },
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 16, className }) => {
  const icon = ICONS[name];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icon.body}
    </svg>
  );
};

export default Icon;
