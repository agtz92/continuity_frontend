"use client";

import { useUserAvatar } from "@/hooks/useUserAvatar";

type Props = {
  size?: number;
  fallbackInitial?: string;
  className?: string;
};

export function UserAvatar({
  size = 36,
  fallbackInitial = "?",
  className = "",
}: Props) {
  const { avatarUrl } = useUserAvatar();
  const dim = { width: size, height: size };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        style={dim}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={dim}
      className={`rounded-full bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-text font-semibold shrink-0 ${className}`}
    >
      {fallbackInitial}
    </div>
  );
}
