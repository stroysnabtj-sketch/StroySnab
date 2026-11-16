export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "power-tools": "setevoy-elektroinstrument",
  tools: "stroitelnyy-ruchnoy-instrument",
  fasteners: "osnastka-i-raskhodniki",
  electric: "setevoy-elektroinstrument",
  finishing: "stroitelnyy-ruchnoy-instrument",
  paint: "germetiki-i-kleyevye-prinadlezhnosti",
  cement: "stroitelnyy-ruchnoy-instrument",
  metal: "osnastka-i-raskhodniki",
  masonry: "stroitelnyy-ruchnoy-instrument",
  roofing: "stroitelnyy-ruchnoy-instrument",
  plumbing: "stroitelnyy-ruchnoy-instrument",
};

export function legacyCategoryTarget(source: string, productName: string): string | undefined {
  void productName;
  return LEGACY_CATEGORY_REDIRECTS[source];
}
