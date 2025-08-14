export const getNextNewYear = (now = new Date()) => {
  const y = now.getFullYear();
  const next = new Date(y + 1, 0, 1, 0, 0, 0); // 1 Ene del año siguiente (hora local)
  return now >= next ? new Date(y + 2, 0, 1, 0, 0, 0) : next;
};

export const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);