/**
 * Kushoniyon / STROYHUB.TJ / Stroysnab.tj
 * Полное дерево категорий и умные фильтры каталога JCTOP 2026
 */

export interface SmartFilterDefinition {
  key: string;
  label: string;
  type: "checkbox" | "range" | "select" | "boolean";
  unit?: string;
  options?: string[];
  isExtra?: boolean;
  recommended?: boolean;
}

export interface ChildCategoryNode {
  slug: string;
  nameRu: string;
  nameTg?: string;
  isMixed?: boolean;
}

export interface SubcategoryNode {
  slug: string;
  nameRu: string;
  nameTg?: string;
  description?: string;
  children?: ChildCategoryNode[];
}

export interface TopCategoryNode {
  slug: string;
  nameRu: string;
  nameTg?: string;
  icon: string;
  description: string;
  subcategories: SubcategoryNode[];
}

export const CATEGORIES_TREE: TopCategoryNode[] = [
  {
    slug: "akkumulyatornyy-instrument",
    nameRu: "Аккумуляторный инструмент",
    nameTg: "Асбобҳои барқии аккумулаторӣ",
    icon: "BatteryCharging",
    description: "Дрели, шуруповёрты, гайковёрты, УШМ, перфораторы и пилы JCTOP",
    subcategories: [],
  },
  {
    slug: "setevoy-elektroinstrument",
    nameRu: "Сетевой электроинструмент",
    nameTg: "Асбобҳои барқии шабакавӣ",
    icon: "Zap",
    description: "Угловые шлифмашины, перфораторы, отбойные молотки и пилы",
    subcategories: [],
  },
  {
    slug: "silovoe-oborudovanie",
    nameRu: "Силовое оборудование",
    nameTg: "Таҷҳизоти барқдиҳӣ ва муҳаррикҳо",
    icon: "Cpu",
    description: "Бензиновые и дизельные генераторы, мотопомпы и вибраторы",
    subcategories: [],
  },
  {
    slug: "ruletki-i-izmeritelnye-pribory",
    nameRu: "Рулетки и измерительные приборы",
    nameTg: "Ченакҳо ва асбобҳои ченкунӣ",
    icon: "Ruler",
    description: "Строительные рулетки, уровни, мультиметры и весы",
    subcategories: [],
  },
  {
    slug: "klyuchi-i-nabory-golovok",
    nameRu: "Ключи и наборы головок",
    nameTg: "Калидҳо ва маҷмӯи саракҳо",
    icon: "Wrench",
    description: "Комбинированные, накидные, разводные ключи и торцевые головки",
    subcategories: [],
  },
  {
    slug: "ploskogubtsy-i-kleshchi",
    nameRu: "Плоскогубцы и клещи",
    nameTg: "Анбӯрҳо ва кандворҳо",
    icon: "Scissors",
    description: "Плоскогубцы, длинногубцы, болторезы и переставные клещи",
    subcategories: [],
  },
  {
    slug: "molotki-i-kuvaldy",
    nameRu: "Молотки и кувалды",
    nameTg: "Болғаҳо ва гурзҳо",
    icon: "Hammer",
    description: "Молотки-гвоздодёры, кувалды, киянки и топорики",
    subcategories: [],
  },
  {
    slug: "stroitelnyy-ruchnoy-instrument",
    nameRu: "Строительный ручной инструмент",
    nameTg: "Асбобҳои дастии сохтмонӣ",
    icon: "Construction",
    description: "Шпатели, кельмы, стамески, заклёпочники и правила",
    subcategories: [],
  },
  {
    slug: "rezhushchiy-ruchnoy-instrument",
    nameRu: "Режущий ручной инструмент",
    nameTg: "Асбобҳои дастии буранда",
    icon: "PenTool",
    description: "Строительные ножи, лезвия, ножовки по металлу и дереву",
    subcategories: [],
  },
  {
    slug: "sadovyy-instrument",
    nameRu: "Садовый инструмент",
    nameTg: "Асбобҳои боғдорӣ",
    icon: "Trees",
    description: "Секаторы, кусторезы, садовые пилы и опрыскиватели",
    subcategories: [],
  },
  {
    slug: "otvyortki-i-nabory-bit",
    nameRu: "Отвёртки и наборы бит",
    nameTg: "Бурғуҳо (отвёрткаҳо) ва маҷмӯи битҳо",
    icon: "Crosshair",
    description: "Крестовые, шлицевые отвёртки и наборы бит",
    subcategories: [],
  },
  {
    slug: "osnastka-i-raskhodniki",
    nameRu: "Оснастка и расходники",
    nameTg: "Таҷҳизот ва маводи истеъмолӣ",
    icon: "Disc",
    description: "Отрезные диски, буры SDS-Plus, свёрла по металлу и бетону",
    subcategories: [],
  },
  {
    slug: "germetiki-i-kleyevye-prinadlezhnosti",
    nameRu: "Герметики и клеевые принадлежности",
    nameTg: "Герметикҳо ва лавозимоти ширешӣ",
    icon: "Droplet",
    description: "Силиконовые герметики, монтажная пена и пистолеты",
    subcategories: [],
  },
  {
    slug: "avtoinstrument-i-remont",
    nameRu: "Автоинструмент и ремонт",
    nameTg: "Асбобҳои худрав ва таъмир",
    icon: "Car",
    description: "Гидравлические домкраты, подставки и маслёнки",
    subcategories: [],
  },
  {
    slug: "zashchitnaya-ekipirovka-i-bezopasnost",
    nameRu: "Защитная экипировка и безопасность",
    nameTg: "Либоси муҳофизатӣ ва бехатарӣ",
    icon: "ShieldCheck",
    description: "Рабочая обувь, перчатки, респираторы, очки и маски",
    subcategories: [],
  },
  {
    slug: "svarochnye-prinadlezhnosti",
    nameRu: "Сварочные принадлежности",
    nameTg: "Лавозимоти кафшергарӣ",
    icon: "Flame",
    description: "Сварочные электроды, держатели и паяльники для труб",
    subcategories: [],
  },
  {
    slug: "strubtsiny-i-prisoski",
    nameRu: "Струбцины и присоски",
    nameTg: "Гирандаҳо (струбсинаҳо) ва макандаҳо",
    icon: "Anchor",
    description: "G-образные струбцины, тиски и вакуумные присоски",
    subcategories: [],
  },
  {
    slug: "reklamnaya-produktsiya",
    nameRu: "Рекламная продукция",
    nameTg: "Маҳсулоти таблиғотӣ",
    icon: "Sparkles",
    description: "Фирменные стенды JCTOP, рекламные поло и баннеры",
    subcategories: [],
  },
];

export const CATEGORY_SMART_FILTERS: Record<string, SmartFilterDefinition[]> = {
  "akkumulyatornyy-instrument": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Напряжение", label: "Напряжение аккумулятора", type: "checkbox", recommended: true },
    { key: "Размер", label: "Патрон / Размер", type: "checkbox" },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "setevoy-elektroinstrument": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Мощность", label: "Потребляемая мощность", type: "checkbox", recommended: true },
    { key: "Размер", label: "Диаметр диска / патрона", type: "checkbox" },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "silovoe-oborudovanie": [
    { key: "Тип", label: "Тип оборудования", type: "checkbox", recommended: true },
    { key: "Мощность", label: "Мощность", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "ruletki-i-izmeritelnye-pribory": [
    { key: "Тип", label: "Тип прибора", type: "checkbox", recommended: true },
    { key: "Размер", label: "Длина / Размер", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "klyuchi-i-nabory-golovok": [
    { key: "Тип", label: "Тип ключа", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер ключа / головки", type: "checkbox", recommended: true },
    { key: "Количество предметов", label: "Количество предметов", type: "checkbox" },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "ploskogubtsy-i-kleshchi": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер / Длина", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "molotki-i-kuvaldy": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Вес / Характеристика", type: "checkbox", recommended: true },
  ],
  "stroitelnyy-ruchnoy-instrument": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер / Ширина", type: "checkbox", recommended: true },
    { key: "Количество предметов", label: "Количество предметов", type: "checkbox" },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "rezhushchiy-ruchnoy-instrument": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер лезвия", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "sadovyy-instrument": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер / Длина", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "otvyortki-i-nabory-bit": [
    { key: "Тип", label: "Тип отвёртки", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер / Длина", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "osnastka-i-raskhodniki": [
    { key: "Тип", label: "Вид оснастки", type: "checkbox", recommended: true },
    { key: "Размер", label: "Диаметр / Размер", type: "checkbox", recommended: true },
    { key: "Зернистость", label: "Зернистость", type: "checkbox" },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "germetiki-i-kleyevye-prinadlezhnosti": [
    { key: "Тип", label: "Тип материала", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Объём / Вес", type: "checkbox", recommended: true },
  ],
  "avtoinstrument-i-remont": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Грузоподъёмность / Вес", type: "checkbox", recommended: true },
  ],
  "zashchitnaya-ekipirovka-i-bezopasnost": [
    { key: "Тип", label: "Вид экипировки", type: "checkbox", recommended: true },
    { key: "Размер обуви", label: "Размер обуви", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "svarochnye-prinadlezhnosti": [
    { key: "Тип", label: "Вид принадлежностей", type: "checkbox", recommended: true },
    { key: "Размер", label: "Диаметр / Размер", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "strubtsiny-i-prisoski": [
    { key: "Тип", label: "Тип инструмента", type: "checkbox", recommended: true },
    { key: "Размер", label: "Размер / Захват", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Характеристика", type: "checkbox" },
  ],
  "reklamnaya-produktsiya": [
    { key: "Тип", label: "Тип продукции", type: "checkbox", recommended: true },
    { key: "Характеристика", label: "Размер / Характеристика", type: "checkbox", recommended: true },
  ],
  gipsokarton: [{ key: "tolshchina-lista", label: "Толщина листа", type: "range", unit: "мм" }],
};

const DEFAULT_FILTERS: SmartFilterDefinition[] = [
  { key: "Тип", label: "Тип инструмента", type: "checkbox" },
  { key: "Характеристика", label: "Характеристика", type: "checkbox" },
];

export function getSmartFiltersForCategory(categorySlug?: string | null): SmartFilterDefinition[] {
  if (!categorySlug) return DEFAULT_FILTERS;
  return CATEGORY_SMART_FILTERS[categorySlug] ?? DEFAULT_FILTERS;
}

export function findCategoryNodeBySlug(slug: string): {
  top?: TopCategoryNode;
  sub?: SubcategoryNode;
  child?: ChildCategoryNode;
} {
  for (const top of CATEGORIES_TREE) {
    if (top.slug === slug) return { top };
    for (const sub of top.subcategories) {
      if (sub.slug === slug) return { top, sub };
      for (const child of sub.children ?? []) {
        if (child.slug === slug) return { top, sub, child };
      }
    }
  }
  return {};
}

export function getAllDescendantSlugs(slug: string): string[] {
  const node = findCategoryNodeBySlug(slug);
  if (node.child) return [node.child.slug];
  if (node.sub) return [node.sub.slug, ...(node.sub.children ?? []).map((c) => c.slug)];
  if (node.top) {
    return [
      node.top.slug,
      ...node.top.subcategories.flatMap((s) => [s.slug, ...(s.children ?? []).map((c) => c.slug)]),
    ];
  }
  return [slug];
}

export function getCategoryProfile(slug?: string | null) {
  if (!slug) return undefined;
  const node = findCategoryNodeBySlug(slug);
  if (!node.top) return undefined;
  const filters = getSmartFiltersForCategory(slug);
  const primary = filters.filter((f) => f.recommended).map((f) => f.label);
  const additional = filters.filter((f) => !f.recommended).map((f) => f.label);
  return {
    path: [node.top.nameRu],
    mixed: false,
    primary,
    additional,
    filters,
  };
}

export function getProductAttributeFields(
  slug: string | undefined,
  values: Record<string, string> = {},
) {
  void values;
  return getSmartFiltersForCategory(slug).filter(
    (field) => !["brand", "price", "inStock"].includes(field.key),
  );
}

export const REFERENCE_CATEGORY_SLUGS = new Set(
  CATEGORIES_TREE.flatMap((top) => [
    top.slug,
    ...top.subcategories.flatMap((sub) => [
      sub.slug,
      ...(sub.children ?? []).map((child) => child.slug),
    ]),
  ]),
);

export function getRelevantProductAttributes(
  slug: string | undefined,
  values: Record<string, string>,
) {
  void slug;
  return values;
}
