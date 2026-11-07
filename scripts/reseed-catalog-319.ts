import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import {
  categories,
  productAttributes,
  products,
  supplierOffers,
  suppliers,
} from "../src/db/schema";

async function run() {
  console.log("Starting catalog reseed and category assignment...");
  const db = await getDb();

  // 1. Загружаем всех поставщиков
  const allSuppliers = await db.select().from(suppliers);
  if (allSuppliers.length === 0) {
    console.error("No suppliers found in database!");
    await closeDb();
    return;
  }
  console.log(`Found ${allSuppliers.length} suppliers.`);

  // 2. Загружаем все категории
  const allCats = await db.select().from(categories);
  const catBySlug = new Map(allCats.map((c) => [c.slug, c]));
  console.log(`Found ${allCats.length} categories in database.`);

  // 3. Перепривязка существующих 240 товаров к новым категориям
  const existingProducts = await db.select().from(products);
  console.log(`Analyzing ${existingProducts.length} existing products for remapping...`);

  // Маппинг ключевых слов на новые slug'и
  const keywordSlugMap: [RegExp, string][] = [
    [/цемент|бетон/i, "tsement-beton"],
    [/стяжк|пол|ровнитель/i, "smesi-dlya-pola"],
    [/шпаклев|шпатлев/i, "shpaklevki"],
    [/штукатур/i, "shtukaturki"],
    [/клей/i, "klei-dlya-plitki-i-kamnya"],
    [/затирк/i, "zatirki"],
    [/песок|щебень|гравий|зубок/i, "pesok-shcheben-zubok"],
    [/гипсокартон|гкл/i, "gipsokarton"],
    [/жби|перемычк|кольцо/i, "zhelezobetonnye-izdeliya"],
    [/кирпич/i, "kirpich"],
    [/кровл|профнастил|черепиц/i, "krovelnye-materialy"],
    [/арматур|прокат|швеллер|балк/i, "metalloprokat"],
    [/профиль.*стальн|труба профильн/i, "metalloprokat"],
    [/доск|брус|пиломатериал/i, "pilomaterialy"],
    [/проволок/i, "provoloka"],
    [/сетк/i, "setki"],
    [/блок/i, "stroitelnye-bloki"],
    [/вата|утеплител|минват/i, "mineralnaya-vata"],
    [/пеноплекс|пенопласт/i, "penopleks-penoplast"],
    [/рубероид|битум|толь/i, "ruberoid-tol"],
    [/герметик/i, "germetiki"],
    [/пена.*монтажн|монтажн.*пен/i, "montazhnye-peny"],
    [/краск|эмаль/i, "interernye-kraski"],
    [/лак/i, "laki"],
    [/ламинат/i, "laminat"],
    [/линолеум/i, "linoleum"],
    [/паркет/i, "parket"],
    [/плитк|керамогранит/i, "klei-dlya-plitki-i-kamnya"],
    [/обои/i, "vinilovye-oboi"],
    [/кабел|провод/i, "kabel-i-provod-mednyy"],
    [/автомат|выключател/i, "avtomaticheskie-vyklyuchateli"],
    [/розетк/i, "rozetki"],
    [/щит|бокс/i, "shchity-i-shkafy"],
    [/перфоратор|отбойн/i, "perforatory-i-otboynye-molotki"],
    [/дрель|шуруповерт/i, "dreli-i-shurupoverty"],
    [/ушм|болгарк/i, "perforatory-i-otboynye-molotki"],
    [/труб|фитинг/i, "truby-i-fitingi-iz-ppr"],
    [/саморез|шуруп/i, "samorezy-i-shurupy"],
    [/дюбел|анкер/i, "samorezy-i-shurupy"],
    [/крепеж/i, "samorezy-i-shurupy"],
  ];

  let remappedCount = 0;
  for (const p of existingProducts) {
    let targetSlug: string | null = null;
    for (const [regex, slug] of keywordSlugMap) {
      if (regex.test(p.nameRu) || regex.test(p.slug)) {
        targetSlug = slug;
        break;
      }
    }

    if (!targetSlug) {
      targetSlug = "tsement-beton";
    }

    const targetCat = catBySlug.get(targetSlug);
    if (targetCat && targetCat.id !== p.categoryId) {
      await db
        .update(products)
        .set({ categoryId: targetCat.id })
        .where(eq(products.id, p.id));
      remappedCount++;
    }
  }
  console.log(`Remapped ${remappedCount} existing products to new leaf categories.`);

  // 4. Добавим аутентичные стройматериалы в ключевые листовые категории,
  // чтобы в каждой популярной категории были реальные товары!
  const newCatalogItems: {
    categorySlug: string;
    items: {
      name: string;
      baseSlug: string;
      brand: string;
      unit: string;
      priceTJS: number;
      stock: number;
      attrs: Record<string, string>;
    }[];
  }[] = [
    {
      categorySlug: "kirpich",
      items: [
        {
          name: "Кирпич керамический рядовой полнотелый М150",
          baseSlug: "brick-m150-red",
          brand: "Душанбе Кирпич",
          unit: "шт.",
          priceTJS: 1.8,
          stock: 45000,
          attrs: {
            "Материал кирпича": "Керамический",
            "Пустотность": "Полнотелый",
            "Формат кирпича": "Одинарный (1НФ)",
            "Марка прочности": "М150",
            "Морозостойкость F": "F50",
            "Цвет": "Красный",
            "Назначение": "Рядовой строительный",
          },
        },
        {
          name: "Кирпич силикатный пустотелый утолщенный М200",
          baseSlug: "brick-silicate-m200",
          brand: "Вахш Строй",
          unit: "шт.",
          priceTJS: 2.2,
          stock: 28000,
          attrs: {
            "Материал кирпича": "Силикатный",
            "Пустотность": "Пустотелый",
            "Формат кирпича": "Полуторный (1.4НФ)",
            "Марка прочности": "М200",
            "Морозостойкость F": "F75",
            "Цвет": "Белый",
            "Назначение": "Облицовочный и рядовой",
          },
        },
        {
          name: "Кирпич облицовочный клинкерный М300 Солома",
          baseSlug: "brick-clinker-m300",
          brand: "Памир Элит",
          unit: "шт.",
          priceTJS: 4.5,
          stock: 12000,
          attrs: {
            "Материал кирпича": "Клинкерный",
            "Пустотность": "Пустотелый",
            "Формат кирпича": "Одинарный (1НФ)",
            "Марка прочности": "М300",
            "Морозостойкость F": "F100",
            "Цвет": "Желтый / Солома",
            "Назначение": "Фасадный облицовочный",
          },
        },
        {
          name: "Кирпич огнеупорный шамотный ША-8",
          baseSlug: "brick-fireproof-sha8",
          brand: "Сомон Огнеупор",
          unit: "шт.",
          priceTJS: 8.5,
          stock: 6500,
          attrs: {
            "Материал кирпича": "Шамотный огнеупорный",
            "Пустотность": "Полнотелый",
            "Формат кирпича": "ША-8 (250х124х65)",
            "Марка прочности": "М150",
            "Цвет": "Песочный",
            "Назначение": "Для печей, каминов и дымоходов",
          },
        },
      ],
    },
    {
      categorySlug: "tsement-beton",
      items: [
        {
          name: "Цемент портландский ПЦ 500-Д0 50 кг (Хуаксин)",
          baseSlug: "cement-huaxin-m500-50kg",
          brand: "Huaxin Cement",
          unit: "мешок",
          priceTJS: 52,
          stock: 1800,
          attrs: {
            "Вид материала": "Портландцемент",
            "Марка цемента": "М500 Д0",
            "Класс прочности бетона": "В40",
            "Время схватывания": "Нормальнотвердеющий",
            "Морозостойкость": "F200",
            "Масса упаковки": "50 кг",
          },
        },
        {
          name: "Цемент строительный М400 Д20 50 кг (Точикцемент)",
          baseSlug: "cement-tojik-m400-50kg",
          brand: "Точикцемент",
          unit: "мешок",
          priceTJS: 46,
          stock: 2400,
          attrs: {
            "Вид материала": "Портландцемент с добавками",
            "Марка цемента": "М400 Д20",
            "Класс прочности бетона": "В30",
            "Время схватывания": "Нормальнотвердеющий",
            "Морозостойкость": "F150",
            "Масса упаковки": "50 кг",
          },
        },
        {
          name: "Бетон товарный готовый В25 (М350) с доставкой миксером",
          baseSlug: "concrete-ready-m350-m3",
          brand: "Бетон-Кушониён",
          unit: "м³",
          priceTJS: 480,
          stock: 350,
          attrs: {
            "Вид материала": "Товарный бетон",
            "Марка цемента": "М500 Д0",
            "Класс прочности бетона": "В25 (М350)",
            "Время схватывания": "Быстротвердеющий",
            "Морозостойкость": "F200",
            "Тип добавок": "Пластификатор противоморозный",
          },
        },
      ],
    },
    {
      categorySlug: "gipsokarton",
      items: [
        {
          name: "Гипсокартон Knauf влагостойкий ГСП-Н2 (ГСПВ) 2500х1200х12.5 мм",
          baseSlug: "gipsokarton-knauf-gspv-12-5",
          brand: "Knauf",
          unit: "лист",
          priceTJS: 64,
          stock: 1200,
          attrs: {
            "Тип листа": "Влагостойкий (ГКЛВ)",
            "Толщина листа": "12.5 мм",
            "Длина листа": "2500 мм",
            "Ширина листа": "1200 мм",
            "Влагостойкость": "Да",
            "Тип кромки": "Утоненная (ПЛУК)",
          },
        },
        {
          name: "Гипсокартон Knauf стандартный потолочный 2500х1200х9.5 мм",
          baseSlug: "gipsokarton-knauf-ceil-9-5",
          brand: "Knauf",
          unit: "лист",
          priceTJS: 54,
          stock: 1600,
          attrs: {
            "Тип листа": "Стандартный (ГКЛ)",
            "Толщина листа": "9.5 мм",
            "Длина листа": "2500 мм",
            "Ширина листа": "1200 мм",
            "Влагостойкость": "Нет",
            "Тип кромки": "Утоненная (ПЛУК)",
          },
        },
        {
          name: "Гипсокартон огнестойкий Knauf ГСП-DF 2500х1200х12.5 мм",
          baseSlug: "gipsokarton-knauf-fire-12-5",
          brand: "Knauf",
          unit: "лист",
          priceTJS: 78,
          stock: 650,
          attrs: {
            "Тип листа": "Огнестойкий (ГКЛО)",
            "Толщина листа": "12.5 мм",
            "Длина листа": "2500 мм",
            "Ширина листа": "1200 мм",
            "Огнестойкость": "Да",
            "Тип кромки": "Утоненная (ПЛУК)",
          },
        },
      ],
    },
    {
      categorySlug: "metalloprokat",
      items: [
        {
          name: "Арматура стальная рифлёная А500С Ø12 мм (длина 11.7 м)",
          baseSlug: "rebar-a500c-d12-11m",
          brand: "Металл-Трейд",
          unit: "тонна",
          priceTJS: 7800,
          stock: 85,
          attrs: {
            "Вид профиля": "Арматура рифлёная",
            "Марка стали": "А500С",
            "Сечение": "12 мм",
            "Толщина металла": "12 мм",
            "Длина изделия": "11.7 м",
            "Стандарт": "ГОСТ 52544-2006",
          },
        },
        {
          name: "Арматура стальная рифлёная А500С Ø16 мм (длина 11.7 м)",
          baseSlug: "rebar-a500c-d16-11m",
          brand: "Металл-Трейд",
          unit: "тонна",
          priceTJS: 7750,
          stock: 60,
          attrs: {
            "Вид профиля": "Арматура рифлёная",
            "Марка стали": "А500С",
            "Сечение": "16 мм",
            "Толщина металла": "16 мм",
            "Длина изделия": "11.7 м",
            "Стандарт": "ГОСТ 52544-2006",
          },
        },
        {
          name: "Труба профильная стальная 40х40х2.0 мм (длина 6 м)",
          baseSlug: "profile-tube-40x40x2",
          brand: "Северсталь",
          unit: "шт.",
          priceTJS: 115,
          stock: 850,
          attrs: {
            "Вид профиля": "Труба профильная квадратная",
            "Марка стали": "Ст3сп",
            "Сечение": "40х40 мм",
            "Толщина металла": "2.0 мм",
            "Длина изделия": "6 м",
            "Стандарт": "ГОСТ 8639-82",
          },
        },
        {
          name: "Швеллер стальной горячекатаный №12П (длина 12 м)",
          baseSlug: "shveller-12p-12m",
          brand: "Металл-Трейд",
          unit: "тонна",
          priceTJS: 9200,
          stock: 35,
          attrs: {
            "Вид профиля": "Швеллер",
            "Марка стали": "Ст3сп",
            "Сечение": "120 мм",
            "Толщина металла": "4.8 мм",
            "Длина изделия": "12 м",
            "Стандарт": "ГОСТ 8240-97",
          },
        },
      ],
    },
    {
      categorySlug: "stroitelnye-bloki",
      items: [
        {
          name: "Газобетонный блок автоклавный D500 (600х300х200 мм)",
          baseSlug: "gazoblock-d500-600x300x200",
          brand: "Газоблок-Таджикистан",
          unit: "шт.",
          priceTJS: 24,
          stock: 7500,
          attrs: {
            "Материал блока": "Автоклавный газобетон",
            "Плотность D": "D500",
            "Марка прочности": "В2.5",
            "Толщина": "300 мм",
            "Длина": "600 мм",
            "Высота": "200 мм",
            "Морозостойкость F": "F50",
            "Назначение": "Стеновой наружный",
          },
        },
        {
          name: "Пеноблок стеновой перегородочный D600 (600х100х300 мм)",
          baseSlug: "penoblock-d600-600x100x300",
          brand: "Вахш Строй",
          unit: "шт.",
          priceTJS: 12,
          stock: 9200,
          attrs: {
            "Материал блока": "Пенобетон",
            "Плотность D": "D600",
            "Марка прочности": "В2.0",
            "Толщина": "100 мм",
            "Длина": "600 мм",
            "Высота": "300 мм",
            "Назначение": "Межкомнатная перегородка",
          },
        },
      ],
    },
    {
      categorySlug: "krovelnye-materialy",
      items: [
        {
          name: "Профнастил кровельный оцинкованный С-21 0.45 мм (длина 6 м)",
          baseSlug: "profnastil-s21-045-6m",
          brand: "Кровля-Люкс",
          unit: "м²",
          priceTJS: 48,
          stock: 2800,
          attrs: {
            "Тип кровли": "Профнастил",
            "Материал": "Оцинкованная сталь",
            "Покрытие": "Цинк",
            "Толщина листа": "0.45 мм",
            "Длина листа": "6.0 м",
            "Тип профиля": "С-21",
          },
        },
        {
          name: "Металлочерепица Монтеррей RAL 8017 Шоколад 0.5 мм",
          baseSlug: "metal-tile-monterrey-8017",
          brand: "Кровля-Люкс",
          unit: "м²",
          priceTJS: 68,
          stock: 1950,
          attrs: {
            "Тип кровли": "Металлочерепица",
            "Материал": "Сталь оцинкованная с полимерным покрытием",
            "Покрытие": "Полиэстер",
            "Толщина листа": "0.5 мм",
            "Цвет RAL": "RAL 8017 (Коричневый шоколад)",
            "Тип профиля": "Монтеррей",
          },
        },
      ],
    },
    {
      categorySlug: "mineralnaya-vata",
      items: [
        {
          name: "Минеральная вата Технониколь Роклайт 1200х600х50 мм (8 плит / 5.76 м²)",
          baseSlug: "minvata-roclight-50mm",
          brand: "Технониколь",
          unit: "упаковка",
          priceTJS: 125,
          stock: 850,
          attrs: {
            "Вид ваты": "Базальтовая (каменная)",
            "Плотность": "30-35 кг/м³",
            "Толщина": "50 мм",
            "Ширина плиты": "600 мм",
            "Длина плиты": "1200 мм",
            "Теплопроводность": "0.038 Вт/м·К",
            "Класс горючести": "НГ (негорючий)",
          },
        },
      ],
    },
    {
      categorySlug: "shtukaturki",
      items: [
        {
          name: "Штукатурка гипсовая Knauf Rotband 30 кг",
          baseSlug: "plaster-knauf-rotband-30kg",
          brand: "Knauf",
          unit: "мешок",
          priceTJS: 62,
          stock: 1500,
          attrs: {
            "Основа смеси": "Гипсовая",
            "Для внутренних или наружных работ": "Для внутренних работ",
            "Ручное или машинное нанесение": "Ручное",
            "Влагостойкость": "Для сухих помещений",
            "Масса упаковки": "30 кг",
          },
        },
      ],
    },
    {
      categorySlug: "shpaklevki",
      items: [
        {
          name: "Шпаклевка финишная полимерная Danogips SuperFinish 25 кг",
          baseSlug: "putty-danogips-25kg",
          brand: "Danogips",
          unit: "ведро",
          priceTJS: 115,
          stock: 640,
          attrs: {
            "Основа смеси": "Полимерная",
            "Стартовая или финишная": "Финишная",
            "Для сухих или влажных помещений": "Для сухих помещений",
            "Готовая или сухая": "Готовая к применению (паста)",
            "Масса упаковки": "25 кг",
          },
        },
      ],
    },
    {
      categorySlug: "klei-dlya-plitki-i-kamnya",
      items: [
        {
          name: "Клей для керамогранита и плитки Ceresit CM 14 Extra 25 кг",
          baseSlug: "tile-glue-ceresit-cm14-25kg",
          brand: "Ceresit",
          unit: "мешок",
          priceTJS: 58,
          stock: 1200,
          attrs: {
            "Тип клея": "Цементный усиленный",
            "Основание": "Бетон, стяжка, штукатурка",
            "Тип облицовки": "Керамогранит, керамика, искусственный камень",
            "Формат плитки максимум": "60x60 см",
            "Класс клея EN 12004": "C1 TE",
            "Для тёплого пола": "Да",
            "Масса упаковки": "25 кг",
          },
        },
      ],
    },
    {
      categorySlug: "kabel-i-provod-mednyy",
      items: [
        {
          name: "Кабель силовой медный ВВГнг(А)-LS 3х2.5 мм² ГОСТ (бухта 100 м)",
          baseSlug: "cable-vvgng-ls-3x25-100m",
          brand: "Кольчугино",
          unit: "м",
          priceTJS: 9.5,
          stock: 8500,
          attrs: {
            "Марка кабеля": "ВВГнг-LS",
            "Число жил": "3",
            "Сечение жилы": "2.5 мм²",
            "Материал изоляции": "ПВХ пониженной пожароопасности",
            "Номинальное напряжение": "660 В",
            "Негорючий кабель": "Да",
          },
        },
        {
          name: "Кабель силовой медный ВВГнг(А)-LS 3х1.5 мм² ГОСТ (бухта 100 м)",
          baseSlug: "cable-vvgng-ls-3x15-100m",
          brand: "Кольчугино",
          unit: "м",
          priceTJS: 6.2,
          stock: 11000,
          attrs: {
            "Марка кабеля": "ВВГнг-LS",
            "Число жил": "3",
            "Сечение жилы": "1.5 мм²",
            "Материал изоляции": "ПВХ пониженной пожароопасности",
            "Номинальное напряжение": "660 В",
            "Негорючий кабель": "Да",
          },
        },
      ],
    },
    {
      categorySlug: "perforatory-i-otboynye-molotki",
      items: [
        {
          name: "Перфоратор сетевой SDS-Plus Bosch GBH 2-28 F Professional (880 Вт, 3.2 Дж)",
          baseSlug: "perforator-bosch-gbh-228",
          brand: "Bosch",
          unit: "шт.",
          priceTJS: 1650,
          stock: 45,
          attrs: {
            "Тип патрона": "SDS-Plus",
            "Потребляемая мощность": "880 Вт",
            "Энергия удара": "3.2 Дж",
            "Количество режимов": "3 (сверление, сверление с ударом, долбление)",
            "Тип питания": "Сетевой (220В)",
          },
        },
      ],
    },
    {
      categorySlug: "dreli-i-shurupoverty",
      items: [
        {
          name: "Дрель-шуруповерт аккумуляторный Makita DDF482Z 18V LXT (62 Нм, 2 скорости)",
          baseSlug: "shurupovert-makita-ddf482",
          brand: "Makita",
          unit: "шт.",
          priceTJS: 980,
          stock: 65,
          attrs: {
            "Вид инструмента": "Шуруповёрт аккумуляторный",
            "Напряжение аккумулятора": "18 В",
            "Максимальный крутящий момент": "62 Нм",
            "Тип патрона": "Быстрозажимной 13 мм",
            "Тип двигателя": "Щёточный",
          },
        },
      ],
    },
    {
      categorySlug: "truby-i-fitingi-iz-ppr",
      items: [
        {
          name: "Труба полипропиленовая армированная стекловолокном PN25 Ø25 мм (длина 4 м)",
          baseSlug: "pipe-ppr-fiber-25-4m",
          brand: "Pilsa",
          unit: "м",
          priceTJS: 8.5,
          stock: 4200,
          attrs: {
            "Тип изделия": "Труба PPR",
            "Диаметр трубы": "25 мм",
            "Номинальное давление PN": "PN25",
            "Тип армирования": "Стекловолокно (Fiber)",
            "Толщина стенки": "3.5 мм",
          },
        },
      ],
    },
    {
      categorySlug: "samorezy-i-shurupy",
      items: [
        {
          name: "Саморезы по металлу со сверлом оцинкованные 4.2х19 мм (пачка 1000 шт.)",
          baseSlug: "screws-drill-42x19-1000",
          brand: "Креп-Мастер",
          unit: "упаковка",
          priceTJS: 42,
          stock: 850,
          attrs: {
            "Назначение": "По металлу",
            "Диаметр": "4.2 мм",
            "Длина": "19 мм",
            "Покрытие": "Оцинкованный",
            "Наконечник": "Сверло",
          },
        },
      ],
    },
  ];

  let addedProductsCount = 0;
  for (const catGroup of newCatalogItems) {
    const targetCat = catBySlug.get(catGroup.categorySlug);
    if (!targetCat) {
      console.warn(`Category slug '${catGroup.categorySlug}' not found in DB!`);
      continue;
    }

    for (const item of catGroup.items) {
      // Проверяем, существует ли уже
      const [existing] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, item.baseSlug))
        .limit(1);

      let productId = existing?.id;
      if (!productId) {
        const [inserted] = await db
          .insert(products)
          .values({
            sku: `KH-${Math.floor(10000 + Math.random() * 90000)}`,
            slug: item.baseSlug,
            nameRu: item.name,
            descriptionRu: `${item.name}. Высококачественный материал с доставкой со складов в Душанбе и Кушониёне.`,
            categoryId: targetCat.id,
            brand: item.brand,
            unit: item.unit,
            status: "PUBLISHED",
          })
          .returning({ id: products.id });
        productId = inserted.id;
        addedProductsCount++;
      } else {
        await db
          .update(products)
          .set({ categoryId: targetCat.id, nameRu: item.name, brand: item.brand, unit: item.unit })
          .where(eq(products.id, productId));
      }

      // Добавляем атрибуты
      for (const [attrName, attrVal] of Object.entries(item.attrs)) {
        await db
          .insert(productAttributes)
          .values({ productId, name: attrName, value: attrVal })
          .onConflictDoUpdate({
            target: [productAttributes.productId, productAttributes.name],
            set: { value: attrVal },
          });
      }

      // Добавляем офферы поставщиков
      const supplier = allSuppliers[addedProductsCount % allSuppliers.length];
      const supplierPriceDirams = BigInt(Math.round(item.priceTJS * 100));

      const [existingOffer] = await db
        .select({ id: supplierOffers.id })
        .from(supplierOffers)
        .where(eq(supplierOffers.productId, productId))
        .limit(1);

      if (!existingOffer) {
        await db.insert(supplierOffers).values({
          productId,
          supplierId: supplier.id,
          supplierPriceDirams,
          stockQty: String(item.stock),
          minOrderQty: item.unit === "тонна" ? "0.5" : "1",
          leadTimeDays: 1,
          isActive: "true",
        });
      }
    }
  }

  console.log(`Added/updated ${addedProductsCount} enriched products into new leaf categories.`);
  await closeDb();
  console.log("Reseed finished successfully!");
}

run().catch((e) => {
  console.error("Error in reseed script:", e);
  process.exit(1);
});

