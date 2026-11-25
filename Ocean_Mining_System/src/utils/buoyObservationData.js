export function validObservationValue(record, field) {
  if (Array.isArray(record?.invalid) && record.invalid.includes(field)) return null;
  const value = record?.values?.[field];
  if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

// The observation endpoints return records in ascending observation time.
export function lastValidObservation(records, field) {
  for (let index = records.length - 1; index >= 0; index--) {
    const value = validObservationValue(records[index], field);
    if (value !== null) return { record: records[index], value };
  }
  return null;
}
