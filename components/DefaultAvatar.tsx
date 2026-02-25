"use client";

import Image from "next/image";

interface DefaultAvatarProps {
  gender?: string;
  isDeceased?: boolean;
}

export default function DefaultAvatar({ gender, isDeceased = false }: DefaultAvatarProps) {
  if (gender === "male") {
    return (
      <Image
        src={isDeceased ? "/default-male.jpg" : "/default-male-alive.png"}
        alt="Nam"
        width={64}
        height={64}
        className="w-full h-full object-cover"
      />
    );
  }
  if (gender === "female") {
    return (
      <Image
        src={isDeceased ? "/default-female.jpg" : "/default-female-alive.png"}
        alt="Nữ"
        width={64}
        height={64}
        className="w-full h-full object-cover"
      />
    );
  }
  // Fallback
  return (
    <Image
      src={isDeceased ? "/default-male.jpg" : "/default-male-alive.png"}
      alt="Mặc định"
      width={64}
      height={64}
      className="w-full h-full object-cover"
    />
  );
}
