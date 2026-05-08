export const daysSince = (dateStr?: string | null) => {
  if (!dateStr) return null;
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
};

export const todayLocalISODate = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

export const dueDateOnly = (dateStr: string) => dateStr.slice(0, 10);

export const isDueToday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  return dueDateOnly(dateStr) === todayLocalISODate();
};

export const isOverdue = (dateStr?: string | null) => {
  if (!dateStr) return false;
  return dueDateOnly(dateStr) < todayLocalISODate();
};

export const daysOverdue = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const due = new Date(dueDateOnly(dateStr) + "T00:00:00");
  const today = new Date(todayLocalISODate() + "T00:00:00");
  const diff = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : null;
};

export const isCompletedToday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const localISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return localISO === todayLocalISODate();
};
