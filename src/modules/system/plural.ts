export function countNoun(count: number, one: string, few: string, many: string) {
  const lastTwo = Math.abs(count) % 100;
  const last = lastTwo % 10;
  return `${count} ${lastTwo >= 11 && lastTwo <= 14 ? many : last === 1 ? one : last >= 2 && last <= 4 ? few : many}`;
}
