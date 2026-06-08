import { ICON_PATHS, type IconName, type IconShape } from './icon-map';

export type { IconName };

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  /** Accessible label; when omitted the icon is treated as decorative. */
  title?: string;
}

export function Icon({
  name,
  size = 18,
  color,
  strokeWidth = 1.7,
  className,
  title,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {ICON_PATHS[name].map((shape, index) => (
        <IconShapeNode key={index} shape={shape} />
      ))}
    </svg>
  );
}

function IconShapeNode({ shape }: { shape: IconShape }) {
  switch (shape[0]) {
    case 'p':
      return (
        <path d={shape[1]} fill={shape[2]?.fill} stroke={shape[2]?.stroke} strokeWidth={shape[2]?.sw} />
      );
    case 'r':
      return <rect x={shape[1]} y={shape[2]} width={shape[3]} height={shape[4]} rx={shape[5]} />;
    case 'c':
      return (
        <circle cx={shape[1]} cy={shape[2]} r={shape[3]} fill={shape[4] ? 'currentColor' : undefined} />
      );
    default:
      shape satisfies never;
      return null;
  }
}
