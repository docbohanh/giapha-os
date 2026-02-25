"use client";

import Image from "next/image";

export default function DefaultAvatar({ gender }: { gender?: string }) {
  if (gender === "male") {
    return (
      <Image
        src="/default_male.jpg"
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
        src="/default_female.jpg"
        alt="Nữ"
        width={64}
        height={64}
        className="w-full h-full object-cover"
      />
    );
  }
  // Giới tính không xác định — dùng ảnh nam làm fallback
  return (
    <Image
      src="/default_male.jpg"
      alt="Mặc định"
      width={64}
      height={64}
      className="w-full h-full object-cover"
    />
  );
}
