// Reviewed narrow mappings. Ambiguous groups stay unchanged for manual review.
export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "cement-bags": "tsement-beton",
  rebar: "metalloprokat",
  "metal-profile": "metalloprokat",
  brick: "kirpich",
  blocks: "stroitelnye-bloki",
  "roof-sheets": "krovelnye-materialy",
  insulation: "mineralnaya-vata",
  pipes: "truby-i-fitingi-iz-ppr",
  fittings: "truby-i-fitingi-iz-ppr",
  cables: "kabel-i-provod-mednyy",
  "electrical-panels": "elektricheskie-shchity",
  paint: "interernye-kraski",
  plaster: "shpaklevki",
  "power-tools": "perforatory-i-otboynye-molotki",
  fasteners: "samorezy-i-shurupy",
};
export function legacyCategoryTarget(source: string, productName: string): string | undefined {
  const name = productName.toLocaleLowerCase("ru").replaceAll("ё", "е");
  const rules: Record<string, [RegExp, string]> = {
    "cement-bags": [/цемент/, "tsement-beton"],
    rebar: [/арматур/, "metalloprokat"],
    "metal-profile": [/труба профильная|профиль.*сталь/, "metalloprokat"],
    brick: [/кирпич/, "kirpich"],
    blocks: [/блок.*стенов/, "stroitelnye-bloki"],
    "roof-sheets": [/профнастил/, "krovelnye-materialy"],
    insulation: [/минеральн/, "mineralnaya-vata"],
    pipes: [/полипропилен/, "truby-i-fitingi-iz-ppr"],
    fittings: [/полипропилен/, "truby-i-fitingi-iz-ppr"],
    cables: [/кабель ввг/, "kabel-i-provod-mednyy"],
    "electrical-panels": [/щит электрическ/, "elektricheskie-shchity"],
    paint: [/краска интерьерн/, "interernye-kraski"],
    plaster: [/шпатлевк|шпаклевк/, "shpaklevki"],
    "power-tools": [/перфоратор/, "perforatory-i-otboynye-molotki"],
    fasteners: [/саморез/, "samorezy-i-shurupy"],
  };
  const rule = rules[source];
  return rule?.[0].test(name) ? rule[1] : undefined;
}
