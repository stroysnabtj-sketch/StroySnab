export const registrationPasswordHint =
  "От 8 символов, заглавная и строчная буквы, цифра и специальный символ.";

export function registrationPasswordError(password: string, confirmation: string) {
  if (
    [...password].length < 8 ||
    new TextEncoder().encode(password).length > 72 ||
    !/\p{Lu}/u.test(password) ||
    !/\p{Ll}/u.test(password) ||
    !/[0-9]/.test(password) ||
    !/[\p{P}\p{S}]/u.test(password)
  )
    return registrationPasswordHint;
  if (password !== confirmation) return "Пароли не совпадают.";
  return "";
}
