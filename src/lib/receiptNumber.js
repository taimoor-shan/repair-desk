import { getNextRepairSeq, getNextSaleSeq } from './api';
import { localDateString } from './helpers';

function todayStr() {
  return localDateString().replace(/-/g, '');
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
