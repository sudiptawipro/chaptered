function isDateString(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) && !isNaN(Date.parse(val));
}

export function reviveDatesExternal(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (isDateString(obj)) return new Date(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(reviveDatesExternal);
  if (typeof obj === 'object') {
    const out: any = {};
    for (const key in obj) out[key] = reviveDatesExternal(obj[key]);
    return out;
  }
  return obj;
}
