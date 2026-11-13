export const registrationPasswordHint =
  "От 8 символов, заглавная и строчная буквы, цифра и специальный символ.";

export function passwordRequirements(password: string) {
  return [
    {
      key: "length",
      label: "Не менее 8 символов",
      met: [...password].length >= 8 && new TextEncoder().encode(password).length <= 72,
    },
    { key: "upper", label: "Заглавная буква", met: /\p{Lu}/u.test(password) },
    { key: "lower", label: "Строчная буква", met: /\p{Ll}/u.test(password) },
    { key: "digit", label: "Цифра", met: /[0-9]/.test(password) },
    { key: "symbol", label: "Специальный символ", met: /[\p{P}\p{S}]/u.test(password) },
  ];
}
export function registrationPasswordError(password: string, confirmation: string) {
  if (!passwordRequirements(password).every((rule) => rule.met)) return registrationPasswordHint;
  if (password !== confirmation) return "Пароли не совпадают.";
  return "";
}
