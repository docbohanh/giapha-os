import { Solar } from "lunar-javascript";

export function formatDisplayDate(
  year: number | null,
  month: number | null,
  day: number | null,
): string {
  if (!year && !month && !day) return "Chưa rõ";

  const parts = [];
  if (day) parts.push(day.toString().padStart(2, "0"));
  if (month) parts.push(month.toString().padStart(2, "0"));
  if (year) parts.push(year.toString());

  return parts.join("/");
}

export function getLunarDateString(
  year: number | null,
  month: number | null,
  day: number | null,
): string | null {
  if (!year || !month || !day) return null;

  try {
    const solar = Solar.fromYmd(
      year,
      parseInt(month.toString()),
      parseInt(day.toString()),
    );
    const lunar = solar.getLunar();

    const lDay = lunar.getDay().toString().padStart(2, "0");
    const lMonthRaw = lunar.getMonth();
    const isLeap = lMonthRaw < 0;
    const lMonth = Math.abs(lMonthRaw).toString().padStart(2, "0");
    const lYear = lunar.getYear();

    return `${lDay}/${lMonth}${isLeap ? " nhuận" : ""}/${lYear}`;
  } catch (error) {
    console.error("Lunar conversion error:", error);
    return null;
  }
}

export function calculateAge(
  birthYear: number | null,
  deathYear: number | null,
): { age: number; isDeceased: boolean } | null {
  if (!birthYear) return null;

  if (deathYear) {
    return { age: deathYear - birthYear, isDeceased: true };
  }

  return { age: new Date().getFullYear() - birthYear, isDeceased: false };
}

export function timeAgo(date: Date | string | number): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 30) return `${days} ngày trước`;
  if (months < 12) return `${months} tháng trước`;
  return `${years} năm trước`;
}
