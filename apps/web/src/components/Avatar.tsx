"use client";

interface AvatarProps {
  email: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

function getInitial(email: string): string {
  return email.charAt(0).toUpperCase();
}

function hashColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export function Avatar({ email, avatarUrl, size = 32, className = "" }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={email}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: hashColor(email),
        fontSize: size * 0.45,
      }}
    >
      {getInitial(email)}
    </div>
  );
}
