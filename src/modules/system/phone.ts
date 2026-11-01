export function normalizePhone(input: string): string {
  const compact = input.trim().replace(/[\s\-()]/g, "");
  let digits = compact;
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) throw new Error("phone_invalid");
  if (/^0\d{9}$/.test(digits)) digits = `992${digits.slice(1)}`;
  else if (/^\d{9}$/.test(digits)) digits = `992${digits}`;
  if (digits.length < 8 || digits.length > 15) throw new Error("phone_invalid");
  return `+${digits}`;
}

export function maskPhone(phone: string): string {
  return phone.replace(/^(\+\d{5})\d+(\d{4})$/, "$1***$2");
}
