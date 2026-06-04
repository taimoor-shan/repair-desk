import { getNextRepairSeq, getNextSaleSeq } from './api';

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function pad(n) {
  return String(n).padStart(4, '0');
}

export async function generateRepairNumber() {
  const seq = await getNextRepairSeq();
  return `REP-${todayStr()}-${pad(seq)}`;
}

export async function generateSaleNumber() {
  const seq = await getNextSaleSeq();
  return `SAL-${todayStr()}-${pad(seq)}`;
}
