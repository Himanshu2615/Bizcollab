/**
 * Formats a number into Indian Rupee (Lakhs/Crores) currency format
 * @param {number} v - The value to format
 * @returns {string} Formatted string
 */
export const fmtL = (v) => {
  if (!v && v !== 0) return '—';
  
  const absV = Math.abs(v);
  const sign = v < 0 ? '-' : '';

  if (absV >= 10000000) {
    return `${sign}₹${(absV / 10000000).toFixed(1)}Cr`;
  }
  if (absV >= 100000) {
    return `${sign}₹${(absV / 100000).toFixed(1)}L`;
  }
  
  return `${sign}₹${absV.toLocaleString('en-IN')}`;
};
