import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  square?: boolean;
  className?: string;
  color?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, src, size = 36, square = false, className, color }: AvatarProps) {
  const fontSize = Math.round(size * 0.36);
  const shape = square ? 'rounded-sm' : 'rounded-full';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn('shrink-0 object-cover', shape, className)}
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize, ...(color ? { backgroundColor: color } : {}) }}
      className={cn(
        'inline-grid shrink-0 place-items-center bg-avatar font-semibold text-white',
        shape,
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
