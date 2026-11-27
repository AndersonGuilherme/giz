import { useId } from 'react';

// The giz mark: a yellow chalk speech bubble with a friendly face (the same drawing as assets/icon/icon.svg).
const BUBBLE = 'M64 9 C93 8.5 117 28 117.5 57 C118 86 95 105 65 105.5 C56 105.6 48 104 41 101 L19 115 C17 116.2 15 114.5 15.8 112.4 L23.5 91 C15 82 10.5 70.5 10.5 57.5 C10 29 34 9.5 64 9 Z';
const SLATE = '#26302d';
const CHALK = '#f3efe2';
const BLUSH = '#e8735a';

// Rough chalk edges: the outline is nudged by a little noise.
function ChalkFilter({ id }: Readonly<{ id: string }>) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.6} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

function Face() {
  return (
    <>
      <ellipse cx="46" cy="51" rx="7" ry="9" fill={SLATE} />
      <ellipse cx="82" cy="51" rx="7" ry="9" fill={SLATE} />
      <circle cx="48.5" cy="47.5" r="2.4" fill={CHALK} />
      <circle cx="84.5" cy="47.5" r="2.4" fill={CHALK} />
      <ellipse cx="34" cy="68" rx="6.5" ry="4.5" fill={BLUSH} opacity="0.85" />
      <ellipse cx="94" cy="68" rx="6.5" ry="4.5" fill={BLUSH} opacity="0.85" />
      <path d="M50 70 C56 81 72 81.5 78 70" fill="none" stroke={SLATE} strokeWidth="6.5" />
    </>
  );
}

/** The logo, drawn inline (no file to load, so the page's Content-Security-Policy is untouched). */
export function Logo() {
  const filter = `chalk${useId().replace(/:/g, '')}`;
  return (
    <svg className="logo" viewBox="0 0 128 128" width="48" height="48" aria-hidden="true">
      <defs><ChalkFilter id={filter} /></defs>
      <g filter={`url(#${filter})`} strokeLinecap="round" strokeLinejoin="round">
        <path d={BUBBLE} fill="#f2c14e" stroke={CHALK} strokeWidth="6.5" />
        <Face />
      </g>
    </svg>
  );
}
