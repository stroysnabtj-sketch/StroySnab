export function safeAuthDestination(value: string | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value))
    return "/account";
  return value;
}
