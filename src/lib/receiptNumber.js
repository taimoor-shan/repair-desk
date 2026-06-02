import { getSettings, updateSettings } from '../db/db';

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function pad(n) {
  return String(n).padStart(4, '0');
}

export async function generateRepairNumber() {
  const s = await getSettings();
  const today = todayStr();

  if (s.lastRepairDate !== today) {
    s.lastRepairSeq = 1;
    s.lastRepairDate = today;
  } else {
    s.lastRepairSeq += 1;
  }

  await updateSettings({
    lastRepairSeq: s.lastRepairSeq,
    lastRepairDate: s.lastRepairDate,
  });

  return `REP-${today}-${pad(s.lastRepairSeq)}`;
}

export async function generateSaleNumber() {
  const s = await getSettings();
  const today = todayStr();

  if (s.lastSaleDate !== today) {
    s.lastSaleSeq = 1;
    s.lastSaleDate = today;
  } else {
    s.lastSaleSeq += 1;
  }

  await updateSettings({
    lastSaleSeq: s.lastSaleSeq,
    lastSaleDate: s.lastSaleDate,
  });

  return `SAL-${today}-${pad(s.lastSaleSeq)}`;
}
