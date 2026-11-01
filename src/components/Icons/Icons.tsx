/**
 * Icons — one stroke, one weight, currentColor. Drawn, not emoji.
 * 24 viewBox, 1.75 stroke, round caps. Color comes from the parent.
 */

import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function svg(size: number, children: ReactNode) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
      {children}
    </svg>
  );
}

export const IconMenu = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
  </>);

export const IconBook = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20" />
  </>);

export const IconMoon = ({ size = 20 }: IconProps) =>
  svg(size, <path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" />);

export const IconSun = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M18.4 5.6l-1.1 1.1M6.7 17.3l-1.1 1.1" />
  </>);

export const IconSpeaker = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" />
    <path d="M16 9.5a3.2 3.2 0 0 1 0 5" />
    <path d="M18 7.2a6.4 6.4 0 0 1 0 9.6" />
  </>);

export const IconSettings = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4" />
  </>);

export const IconCloud = ({ size = 20 }: IconProps) =>
  svg(size, <path d="M7 18h9.2a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.6A3.6 3.6 0 0 0 7 18z" />);

export const IconCloudOff = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M7 18h9.2a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-2.2-.7" />
    <path d="M8.2 7.4A5.5 5.5 0 0 0 6.2 11.6 3.6 3.6 0 0 0 7 18" />
    <path d="M4 4l16 16" />
  </>);

export const IconAlert = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M12 3.5 2.8 19.5h18.4z" />
    <path d="M12 10v4" /><path d="M12 16.6v.4" />
  </>);

export const IconFolder = ({ size = 20 }: IconProps) =>
  svg(size, <path d="M3 7.5A2 2 0 0 1 5 5.5h4l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />);

export const IconRocket = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M14 10a8 8 0 0 0-6.5 9.5A8 8 0 0 0 14 10z" />
    <path d="M14 10c2-3 2.5-6.5 2.5-6.5S18 6 16.5 9" />
    <path d="M7.5 14 4 17.5" /><path d="M9 17.5 6.5 20" />
    <circle cx="12.2" cy="11.8" r="1" />
  </>);

export const IconPlay = ({ size = 20 }: IconProps) =>
  svg(size, <path d="M8 5.5v13l11-6.5z" />);

export const IconHourglass = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M7 4h10M7 20h10" />
    <path d="M8 4c0 4 4 4.5 4 8s-4 4-4 8M16 4c0 4-4 4.5-4 8s4 4 4 8" />
  </>);

export const IconPower = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M12 3.5v7" />
    <path d="M7.2 6.2a7 7 0 1 0 9.6 0" />
  </>);

export const IconCheckCircle = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2 11 14.7l4.5-5" />
  </>);

export const IconChevron = ({ size = 16 }: IconProps) =>
  svg(size, <path d="M9 6l6 6-6 6" />);

export const IconPen = ({ size = 20 }: IconProps) =>
  svg(size, <>
    <path d="M4 20l1.2-4.2L16.5 4.5a1.8 1.8 0 0 1 2.5 2.5L7.7 18.3z" />
    <path d="M13.8 6.2l3.5 3.5" />
  </>);
