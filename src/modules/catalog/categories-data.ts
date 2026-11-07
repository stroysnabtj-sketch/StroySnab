import profileData from "./category-profile-data.json";
/**
 * Kushoniyon / STROYHUB.TJ
 * Полное дерево категорий (319 листовых) и умные фильтры
 * Сгенерировано из Umnye_filtry_319_kategoriy.xlsx
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
    slug: "building-materials",
    nameRu: "Стройматериалы",
    nameTg: "Маводҳои сохтмонӣ",
    icon: "Building2",
    description: "Цемент, бетон, сухие смеси, кирпич, арматура, блоки, кровля и теплоизоляция",
    subcategories: [
      {
        slug: "obshchestroitelnye-materialy",
        nameRu: "Общестроительные материалы",
        children: [
          { slug: "gipsokarton", nameRu: "Гипсокартон" },
          { slug: "zhelezobetonnye-izdeliya", nameRu: "Железобетонные изделия" },
          { slug: "kirpich", nameRu: "Кирпич" },
          { slug: "krovelnye-materialy", nameRu: "Кровельные материалы", isMixed: true },
          { slug: "metalloprokat", nameRu: "Металлопрокат" },
          { slug: "pilomaterialy", nameRu: "Пиломатериалы" },
          { slug: "provoloka", nameRu: "Проволока" },
          { slug: "setki", nameRu: "Сетки" },
          { slug: "stroitelnye-bloki", nameRu: "Строительные блоки" },
        ],
      },
      {
        slug: "smesi",
        nameRu: "Смеси",
        children: [
          { slug: "gidroizolyatsionnye-smesi", nameRu: "Гидроизоляционные смеси" },
          { slug: "zatirki", nameRu: "Затирки" },
          { slug: "klei-dlya-plitki-i-kamnya", nameRu: "Клеи для плитки и камня" },
          { slug: "pesok-shcheben-zubok", nameRu: "Песок, щебень, Зубок", isMixed: true },
          { slug: "smesi-dlya-pola", nameRu: "Смеси для пола" },
          { slug: "tsement-beton", nameRu: "Цемент и бетон", isMixed: true },
          { slug: "shpaklevki", nameRu: "Шпаклевки" },
          { slug: "shtukaturki", nameRu: "Штукатурки" },
        ],
      },
      {
        slug: "stroitelnoe-oborudovanie",
        nameRu: "Строительное оборудование",
        children: [
          { slug: "burovye-ustanovki", nameRu: "Буровые установки" },
          {
            slug: "gruzopodemnoe-oborudovanie",
            nameRu: "Грузоподъемное оборудование",
            isMixed: true,
          },
          { slug: "kompressory", nameRu: "Компрессоры" },
          { slug: "lestnitsy-i-stremyanki", nameRu: "Лестницы и стремянки" },
          { slug: "stroitelnye-tachki", nameRu: "Строительные тачки" },
        ],
      },
      {
        slug: "teplo-gidroizolyatsiya",
        nameRu: "Тепло-гидроизоляция",
        children: [
          { slug: "bitum", nameRu: "Битум" },
          { slug: "vspenennyy-polietilen", nameRu: "Вспененный полиэтилен" },
          { slug: "mineralnaya-vata", nameRu: "Минеральная вата" },
          { slug: "penopleks-penoplast", nameRu: "Пеноплекс & пенопласт" },
          { slug: "pergamin", nameRu: "Пергамин" },
          { slug: "ruberoid-tol", nameRu: "Рубероид & Толь" },
          { slug: "sendvich-paneli", nameRu: "Сэндвич-панели" },
        ],
      },
      {
        slug: "khimiya",
        nameRu: "Химия",
        children: [
          { slug: "germetiki", nameRu: "Герметики" },
          { slug: "gruntovki-i-betonokontakt", nameRu: "Грунтовки и Бетоноконтакт" },
          { slug: "zhidkie-gvozdi", nameRu: "Жидкие гвозди" },
          { slug: "klei", nameRu: "Клеи" },
          { slug: "montazhnye-peny", nameRu: "Монтажные пены" },
        ],
      },
    ],
  },
  {
    slug: "finishing",
    nameRu: "Отделка",
    nameTg: "Пардоз",
    icon: "PaintBucket",
    description: "Краски, обои, плитка, напольные покрытия, декоративные штукатурки и лаки",
    subcategories: [
      {
        slug: "dekorativnye-materialy",
        nameRu: "Декоративные материалы",
        children: [
          { slug: "dekorativno-zashchitnye-materialy", nameRu: "Декоративно-защитные материалы" },
          { slug: "dekorativnye-gruntovki", nameRu: "Декоративные грунтовки" },
          { slug: "dekorativnye-kraski", nameRu: "Декоративные краски" },
          { slug: "dekorativnye-shtukaturki", nameRu: "Декоративные штукатурки" },
          { slug: "plintusy-potolochnye", nameRu: "Плинтусы потолочные" },
        ],
      },
      {
        slug: "lakokrasochnye-materialy",
        nameRu: "Лакокрасочные материалы",
        children: [
          { slug: "aerozolnye-kraski", nameRu: "Аэрозольные краски" },
          { slug: "gruntovki", nameRu: "Грунтовки" },
          { slug: "interernye-kraski", nameRu: "Интерьерные краски" },
          { slug: "kolera-krasiteli-i-rastvoriteli", nameRu: "Колера, красители и растворители" },
          { slug: "laki", nameRu: "Лаки" },
          { slug: "maslyanye-kraski", nameRu: "Масляные краски" },
          { slug: "fasadnye-kraski", nameRu: "Фасадные краски" },
        ],
      },
      {
        slug: "napolnye-pokrytiya",
        nameRu: "Напольные покрытия",
        children: [
          { slug: "vinilovye-poly", nameRu: "Виниловые полы" },
          { slug: "laminat", nameRu: "Ламинат" },
          { slug: "linoleum", nameRu: "Линолеум" },
          { slug: "parket", nameRu: "Паркет" },
          { slug: "plintusy-i-aksessuary", nameRu: "Плинтусы и аксессуары" },
          { slug: "podlozhki-i-nastily-dlya-pola", nameRu: "Подложки и настилы для пола" },
          { slug: "teplye-poly", nameRu: "Теплые полы" },
        ],
      },
      {
        slug: "oboi",
        nameRu: "Обои",
        children: [
          { slug: "bumazhnye-oboi", nameRu: "Бумажные обои" },
          { slug: "vinilovye-oboi", nameRu: "Виниловые обои" },
          { slug: "zhidkie-oboi", nameRu: "Жидкие обои" },
          { slug: "kley-dlya-oboev", nameRu: "Клей для обоев" },
          { slug: "oboi-pod-pokrasku", nameRu: "Обои под покраску" },
          { slug: "flizelinovye-oboi", nameRu: "Флизелиновые обои" },
          { slug: "fotooboi", nameRu: "Фотообои" },
        ],
      },
      {
        slug: "otdelka-potolka",
        nameRu: "Отделка потолка",
        children: [
          { slug: "natyazhnye-potolki", nameRu: "Натяжные потолки" },
          { slug: "potolochnye-plintusy-bagety", nameRu: "Потолочные плинтусы(багеты)" },
          { slug: "potolochnye-sistemy", nameRu: "Потолочные системы" },
        ],
      },
      {
        slug: "otdelka-sten",
        nameRu: "Отделка стен",
        children: [
          { slug: "izolenta", nameRu: "Изолента" },
          { slug: "lenty", nameRu: "Ленты" },
          { slug: "serpyanki", nameRu: "Серпянки" },
          { slug: "ugolki-malyarnye", nameRu: "Уголки малярные" },
          { slug: "ugolki-plastmassovye", nameRu: "Уголки пластмассовые" },
          { slug: "uplotniteli", nameRu: "Уплотнители" },
        ],
      },
      {
        slug: "plitka",
        nameRu: "Плитка",
        children: [
          { slug: "dekorativnyy-kamen", nameRu: "Декоративный камень" },
          { slug: "keramicheskaya", nameRu: "Керамическая" },
          { slug: "keramogranit", nameRu: "Керамогранит" },
          { slug: "klinker", nameRu: "Клинкер" },
          { slug: "mozaika", nameRu: "Мозаика" },
          { slug: "stupeni", nameRu: "Ступени" },
        ],
      },
      {
        slug: "stroitelnye-lenty",
        nameRu: "Строительные ленты",
        children: [{ slug: "stroitelnye-lenty-2", nameRu: "Строительные ленты" }],
      },
    ],
  },
  {
    slug: "elektrotovary",
    nameRu: "Электротовары",
    icon: "Package",
    description: "Электротовары",
    subcategories: [
      {
        slug: "modulnoe-oborudovanie",
        nameRu: "Модульное оборудование",
        children: [
          { slug: "avtomatizatsiya-i-kip", nameRu: "Автоматизация и КИП" },
          {
            slug: "avtomaticheskie-vyklyuchateli-differentsialnogo-to",
            nameRu: "Автоматические выключатели дифференциального тока (АВДТ)",
          },
          {
            slug: "vyklyuchateli-differentsialnogo-toka-uzo",
            nameRu: "Выключатели дифференциального тока (УЗО)",
          },
          { slug: "kontaktory-modulnye", nameRu: "Контакторы модульные" },
          { slug: "modulnoe-rele", nameRu: "Модульное реле" },
          {
            slug: "modulnye-avtomaticheskie-vyklyuchateli",
            nameRu: "Модульные автоматические выключатели",
          },
          {
            slug: "modulnye-predokhraniteli-razediniteli",
            nameRu: "Модульные предохранители-разъединители",
          },
          {
            slug: "oborudovanie-srednego-napryazheniya",
            nameRu: "Оборудование среднего напряжения",
          },
          {
            slug: "rubilniki-i-pereklyuchateli-modulnye",
            nameRu: "Рубильники и переключатели модульные",
          },
          {
            slug: "ustroystva-zashchity-ot-dugovogo-proboya-i-iskreni",
            nameRu: "Устройства защиты от дугового пробоя и искрения (УЗДП, УЗИС)",
          },
          {
            slug: "ustroystva-zashchity-ot-impulsnykh-perenapryazheni",
            nameRu: "Устройства защиты от импульсных перенапряжений (УЗИП)",
          },
        ],
      },
      {
        slug: "svetotekhnika",
        nameRu: "Светотехника",
        children: [
          { slug: "galogennye-lampy", nameRu: "Галогенные лампы" },
          { slug: "lampy-nakalivaniya", nameRu: "Лампы накаливания" },
          { slug: "plafony", nameRu: "Плафоны" },
          { slug: "prozhektory", nameRu: "Прожекторы" },
          { slug: "svetodiodnye-lampy", nameRu: "Светодиодные лампы" },
          { slug: "svetodiodnye-paneli", nameRu: "Светодиодные панели" },
          { slug: "fonariki", nameRu: "Фонарики" },
          { slug: "energosberegayushchie-lampy", nameRu: "Энергосберегающие лампы" },
          { slug: "svetilniki", nameRu: "Светильники" },
        ],
      },
      {
        slug: "silovoe-oborudovanie",
        nameRu: "Силовое оборудование",
        children: [
          { slug: "generatory", nameRu: "Генераторы" },
          { slug: "zaryadnye-ustroystva", nameRu: "Зарядные устройства" },
          { slug: "preobrazovateli-invertory", nameRu: "Преобразователи (инверторы)" },
          { slug: "stabilizatory", nameRu: "Стабилизаторы" },
          { slug: "transformatory", nameRu: "Трансформаторы" },
        ],
      },
      {
        slug: "elektricheskie-aksessuary",
        nameRu: "Электрические аксессуары",
        children: [
          { slug: "klimaticheskoe-sistemy", nameRu: "Климатическое системы", isMixed: true },
          { slug: "knopki-i-pereklyuchateli", nameRu: "Кнопки и переключатели" },
          { slug: "korobki-raspredelitelnye", nameRu: "Коробки распределительные" },
          { slug: "setevye-filtry", nameRu: "Сетевые фильтры" },
          { slug: "troyniki-i-vilki", nameRu: "Тройники и вилки" },
          { slug: "udliniteli-i-kolodki", nameRu: "Удлинители и колодки" },
          { slug: "elektricheskie-shchity", nameRu: "Электрические щиты" },
        ],
      },
      {
        slug: "lyustry-bra",
        nameRu: "Люстры & Бра",
        children: [{ slug: "lyustry-bra-2", nameRu: "Люстры & Бра" }],
      },
      {
        slug: "kabel-i-montazh",
        nameRu: "Кабель и монтаж",
        children: [
          { slug: "gofry-i-truby-dlya-kabelya", nameRu: "Гофры и трубы для кабеля" },
          { slug: "kabel-i-provod-alyuminievyy", nameRu: "Кабель и провод алюминиевый" },
          { slug: "kabel-i-provod-mednyy", nameRu: "Кабель и провод медный" },
          { slug: "kabelnye-aksessuary", nameRu: "Кабельные аксессуары" },
          { slug: "kabelnye-koroba", nameRu: "Кабельные короба" },
        ],
      },
      {
        slug: "rozetki-i-vyklyuchateli",
        nameRu: "Розетки и выключатели",
        children: [
          { slug: "vyklyuchateli", nameRu: "Выключатели" },
          { slug: "dimmery", nameRu: "Диммеры" },
          { slug: "kompyuternye-rozetki", nameRu: "Компьютерные розетки" },
          { slug: "ramki", nameRu: "Рамки" },
          { slug: "rozetki", nameRu: "Розетки" },
          { slug: "rozetki-dlya-tv-antenny", nameRu: "Розетки для ТВ антенны" },
          { slug: "telefonnye-rozetki", nameRu: "Телефонные розетки" },
        ],
      },
    ],
  },
  {
    slug: "instrumenty",
    nameRu: "Инструменты",
    icon: "Package",
    description: "Инструменты",
    subcategories: [
      {
        slug: "malyarnye-instrumenty",
        nameRu: "Малярные инструменты",
        children: [
          { slug: "vannochki-i-valiki", nameRu: "Ванночки и валики" },
          { slug: "vedra-stroitelnye", nameRu: "Ведра строительные" },
          { slug: "instrument-dlya-shlifovaniya", nameRu: "Инструмент для шлифования" },
          { slug: "kisti-i-shchetki-malyarnye", nameRu: "Кисти и щетки малярные" },
          { slug: "kraskoraspyliteli", nameRu: "Краскораспылители" },
          { slug: "masterki-i-shpateli", nameRu: "Мастерки и шпатели" },
          { slug: "meshalki-dlya-krasok-i-smesey", nameRu: "Мешалки для красок и смесей" },
          { slug: "mont-pistolety-i-shpritsy", nameRu: "Монт. пистолеты и шприцы" },
          { slug: "stroitelnye-nozhi", nameRu: "Строительные ножи" },
        ],
      },
      {
        slug: "izmeritelnye-instrumenty",
        nameRu: "Измерительные инструменты",
        children: [
          { slug: "dalnomery-lazernye-ruletki", nameRu: "Дальномеры лазерные (рулетки)" },
          { slug: "indikatory-napryazheniya", nameRu: "Индикаторы напряжения" },
          { slug: "instrumenty-dlya-razmetki", nameRu: "Инструменты для разметки" },
          { slug: "lazernyy-uroven", nameRu: "Лазерный уровень" },
          { slug: "ruletki", nameRu: "Рулетки" },
          { slug: "ugolki-stroitelnye", nameRu: "Уголки строительные" },
          { slug: "urovni", nameRu: "Уровни" },
        ],
      },
      {
        slug: "ruchnye-instrumenty",
        nameRu: "Ручные инструменты",
        children: [
          { slug: "vozdukhoduv", nameRu: "воздуходув" },
          { slug: "gubtsevyy-instrument", nameRu: "Губцевый инструмент" },
          { slug: "klyuchi", nameRu: "Ключи" },
          { slug: "mikser", nameRu: "Миксер", isMixed: true },
          { slug: "nabory-ruchnykh-instrumentov", nameRu: "Наборы ручных инструментов" },
          { slug: "nozhovki-i-pily", nameRu: "Ножовки и пилы" },
          { slug: "otvertki", nameRu: "Отвертки" },
          { slug: "pnevmaticheskie-instrumenty", nameRu: "Пневматические инструменты" },
          { slug: "sekatory-i-kleshchi", nameRu: "Секаторы и клещи" },
          { slug: "steplery", nameRu: "Степлеры" },
          { slug: "strubtsiny-i-zazhimy", nameRu: "Струбцины и зажимы" },
          { slug: "udarnye-instrumenty", nameRu: "Ударные инструменты" },
        ],
      },
      {
        slug: "sredstva-zashchity",
        nameRu: "Средства защиты",
        children: [
          { slug: "zashchitnye-ochki", nameRu: "Защитные очки" },
          { slug: "kaski-i-maski-dlya-zashchity", nameRu: "Каски и маски для защиты" },
          { slug: "perchatki", nameRu: "Перчатки" },
          { slug: "remni-bezopasnosti", nameRu: "Ремни безопасности" },
          { slug: "spetsodezhda", nameRu: "Спецодежда" },
          { slug: "yashchiki", nameRu: "Ящики" },
        ],
      },
      {
        slug: "stolyarno-slesarnye-inst",
        nameRu: "Столярно-слесарные инст.",
        children: [{ slug: "stolyarno-slesarnye-inst-2", nameRu: "Столярно-слесарные инст." }],
      },
      {
        slug: "elektroinstrumenty",
        nameRu: "Электроинструменты",
        children: [
          { slug: "shlifovalnye-mashiny", nameRu: "Шлифовальные машины" },
          { slug: "raskhodnye-materialy", nameRu: "Расходные материалы", isMixed: true },
          { slug: "shtroborezy-i-brozdodely", nameRu: "Штроборезы и броздоделы" },
          { slug: "oborudovaniya", nameRu: "Оборудования" },
          { slug: "otboynye-molotki", nameRu: "Отбойные молотки" },
          {
            slug: "stanki-i-drugie-elektroinstrumenty",
            nameRu: "Станки и другие электроинструменты",
          },
          { slug: "akkumulyatornye-batarei", nameRu: "Аккумуляторные батареи" },
          { slug: "lobziki-pily-i-rubanki", nameRu: "Лобзики, пилы и рубанки", isMixed: true },
          { slug: "dreli-i-shurupoverty", nameRu: "Дрели и шуруповерты", isMixed: true },
          { slug: "elektrotochilki", nameRu: "Электроточилки" },
          {
            slug: "svarochnye-apparaty-i-feny",
            nameRu: "Сварочные аппараты и фены",
            isMixed: true,
          },
          {
            slug: "perforatory-i-otboynye-molotki",
            nameRu: "Перфораторы и отбойные молотки",
            isMixed: true,
          },
          { slug: "payalniki-elektricheskie", nameRu: "Паяльники электрические" },
        ],
      },
    ],
  },
  {
    slug: "plumbing",
    nameRu: "Сантехника",
    nameTg: "Сантехника",
    icon: "Droplet",
    description: "Трубы, фитинги, смесители, унитазы, раковины, ванны и водонагреватели",
    subcategories: [
      {
        slug: "vodosnabzhenie",
        nameRu: "Водоснабжение",
        children: [
          { slug: "zadvizhki", nameRu: "Задвижки" },
          { slug: "komplektuyushchie", nameRu: "Комплектующие" },
          { slug: "nasosy", nameRu: "Насосы" },
          { slug: "pompy", nameRu: "Помпы" },
          { slug: "regulyatory-davleniya-vody", nameRu: "Регуляторы давления воды" },
          { slug: "filtry", nameRu: "Фильтры" },
        ],
      },
      {
        slug: "dushevaya-sistema",
        nameRu: "Душевая система",
        children: [
          { slug: "dushevye-garnitury", nameRu: "Душевые гарнитуры" },
          { slug: "dushevye-paneli", nameRu: "Душевые панели" },
        ],
      },
      {
        slug: "inzhenernaya-santekhnika",
        nameRu: "Инженерная сантехника",
        children: [
          { slug: "gafrirovannye-truby", nameRu: "Гафрированные трубы" },
          { slug: "zashchita-ot-protechek", nameRu: "Защита от протечек" },
          { slug: "kollektory-i-aksessuary", nameRu: "Коллекторы и аксессуары" },
          { slug: "mednye-truby", nameRu: "Медные трубы" },
          { slug: "naruzhnaya-kanalizatsiya", nameRu: "Наружная канализация" },
          { slug: "truby-i-fitingi-iz-pvkh", nameRu: "Трубы и фитинги из ПВХ", isMixed: true },
          { slug: "truby-i-fitingi-iz-ppr", nameRu: "Трубы и фитинги из ППР", isMixed: true },
          { slug: "fitingi-bronzovye", nameRu: "Фитинги бронзовые" },
        ],
      },
      {
        slug: "otopitelnaya-tekhnika",
        nameRu: "Отопительная техника",
        children: [
          { slug: "boylery-vodonagrevateli", nameRu: "Бойлеры водонагреватели" },
          { slug: "kotly", nameRu: "Котлы" },
          { slug: "polotentsesushiteli", nameRu: "Полотенцесушители" },
          { slug: "radiatory-otopleniya", nameRu: "Радиаторы отопления" },
        ],
      },
      {
        slug: "santekhnicheskiy-instrument",
        nameRu: "Сантехнический инструмент",
        children: [{ slug: "truborezy", nameRu: "Труборезы" }],
      },
      {
        slug: "sanfayans-i-smesiteli",
        nameRu: "Санфаянс и смесители",
        children: [
          { slug: "komplektuyushchie-2", nameRu: "Комплектующие" },
          { slug: "komplektuyushchie-k-sanfayansu", nameRu: "Комплектующие к санфаянсу" },
          { slug: "sanfayans", nameRu: "Санфаянс" },
          { slug: "smesiteli-dlya-dusha", nameRu: "Смесители для душа" },
          { slug: "smesiteli-dlya-kukhni", nameRu: "Смесители для кухни" },
          { slug: "smesiteli-dlya-umyvalnika", nameRu: "Смесители для умывальника" },
          { slug: "shlangi-dlya-smesiteley", nameRu: "Шланги для смесителей" },
        ],
      },
      {
        slug: "unitazy-i-bide",
        nameRu: "Унитазы и биде",
        children: [
          { slug: "umyvalniki", nameRu: "Умывальники" },
          { slug: "unitazy", nameRu: "Унитазы" },
        ],
      },
    ],
  },
  {
    slug: "khoztovary-i-krepezh",
    nameRu: "Хозтовары и Крепеж",
    icon: "Package",
    description: "Хозтовары и Крепеж",
    subcategories: [
      {
        slug: "bytovaya-khimiya",
        nameRu: "Бытовая химия",
        children: [
          { slug: "gigienicheskie-sredstva", nameRu: "Гигиенические средства" },
          { slug: "moyushchie-i-chistyashchie-sredstva", nameRu: "Моющие и чистящие средства" },
          { slug: "osvezhiteli-vozdukha", nameRu: "Освежители воздуха" },
          { slug: "stirka", nameRu: "Стирка" },
          { slug: "ukhod-za-bytovoy-tekhnikoy", nameRu: "Уход за бытовой техникой" },
        ],
      },
      {
        slug: "skladskoe-oborudovanie",
        nameRu: "Складское оборудование",
        children: [{ slug: "telezhki", nameRu: "Тележки" }],
      },
      {
        slug: "skobyanye-izdeliya",
        nameRu: "Скобяные изделия",
        children: [
          { slug: "ankery", nameRu: "Анкеры" },
          { slug: "bolty-i-shpilki", nameRu: "Болты и шпильки" },
          { slug: "gayki-i-shayby", nameRu: "Гайки и шайбы" },
          { slug: "gvozdi", nameRu: "Гвозди" },
          { slug: "dyubeli", nameRu: "Дюбели" },
          { slug: "kryuki-i-zazhimy", nameRu: "Крюки и зажимы" },
          { slug: "samorezy-i-shurupy", nameRu: "Саморезы и шурупы" },
          { slug: "skoby-i-ploshchadki", nameRu: "Скобы и площадки" },
          { slug: "tros-stalnoy", nameRu: "Трос стальной" },
          { slug: "khomuty-styazhki", nameRu: "Хомуты-стяжки" },
        ],
      },
      {
        slug: "stirka-i-glazhka",
        nameRu: "Стирка и глажка",
        children: [
          { slug: "gladilnye-doski", nameRu: "Гладильные доски" },
          { slug: "sushilki", nameRu: "Сушилки" },
          { slug: "utyugi", nameRu: "Утюги" },
        ],
      },
      {
        slug: "tovary-dlya-ubornoy",
        nameRu: "Товары для уборной",
        children: [
          { slug: "vantuzy", nameRu: "Вантузы" },
          { slug: "vedra", nameRu: "Ведра" },
          { slug: "veniki-i-metly", nameRu: "Веники и метлы" },
          { slug: "ershi", nameRu: "Ерши" },
          { slug: "steklomoi", nameRu: "Стекломои" },
          { slug: "shvabry-i-shchetki", nameRu: "Швабры и щетки" },
        ],
      },
    ],
  },
  {
    slug: "garden-outdoor",
    nameRu: "Дача и сад",
    nameTg: "Бобустон ва боғ",
    icon: "Flower2",
    description: "Системы полива, триммеры, газонокосилки, мотоблоки, садовый инвентарь",
    subcategories: [
      {
        slug: "poliv",
        nameRu: "Полив",
        children: [
          { slug: "aksessuary-dlya-poliva", nameRu: "Аксессуары для полива" },
          { slug: "emkosti", nameRu: "Емкости" },
          { slug: "pulverizatory", nameRu: "Пульверизаторы" },
          { slug: "raspyliteli", nameRu: "Распылители" },
          { slug: "shlangi", nameRu: "Шланги" },
        ],
      },
      {
        slug: "sadovaya-tekhnika",
        nameRu: "Садовая техника",
        children: [
          { slug: "gazonokosilki-i-motobloki", nameRu: "Газонокосилки и мотоблоки", isMixed: true },
          { slug: "kustorezy", nameRu: "Кусторезы" },
          { slug: "moyki", nameRu: "Мойки", isMixed: true },
          { slug: "opryskivateli", nameRu: "Опрыскиватели" },
          { slug: "sadovye-tachki", nameRu: "Садовые тачки" },
          { slug: "trimmery", nameRu: "Триммеры" },
        ],
      },
      {
        slug: "sadovoe-osveshchenie",
        nameRu: "Садовое освещение",
        children: [
          { slug: "dekorativnye-lampy", nameRu: "Декоративные лампы" },
          { slug: "svetilniki-2", nameRu: "Светильники" },
          { slug: "solnechnye-svetilniki", nameRu: "Солнечные светильники" },
        ],
      },
      {
        slug: "sadovye-instrumenty",
        nameRu: "Садовые инструменты",
        children: [
          { slug: "grabli-i-vily", nameRu: "Грабли и вилы" },
          { slug: "lopaty", nameRu: "Лопаты" },
          { slug: "ruchnye-kustorezy", nameRu: "Ручные кусторезы" },
        ],
      },
      {
        slug: "sredstva-dlya-rozzhiga",
        nameRu: "Средства для розжига",
        children: [{ slug: "ugol-i-drova", nameRu: "Уголь и дрова" }],
      },
    ],
  },
  {
    slug: "doors-windows",
    nameRu: "Двери и окна",
    nameTg: "Дарҳо ва тирезаҳо",
    icon: "DoorOpen",
    description: "Двери межкомнатные и входные, окна ПВХ, подоконники, фурнитура и замки",
    subcategories: [
      {
        slug: "dveri",
        nameRu: "Двери",
        children: [
          { slug: "alyuminievye-dveri", nameRu: "Алюминиевые двери" },
          { slug: "vkhodnye-dveri", nameRu: "Входные двери" },
          { slug: "dveri-ekoshpon", nameRu: "Двери экошпон" },
          { slug: "laminirovannye-dveri", nameRu: "Ламинированные двери" },
          { slug: "mezhkomnatnye-dveri", nameRu: "Межкомнатные двери" },
          { slug: "plastikovye-dveri", nameRu: "Пластиковые двери" },
          { slug: "razdvizhnye-dveri", nameRu: "Раздвижные двери" },
        ],
      },
      {
        slug: "zabory-i-vorota",
        nameRu: "Заборы и ворота",
        children: [{ slug: "rolstavni-i-rolvorota", nameRu: "Рольставни и рольворота" }],
      },
      {
        slug: "lyuki-i-peregorodki",
        nameRu: "Люки и перегородки",
        children: [
          { slug: "lyuki-napolnye", nameRu: "Люки напольные" },
          { slug: "lyuki-nevidimki", nameRu: "Люки-невидимки" },
          { slug: "lyuki-revizionnye-pod-plitku", nameRu: "Люки ревизионные под плитку" },
          { slug: "lyuki-revizionnye-pod-pokrasku", nameRu: "Люки ревизионные под покраску" },
          { slug: "lyuki-santekhnicheskie", nameRu: "Люки сантехнические" },
        ],
      },
      {
        slug: "okna",
        nameRu: "Окна",
        children: [
          { slug: "alyuminievye-okna", nameRu: "Алюминиевые окна" },
          { slug: "derevyannye-okna", nameRu: "Деревянные окна" },
          { slug: "plastikovye-okna", nameRu: "Пластиковые окна" },
        ],
      },
      {
        slug: "furnitura",
        nameRu: "Фурнитура",
        children: [
          { slug: "zamki", nameRu: "Замки" },
          { slug: "petli-dvernye-i-okonnye", nameRu: "Петли дверные и оконные", isMixed: true },
        ],
      },
    ],
  },
  {
    slug: "cistemy-bezopasnosti",
    nameRu: "Системы безопасности",
    icon: "Package",
    description: "Cистемы безопасности",
    subcategories: [
      {
        slug: "aksessuary",
        nameRu: "Аксессуары",
        children: [
          { slug: "ssd-i-hdd-diski", nameRu: "SSD и HDD диски" },
          { slug: "kabelnaya-produktsiya", nameRu: "Кабельная продукция" },
          { slug: "klaviatury-dlya-upravleniya", nameRu: "Клавиатуры для управления" },
          { slug: "monitory", nameRu: "Мониторы" },
        ],
      },
      {
        slug: "zamki-i-dovodchiki",
        nameRu: "Замки и доводчики",
        children: [
          { slug: "dovodchiki", nameRu: "Доводчики" },
          { slug: "elektronnye-zamki", nameRu: "Электронные замки" },
        ],
      },
      {
        slug: "istochniki-pitaniya",
        nameRu: "Источники питания",
        children: [
          { slug: "blok-pitaniya", nameRu: "Блок питания" },
          { slug: "ibp", nameRu: "ИБП" },
        ],
      },
      {
        slug: "kamery-i-videoregistratory",
        nameRu: "Камеры и видеорегистраторы",
        children: [
          { slug: "hd-tvi-videoregistratory", nameRu: "HD-TVI видеорегистраторы" },
          { slug: "hd-tvi-kamery", nameRu: "HD-TVI камеры" },
          { slug: "ip-videoregistratory", nameRu: "IP видеорегистраторы" },
          { slug: "ip-kamery", nameRu: "IP камеры" },
        ],
      },
      {
        slug: "kontrol-dostupa",
        nameRu: "Контроль доступа",
        children: [
          { slug: "metallodetektory", nameRu: "Металлодетекторы" },
          { slug: "skud-i-domofony", nameRu: "СКУД и домофоны" },
          { slug: "terminaly-raspoznavaniya-lits", nameRu: "Терминалы распознавания лиц" },
          { slug: "turnikety", nameRu: "Турникеты" },
          { slug: "shlagbaumy", nameRu: "Шлагбаумы" },
        ],
      },
      {
        slug: "protivopozharnoe-oborudovanie",
        nameRu: "Противопожарное оборудование",
        children: [
          { slug: "bezopasnost-i-zashchita", nameRu: "Безопасность и Защита" },
          { slug: "ognetushiteli", nameRu: "Огнетушители" },
          { slug: "pozharnye-opoveshchateli", nameRu: "Пожарные оповещатели" },
          { slug: "pozharnye-shchity", nameRu: "Пожарные щиты" },
          { slug: "priemno-kontrolnye-sistemy", nameRu: "Приемно-контрольные системы" },
          { slug: "signalizatsii", nameRu: "Сигнализации" },
          { slug: "snaryazhenie", nameRu: "Снаряжение" },
        ],
      },
      {
        slug: "setevoe-oborudovanie",
        nameRu: "Сетевое оборудование",
        children: [{ slug: "kommutatory", nameRu: "Коммутаторы" }],
      },
    ],
  },
  {
    slug: "tekhnika-i-elektronika",
    nameRu: "Техника и электроника",
    icon: "Package",
    description: "ТЕХНИКА И ЭЛЕКТРОНИКА",
    subcategories: [
      {
        slug: "audio-i-video",
        nameRu: "Аудио и видео",
        children: [{ slug: "audio-i-video-2", nameRu: "Аудио и видео", isMixed: true }],
      },
      {
        slug: "orgtekhnika",
        nameRu: "Оргтехника",
        children: [
          { slug: "kompyutery", nameRu: "Компьютеры" },
          { slug: "monobloki", nameRu: "Моноблоки" },
          { slug: "noutbuki", nameRu: "Ноутбуки" },
          { slug: "printery", nameRu: "Принтеры" },
          { slug: "skanery", nameRu: "Сканеры" },
        ],
      },
      {
        slug: "televizory",
        nameRu: "Телевизоры",
        children: [{ slug: "televizory-2", nameRu: "Телевизоры" }],
      },
      {
        slug: "tekhnika-dlya-doma",
        nameRu: "Техника для дома",
        children: [
          { slug: "vesy", nameRu: "Весы" },
          { slug: "klimaticheskaya-tekhnika", nameRu: "Климатическая техника", isMixed: true },
          { slug: "konditsionery", nameRu: "Кондиционеры" },
          { slug: "obogrevateli", nameRu: "Обогреватели" },
          { slug: "pylesosy", nameRu: "Пылесосы" },
          { slug: "stiralnye-mashiny", nameRu: "Стиральные машины" },
          { slug: "fen", nameRu: "Фен" },
        ],
      },
      {
        slug: "tekhnika-dlya-kukhni",
        nameRu: "Техника для кухни",
        children: [
          { slug: "vstraivaemaya-tekhnika", nameRu: "Встраиваемая техника", isMixed: true },
          { slug: "vytyazhki", nameRu: "Вытяжки" },
          { slug: "melkaya-kukhonnaya-tekhnika", nameRu: "Мелкая кухонная техника", isMixed: true },
          { slug: "mikrovolnovye-pechi", nameRu: "Микроволновые печи" },
          { slug: "multivarki", nameRu: "Мультиварки" },
          { slug: "plity-gazovye-i-kombinirovannye", nameRu: "Плиты газовые и комбинированные" },
          { slug: "kholodilniki", nameRu: "Холодильники" },
          { slug: "elektricheskaya-kukhonnaya-plita", nameRu: "Электрическая кухонная плита" },
          { slug: "elektrochayniki", nameRu: "Электрочайники" },
        ],
      },
      {
        slug: "ukhod-za-odezhdoy",
        nameRu: "Уход за одеждой",
        children: [{ slug: "utyugi-2", nameRu: "Утюги" }],
      },
    ],
  },
  {
    slug: "engineering-systems",
    nameRu: "Инженерные системы",
    nameTg: "Низомҳои муҳандисӣ",
    icon: "Wind",
    description: "Вентиляция, холодильное оборудование, медные трубы, фреон и компрессоры",
    subcategories: [
      {
        slug: "ventilyatsiya",
        nameRu: "Вентиляция",
        children: [{ slug: "ventilyatsiya-2", nameRu: "Вентиляция", isMixed: true }],
      },
      {
        slug: "kholod",
        nameRu: "Холод",
        children: [
          { slug: "konditsionernye-kompressory", nameRu: "Кондиционерные компрессоры" },
          { slug: "masla-kholodilnye", nameRu: "Масла холодильные" },
          { slug: "mednye-truby-2", nameRu: "Медные трубы" },
          { slug: "tekhnicheskie-gazy", nameRu: "Технические газы" },
          { slug: "filtry-kholodilnye", nameRu: "Фильтры холодильные" },
          { slug: "freon-khladagenty", nameRu: "Фреон, хладагенты" },
          { slug: "kholodilnye-kompressory", nameRu: "Холодильные компрессоры" },
          { slug: "kholodilnyy-instrument", nameRu: "Холодильный инструмент" },
        ],
      },
    ],
  },
  {
    slug: "trade-equipment",
    nameRu: "Торговое оборудование",
    nameTg: "Таҷҳизоти тиҷоратӣ",
    icon: "Store",
    description: "Торговые весы, кассовое оборудование и витрины",
    subcategories: [
      {
        slug: "torgovye-vesy",
        nameRu: "Торговые весы",
        children: [{ slug: "torgovye-vesy-2", nameRu: "Торговые весы" }],
      },
    ],
  },
];

/**
 * Умные фильтры для всех 319 листовых категорий
 * Ключ = slug категории, значение = массив фильтров
 * Фильтры с isExtra=true показываются в раскрытом виде "Дополнительные"
 */
export const CATEGORY_SMART_FILTERS: Record<string, SmartFilterDefinition[]> = {
  // Гипсокартон
  gipsokarton: [
    { key: "tip-lista", label: "Тип листа", type: "checkbox" },
    { key: "tolshchina-lista", label: "Толщина листа", type: "checkbox" },
    { key: "dlina-lista", label: "Длина листа", type: "checkbox" },
    { key: "shirina-lista", label: "Ширина листа", type: "checkbox" },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox" },
    { key: "ognestoykost", label: "Огнестойкость", type: "checkbox", isExtra: true },
    { key: "tip-kromki", label: "Тип кромки", type: "checkbox", isExtra: true },
  ],
  // Железобетонные изделия
  "zhelezobetonnye-izdeliya": [
    { key: "vid-zhbi", label: "Вид ЖБИ", type: "checkbox" },
    { key: "dlina-izdeliya", label: "Длина изделия", type: "checkbox" },
    { key: "shirina-izdeliya", label: "Ширина изделия", type: "checkbox" },
    { key: "vysota-izdeliya", label: "Высота изделия", type: "checkbox" },
    { key: "klass-betona", label: "Класс бетона", type: "checkbox" },
    { key: "nesushchaya-nagruzka", label: "Несущая нагрузка", type: "checkbox", isExtra: true },
    { key: "massa-izdeliya", label: "Масса изделия", type: "checkbox", isExtra: true },
  ],
  // Кирпич
  kirpich: [
    { key: "material-kirpicha", label: "Материал кирпича", type: "checkbox" },
    { key: "pustotnost", label: "Пустотность", type: "checkbox" },
    { key: "format-kirpicha", label: "Формат кирпича", type: "checkbox" },
    { key: "marka-prochnosti", label: "Марка прочности", type: "checkbox" },
    { key: "morozostoykost-f", label: "Морозостойкость F", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
  ],
  // Кровельные материалы
  "krovelnye-materialy": [
    { key: "tip-krovli", label: "Тип кровли", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox" },
    { key: "tolshchina-lista", label: "Толщина листа", type: "checkbox" },
    { key: "dlina-lista", label: "Длина листа", type: "checkbox" },
    { key: "shirina-lista", label: "Ширина листа", type: "checkbox", isExtra: true },
    { key: "tsvet-ral", label: "Цвет RAL", type: "checkbox", isExtra: true },
    { key: "tip-profilya", label: "Тип профиля", type: "checkbox", isExtra: true },
    { key: "ugol-uklona-minimum", label: "Угол уклона минимум", type: "checkbox", isExtra: true },
  ],
  // Металлопрокат
  metalloprokat: [
    { key: "vid-profilya", label: "Вид профиля", type: "checkbox" },
    { key: "marka-stali", label: "Марка стали", type: "checkbox" },
    { key: "sechenie", label: "Сечение", type: "checkbox" },
    { key: "tolshchina-metalla", label: "Толщина металла", type: "checkbox" },
    { key: "dlina-izdeliya", label: "Длина изделия", type: "checkbox" },
    { key: "tip-pokrytiya", label: "Тип покрытия", type: "checkbox", isExtra: true },
    { key: "standart", label: "Стандарт", type: "checkbox", isExtra: true },
  ],
  // Пиломатериалы
  pilomaterialy: [
    { key: "poroda-drevesiny", label: "Порода древесины", type: "checkbox" },
    { key: "tip-pilomateriala", label: "Тип пиломатериала", type: "checkbox" },
    { key: "sort-drevesiny", label: "Сорт древесины", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox", isExtra: true },
    { key: "vlazhnost-drevesiny", label: "Влажность древесины", type: "checkbox", isExtra: true },
    { key: "obrabotka", label: "Обработка", type: "checkbox", isExtra: true },
  ],
  // Проволока
  provoloka: [
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "diametr-provoloki", label: "Диаметр проволоки", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "razryvnaya-nagruzka", label: "Разрывная нагрузка", type: "checkbox", isExtra: true },
    { key: "dlina-bukhty", label: "Длина бухты", type: "checkbox", isExtra: true },
  ],
  // Сетки
  setki: [
    { key: "tip-setki", label: "Тип сетки", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "razmer-yacheyki", label: "Размер ячейки", type: "checkbox" },
    { key: "diametr-provoloki", label: "Диаметр проволоки", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox", isExtra: true },
    { key: "pokrytie", label: "Покрытие", type: "checkbox", isExtra: true },
  ],
  // Строительные блоки
  "stroitelnye-bloki": [
    { key: "material-bloka", label: "Материал блока", type: "checkbox" },
    { key: "plotnost-d", label: "Плотность D", type: "checkbox" },
    { key: "marka-prochnosti", label: "Марка прочности", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "vysota", label: "Высота", type: "checkbox", isExtra: true },
    { key: "morozostoykost-f", label: "Морозостойкость F", type: "checkbox", isExtra: true },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
  ],
  // Гидроизоляционные смеси
  "gidroizolyatsionnye-smesi": [
    { key: "tip-gidroizolyatsii", label: "Тип гидроизоляции", type: "checkbox" },
    { key: "osnova-smesi", label: "Основа смеси", type: "checkbox" },
    { key: "oblast-primeneniya", label: "Область применения", type: "checkbox" },
    { key: "dlya-basseynov", label: "Для бассейнов", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox" },
    { key: "tolshchina-sloya", label: "Толщина слоя", type: "checkbox", isExtra: true },
    { key: "vremya-vysykhaniya", label: "Время высыхания", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Затирки
  zatirki: [
    { key: "tip-zatirki", label: "Тип затирки", type: "checkbox" },
    { key: "shirina-shva", label: "Ширина шва", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "dlya-vlazhnykh-pomeshcheniy", label: "Для влажных помещений", type: "checkbox" },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox" },
    { key: "osnova-smesi", label: "Основа смеси", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Клеи для плитки и камня
  "klei-dlya-plitki-i-kamnya": [
    { key: "tip-kleya", label: "Тип клея", type: "checkbox" },
    { key: "osnovanie", label: "Основание", type: "checkbox" },
    { key: "tip-oblitsovki", label: "Тип облицовки", type: "checkbox" },
    { key: "format-plitki-maksimum", label: "Формат плитки максимум", type: "checkbox" },
    { key: "klass-kleya-en-12004", label: "Класс клея EN 12004", type: "checkbox" },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox", isExtra: true },
    { key: "morozostoykost", label: "Морозостойкость", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Песок, щебень, Зубок
  "pesok-shcheben-zubok": [
    { key: "vid-zapolnitelya", label: "Вид заполнителя", type: "checkbox" },
    { key: "fraktsiya", label: "Фракция", type: "checkbox" },
    { key: "proiskhozhdenie", label: "Происхождение", type: "checkbox" },
    { key: "nasypnaya-plotnost", label: "Насыпная плотность", type: "checkbox" },
    { key: "forma-postavki", label: "Форма поставки", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Смеси для пола
  "smesi-dlya-pola": [
    { key: "tip-smesi", label: "Тип смеси", type: "checkbox" },
    { key: "naznachenie-sloya", label: "Назначение слоя", type: "checkbox" },
    { key: "tolshchina-sloya-minimum", label: "Толщина слоя минимум", type: "checkbox" },
    { key: "tolshchina-sloya-maksimum", label: "Толщина слоя максимум", type: "checkbox" },
    { key: "osnova-smesi", label: "Основа смеси", type: "checkbox" },
    {
      key: "samovyravnivayushchayasya",
      label: "Самовыравнивающаяся",
      type: "checkbox",
      isExtra: true,
    },
    {
      key: "vremya-peshego-prokhoda",
      label: "Время пешего прохода",
      type: "checkbox",
      isExtra: true,
    },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox", isExtra: true },
  ],
  // Цемент & Бетон
  "tsement-beton": [
    { key: "vid-materiala", label: "Вид материала", type: "checkbox" },
    { key: "marka-tsementa", label: "Марка цемента", type: "checkbox" },
    { key: "klass-prochnosti-betona", label: "Класс прочности бетона", type: "checkbox" },
    { key: "vremya-skhvatyvaniya", label: "Время схватывания", type: "checkbox" },
    { key: "morozostoykost-f", label: "Морозостойкость F", type: "checkbox" },
    { key: "tip-dobavok", label: "Тип добавок", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Шпаклевки
  shpaklevki: [
    { key: "osnova-smesi", label: "Основа смеси", type: "checkbox" },
    { key: "startovaya-ili-finishnaya", label: "Стартовая или финишная", type: "checkbox" },
    {
      key: "dlya-sukhikh-ili-vlazhnykh-pomeshcheniy",
      label: "Для сухих или влажных помещений",
      type: "checkbox",
    },
    { key: "tolshchina-sloya-maksimum", label: "Толщина слоя максимум", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "gotovaya-ili-sukhaya", label: "Готовая или сухая", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Штукатурки
  shtukaturki: [
    { key: "osnova-smesi", label: "Основа смеси", type: "checkbox" },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
    },
    {
      key: "ruchnoe-ili-mashinnoe-nanesenie",
      label: "Ручное или машинное нанесение",
      type: "checkbox",
    },
    { key: "tolshchina-sloya-maksimum", label: "Толщина слоя максимум", type: "checkbox" },
    { key: "tip-osnovaniya", label: "Тип основания", type: "checkbox" },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Буровые установки
  "burovye-ustanovki": [
    { key: "tip-bureniya", label: "Тип бурения", type: "checkbox" },
    { key: "diametr-bureniya-maksimum", label: "Диаметр бурения максимум", type: "checkbox" },
    { key: "glubina-bureniya-maksimum", label: "Глубина бурения максимум", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "tip-dvigatelya", label: "Тип двигателя", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    { key: "massa-oborudovaniya", label: "Масса оборудования", type: "checkbox", isExtra: true },
  ],
  // Грузоподъемное оборудование
  "gruzopodemnoe-oborudovanie": [
    { key: "tip-mekhanizma", label: "Тип механизма", type: "checkbox" },
    { key: "gruzopodyomnost", label: "Грузоподъёмность", type: "checkbox" },
    { key: "vysota-podyoma", label: "Высота подъёма", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox" },
    { key: "dlina-trosa", label: "Длина троса", type: "checkbox", isExtra: true },
    { key: "skorost-podyoma", label: "Скорость подъёма", type: "checkbox", isExtra: true },
  ],
  // Компрессоры
  kompressory: [
    { key: "tip-kompressora", label: "Тип компрессора", type: "checkbox" },
    { key: "proizvoditelnost-vozdukha", label: "Производительность воздуха", type: "checkbox" },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox" },
    { key: "obyom-resivera", label: "Объём ресивера", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    { key: "bezmaslyanyy", label: "Безмасляный", type: "checkbox", isExtra: true },
  ],
  // Лестницы и стремянки
  "lestnitsy-i-stremyanki": [
    { key: "tip-konstruktsii", label: "Тип конструкции", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "chislo-stupeney", label: "Число ступеней", type: "checkbox" },
    { key: "rabochaya-vysota", label: "Рабочая высота", type: "checkbox" },
    {
      key: "maksimalnaya-nagruzka",
      label: "Максимальная нагрузка",
      type: "checkbox",
      isExtra: true,
    },
    { key: "transformer", label: "Трансформер", type: "checkbox", isExtra: true },
  ],
  // Строительные тачки
  "stroitelnye-tachki": [
    { key: "obyom-koryta", label: "Объём корыта", type: "checkbox" },
    { key: "gruzopodyomnost", label: "Грузоподъёмность", type: "checkbox" },
    { key: "chislo-kolyos", label: "Число колёс", type: "checkbox" },
    { key: "material-kuzova", label: "Материал кузова", type: "checkbox" },
    { key: "tip-kolesa", label: "Тип колеса", type: "checkbox", isExtra: true },
    { key: "diametr-kolesa", label: "Диаметр колеса", type: "checkbox", isExtra: true },
  ],
  // Битум
  bitum: [
    { key: "tip-bituma", label: "Тип битума", type: "checkbox" },
    { key: "primenenie", label: "Применение", type: "checkbox" },
    { key: "temperatura-razmyagcheniya", label: "Температура размягчения", type: "checkbox" },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox" },
    { key: "forma-postavki", label: "Форма поставки", type: "checkbox", isExtra: true },
    { key: "sposob-naneseniya", label: "Способ нанесения", type: "checkbox", isExtra: true },
  ],
  // Вспененный полиэтилен
  "vspenennyy-polietilen": [
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "folgirovannyy-sloy", label: "Фольгированный слой", type: "checkbox" },
    { key: "teploprovodnost", label: "Теплопроводность", type: "checkbox", isExtra: true },
    { key: "samokleyashchiysya", label: "Самоклеящийся", type: "checkbox", isExtra: true },
  ],
  // Минеральная вата
  "mineralnaya-vata": [
    { key: "vid-vaty", label: "Вид ваты", type: "checkbox" },
    { key: "plotnost", label: "Плотность", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "shirina-plity", label: "Ширина плиты", type: "checkbox" },
    { key: "dlina-plity", label: "Длина плиты", type: "checkbox" },
    { key: "teploprovodnost", label: "Теплопроводность", type: "checkbox", isExtra: true },
    { key: "klass-goryuchesti", label: "Класс горючести", type: "checkbox", isExtra: true },
    { key: "primenenie", label: "Применение", type: "checkbox", isExtra: true },
  ],
  // Пеноплекс & пенопласт
  "penopleks-penoplast": [
    { key: "material-uteplitelya", label: "Материал утеплителя", type: "checkbox" },
    { key: "plotnost", label: "Плотность", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "shirina-plity", label: "Ширина плиты", type: "checkbox" },
    { key: "dlina-plity", label: "Длина плиты", type: "checkbox" },
    { key: "prochnost-na-szhatie", label: "Прочность на сжатие", type: "checkbox", isExtra: true },
    { key: "teploprovodnost", label: "Теплопроводность", type: "checkbox", isExtra: true },
    { key: "tip-kromki", label: "Тип кромки", type: "checkbox", isExtra: true },
  ],
  // Пергамин
  pergamin: [
    { key: "marka-pergamina", label: "Марка пергамина", type: "checkbox" },
    { key: "plotnost", label: "Плотность", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "ploshchad-rulona", label: "Площадь рулона", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
    { key: "material-osnovaniya", label: "Материал основания", type: "checkbox", isExtra: true },
  ],
  // Рубероид & Толь
  "ruberoid-tol": [
    { key: "tip-rulonnoy-krovli", label: "Тип рулонной кровли", type: "checkbox" },
    { key: "marka-materiala", label: "Марка материала", type: "checkbox" },
    { key: "osnova", label: "Основа", type: "checkbox" },
    { key: "massa-na-m", label: "Масса на м²", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "ploshchad-rulona", label: "Площадь рулона", type: "checkbox", isExtra: true },
    { key: "tip-posypki", label: "Тип посыпки", type: "checkbox", isExtra: true },
  ],
  // Сэндвич-панели
  "sendvich-paneli": [
    { key: "naznachenie-paneli", label: "Назначение панели", type: "checkbox" },
    { key: "tip-napolnitelya", label: "Тип наполнителя", type: "checkbox" },
    { key: "tolshchina-paneli", label: "Толщина панели", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "rabochaya-shirina", label: "Рабочая ширина", type: "checkbox" },
    { key: "tip-zamka", label: "Тип замка", type: "checkbox", isExtra: true },
    { key: "tsvet-ral", label: "Цвет RAL", type: "checkbox", isExtra: true },
    { key: "ognestoykost", label: "Огнестойкость", type: "checkbox", isExtra: true },
  ],
  // Герметики
  germetiki: [
    { key: "khimicheskaya-osnova", label: "Химическая основа", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    { key: "temperatura-ekspluatatsii", label: "Температура эксплуатации", type: "checkbox" },
    {
      key: "vozmozhnost-okrashivaniya",
      label: "Возможность окрашивания",
      type: "checkbox",
      isExtra: true,
    },
    {
      key: "dlya-vlazhnykh-pomeshcheniy",
      label: "Для влажных помещений",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Грунтовки и Бетоноконтакт
  "gruntovki-i-betonokontakt": [
    { key: "tip-grunta", label: "Тип грунта", type: "checkbox" },
    { key: "osnovanie", label: "Основание", type: "checkbox" },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
    },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox" },
    {
      key: "glubina-proniknoveniya",
      label: "Глубина проникновения",
      type: "checkbox",
      isExtra: true,
    },
    { key: "vremya-vysykhaniya", label: "Время высыхания", type: "checkbox", isExtra: true },
  ],
  // Жидкие гвозди
  "zhidkie-gvozdi": [
    { key: "osnova-kleya", label: "Основа клея", type: "checkbox" },
    { key: "dlya-kakikh-materialov", label: "Для каких материалов", type: "checkbox" },
    { key: "nachalnaya-sila-skhvatyvaniya", label: "Начальная сила схватывания", type: "checkbox" },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Клеи
  klei: [
    { key: "tip-kleya", label: "Тип клея", type: "checkbox" },
    { key: "dlya-kakikh-materialov", label: "Для каких материалов", type: "checkbox" },
    { key: "vodostoykost", label: "Водостойкость", type: "checkbox" },
    { key: "vremya-skhvatyvaniya", label: "Время схватывания", type: "checkbox" },
    { key: "forma-vypuska", label: "Форма выпуска", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Монтажные пены
  "montazhnye-peny": [
    { key: "tip-peny", label: "Тип пены", type: "checkbox" },
    { key: "sezonnost", label: "Сезонность", type: "checkbox" },
    { key: "vykhod-peny", label: "Выход пены", type: "checkbox" },
    { key: "obyom-ballona", label: "Объём баллона", type: "checkbox" },
    { key: "pistoletnaya-ili-bytovaya", label: "Пистолетная или бытовая", type: "checkbox" },
    { key: "ognestoykost", label: "Огнестойкость", type: "checkbox", isExtra: true },
    {
      key: "vtorichnoe-rasshirenie",
      label: "Вторичное расширение",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Декоративно-защитные материалы
  "dekorativno-zashchitnye-materialy": [
    { key: "vid-pokrytiya", label: "Вид покрытия", type: "checkbox" },
    { key: "osnova", label: "Основа", type: "checkbox" },
    { key: "effekt-poverkhnosti", label: "Эффект поверхности", type: "checkbox" },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
    },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox", isExtra: true },
  ],
  // Декоративные грунтовки
  "dekorativnye-gruntovki": [
    { key: "naznachenie-grunta", label: "Назначение грунта", type: "checkbox" },
    { key: "osnova", label: "Основа", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    { key: "tip-osnovaniya", label: "Тип основания", type: "checkbox", isExtra: true },
  ],
  // Декоративные краски
  "dekorativnye-kraski": [
    { key: "dekorativnyy-effekt", label: "Декоративный эффект", type: "checkbox" },
    { key: "osnova-kraski", label: "Основа краски", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "stepen-bleska", label: "Степень блеска", type: "checkbox" },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
      isExtra: true,
    },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox", isExtra: true },
  ],
  // Декоративные штукатурки
  "dekorativnye-shtukaturki": [
    { key: "faktura", label: "Фактура", type: "checkbox" },
    { key: "razmer-zerna", label: "Размер зерна", type: "checkbox" },
    { key: "osnova-smesi", label: "Основа смеси", type: "checkbox" },
    { key: "gotovaya-ili-sukhaya", label: "Готовая или сухая", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox", isExtra: true },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox", isExtra: true },
  ],
  // Плинтусы потолочные
  "plintusy-potolochnye": [
    { key: "material-plintusa", label: "Материал плинтуса", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "shirina-profilya", label: "Ширина профиля", type: "checkbox" },
    { key: "vysota-profilya", label: "Высота профиля", type: "checkbox" },
    { key: "pod-pokrasku", label: "Под покраску", type: "checkbox", isExtra: true },
    { key: "ornament", label: "Орнамент", type: "checkbox", isExtra: true },
  ],
  // Аэрозольные краски
  "aerozolnye-kraski": [
    { key: "tip-pokrytiya", label: "Тип покрытия", type: "checkbox" },
    { key: "material-osnovaniya", label: "Материал основания", type: "checkbox" },
    { key: "tsvet-ral", label: "Цвет RAL", type: "checkbox" },
    { key: "effekt-poverkhnosti", label: "Эффект поверхности", type: "checkbox" },
    { key: "obyom-ballona", label: "Объём баллона", type: "checkbox", isExtra: true },
    { key: "termostoykost", label: "Термостойкость", type: "checkbox", isExtra: true },
  ],
  // Грунтовки
  gruntovki: [
    { key: "tip-grunta", label: "Тип грунта", type: "checkbox" },
    { key: "osnovanie", label: "Основание", type: "checkbox" },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
    },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox", isExtra: true },
    { key: "vremya-vysykhaniya", label: "Время высыхания", type: "checkbox", isExtra: true },
  ],
  // Интерьерные краски
  "interernye-kraski": [
    { key: "dlya-kakikh-pomeshcheniy", label: "Для каких помещений", type: "checkbox" },
    { key: "osnova-kraski", label: "Основа краски", type: "checkbox" },
    { key: "stepen-bleska", label: "Степень блеска", type: "checkbox" },
    { key: "klass-mokrogo-istiraniya", label: "Класс мокрого истирания", type: "checkbox" },
    { key: "koleruemaya", label: "Колеруемая", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox", isExtra: true },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
  ],
  // Колера, красители и растворители
  "kolera-krasiteli-i-rastvoriteli": [
    { key: "vid-produkta", label: "Вид продукта", type: "checkbox" },
    { key: "sovmestimost-s-kraskoy", label: "Совместимость с краской", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "osnova-rastvoritelya", label: "Основа растворителя", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    { key: "kontsentratsiya", label: "Концентрация", type: "checkbox", isExtra: true },
  ],
  // Лаки
  laki: [
    { key: "osnova-laka", label: "Основа лака", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "stepen-bleska", label: "Степень блеска", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "iznosostoykost", label: "Износостойкость", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Масляные краски
  "maslyanye-kraski": [
    { key: "osnova-kraski", label: "Основа краски", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "stepen-bleska", label: "Степень блеска", type: "checkbox" },
    { key: "dlya-metalla-ili-dereva", label: "Для металла или дерева", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    { key: "vremya-vysykhaniya", label: "Время высыхания", type: "checkbox", isExtra: true },
  ],
  // Фасадные краски
  "fasadnye-kraski": [
    { key: "osnova-kraski", label: "Основа краски", type: "checkbox" },
    { key: "tip-fasadnogo-osnovaniya", label: "Тип фасадного основания", type: "checkbox" },
    { key: "paropronitsaemost", label: "Паропроницаемость", type: "checkbox" },
    { key: "atmosferostoykost", label: "Атмосферостойкость", type: "checkbox" },
    { key: "raskhod-na-m", label: "Расход на м²", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
  ],
  // Виниловые полы
  "vinilovye-poly": [
    { key: "tip-lvt-ili-spc", label: "Тип LVT или SPC", type: "checkbox" },
    { key: "klass-iznosostoykosti", label: "Класс износостойкости", type: "checkbox" },
    { key: "tolshchina-pokrytiya", label: "Толщина покрытия", type: "checkbox" },
    { key: "tolshchina-zashchitnogo-sloya", label: "Толщина защитного слоя", type: "checkbox" },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox" },
    { key: "dekor", label: "Декор", type: "checkbox", isExtra: true },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox", isExtra: true },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox", isExtra: true },
  ],
  // Ламинат
  laminat: [
    { key: "klass-iznosostoykosti", label: "Класс износостойкости", type: "checkbox" },
    { key: "tolshchina-pokrytiya", label: "Толщина покрытия", type: "checkbox" },
    { key: "faska", label: "Фаска", type: "checkbox" },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox" },
    { key: "dekor", label: "Декор", type: "checkbox" },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox", isExtra: true },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox", isExtra: true },
    { key: "shirina-planki", label: "Ширина планки", type: "checkbox", isExtra: true },
  ],
  // Линолеум
  linoleum: [
    { key: "tip-linoleuma", label: "Тип линолеума", type: "checkbox" },
    { key: "klass-iznosostoykosti", label: "Класс износостойкости", type: "checkbox" },
    { key: "obshchaya-tolshchina", label: "Общая толщина", type: "checkbox" },
    { key: "tolshchina-zashchitnogo-sloya", label: "Толщина защитного слоя", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "osnova", label: "Основа", type: "checkbox", isExtra: true },
    { key: "dekor", label: "Декор", type: "checkbox", isExtra: true },
  ],
  // Паркет
  parket: [
    { key: "vid-parketa", label: "Вид паркета", type: "checkbox" },
    { key: "poroda-drevesiny", label: "Порода древесины", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "shirina-planki", label: "Ширина планки", type: "checkbox" },
    { key: "sortirovka-drevesiny", label: "Сортировка древесины", type: "checkbox" },
    { key: "tip-pokrytiya", label: "Тип покрытия", type: "checkbox", isExtra: true },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox", isExtra: true },
  ],
  // Плинтусы и аксессуары
  "plintusy-i-aksessuary": [
    { key: "vid-aksessuara", label: "Вид аксессуара", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "vysota-profilya", label: "Высота профиля", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "kabel-kanal", label: "Кабель-канал", type: "checkbox", isExtra: true },
    { key: "sposob-krepleniya", label: "Способ крепления", type: "checkbox", isExtra: true },
  ],
  // Подложки и настилы для пола
  "podlozhki-i-nastily-dlya-pola": [
    { key: "vid-podlozhki", label: "Вид подложки", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "plotnost", label: "Плотность", type: "checkbox" },
    { key: "ploshchad-upakovki", label: "Площадь упаковки", type: "checkbox" },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox", isExtra: true },
    { key: "vlagozashchita", label: "Влагозащита", type: "checkbox", isExtra: true },
  ],
  // Теплые полы
  "teplye-poly": [
    { key: "tip-podogreva", label: "Тип подогрева", type: "checkbox" },
    { key: "elektricheskiy-ili-vodyanoy", label: "Электрический или водяной", type: "checkbox" },
    { key: "moshchnost-na-m", label: "Мощность на м²", type: "checkbox" },
    { key: "ploshchad-komplekta", label: "Площадь комплекта", type: "checkbox" },
    {
      key: "termoregulyator-v-komplekte",
      label: "Терморегулятор в комплекте",
      type: "checkbox",
      isExtra: true,
    },
    {
      key: "vid-napolnogo-pokrytiya",
      label: "Вид напольного покрытия",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Бумажные обои
  "bumazhnye-oboi": [
    { key: "kolichestvo-sloyov", label: "Количество слоёв", type: "checkbox" },
    { key: "dizayn", label: "Дизайн", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "rapport-risunka", label: "Раппорт рисунка", type: "checkbox", isExtra: true },
    { key: "podgonka-risunka", label: "Подгонка рисунка", type: "checkbox", isExtra: true },
  ],
  // Виниловые обои
  "vinilovye-oboi": [
    { key: "material-osnovy", label: "Материал основы", type: "checkbox" },
    { key: "tip-vinila", label: "Тип винила", type: "checkbox" },
    { key: "dizayn", label: "Дизайн", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "moyushchiesya", label: "Моющиеся", type: "checkbox", isExtra: true },
    { key: "rapport-risunka", label: "Раппорт рисунка", type: "checkbox", isExtra: true },
  ],
  // Жидкие обои
  "zhidkie-oboi": [
    { key: "faktura", label: "Фактура", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "raskhod-upakovki-na-m", label: "Расход упаковки на м²", type: "checkbox" },
    { key: "material-napolnitelya", label: "Материал наполнителя", type: "checkbox" },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox", isExtra: true },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox", isExtra: true },
  ],
  // Клей для обоев
  "kley-dlya-oboev": [
    { key: "tip-oboev", label: "Тип обоев", type: "checkbox" },
    { key: "tip-kleya", label: "Тип клея", type: "checkbox" },
    { key: "raskhod-na-rulony", label: "Расход на рулоны", type: "checkbox" },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox" },
    { key: "vremya-prigotovleniya", label: "Время приготовления", type: "checkbox", isExtra: true },
    { key: "gotovyy-ili-sukhoy", label: "Готовый или сухой", type: "checkbox", isExtra: true },
  ],
  // Обои под покраску
  "oboi-pod-pokrasku": [
    { key: "material-osnovy", label: "Материал основы", type: "checkbox" },
    { key: "faktura", label: "Фактура", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    {
      key: "kolichestvo-perekrashivaniy",
      label: "Количество перекрашиваний",
      type: "checkbox",
      isExtra: true,
    },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox", isExtra: true },
  ],
  // Флизелиновые обои
  "flizelinovye-oboi": [
    { key: "tip-pokrytiya", label: "Тип покрытия", type: "checkbox" },
    { key: "dizayn", label: "Дизайн", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "shirina-rulona", label: "Ширина рулона", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "rapport-risunka", label: "Раппорт рисунка", type: "checkbox", isExtra: true },
    { key: "moyushchiesya", label: "Моющиеся", type: "checkbox", isExtra: true },
  ],
  // Фотообои
  fotooboi: [
    { key: "tematika-risunka", label: "Тематика рисунка", type: "checkbox" },
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "vysota-polotna", label: "Высота полотна", type: "checkbox" },
    { key: "material-osnovy", label: "Материал основы", type: "checkbox" },
    { key: "faktura", label: "Фактура", type: "checkbox", isExtra: true },
    { key: "kolichestvo-chastey", label: "Количество частей", type: "checkbox", isExtra: true },
  ],
  // Натяжные потолки
  "natyazhnye-potolki": [
    { key: "material-polotna", label: "Материал полотна", type: "checkbox" },
    { key: "faktura", label: "Фактура", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "svetopropuskanie", label: "Светопропускание", type: "checkbox", isExtra: true },
    { key: "perforatsiya", label: "Перфорация", type: "checkbox", isExtra: true },
  ],
  // Потолочные плинтусы(багеты)
  "potolochnye-plintusy-bagety": [
    { key: "material-plintusa", label: "Материал плинтуса", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "vysota-profilya", label: "Высота профиля", type: "checkbox" },
    { key: "shirina-profilya", label: "Ширина профиля", type: "checkbox" },
    { key: "pod-pokrasku", label: "Под покраску", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Потолочные системы
  "potolochnye-sistemy": [
    { key: "tip-potolochnoy-sistemy", label: "Тип потолочной системы", type: "checkbox" },
    { key: "format-plity", label: "Формат плиты", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox" },
    { key: "akusticheskie-svoystva", label: "Акустические свойства", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "klass-goryuchesti", label: "Класс горючести", type: "checkbox", isExtra: true },
  ],
  // Изолента
  izolenta: [
    { key: "material-lenty", label: "Материал ленты", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    {
      key: "temperaturnyy-diapazon",
      label: "Температурный диапазон",
      type: "checkbox",
      isExtra: true,
    },
    {
      key: "elektroizolyatsionnaya",
      label: "Электроизоляционная",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Ленты
  lenty: [
    { key: "naznachenie-lenty", label: "Назначение ленты", type: "checkbox" },
    { key: "osnova-lenty", label: "Основа ленты", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "kleevoy-sloy", label: "Клеевой слой", type: "checkbox", isExtra: true },
    { key: "vlagostoykost", label: "Влагостойкость", type: "checkbox", isExtra: true },
  ],
  // Серпянки
  serpyanki: [
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "material-setki", label: "Материал сетки", type: "checkbox" },
    { key: "razmer-yacheyki", label: "Размер ячейки", type: "checkbox" },
    { key: "samokleyashchayasya", label: "Самоклеящаяся", type: "checkbox", isExtra: true },
  ],
  // Уголки малярные
  "ugolki-malyarnye": [
    { key: "material-ugolka", label: "Материал уголка", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "shirina-polki", label: "Ширина полки", type: "checkbox" },
    { key: "perforirovannyy", label: "Перфорированный", type: "checkbox" },
    { key: "setka-v-komplekte", label: "Сетка в комплекте", type: "checkbox", isExtra: true },
  ],
  // Уголки пластмассовые
  "ugolki-plastmassovye": [
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "razmer-polki", label: "Размер полки", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "sposob-krepleniya", label: "Способ крепления", type: "checkbox", isExtra: true },
  ],
  // Уплотнители
  uplotniteli: [
    { key: "profil-uplotnitelya", label: "Профиль уплотнителя", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "samokleyashchiysya", label: "Самоклеящийся", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Декоративный камень
  "dekorativnyy-kamen": [
    { key: "vid-kamnya", label: "Вид камня", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "razmer-elementa", label: "Размер элемента", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "dlya-fasada", label: "Для фасада", type: "checkbox", isExtra: true },
    { key: "morozostoykost", label: "Морозостойкость", type: "checkbox", isExtra: true },
  ],
  // Керамическая
  keramicheskaya: [
    { key: "naznachenie-plitki", label: "Назначение плитки", type: "checkbox" },
    { key: "format-plitki", label: "Формат плитки", type: "checkbox" },
    { key: "poverkhnost", label: "Поверхность", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "rektifikatsiya", label: "Ректификация", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox", isExtra: true },
    { key: "morozostoykost", label: "Морозостойкость", type: "checkbox", isExtra: true },
    { key: "dlya-tyoplogo-pola", label: "Для тёплого пола", type: "checkbox", isExtra: true },
  ],
  // Керамогранит
  keramogranit: [
    { key: "format-plitki", label: "Формат плитки", type: "checkbox" },
    { key: "poverkhnost", label: "Поверхность", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "rektifikatsiya", label: "Ректификация", type: "checkbox" },
    { key: "morozostoykost", label: "Морозостойкость", type: "checkbox" },
    {
      key: "klass-protivoskolzheniya-r",
      label: "Класс противоскольжения R",
      type: "checkbox",
      isExtra: true,
    },
    { key: "dizayn", label: "Дизайн", type: "checkbox", isExtra: true },
    { key: "dlya-pola-ili-sten", label: "Для пола или стен", type: "checkbox", isExtra: true },
  ],
  // Клинкер
  klinker: [
    { key: "naznachenie-plitki", label: "Назначение плитки", type: "checkbox" },
    { key: "format-plitki", label: "Формат плитки", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    { key: "morozostoykost", label: "Морозостойкость", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "poverkhnost", label: "Поверхность", type: "checkbox", isExtra: true },
    { key: "vodopogloshchenie", label: "Водопоглощение", type: "checkbox", isExtra: true },
  ],
  // Мозаика
  mozaika: [
    { key: "material-mozaiki", label: "Материал мозаики", type: "checkbox" },
    { key: "razmer-chipa", label: "Размер чипа", type: "checkbox" },
    { key: "razmer-lista", label: "Размер листа", type: "checkbox" },
    { key: "poverkhnost", label: "Поверхность", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "na-setke", label: "На сетке", type: "checkbox", isExtra: true },
    { key: "dlya-basseyna", label: "Для бассейна", type: "checkbox", isExtra: true },
  ],
  // Ступени
  stupeni: [
    { key: "vid-elementa", label: "Вид элемента", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "dlina-stupeni", label: "Длина ступени", type: "checkbox" },
    { key: "shirina-stupeni", label: "Ширина ступени", type: "checkbox" },
    { key: "tolshchina", label: "Толщина", type: "checkbox" },
    {
      key: "protivoskolzyashchaya-poverkhnost",
      label: "Противоскользящая поверхность",
      type: "checkbox",
      isExtra: true,
    },
    { key: "dlya-ulitsy", label: "Для улицы", type: "checkbox", isExtra: true },
  ],
  // Строительные ленты
  "stroitelnye-lenty-2": [
    { key: "naznachenie-lenty", label: "Назначение ленты", type: "checkbox" },
    { key: "material-osnovy", label: "Материал основы", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "dlina-rulona", label: "Длина рулона", type: "checkbox" },
    { key: "tip-kleevogo-sloya", label: "Тип клеевого слоя", type: "checkbox" },
    {
      key: "dlya-vnutrennikh-ili-naruzhnykh-rabot",
      label: "Для внутренних или наружных работ",
      type: "checkbox",
      isExtra: true,
    },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Автоматизация и КИП
  "avtomatizatsiya-i-kip": [
    { key: "tip-pribora", label: "Тип прибора", type: "checkbox" },
    { key: "izmeryaemaya-velichina", label: "Измеряемая величина", type: "checkbox" },
    { key: "diapazon-izmereniya", label: "Диапазон измерения", type: "checkbox" },
    { key: "napryazhenie-pitaniya", label: "Напряжение питания", type: "checkbox" },
    { key: "vykhodnoy-signal", label: "Выходной сигнал", type: "checkbox", isExtra: true },
    { key: "montazh-na-din-reyku", label: "Монтаж на DIN-рейку", type: "checkbox", isExtra: true },
  ],
  // Автоматические выключатели дифференциального тока (АВДТ)
  "avtomaticheskie-vyklyuchateli-differentsialnogo-to": [
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "tok-utechki", label: "Ток утечки", type: "checkbox" },
    { key: "tip-difzashchity", label: "Тип дифзащиты", type: "checkbox" },
    { key: "kharakteristika-otklyucheniya", label: "Характеристика отключения", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    {
      key: "otklyuchayushchaya-sposobnost",
      label: "Отключающая способность",
      type: "checkbox",
      isExtra: true,
    },
    { key: "shirina-v-modulyakh", label: "Ширина в модулях", type: "checkbox", isExtra: true },
  ],
  // Выключатели дифференциального тока (УЗО)
  "vyklyuchateli-differentsialnogo-toka-uzo": [
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "tok-utechki", label: "Ток утечки", type: "checkbox" },
    { key: "tip-difzashchity", label: "Тип дифзащиты", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    { key: "selektivnost", label: "Селективность", type: "checkbox", isExtra: true },
    {
      key: "nominalnoe-napryazhenie",
      label: "Номинальное напряжение",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Контакторы модульные
  "kontaktory-modulnye": [
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "napryazhenie-katushki", label: "Напряжение катушки", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    { key: "kategoriya-primeneniya", label: "Категория применения", type: "checkbox" },
    { key: "kontaktnaya-gruppa", label: "Контактная группа", type: "checkbox", isExtra: true },
    { key: "shirina-v-modulyakh", label: "Ширина в модулях", type: "checkbox", isExtra: true },
  ],
  // Модульное реле
  "modulnoe-rele": [
    { key: "naznachenie-rele", label: "Назначение реле", type: "checkbox" },
    { key: "napryazhenie-upravleniya", label: "Напряжение управления", type: "checkbox" },
    { key: "diapazon-nastroyki", label: "Диапазон настройки", type: "checkbox" },
    { key: "chislo-kontaktov", label: "Число контактов", type: "checkbox" },
    { key: "montazh-na-din-reyku", label: "Монтаж на DIN-рейку", type: "checkbox", isExtra: true },
    { key: "vremya-srabatyvaniya", label: "Время срабатывания", type: "checkbox", isExtra: true },
  ],
  // Модульные автоматические выключатели
  "modulnye-avtomaticheskie-vyklyuchateli": [
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "kharakteristika-otklyucheniya", label: "Характеристика отключения", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    { key: "otklyuchayushchaya-sposobnost", label: "Отключающая способность", type: "checkbox" },
    {
      key: "nominalnoe-napryazhenie",
      label: "Номинальное напряжение",
      type: "checkbox",
      isExtra: true,
    },
    { key: "shirina-v-modulyakh", label: "Ширина в модулях", type: "checkbox", isExtra: true },
  ],
  // Модульные предохранители-разъединители
  "modulnye-predokhraniteli-razediniteli": [
    { key: "tip-plavkoy-vstavki", label: "Тип плавкой вставки", type: "checkbox" },
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "razmer-predokhranitelya", label: "Размер предохранителя", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    {
      key: "nominalnoe-napryazhenie",
      label: "Номинальное напряжение",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Оборудование среднего напряжения
  "oborudovanie-srednego-napryazheniya": [
    { key: "vid-oborudovaniya", label: "Вид оборудования", type: "checkbox" },
    { key: "klass-napryazheniya", label: "Класс напряжения", type: "checkbox" },
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "otklyuchayushchaya-sposobnost", label: "Отключающая способность", type: "checkbox" },
    { key: "montazh", label: "Монтаж", type: "checkbox", isExtra: true },
    { key: "standart", label: "Стандарт", type: "checkbox", isExtra: true },
  ],
  // Рубильники и переключатели модульные
  "rubilniki-i-pereklyuchateli-modulnye": [
    { key: "tip-pereklyucheniya", label: "Тип переключения", type: "checkbox" },
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    { key: "nominalnoe-napryazhenie", label: "Номинальное напряжение", type: "checkbox" },
    { key: "montazh-na-din-reyku", label: "Монтаж на DIN-рейку", type: "checkbox", isExtra: true },
  ],
  // Устройства защиты от дугового пробоя и искрения (УЗДП, УЗИС)
  "ustroystva-zashchity-ot-dugovogo-proboya-i-iskreni": [
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "kolichestvo-polyusov", label: "Количество полюсов", type: "checkbox" },
    { key: "tip-zashchity", label: "Тип защиты", type: "checkbox" },
    { key: "vstroennyy-avtomat", label: "Встроенный автомат", type: "checkbox" },
    {
      key: "nominalnoe-napryazhenie",
      label: "Номинальное напряжение",
      type: "checkbox",
      isExtra: true,
    },
    { key: "shirina-v-modulyakh", label: "Ширина в модулях", type: "checkbox", isExtra: true },
  ],
  // Устройства защиты от импульсных перенапряжений (УЗИП)
  "ustroystva-zashchity-ot-impulsnykh-perenapryazheni": [
    { key: "klass-uzip", label: "Класс УЗИП", type: "checkbox" },
    { key: "chislo-polyusov", label: "Число полюсов", type: "checkbox" },
    {
      key: "maksimalnoe-rabochee-napryazhenie-uc",
      label: "Максимальное рабочее напряжение Uc",
      type: "checkbox",
    },
    { key: "impulsnyy-tok", label: "Импульсный ток", type: "checkbox" },
    { key: "uroven-zashchity-up", label: "Уровень защиты Up", type: "checkbox", isExtra: true },
    { key: "tip-seti", label: "Тип сети", type: "checkbox", isExtra: true },
  ],
  // Галогенные лампы
  "galogennye-lampy": [
    { key: "tsokol", label: "Цоколь", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "napryazhenie", label: "Напряжение", type: "checkbox" },
    { key: "forma-kolby", label: "Форма колбы", type: "checkbox" },
    {
      key: "tsvetovaya-temperatura",
      label: "Цветовая температура",
      type: "checkbox",
      isExtra: true,
    },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox", isExtra: true },
  ],
  // Лампы накаливания
  "lampy-nakalivaniya": [
    { key: "tsokol", label: "Цоколь", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "napryazhenie", label: "Напряжение", type: "checkbox" },
    { key: "forma-kolby", label: "Форма колбы", type: "checkbox" },
    { key: "tip-kolby", label: "Тип колбы", type: "checkbox", isExtra: true },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox", isExtra: true },
  ],
  // Плафоны
  plafony: [
    { key: "tip-plafona", label: "Тип плафона", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "diametr", label: "Диаметр", type: "checkbox" },
    { key: "vysota", label: "Высота", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "tip-krepleniya", label: "Тип крепления", type: "checkbox", isExtra: true },
    {
      key: "sovmestimyy-svetilnik",
      label: "Совместимый светильник",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Прожекторы
  prozhektory: [
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox" },
    { key: "tsvetovaya-temperatura", label: "Цветовая температура", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "ugol-svecheniya", label: "Угол свечения", type: "checkbox" },
    { key: "datchik-dvizheniya", label: "Датчик движения", type: "checkbox", isExtra: true },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox", isExtra: true },
  ],
  // Светодиодные лампы
  "svetodiodnye-lampy": [
    { key: "tsokol", label: "Цоколь", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox" },
    { key: "tsvetovaya-temperatura", label: "Цветовая температура", type: "checkbox" },
    { key: "forma-kolby", label: "Форма колбы", type: "checkbox" },
    { key: "dimmiruemaya", label: "Диммируемая", type: "checkbox", isExtra: true },
    { key: "napryazhenie", label: "Напряжение", type: "checkbox", isExtra: true },
  ],
  // Светодиодные панели
  "svetodiodnye-paneli": [
    { key: "razmer-paneli", label: "Размер панели", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox" },
    { key: "tsvetovaya-temperatura", label: "Цветовая температура", type: "checkbox" },
    { key: "montazh", label: "Монтаж", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "dimmiruemaya", label: "Диммируемая", type: "checkbox", isExtra: true },
  ],
  // Фонарики
  fonariki: [
    { key: "tip-fonarya", label: "Тип фонаря", type: "checkbox" },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox" },
    { key: "dalnost-osveshcheniya", label: "Дальность освещения", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    {
      key: "yomkost-akkumulyatora",
      label: "Ёмкость аккумулятора",
      type: "checkbox",
      isExtra: true,
    },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
  ],
  // Энергосберегающие лампы
  "energosberegayushchie-lampy": [
    { key: "tsokol", label: "Цоколь", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "tsvetovaya-temperatura", label: "Цветовая температура", type: "checkbox" },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox" },
    { key: "forma-kolby", label: "Форма колбы", type: "checkbox", isExtra: true },
    { key: "tip-pra", label: "Тип ПРА", type: "checkbox", isExtra: true },
  ],
  // Светильники
  svetilniki: [
    { key: "tip-svetilnika", label: "Тип светильника", type: "checkbox" },
    { key: "mesto-ustanovki", label: "Место установки", type: "checkbox" },
    { key: "montazh", label: "Монтаж", type: "checkbox" },
    { key: "tsokol", label: "Цоколь", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    {
      key: "tsvetovaya-temperatura",
      label: "Цветовая температура",
      type: "checkbox",
      isExtra: true,
    },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox", isExtra: true },
  ],
  // Генераторы
  generatory: [
    { key: "tip-topliva", label: "Тип топлива", type: "checkbox" },
    { key: "nominalnaya-moshchnost", label: "Номинальная мощность", type: "checkbox" },
    { key: "maksimalnaya-moshchnost", label: "Максимальная мощность", type: "checkbox" },
    { key: "kolichestvo-faz", label: "Количество фаз", type: "checkbox" },
    { key: "tip-zapuska", label: "Тип запуска", type: "checkbox" },
    { key: "invertornyy", label: "Инверторный", type: "checkbox", isExtra: true },
    { key: "obyom-baka", label: "Объём бака", type: "checkbox", isExtra: true },
    { key: "avtozapusk-avr", label: "Автозапуск АВР", type: "checkbox", isExtra: true },
  ],
  // Зарядные устройства
  "zaryadnye-ustroystva": [
    { key: "tip-akkumulyatora", label: "Тип аккумулятора", type: "checkbox" },
    { key: "napryazhenie-zaryada", label: "Напряжение заряда", type: "checkbox" },
    { key: "tok-zaryada", label: "Ток заряда", type: "checkbox" },
    { key: "yomkost-akb-podderzhivaemaya", label: "Ёмкость АКБ поддерживаемая", type: "checkbox" },
    { key: "kolichestvo-kanalov", label: "Количество каналов", type: "checkbox", isExtra: true },
    {
      key: "avtomaticheskoe-otklyuchenie",
      label: "Автоматическое отключение",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Преобразователи (инверторы)
  "preobrazovateli-invertory": [
    { key: "forma-vykhodnogo-signala", label: "Форма выходного сигнала", type: "checkbox" },
    { key: "nominalnaya-moshchnost", label: "Номинальная мощность", type: "checkbox" },
    { key: "vkhodnoe-napryazhenie", label: "Входное напряжение", type: "checkbox" },
    { key: "vykhodnoe-napryazhenie", label: "Выходное напряжение", type: "checkbox" },
    { key: "tip-invertora", label: "Тип инвертора", type: "checkbox", isExtra: true },
    { key: "kpd", label: "КПД", type: "checkbox", isExtra: true },
  ],
  // Стабилизаторы
  stabilizatory: [
    { key: "tip-stabilizatora", label: "Тип стабилизатора", type: "checkbox" },
    { key: "moshchnost-polnaya", label: "Мощность полная", type: "checkbox" },
    {
      key: "rabochiy-diapazon-napryazheniya",
      label: "Рабочий диапазон напряжения",
      type: "checkbox",
    },
    { key: "kolichestvo-faz", label: "Количество фаз", type: "checkbox" },
    {
      key: "tochnost-stabilizatsii",
      label: "Точность стабилизации",
      type: "checkbox",
      isExtra: true,
    },
    { key: "baypas", label: "Байпас", type: "checkbox", isExtra: true },
  ],
  // Трансформаторы
  transformatory: [
    { key: "tip-transformatora", label: "Тип трансформатора", type: "checkbox" },
    { key: "moshchnost-polnaya", label: "Мощность полная", type: "checkbox" },
    { key: "pervichnoe-napryazhenie", label: "Первичное напряжение", type: "checkbox" },
    { key: "vtorichnoe-napryazhenie", label: "Вторичное напряжение", type: "checkbox" },
    { key: "kolichestvo-faz", label: "Количество фаз", type: "checkbox", isExtra: true },
    { key: "sposob-ustanovki", label: "Способ установки", type: "checkbox", isExtra: true },
  ],
  // Климатическое системы
  "klimaticheskoe-sistemy": [
    {
      key: "tip-klimaticheskogo-ustroystva",
      label: "Тип климатического устройства",
      type: "checkbox",
    },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "proizvoditelnost-vozdukha", label: "Производительность воздуха", type: "checkbox" },
    { key: "ploshchad-pomeshcheniya", label: "Площадь помещения", type: "checkbox" },
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox", isExtra: true },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
  ],
  // Кнопки и переключатели
  "knopki-i-pereklyuchateli": [
    { key: "vid-elementa", label: "Вид элемента", type: "checkbox" },
    { key: "fiksatsiya", label: "Фиксация", type: "checkbox" },
    { key: "kontaktnaya-gruppa", label: "Контактная группа", type: "checkbox" },
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    {
      key: "diametr-montazhnogo-otverstiya",
      label: "Диаметр монтажного отверстия",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Коробки распределительные
  "korobki-raspredelitelnye": [
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "razmery", label: "Размеры", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "chislo-vvodov", label: "Число вводов", type: "checkbox", isExtra: true },
    { key: "dlya-ulitsy", label: "Для улицы", type: "checkbox", isExtra: true },
  ],
  // Сетевые фильтры
  "setevye-filtry": [
    { key: "chislo-rozetok", label: "Число розеток", type: "checkbox" },
    { key: "dlina-kabelya", label: "Длина кабеля", type: "checkbox" },
    { key: "maksimalnaya-nagruzka", label: "Максимальная нагрузка", type: "checkbox" },
    { key: "zashchita-ot-perenapryazheniya", label: "Защита от перенапряжения", type: "checkbox" },
    { key: "usb-porty", label: "USB-порты", type: "checkbox", isExtra: true },
    { key: "vyklyuchatel", label: "Выключатель", type: "checkbox", isExtra: true },
  ],
  // Тройники и вилки
  "troyniki-i-vilki": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "tip-vilki-ili-rozetki", label: "Тип вилки или розетки", type: "checkbox" },
    { key: "zazemlenie", label: "Заземление", type: "checkbox" },
    { key: "nominalnyy-tok", label: "Номинальный ток", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Удлинители и колодки
  "udliniteli-i-kolodki": [
    { key: "tip-izdeliya", label: "Тип изделия", type: "checkbox" },
    { key: "chislo-gnyozd", label: "Число гнёзд", type: "checkbox" },
    { key: "dlina-kabelya", label: "Длина кабеля", type: "checkbox" },
    { key: "sechenie-kabelya", label: "Сечение кабеля", type: "checkbox" },
    { key: "maksimalnaya-nagruzka", label: "Максимальная нагрузка", type: "checkbox" },
    { key: "zazemlenie", label: "Заземление", type: "checkbox", isExtra: true },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
  ],
  // Электрические щиты
  "elektricheskie-shchity": [
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox" },
    { key: "chislo-moduley", label: "Число модулей", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "komplektatsiya", label: "Комплектация", type: "checkbox" },
    { key: "razmery", label: "Размеры", type: "checkbox", isExtra: true },
    { key: "dlya-ulitsy", label: "Для улицы", type: "checkbox", isExtra: true },
  ],
  // Люстры & Бра
  "lyustry-bra-2": [
    { key: "vid-svetilnika", label: "Вид светильника", type: "checkbox" },
    { key: "stil", label: "Стиль", type: "checkbox" },
    { key: "chislo-lamp", label: "Число ламп", type: "checkbox" },
    { key: "tsokol", label: "Цоколь", type: "checkbox" },
    { key: "tsvet-korpusa", label: "Цвет корпуса", type: "checkbox" },
    { key: "material-plafona", label: "Материал плафона", type: "checkbox", isExtra: true },
    { key: "diametr", label: "Диаметр", type: "checkbox", isExtra: true },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox", isExtra: true },
    { key: "dimmiruemaya", label: "Диммируемая", type: "checkbox", isExtra: true },
  ],
  // Гофры и трубы для кабеля
  "gofry-i-truby-dlya-kabelya": [
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "naruzhnyy-diametr", label: "Наружный диаметр", type: "checkbox" },
    { key: "vnutrenniy-diametr", label: "Внутренний диаметр", type: "checkbox" },
    { key: "s-protyazhkoy", label: "С протяжкой", type: "checkbox" },
    { key: "stoykost-k-uf", label: "Стойкость к УФ", type: "checkbox" },
    { key: "stepen-zashchity", label: "Степень защиты", type: "checkbox", isExtra: true },
    { key: "dlina-bukhty", label: "Длина бухты", type: "checkbox", isExtra: true },
  ],
  // Кабель и провод алюминиевый
  "kabel-i-provod-alyuminievyy": [
    { key: "marka-kabelya", label: "Марка кабеля", type: "checkbox" },
    { key: "chislo-zhil", label: "Число жил", type: "checkbox" },
    { key: "sechenie-zhily", label: "Сечение жилы", type: "checkbox" },
    { key: "material-izolyatsii", label: "Материал изоляции", type: "checkbox" },
    { key: "nominalnoe-napryazhenie", label: "Номинальное напряжение", type: "checkbox" },
    { key: "negoryuchiy-kabel", label: "Негорючий кабель", type: "checkbox", isExtra: true },
    { key: "forma-kabelya", label: "Форма кабеля", type: "checkbox", isExtra: true },
  ],
  // Кабель и провод медный
  "kabel-i-provod-mednyy": [
    { key: "marka-kabelya", label: "Марка кабеля", type: "checkbox" },
    { key: "chislo-zhil", label: "Число жил", type: "checkbox" },
    { key: "sechenie-zhily", label: "Сечение жилы", type: "checkbox" },
    { key: "material-izolyatsii", label: "Материал изоляции", type: "checkbox" },
    { key: "nominalnoe-napryazhenie", label: "Номинальное напряжение", type: "checkbox" },
    { key: "negoryuchiy-kabel", label: "Негорючий кабель", type: "checkbox", isExtra: true },
    { key: "gibkost-zhily", label: "Гибкость жилы", type: "checkbox", isExtra: true },
  ],
  // Кабельные аксессуары
  "kabelnye-aksessuary": [
    { key: "vid-aksessuara", label: "Вид аксессуара", type: "checkbox" },
    { key: "sechenie-kabelya", label: "Сечение кабеля", type: "checkbox" },
    { key: "diametr-kabelya", label: "Диаметр кабеля", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    {
      key: "dlya-pomeshcheniya-ili-ulitsy",
      label: "Для помещения или улицы",
      type: "checkbox",
      isExtra: true,
    },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
  ],
  // Кабельные короба
  "kabelnye-koroba": [
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "shirina-koroba", label: "Ширина короба", type: "checkbox" },
    { key: "vysota-koroba", label: "Высота короба", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "s-kryshkoy", label: "С крышкой", type: "checkbox", isExtra: true },
    { key: "samokleyashchiysya", label: "Самоклеящийся", type: "checkbox", isExtra: true },
  ],
  // Выключатели
  vyklyuchateli: [
    { key: "tip-vyklyuchatelya", label: "Тип выключателя", type: "checkbox" },
    { key: "chislo-klavish", label: "Число клавиш", type: "checkbox" },
    { key: "prokhodnoy", label: "Проходной", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "podsvetka", label: "Подсветка", type: "checkbox", isExtra: true },
  ],
  // Диммеры
  dimmery: [
    { key: "tip-nagruzki", label: "Тип нагрузки", type: "checkbox" },
    { key: "sovmestimost-s-led", label: "Совместимость с LED", type: "checkbox" },
    { key: "moshchnost-nagruzki", label: "Мощность нагрузки", type: "checkbox" },
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Компьютерные розетки
  "kompyuternye-rozetki": [
    { key: "kategoriya-rj45", label: "Категория RJ45", type: "checkbox" },
    { key: "kolichestvo-portov", label: "Количество портов", type: "checkbox" },
    { key: "ekranirovanie", label: "Экранирование", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "tip-modulya", label: "Тип модуля", type: "checkbox", isExtra: true },
  ],
  // Рамки
  ramki: [
    { key: "chislo-postov", label: "Число постов", type: "checkbox" },
    { key: "orientatsiya", label: "Ориентация", type: "checkbox" },
    { key: "seriya", label: "Серия", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    {
      key: "sovmestimost-mekhanizma",
      label: "Совместимость механизма",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Розетки
  rozetki: [
    { key: "tip-rozetki", label: "Тип розетки", type: "checkbox" },
    { key: "zazemlenie", label: "Заземление", type: "checkbox" },
    { key: "chislo-postov", label: "Число постов", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "shtorki", label: "Шторки", type: "checkbox", isExtra: true },
    { key: "usb-porty", label: "USB-порты", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Розетки для ТВ антенны
  "rozetki-dlya-tv-antenny": [
    { key: "tip-tv-rozetki", label: "Тип ТВ-розетки", type: "checkbox" },
    { key: "chislo-vykhodov", label: "Число выходов", type: "checkbox" },
    { key: "diapazon-chastot", label: "Диапазон частот", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "seriya", label: "Серия", type: "checkbox", isExtra: true },
  ],
  // Телефонные розетки
  "telefonnye-rozetki": [
    { key: "razyom-rj11-rj12", label: "Разъём RJ11/RJ12", type: "checkbox" },
    { key: "kolichestvo-portov", label: "Количество портов", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "seriya", label: "Серия", type: "checkbox", isExtra: true },
  ],
  // Ванночки и валики
  "vannochki-i-valiki": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "shirina-valika", label: "Ширина валика", type: "checkbox" },
    { key: "diametr-valika", label: "Диаметр валика", type: "checkbox" },
    { key: "material-shubki", label: "Материал шубки", type: "checkbox" },
    { key: "dlina-vorsa", label: "Длина ворса", type: "checkbox" },
    { key: "dlya-tipa-kraski", label: "Для типа краски", type: "checkbox", isExtra: true },
    { key: "razmer-vannochki", label: "Размер ванночки", type: "checkbox", isExtra: true },
  ],
  // Ведра строительные
  "vedra-stroitelnye": [
    { key: "obyom", label: "Объём", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "forma", label: "Форма", type: "checkbox" },
    { key: "mernaya-shkala", label: "Мерная шкала", type: "checkbox" },
    { key: "kryshka", label: "Крышка", type: "checkbox", isExtra: true },
    { key: "usilennaya-ruchka", label: "Усиленная ручка", type: "checkbox", isExtra: true },
  ],
  // Инструмент для шлифования
  "instrument-dlya-shlifovaniya": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "abrazivnost-p", label: "Абразивность P", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "material-abraziva", label: "Материал абразива", type: "checkbox", isExtra: true },
    {
      key: "dlya-materiala-osnovaniya",
      label: "Для материала основания",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Кисти и щетки малярные
  "kisti-i-shchetki-malyarnye": [
    { key: "vid-kisti", label: "Вид кисти", type: "checkbox" },
    { key: "shirina-kisti", label: "Ширина кисти", type: "checkbox" },
    { key: "material-vorsa", label: "Материал ворса", type: "checkbox" },
    { key: "forma", label: "Форма", type: "checkbox" },
    { key: "dlya-tipa-kraski", label: "Для типа краски", type: "checkbox", isExtra: true },
    { key: "dlina-ruchki", label: "Длина ручки", type: "checkbox", isExtra: true },
  ],
  // Краскораспылители
  kraskoraspyliteli: [
    { key: "tip-kraskopulta", label: "Тип краскопульта", type: "checkbox" },
    {
      key: "proizvoditelnost-raspyleniya",
      label: "Производительность распыления",
      type: "checkbox",
    },
    { key: "diametr-sopla", label: "Диаметр сопла", type: "checkbox" },
    { key: "obyom-bachka", label: "Объём бачка", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox", isExtra: true },
    {
      key: "vyazkost-kraski-maksimum",
      label: "Вязкость краски максимум",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Мастерки и шпатели
  "masterki-i-shpateli": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "shirina-rabochey-chasti", label: "Ширина рабочей части", type: "checkbox" },
    { key: "material-polotna", label: "Материал полотна", type: "checkbox" },
    { key: "zubchatyy", label: "Зубчатый", type: "checkbox" },
    { key: "razmer-zuba", label: "Размер зуба", type: "checkbox", isExtra: true },
    { key: "material-rukoyatki", label: "Материал рукоятки", type: "checkbox", isExtra: true },
  ],
  // Мешалки для красок и смесей
  "meshalki-dlya-krasok-i-smesey": [
    { key: "tip-nasadki", label: "Тип насадки", type: "checkbox" },
    { key: "diametr-venchika", label: "Диаметр венчика", type: "checkbox" },
    { key: "dlina-venchika", label: "Длина венчика", type: "checkbox" },
    { key: "tip-khvostovika", label: "Тип хвостовика", type: "checkbox" },
    { key: "dlya-tipa-smesi", label: "Для типа смеси", type: "checkbox", isExtra: true },
    { key: "obyom-peremeshivaniya", label: "Объём перемешивания", type: "checkbox", isExtra: true },
  ],
  // Монт. пистолеты и шприцы
  "mont-pistolety-i-shpritsy": [
    { key: "vid-pistoleta", label: "Вид пистолета", type: "checkbox" },
    { key: "pod-kartridzh-ili-tubu", label: "Под картридж или тубу", type: "checkbox" },
    { key: "obyom-kartridzha", label: "Объём картриджа", type: "checkbox" },
    {
      key: "mekhanicheskiy-ili-pnevmaticheskiy",
      label: "Механический или пневматический",
      type: "checkbox",
    },
    { key: "peredatochnoe-chislo", label: "Передаточное число", type: "checkbox", isExtra: true },
  ],
  // Строительные ножи
  "stroitelnye-nozhi": [
    { key: "tip-nozha", label: "Тип ножа", type: "checkbox" },
    { key: "shirina-lezviya", label: "Ширина лезвия", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "skladnoy", label: "Складной", type: "checkbox" },
    { key: "fiksator-lezviya", label: "Фиксатор лезвия", type: "checkbox", isExtra: true },
    { key: "smennye-lezviya", label: "Сменные лезвия", type: "checkbox", isExtra: true },
  ],
  // Дальномеры лазерные (рулетки)
  "dalnomery-lazernye-ruletki": [
    { key: "dalnost-izmereniya", label: "Дальность измерения", type: "checkbox" },
    { key: "pogreshnost-izmereniya", label: "Погрешность измерения", type: "checkbox" },
    {
      key: "funktsiya-vychisleniya-ploshchadi",
      label: "Функция вычисления площади",
      type: "checkbox",
    },
    { key: "izmerenie-obyoma", label: "Измерение объёма", type: "checkbox" },
    { key: "bluetooth", label: "Bluetooth", type: "checkbox", isExtra: true },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
  ],
  // Индикаторы напряжения
  "indikatory-napryazheniya": [
    { key: "tip-indikatora", label: "Тип индикатора", type: "checkbox" },
    { key: "diapazon-napryazheniya", label: "Диапазон напряжения", type: "checkbox" },
    {
      key: "kontaktnyy-ili-beskontaktnyy",
      label: "Контактный или бесконтактный",
      type: "checkbox",
    },
    { key: "indikatsiya", label: "Индикация", type: "checkbox" },
    {
      key: "kategoriya-bezopasnosti-cat",
      label: "Категория безопасности CAT",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Инструменты для разметки
  "instrumenty-dlya-razmetki": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tsvet-razmetki", label: "Цвет разметки", type: "checkbox" },
    { key: "smennyy-grifel", label: "Сменный грифель", type: "checkbox", isExtra: true },
    {
      key: "dlya-materiala-osnovaniya",
      label: "Для материала основания",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Лазерный уровень
  "lazernyy-uroven": [
    { key: "chislo-luchey", label: "Число лучей", type: "checkbox" },
    { key: "tsvet-lazera", label: "Цвет лазера", type: "checkbox" },
    { key: "dalnost-izmereniya", label: "Дальность измерения", type: "checkbox" },
    { key: "samovyravnivanie", label: "Самовыравнивание", type: "checkbox" },
    { key: "pogreshnost-izmereniya", label: "Погрешность измерения", type: "checkbox" },
    { key: "rezba-shtativa", label: "Резьба штатива", type: "checkbox", isExtra: true },
    { key: "priyomnik-lazera", label: "Приёмник лазера", type: "checkbox", isExtra: true },
  ],
  // Рулетки
  ruletki: [
    { key: "dlina-lenty", label: "Длина ленты", type: "checkbox" },
    { key: "shirina-lenty", label: "Ширина ленты", type: "checkbox" },
    { key: "material-polotna", label: "Материал полотна", type: "checkbox" },
    { key: "magnitnyy-zatsep", label: "Магнитный зацеп", type: "checkbox" },
    { key: "avtostop", label: "Автостоп", type: "checkbox", isExtra: true },
    { key: "dvustoronnyaya-shkala", label: "Двусторонняя шкала", type: "checkbox", isExtra: true },
  ],
  // Уголки строительные
  "ugolki-stroitelnye": [
    { key: "dlina-plecha", label: "Длина плеча", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "reguliruemyy", label: "Регулируемый", type: "checkbox" },
    { key: "razmetochnaya-shkala", label: "Разметочная шкала", type: "checkbox" },
    { key: "tochnost", label: "Точность", type: "checkbox", isExtra: true },
  ],
  // Уровни
  urovni: [
    { key: "tip-urovnya", label: "Тип уровня", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "chislo-glazkov", label: "Число глазков", type: "checkbox" },
    { key: "tochnost", label: "Точность", type: "checkbox" },
    { key: "magnitnoe-osnovanie", label: "Магнитное основание", type: "checkbox", isExtra: true },
    { key: "tsifrovoy-displey", label: "Цифровой дисплей", type: "checkbox", isExtra: true },
  ],
  // воздуходув
  vozdukhoduv: [
    { key: "tip-vozdukhoduva", label: "Тип воздуходува", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "proizvoditelnost-vozdukha", label: "Производительность воздуха", type: "checkbox" },
    { key: "skorost-potoka", label: "Скорость потока", type: "checkbox" },
    { key: "rezhim-vsasyvaniya", label: "Режим всасывания", type: "checkbox", isExtra: true },
    { key: "obyom-meshka", label: "Объём мешка", type: "checkbox", isExtra: true },
  ],
  // Губцевый инструмент
  "gubtsevyy-instrument": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "material-gubok", label: "Материал губок", type: "checkbox" },
    { key: "izolirovannye-rukoyatki", label: "Изолированные рукоятки", type: "checkbox" },
    {
      key: "dielektricheskiy-dopusk",
      label: "Диэлектрический допуск",
      type: "checkbox",
      isExtra: true,
    },
    { key: "tip-gubok", label: "Тип губок", type: "checkbox", isExtra: true },
  ],
  // Ключи
  klyuchi: [
    { key: "vid-klyucha", label: "Вид ключа", type: "checkbox" },
    { key: "razmer-zeva", label: "Размер зева", type: "checkbox" },
    { key: "posadochnyy-kvadrat", label: "Посадочный квадрат", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "treshchotka", label: "Трещотка", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox", isExtra: true },
    { key: "nabor-ili-odinochnyy", label: "Набор или одиночный", type: "checkbox", isExtra: true },
  ],
  // Миксер
  mikser: [
    { key: "tip-miksera", label: "Тип миксера", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "kolichestvo-skorostey", label: "Количество скоростей", type: "checkbox" },
    { key: "maksimalnyy-obyom-smesi", label: "Максимальный объём смеси", type: "checkbox" },
    { key: "tip-shpindelya", label: "Тип шпинделя", type: "checkbox", isExtra: true },
    { key: "chislo-venchikov", label: "Число венчиков", type: "checkbox", isExtra: true },
  ],
  // Наборы ручных инструментов
  "nabory-ruchnykh-instrumentov": [
    { key: "vid-nabora", label: "Вид набора", type: "checkbox" },
    { key: "kolichestvo-predmetov", label: "Количество предметов", type: "checkbox" },
    { key: "tipy-golovok", label: "Типы головок", type: "checkbox" },
    { key: "posadochnyy-kvadrat", label: "Посадочный квадрат", type: "checkbox" },
    { key: "material-keysa", label: "Материал кейса", type: "checkbox", isExtra: true },
    { key: "dlya-avto-ili-doma", label: "Для авто или дома", type: "checkbox", isExtra: true },
  ],
  // Ножовки и пилы
  "nozhovki-i-pily": [
    { key: "tip-pily", label: "Тип пилы", type: "checkbox" },
    { key: "material-rezaniya", label: "Материал резания", type: "checkbox" },
    { key: "dlina-polotna", label: "Длина полотна", type: "checkbox" },
    { key: "razmer-zuba-tpi", label: "Размер зуба TPI", type: "checkbox" },
    { key: "smennoe-polotno", label: "Сменное полотно", type: "checkbox", isExtra: true },
    { key: "material-rukoyatki", label: "Материал рукоятки", type: "checkbox", isExtra: true },
  ],
  // Отвертки
  otvertki: [
    { key: "tip-nakonechnika", label: "Тип наконечника", type: "checkbox" },
    { key: "razmer-nakonechnika", label: "Размер наконечника", type: "checkbox" },
    { key: "dlina-sterzhnya", label: "Длина стержня", type: "checkbox" },
    { key: "dielektricheskaya", label: "Диэлектрическая", type: "checkbox" },
    {
      key: "magnitnyy-nakonechnik",
      label: "Магнитный наконечник",
      type: "checkbox",
      isExtra: true,
    },
    { key: "nabor-ili-odinochnaya", label: "Набор или одиночная", type: "checkbox", isExtra: true },
  ],
  // Пневматические инструменты
  "pnevmaticheskie-instrumenty": [
    { key: "tip-pnevmoinstrumenta", label: "Тип пневмоинструмента", type: "checkbox" },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox" },
    { key: "raskhod-vozdukha", label: "Расход воздуха", type: "checkbox" },
    { key: "posadochnyy-kvadrat", label: "Посадочный квадрат", type: "checkbox" },
    { key: "tip-shtutsera", label: "Тип штуцера", type: "checkbox", isExtra: true },
    { key: "krutyashchiy-moment", label: "Крутящий момент", type: "checkbox", isExtra: true },
  ],
  // Секаторы и клещи
  "sekatory-i-kleshchi": [
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "diametr-reza-maksimum", label: "Диаметр реза максимум", type: "checkbox" },
    { key: "tip-lezviya", label: "Тип лезвия", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "khrapovyy-mekhanizm", label: "Храповый механизм", type: "checkbox", isExtra: true },
    { key: "material-lezviya", label: "Материал лезвия", type: "checkbox", isExtra: true },
  ],
  // Степлеры
  steplery: [
    { key: "tip-steplera", label: "Тип степлера", type: "checkbox" },
    { key: "tip-skoby", label: "Тип скобы", type: "checkbox" },
    { key: "dlina-skoby", label: "Длина скобы", type: "checkbox" },
    {
      key: "mekhanicheskiy-ili-elektricheskiy",
      label: "Механический или электрический",
      type: "checkbox",
    },
    {
      key: "regulirovka-sily-udara",
      label: "Регулировка силы удара",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Струбцины и зажимы
  "strubtsiny-i-zazhimy": [
    { key: "tip-strubtsiny", label: "Тип струбцины", type: "checkbox" },
    { key: "rabochiy-zakhvat", label: "Рабочий захват", type: "checkbox" },
    { key: "glubina-zazhima", label: "Глубина зажима", type: "checkbox" },
    { key: "usilie-zazhima", label: "Усилие зажима", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox", isExtra: true },
    { key: "bystrozazhimnaya", label: "Быстрозажимная", type: "checkbox", isExtra: true },
  ],
  // Ударные инструменты
  "udarnye-instrumenty": [
    { key: "tip-instrumenta", label: "Тип инструмента", type: "checkbox" },
    { key: "massa-boyka", label: "Масса бойка", type: "checkbox" },
    { key: "material-rukoyatki", label: "Материал рукоятки", type: "checkbox" },
    { key: "tip-boyka", label: "Тип бойка", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox", isExtra: true },
    {
      key: "antivibratsionnaya-rukoyatka",
      label: "Антивибрационная рукоятка",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Защитные очки
  "zashchitnye-ochki": [
    { key: "tip-ochkov", label: "Тип очков", type: "checkbox" },
    { key: "material-linz", label: "Материал линз", type: "checkbox" },
    { key: "zashchita-ot-uf", label: "Защита от УФ", type: "checkbox" },
    { key: "antizapotevanie", label: "Антизапотевание", type: "checkbox" },
    { key: "reguliruemaya-duzhka", label: "Регулируемая дужка", type: "checkbox", isExtra: true },
    {
      key: "sovmestimost-s-kaskoy",
      label: "Совместимость с каской",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Каски и маски для защиты
  "kaski-i-maski-dlya-zashchity": [
    { key: "vid-zashchity", label: "Вид защиты", type: "checkbox" },
    { key: "klass-zashchity", label: "Класс защиты", type: "checkbox" },
    { key: "razmer", label: "Размер", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "regulirovka-ogolovya", label: "Регулировка оголовья", type: "checkbox", isExtra: true },
    { key: "shchitok", label: "Щиток", type: "checkbox", isExtra: true },
  ],
  // Перчатки
  perchatki: [
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "razmer-perchatok", label: "Размер перчаток", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tip-pokrytiya", label: "Тип покрытия", type: "checkbox" },
    {
      key: "klass-mekhanicheskoy-zashchity",
      label: "Класс механической защиты",
      type: "checkbox",
      isExtra: true,
    },
    { key: "uteplyonnye", label: "Утеплённые", type: "checkbox", isExtra: true },
  ],
  // Ремни безопасности
  "remni-bezopasnosti": [
    { key: "tip-privyazi", label: "Тип привязи", type: "checkbox" },
    { key: "razmer", label: "Размер", type: "checkbox" },
    { key: "chislo-tochek-krepleniya", label: "Число точек крепления", type: "checkbox" },
    { key: "dopustimaya-nagruzka", label: "Допустимая нагрузка", type: "checkbox" },
    {
      key: "standart-bezopasnosti",
      label: "Стандарт безопасности",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Спецодежда
  spetsodezhda: [
    { key: "vid-odezhdy", label: "Вид одежды", type: "checkbox" },
    { key: "razmer-odezhdy", label: "Размер одежды", type: "checkbox" },
    { key: "rostovka", label: "Ростовка", type: "checkbox" },
    { key: "sezonnost", label: "Сезонность", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "klass-zashchity", label: "Класс защиты", type: "checkbox", isExtra: true },
    {
      key: "svetootrazhayushchie-elementy",
      label: "Светоотражающие элементы",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Ящики
  yashchiki: [
    { key: "tip-yashchika", label: "Тип ящика", type: "checkbox" },
    { key: "razmery", label: "Размеры", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "chislo-otdeleniy", label: "Число отделений", type: "checkbox" },
    { key: "s-kolyosami", label: "С колёсами", type: "checkbox", isExtra: true },
    { key: "dlya-instrumenta", label: "Для инструмента", type: "checkbox", isExtra: true },
  ],
  // Столярно-слесарные инст.
  "stolyarno-slesarnye-inst-2": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "razmer-rabochey-chasti", label: "Размер рабочей части", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox", isExtra: true },
    { key: "nabor-ili-odinochnyy", label: "Набор или одиночный", type: "checkbox", isExtra: true },
  ],
  // Шлифовальные машины
  "shlifovalnye-mashiny": [
    { key: "tip-shlifmashiny", label: "Тип шлифмашины", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "diametr-diska", label: "Диаметр диска", type: "checkbox" },
    { key: "chastota-vrashcheniya", label: "Частота вращения", type: "checkbox" },
    { key: "regulirovka-oborotov", label: "Регулировка оборотов", type: "checkbox", isExtra: true },
    { key: "pyleudalenie", label: "Пылеудаление", type: "checkbox", isExtra: true },
  ],
  // Расходные материалы
  "raskhodnye-materialy": [
    { key: "tip-osnastki", label: "Тип оснастки", type: "checkbox" },
    { key: "dlya-kakogo-instrumenta", label: "Для какого инструмента", type: "checkbox" },
    { key: "posadochnyy-razmer", label: "Посадочный размер", type: "checkbox" },
    { key: "diametr", label: "Диаметр", type: "checkbox" },
    { key: "abrazivnost-p", label: "Абразивность P", type: "checkbox" },
    { key: "material-obrabotki", label: "Материал обработки", type: "checkbox", isExtra: true },
    {
      key: "kolichestvo-v-upakovke",
      label: "Количество в упаковке",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Штроборезы и броздоделы
  "shtroborezy-i-brozdodely": [
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "diametr-diska", label: "Диаметр диска", type: "checkbox" },
    { key: "shirina-shtroby-maksimum", label: "Ширина штробы максимум", type: "checkbox" },
    { key: "glubina-reza-maksimum", label: "Глубина реза максимум", type: "checkbox" },
    { key: "kolichestvo-diskov", label: "Количество дисков", type: "checkbox", isExtra: true },
    { key: "pyleudalenie", label: "Пылеудаление", type: "checkbox", isExtra: true },
  ],
  // Оборудования
  oborudovaniya: [
    { key: "vid-oborudovaniya", label: "Вид оборудования", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "gabarity", label: "Габариты", type: "checkbox" },
    { key: "ves", label: "Вес", type: "checkbox", isExtra: true },
    { key: "proizvoditelnost", label: "Производительность", type: "checkbox", isExtra: true },
  ],
  // Отбойные молотки
  "otboynye-molotki": [
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "energiya-udara", label: "Энергия удара", type: "checkbox" },
    { key: "chastota-udarov", label: "Частота ударов", type: "checkbox" },
    { key: "tip-patrona", label: "Тип патрона", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox", isExtra: true },
    { key: "massa-instrumenta", label: "Масса инструмента", type: "checkbox", isExtra: true },
  ],
  // Станки и другие электроинструменты
  "stanki-i-drugie-elektroinstrumenty": [
    { key: "tip-stanka", label: "Тип станка", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "razmer-rabochego-stola", label: "Размер рабочего стола", type: "checkbox" },
    { key: "skorost-vrashcheniya", label: "Скорость вращения", type: "checkbox", isExtra: true },
    { key: "material-obrabotki", label: "Материал обработки", type: "checkbox", isExtra: true },
  ],
  // Аккумуляторные батареи
  "akkumulyatornye-batarei": [
    { key: "platforma-akkumulyatora", label: "Платформа аккумулятора", type: "checkbox" },
    { key: "napryazhenie-akkumulyatora", label: "Напряжение аккумулятора", type: "checkbox" },
    { key: "yomkost-akkumulyatora", label: "Ёмкость аккумулятора", type: "checkbox" },
    { key: "khimiya-akkumulyatora", label: "Химия аккумулятора", type: "checkbox" },
    { key: "sovmestimost-brenda", label: "Совместимость бренда", type: "checkbox", isExtra: true },
    { key: "indikator-zaryada", label: "Индикатор заряда", type: "checkbox", isExtra: true },
  ],
  // Лобзики, пилы и рубанки
  "lobziki-pily-i-rubanki": [
    { key: "tip-instrumenta", label: "Тип инструмента", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "glubina-reza", label: "Глубина реза", type: "checkbox" },
    { key: "diametr-diska", label: "Диаметр диска", type: "checkbox" },
    { key: "chastota-khoda", label: "Частота хода", type: "checkbox", isExtra: true },
    { key: "regulirovka-oborotov", label: "Регулировка оборотов", type: "checkbox", isExtra: true },
  ],
  // Дрели и шуруповерты
  "dreli-i-shurupoverty": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    {
      key: "maksimalnyy-krutyashchiy-moment",
      label: "Максимальный крутящий момент",
      type: "checkbox",
    },
    { key: "tip-patrona", label: "Тип патрона", type: "checkbox" },
    { key: "diametr-patrona", label: "Диаметр патрона", type: "checkbox" },
    { key: "chislo-skorostey", label: "Число скоростей", type: "checkbox", isExtra: true },
    { key: "udarnyy-rezhim", label: "Ударный режим", type: "checkbox", isExtra: true },
    {
      key: "napryazhenie-akkumulyatora",
      label: "Напряжение аккумулятора",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Электроточилки
  elektrotochilki: [
    { key: "tip-tochilnogo-stanka", label: "Тип точильного станка", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "diametr-kruga", label: "Диаметр круга", type: "checkbox" },
    { key: "posadochnyy-diametr", label: "Посадочный диаметр", type: "checkbox" },
    { key: "chastota-vrashcheniya", label: "Частота вращения", type: "checkbox", isExtra: true },
    { key: "zernistost", label: "Зернистость", type: "checkbox", isExtra: true },
  ],
  // Сварочные аппараты и фены
  "svarochnye-apparaty-i-feny": [
    { key: "tip-instrumenta", label: "Тип инструмента", type: "checkbox" },
    { key: "svarochnyy-tok-maksimum", label: "Сварочный ток максимум", type: "checkbox" },
    { key: "metod-svarki", label: "Метод сварки", type: "checkbox" },
    { key: "pv-pri-toke", label: "ПВ при токе", type: "checkbox" },
    { key: "temperatura-nagreva", label: "Температура нагрева", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox", isExtra: true },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
  ],
  // Перфораторы и отбойные молотки
  "perforatory-i-otboynye-molotki": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "energiya-udara", label: "Энергия удара", type: "checkbox" },
    { key: "tip-patrona", label: "Тип патрона", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "rezhimy-raboty", label: "Режимы работы", type: "checkbox" },
    {
      key: "diametr-bureniya-maksimum",
      label: "Диаметр бурения максимум",
      type: "checkbox",
      isExtra: true,
    },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox", isExtra: true },
    { key: "massa-instrumenta", label: "Масса инструмента", type: "checkbox", isExtra: true },
  ],
  // Паяльники электрические
  "payalniki-elektricheskie": [
    { key: "tip-payalnika", label: "Тип паяльника", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "diapazon-temperatur", label: "Диапазон температур", type: "checkbox" },
    { key: "tip-zhala", label: "Тип жала", type: "checkbox" },
    {
      key: "regulirovka-temperatury",
      label: "Регулировка температуры",
      type: "checkbox",
      isExtra: true,
    },
    { key: "napryazhenie", label: "Напряжение", type: "checkbox", isExtra: true },
  ],
  // Задвижки
  zadvizhki: [
    { key: "tip-armatury", label: "Тип арматуры", type: "checkbox" },
    { key: "uslovnyy-prokhod-dn", label: "Условный проход DN", type: "checkbox" },
    { key: "nominalnoe-davlenie-pn", label: "Номинальное давление PN", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "tip-prisoedineniya", label: "Тип присоединения", type: "checkbox", isExtra: true },
    { key: "rabochaya-temperatura", label: "Рабочая температура", type: "checkbox", isExtra: true },
  ],
  // Комплектующие
  komplektuyushchie: [
    { key: "vid-komplektuyushchego", label: "Вид комплектующего", type: "checkbox" },
    { key: "podklyuchenie", label: "Подключение", type: "checkbox" },
    { key: "prisoedinitelnyy-razmer", label: "Присоединительный размер", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "sovmestimaya-sistema", label: "Совместимая система", type: "checkbox", isExtra: true },
    {
      key: "nominalnoe-davlenie-pn",
      label: "Номинальное давление PN",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Насосы
  nasosy: [
    { key: "tip-nasosa", label: "Тип насоса", type: "checkbox" },
    { key: "proizvoditelnost", label: "Производительность", type: "checkbox" },
    { key: "napor-maksimum", label: "Напор максимум", type: "checkbox" },
    { key: "glubina-vsasyvaniya", label: "Глубина всасывания", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    {
      key: "dlya-chistoy-ili-gryaznoy-vody",
      label: "Для чистой или грязной воды",
      type: "checkbox",
      isExtra: true,
    },
    {
      key: "diametr-podklyucheniya",
      label: "Диаметр подключения",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Помпы
  pompy: [
    { key: "tip-pompy", label: "Тип помпы", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "proizvoditelnost", label: "Производительность", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "napor-maksimum", label: "Напор максимум", type: "checkbox", isExtra: true },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox", isExtra: true },
  ],
  // Регуляторы давления воды
  "regulyatory-davleniya-vody": [
    { key: "diametr-podklyucheniya", label: "Диаметр подключения", type: "checkbox" },
    {
      key: "diapazon-regulirovki-davleniya",
      label: "Диапазон регулировки давления",
      type: "checkbox",
    },
    { key: "nominalnoe-davlenie-pn", label: "Номинальное давление PN", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "manometr-v-komplekte", label: "Манометр в комплекте", type: "checkbox", isExtra: true },
  ],
  // Фильтры
  filtry: [
    { key: "tip-filtra", label: "Тип фильтра", type: "checkbox" },
    { key: "stepen-filtratsii", label: "Степень фильтрации", type: "checkbox" },
    { key: "razmer-kartridzha", label: "Размер картриджа", type: "checkbox" },
    { key: "diametr-podklyucheniya", label: "Диаметр подключения", type: "checkbox" },
    { key: "proizvoditelnost", label: "Производительность", type: "checkbox", isExtra: true },
    {
      key: "dlya-kholodnoy-ili-goryachey-vody",
      label: "Для холодной или горячей воды",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Душевые гарнитуры
  "dushevye-garnitury": [
    { key: "tip-garnitura", label: "Тип гарнитура", type: "checkbox" },
    { key: "kolichestvo-rezhimov-strui", label: "Количество режимов струи", type: "checkbox" },
    { key: "dlina-shlanga", label: "Длина шланга", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tsvet-pokrytiya", label: "Цвет покрытия", type: "checkbox" },
    { key: "s-termostatom", label: "С термостатом", type: "checkbox", isExtra: true },
    { key: "razmer-leyki", label: "Размер лейки", type: "checkbox", isExtra: true },
  ],
  // Душевые панели
  "dushevye-paneli": [
    { key: "tip-dushevoy-paneli", label: "Тип душевой панели", type: "checkbox" },
    { key: "vysota", label: "Высота", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "gidromassazh", label: "Гидромассаж", type: "checkbox" },
    { key: "tip-smesitelya", label: "Тип смесителя", type: "checkbox", isExtra: true },
    { key: "tsvet-pokrytiya", label: "Цвет покрытия", type: "checkbox", isExtra: true },
  ],
  // Гафрированные трубы
  "gafrirovannye-truby": [
    { key: "material-truby", label: "Материал трубы", type: "checkbox" },
    { key: "diametr-truby", label: "Диаметр трубы", type: "checkbox" },
    { key: "dlina-bukhty", label: "Длина бухты", type: "checkbox" },
    { key: "primenenie", label: "Применение", type: "checkbox" },
    { key: "rabochaya-temperatura", label: "Рабочая температура", type: "checkbox", isExtra: true },
    { key: "s-armirovaniem", label: "С армированием", type: "checkbox", isExtra: true },
  ],
  // Защита от протечек
  "zashchita-ot-protechek": [
    { key: "tip-sistemy", label: "Тип системы", type: "checkbox" },
    { key: "chislo-datchikov", label: "Число датчиков", type: "checkbox" },
    { key: "diametr-krana", label: "Диаметр крана", type: "checkbox" },
    { key: "provodnaya-ili-besprovodnaya", label: "Проводная или беспроводная", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    {
      key: "uvedomleniya-na-telefon",
      label: "Уведомления на телефон",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Коллекторы и аксессуары
  "kollektory-i-aksessuary": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "chislo-vykhodov", label: "Число выходов", type: "checkbox" },
    { key: "diametr-vkhoda", label: "Диаметр входа", type: "checkbox" },
    { key: "diametr-vykhoda", label: "Диаметр выхода", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox", isExtra: true },
    { key: "s-raskhodomerami", label: "С расходомерами", type: "checkbox", isExtra: true },
  ],
  // Медные трубы
  "mednye-truby": [
    { key: "diametr-truby", label: "Диаметр трубы", type: "checkbox" },
    { key: "tolshchina-stenki", label: "Толщина стенки", type: "checkbox" },
    { key: "myagkaya-ili-tvyordaya", label: "Мягкая или твёрдая", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "primenenie", label: "Применение", type: "checkbox", isExtra: true },
    { key: "standart", label: "Стандарт", type: "checkbox", isExtra: true },
  ],
  // Наружная канализация
  "naruzhnaya-kanalizatsiya": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "diametr-truby", label: "Диаметр трубы", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    {
      key: "klass-koltsevoy-zhyostkosti-sn",
      label: "Класс кольцевой жёсткости SN",
      type: "checkbox",
      isExtra: true,
    },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox", isExtra: true },
  ],
  // Трубы и фитинги из ПВХ
  "truby-i-fitingi-iz-pvkh": [
    { key: "tip-izdeliya", label: "Тип изделия", type: "checkbox" },
    { key: "naruzhnyy-diametr", label: "Наружный диаметр", type: "checkbox" },
    { key: "prisoedinitelnyy-razmer", label: "Присоединительный размер", type: "checkbox" },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox" },
    {
      key: "nominalnoe-davlenie-pn",
      label: "Номинальное давление PN",
      type: "checkbox",
      isExtra: true,
    },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
  ],
  // Трубы и фитинги из ППР
  "truby-i-fitingi-iz-ppr": [
    { key: "tip-izdeliya", label: "Тип изделия", type: "checkbox" },
    { key: "diametr-truby", label: "Диаметр трубы", type: "checkbox" },
    { key: "nominalnoe-davlenie-pn", label: "Номинальное давление PN", type: "checkbox" },
    { key: "tip-armirovaniya", label: "Тип армирования", type: "checkbox" },
    { key: "tolshchina-stenki", label: "Толщина стенки", type: "checkbox" },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox", isExtra: true },
    {
      key: "dlya-otopleniya-ili-vody",
      label: "Для отопления или воды",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Фитинги бронзовые
  "fitingi-bronzovye": [
    { key: "vid-fitinga", label: "Вид фитинга", type: "checkbox" },
    { key: "prisoedinitelnyy-razmer", label: "Присоединительный размер", type: "checkbox" },
    { key: "tip-rezby", label: "Тип резьбы", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    {
      key: "nominalnoe-davlenie-pn",
      label: "Номинальное давление PN",
      type: "checkbox",
      isExtra: true,
    },
    { key: "ugol", label: "Угол", type: "checkbox", isExtra: true },
  ],
  // Бойлеры водонагреватели
  "boylery-vodonagrevateli": [
    { key: "tip-vodonagrevatelya", label: "Тип водонагревателя", type: "checkbox" },
    { key: "obyom-baka", label: "Объём бака", type: "checkbox" },
    { key: "moshchnost-nagreva", label: "Мощность нагрева", type: "checkbox" },
    {
      key: "vertikalnyy-ili-gorizontalnyy",
      label: "Вертикальный или горизонтальный",
      type: "checkbox",
    },
    { key: "material-baka", label: "Материал бака", type: "checkbox" },
    { key: "vremya-nagreva", label: "Время нагрева", type: "checkbox", isExtra: true },
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox", isExtra: true },
  ],
  // Котлы
  kotly: [
    { key: "tip-kotla", label: "Тип котла", type: "checkbox" },
    { key: "tip-topliva", label: "Тип топлива", type: "checkbox" },
    { key: "teplovaya-moshchnost", label: "Тепловая мощность", type: "checkbox" },
    { key: "ploshchad-otopleniya", label: "Площадь отопления", type: "checkbox" },
    { key: "kolichestvo-konturov", label: "Количество контуров", type: "checkbox" },
    { key: "kamera-sgoraniya", label: "Камера сгорания", type: "checkbox", isExtra: true },
    {
      key: "nastennyy-ili-napolnyy",
      label: "Настенный или напольный",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Полотенцесушители
  polotentsesushiteli: [
    { key: "tip-nagreva", label: "Тип нагрева", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "vysota", label: "Высота", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "diametr-podklyucheniya", label: "Диаметр подключения", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox", isExtra: true },
    { key: "tsvet-pokrytiya", label: "Цвет покрытия", type: "checkbox", isExtra: true },
  ],
  // Радиаторы отопления
  "radiatory-otopleniya": [
    { key: "tip-radiatora", label: "Тип радиатора", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "chislo-sektsiy", label: "Число секций", type: "checkbox" },
    { key: "teplootdacha", label: "Теплоотдача", type: "checkbox" },
    { key: "mezhosevoe-rasstoyanie", label: "Межосевое расстояние", type: "checkbox" },
    { key: "tip-podklyucheniya", label: "Тип подключения", type: "checkbox", isExtra: true },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox", isExtra: true },
  ],
  // Труборезы
  truborezy: [
    { key: "dlya-kakogo-materiala-trub", label: "Для какого материала труб", type: "checkbox" },
    { key: "diametr-reza-maksimum", label: "Диаметр реза максимум", type: "checkbox" },
    { key: "tip-mekhanizma", label: "Тип механизма", type: "checkbox" },
    { key: "material-lezviya", label: "Материал лезвия", type: "checkbox" },
    {
      key: "ruchnoy-ili-elektricheskiy",
      label: "Ручной или электрический",
      type: "checkbox",
      isExtra: true,
    },
    { key: "smennyy-rolik", label: "Сменный ролик", type: "checkbox", isExtra: true },
  ],
  // Комплектующие
  "komplektuyushchie-2": [
    { key: "vid-komplektuyushchego", label: "Вид комплектующего", type: "checkbox" },
    { key: "dlya-kakogo-izdeliya", label: "Для какого изделия", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "prisoedinitelnyy-razmer", label: "Присоединительный размер", type: "checkbox" },
    { key: "sovmestimost-modeli", label: "Совместимость модели", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Комплектующие к санфаянсу
  "komplektuyushchie-k-sanfayansu": [
    { key: "vid-komplektuyushchego", label: "Вид комплектующего", type: "checkbox" },
    { key: "dlya-unitaza-ili-rakoviny", label: "Для унитаза или раковины", type: "checkbox" },
    { key: "razmer", label: "Размер", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "sovmestimost-modeli", label: "Совместимость модели", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Санфаянс
  sanfayans: [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "forma", label: "Форма", type: "checkbox" },
    { key: "razmery", label: "Размеры", type: "checkbox", isExtra: true },
    { key: "tip-vypuska", label: "Тип выпуска", type: "checkbox", isExtra: true },
  ],
  // Смесители для душа
  "smesiteli-dlya-dusha": [
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "mezhosevoe-rasstoyanie", label: "Межосевое расстояние", type: "checkbox" },
    { key: "termostat", label: "Термостат", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "tsvet-pokrytiya", label: "Цвет покрытия", type: "checkbox", isExtra: true },
    { key: "tip-podklyucheniya", label: "Тип подключения", type: "checkbox", isExtra: true },
  ],
  // Смесители для кухни
  "smesiteli-dlya-kukhni": [
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox" },
    { key: "vysota-izliva", label: "Высота излива", type: "checkbox" },
    { key: "povorotnyy-izliv", label: "Поворотный излив", type: "checkbox" },
    { key: "vydvizhnaya-leyka", label: "Выдвижная лейка", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox", isExtra: true },
    { key: "tsvet-pokrytiya", label: "Цвет покрытия", type: "checkbox", isExtra: true },
  ],
  // Смесители для умывальника
  "smesiteli-dlya-umyvalnika": [
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox" },
    { key: "vysota-izliva", label: "Высота излива", type: "checkbox" },
    { key: "dlina-izliva", label: "Длина излива", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "tsvet-pokrytiya", label: "Цвет покрытия", type: "checkbox", isExtra: true },
    { key: "donnyy-klapan", label: "Донный клапан", type: "checkbox", isExtra: true },
  ],
  // Шланги для смесителей
  "shlangi-dlya-smesiteley": [
    { key: "dlina-shlanga", label: "Длина шланга", type: "checkbox" },
    { key: "prisoedinitelnyy-razmer", label: "Присоединительный размер", type: "checkbox" },
    { key: "tip-rezby", label: "Тип резьбы", type: "checkbox" },
    { key: "material-oplyotki", label: "Материал оплётки", type: "checkbox" },
    { key: "dlya-goryachey-vody", label: "Для горячей воды", type: "checkbox", isExtra: true },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox", isExtra: true },
  ],
  // Умывальники
  umyvalniki: [
    { key: "tip-umyvalnika", label: "Тип умывальника", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    { key: "glubina", label: "Глубина", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "otverstie-pod-smesitel", label: "Отверстие под смеситель", type: "checkbox" },
    { key: "pereliv", label: "Перелив", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Унитазы
  unitazy: [
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox" },
    { key: "tip-vypuska", label: "Тип выпуска", type: "checkbox" },
    { key: "bezobodkovyy", label: "Безободковый", type: "checkbox" },
    { key: "mikrolift-sidenya", label: "Микролифт сиденья", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "forma-chashi", label: "Форма чаши", type: "checkbox", isExtra: true },
    {
      key: "komplektatsiya-bachkom",
      label: "Комплектация бачком",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Гигиенические средства
  "gigienicheskie-sredstva": [
    { key: "vid-sredstva", label: "Вид средства", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    { key: "aromat", label: "Аромат", type: "checkbox" },
    { key: "format-upakovki", label: "Формат упаковки", type: "checkbox", isExtra: true },
    { key: "gipoallergennyy", label: "Гипоаллергенный", type: "checkbox", isExtra: true },
  ],
  // Моющие и чистящие средства
  "moyushchie-i-chistyashchie-sredstva": [
    { key: "naznachenie-sredstva", label: "Назначение средства", type: "checkbox" },
    { key: "dlya-poverkhnosti", label: "Для поверхности", type: "checkbox" },
    { key: "forma-vypuska", label: "Форма выпуска", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    { key: "kontsentrat", label: "Концентрат", type: "checkbox", isExtra: true },
    {
      key: "dlya-ruchnoy-ili-mashinnoy-uborki",
      label: "Для ручной или машинной уборки",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Освежители воздуха
  "osvezhiteli-vozdukha": [
    { key: "tip-osvezhitelya", label: "Тип освежителя", type: "checkbox" },
    { key: "aromat", label: "Аромат", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    { key: "smennyy-blok", label: "Сменный блок", type: "checkbox" },
    { key: "avtomaticheskiy", label: "Автоматический", type: "checkbox", isExtra: true },
  ],
  // Стирка
  stirka: [
    { key: "tip-sredstva", label: "Тип средства", type: "checkbox" },
    {
      key: "dlya-belogo-ili-tsvetnogo-belya",
      label: "Для белого или цветного белья",
      type: "checkbox",
    },
    { key: "forma-vypuska", label: "Форма выпуска", type: "checkbox" },
    { key: "kolichestvo-stirok", label: "Количество стирок", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    { key: "gipoallergennyy", label: "Гипоаллергенный", type: "checkbox", isExtra: true },
  ],
  // Уход за бытовой техникой
  "ukhod-za-bytovoy-tekhnikoy": [
    { key: "dlya-vida-tekhniki", label: "Для вида техники", type: "checkbox" },
    { key: "tip-sredstva", label: "Тип средства", type: "checkbox" },
    { key: "naznachenie-sredstva", label: "Назначение средства", type: "checkbox" },
    { key: "forma-vypuska", label: "Форма выпуска", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox", isExtra: true },
    { key: "udalenie-nakipi", label: "Удаление накипи", type: "checkbox", isExtra: true },
  ],
  // Тележки
  telezhki: [
    { key: "tip-telezhki", label: "Тип тележки", type: "checkbox" },
    { key: "gruzopodyomnost", label: "Грузоподъёмность", type: "checkbox" },
    { key: "razmer-platformy", label: "Размер платформы", type: "checkbox" },
    { key: "chislo-kolyos", label: "Число колёс", type: "checkbox" },
    { key: "material-platformy", label: "Материал платформы", type: "checkbox" },
    { key: "skladnaya", label: "Складная", type: "checkbox", isExtra: true },
    { key: "diametr-kolesa", label: "Диаметр колеса", type: "checkbox", isExtra: true },
  ],
  // Анкеры
  ankery: [
    { key: "tip-ankera", label: "Тип анкера", type: "checkbox" },
    { key: "diametr-krepezha", label: "Диаметр крепежа", type: "checkbox" },
    { key: "dlina-krepezha", label: "Длина крепежа", type: "checkbox" },
    { key: "material-osnovaniya", label: "Материал основания", type: "checkbox" },
    { key: "material-krepezha", label: "Материал крепежа", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox", isExtra: true },
    { key: "raschyotnaya-nagruzka", label: "Расчётная нагрузка", type: "checkbox", isExtra: true },
  ],
  // Болты и шпильки
  "bolty-i-shpilki": [
    { key: "vid-krepezha", label: "Вид крепежа", type: "checkbox" },
    { key: "diametr-rezby", label: "Диаметр резьбы", type: "checkbox" },
    { key: "dlina-krepezha", label: "Длина крепежа", type: "checkbox" },
    { key: "shag-rezby", label: "Шаг резьбы", type: "checkbox" },
    { key: "klass-prochnosti", label: "Класс прочности", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox", isExtra: true },
    { key: "pokrytie", label: "Покрытие", type: "checkbox", isExtra: true },
  ],
  // Гайки и шайбы
  "gayki-i-shayby": [
    { key: "tip-izdeliya", label: "Тип изделия", type: "checkbox" },
    { key: "diametr-rezby", label: "Диаметр резьбы", type: "checkbox" },
    { key: "standart-din-iso", label: "Стандарт DIN/ISO", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "klass-prochnosti", label: "Класс прочности", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox", isExtra: true },
    { key: "forma", label: "Форма", type: "checkbox", isExtra: true },
  ],
  // Гвозди
  gvozdi: [
    { key: "tip-gvozdya", label: "Тип гвоздя", type: "checkbox" },
    { key: "diametr-krepezha", label: "Диаметр крепежа", type: "checkbox" },
    { key: "dlina-krepezha", label: "Длина крепежа", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
    { key: "ves-upakovki", label: "Вес упаковки", type: "checkbox", isExtra: true },
  ],
  // Дюбели
  dyubeli: [
    { key: "vid-dyubelya", label: "Вид дюбеля", type: "checkbox" },
    { key: "diametr-dyubelya", label: "Диаметр дюбеля", type: "checkbox" },
    { key: "dlina-dyubelya", label: "Длина дюбеля", type: "checkbox" },
    { key: "material-osnovaniya", label: "Материал основания", type: "checkbox" },
    { key: "material-dyubelya", label: "Материал дюбеля", type: "checkbox", isExtra: true },
    { key: "s-shurupom", label: "С шурупом", type: "checkbox", isExtra: true },
  ],
  // Крюки и зажимы
  "kryuki-i-zazhimy": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "diametr-krepezha", label: "Диаметр крепежа", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox" },
    {
      key: "maksimalnaya-nagruzka",
      label: "Максимальная нагрузка",
      type: "checkbox",
      isExtra: true,
    },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
  ],
  // Саморезы и шурупы
  "samorezy-i-shurupy": [
    { key: "naznachenie-krepezha", label: "Назначение крепежа", type: "checkbox" },
    { key: "diametr-krepezha", label: "Диаметр крепежа", type: "checkbox" },
    { key: "dlina-krepezha", label: "Длина крепежа", type: "checkbox" },
    { key: "tip-golovki", label: "Тип головки", type: "checkbox" },
    { key: "tip-shlitsa", label: "Тип шлица", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox", isExtra: true },
    { key: "pokrytie", label: "Покрытие", type: "checkbox", isExtra: true },
    { key: "tip-nakonechnika", label: "Тип наконечника", type: "checkbox", isExtra: true },
  ],
  // Скобы и площадки
  "skoby-i-ploshchadki": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "razmer-skoby", label: "Размер скобы", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox" },
    { key: "tip-krepleniya", label: "Тип крепления", type: "checkbox", isExtra: true },
    {
      key: "kolichestvo-v-upakovke",
      label: "Количество в упаковке",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Трос стальной
  "tros-stalnoy": [
    { key: "diametr-trosa", label: "Диаметр троса", type: "checkbox" },
    { key: "konstruktsiya-trosa", label: "Конструкция троса", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "pokrytie", label: "Покрытие", type: "checkbox" },
    { key: "razryvnaya-nagruzka", label: "Разрывная нагрузка", type: "checkbox", isExtra: true },
    { key: "dlina-bukhty", label: "Длина бухты", type: "checkbox", isExtra: true },
  ],
  // Хомуты-стяжки
  "khomuty-styazhki": [
    { key: "tip-khomuta", label: "Тип хомута", type: "checkbox" },
    { key: "dlina-styazhki", label: "Длина стяжки", type: "checkbox" },
    { key: "shirina-styazhki", label: "Ширина стяжки", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "uf-stoykost", label: "УФ-стойкость", type: "checkbox", isExtra: true },
    { key: "dlya-trub-ili-kabelya", label: "Для труб или кабеля", type: "checkbox", isExtra: true },
  ],
  // Гладильные доски
  "gladilnye-doski": [
    { key: "razmer-poverkhnosti", label: "Размер поверхности", type: "checkbox" },
    { key: "regulirovka-vysoty", label: "Регулировка высоты", type: "checkbox" },
    { key: "material-osnovy", label: "Материал основы", type: "checkbox" },
    { key: "podstavka-pod-utyug", label: "Подставка под утюг", type: "checkbox" },
    { key: "elektrorozetka", label: "Электророзетка", type: "checkbox", isExtra: true },
    { key: "skladnaya", label: "Складная", type: "checkbox", isExtra: true },
  ],
  // Сушилки
  sushilki: [
    { key: "tip-sushilki", label: "Тип сушилки", type: "checkbox" },
    { key: "dlina-sushilnoy-poverkhnosti", label: "Длина сушильной поверхности", type: "checkbox" },
    { key: "maksimalnaya-nagruzka", label: "Максимальная нагрузка", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "skladnaya", label: "Складная", type: "checkbox", isExtra: true },
    { key: "s-kolyosami", label: "С колёсами", type: "checkbox", isExtra: true },
  ],
  // Утюги
  utyugi: [
    { key: "tip-utyuga", label: "Тип утюга", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "parovoy-udar", label: "Паровой удар", type: "checkbox" },
    { key: "postoyannaya-podacha-para", label: "Постоянная подача пара", type: "checkbox" },
    { key: "material-podoshvy", label: "Материал подошвы", type: "checkbox" },
    { key: "obyom-rezervuara", label: "Объём резервуара", type: "checkbox", isExtra: true },
    { key: "avtootklyuchenie", label: "Автоотключение", type: "checkbox", isExtra: true },
  ],
  // Вантузы
  vantuzy: [
    { key: "tip-vantuza", label: "Тип вантуза", type: "checkbox" },
    { key: "diametr-chashi", label: "Диаметр чаши", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "dlina-ruchki", label: "Длина ручки", type: "checkbox" },
    {
      key: "dlya-rakoviny-ili-unitaza",
      label: "Для раковины или унитаза",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Ведра
  vedra: [
    { key: "obyom", label: "Объём", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "forma", label: "Форма", type: "checkbox" },
    { key: "otzhim", label: "Отжим", type: "checkbox" },
    { key: "kryshka", label: "Крышка", type: "checkbox", isExtra: true },
    { key: "mernaya-shkala", label: "Мерная шкала", type: "checkbox", isExtra: true },
  ],
  // Веники и метлы
  "veniki-i-metly": [
    { key: "vid-izdeliya", label: "Вид изделия", type: "checkbox" },
    { key: "material-shchetiny", label: "Материал щетины", type: "checkbox" },
    { key: "shirina-rabochey-chasti", label: "Ширина рабочей части", type: "checkbox" },
    { key: "dlina-ruchki", label: "Длина ручки", type: "checkbox" },
    {
      key: "dlya-ulitsy-ili-pomeshcheniya",
      label: "Для улицы или помещения",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Ерши
  ershi: [
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "material-shchetiny", label: "Материал щетины", type: "checkbox" },
    { key: "dlina-ruchki", label: "Длина ручки", type: "checkbox" },
    { key: "s-podstavkoy", label: "С подставкой", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Стекломои
  steklomoi: [
    { key: "shirina-rabochey-chasti", label: "Ширина рабочей части", type: "checkbox" },
    { key: "dlina-ruchki", label: "Длина ручки", type: "checkbox" },
    { key: "teleskopicheskaya", label: "Телескопическая", type: "checkbox" },
    { key: "material-nasadki", label: "Материал насадки", type: "checkbox" },
    { key: "s-raspylitelem", label: "С распылителем", type: "checkbox", isExtra: true },
  ],
  // Швабры и щетки
  "shvabry-i-shchetki": [
    { key: "tip-shvabry", label: "Тип швабры", type: "checkbox" },
    { key: "material-nasadki", label: "Материал насадки", type: "checkbox" },
    { key: "shirina-rabochey-chasti", label: "Ширина рабочей части", type: "checkbox" },
    { key: "otzhim", label: "Отжим", type: "checkbox" },
    { key: "teleskopicheskaya", label: "Телескопическая", type: "checkbox", isExtra: true },
    { key: "smennaya-nasadka", label: "Сменная насадка", type: "checkbox", isExtra: true },
  ],
  // Аксессуары для полива
  "aksessuary-dlya-poliva": [
    { key: "vid-soedinitelya", label: "Вид соединителя", type: "checkbox" },
    { key: "diametr-shlanga", label: "Диаметр шланга", type: "checkbox" },
    { key: "tip-rezby", label: "Тип резьбы", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "bystrosyomnyy", label: "Быстросъёмный", type: "checkbox", isExtra: true },
    { key: "s-akvastopom", label: "С аквастопом", type: "checkbox", isExtra: true },
  ],
  // Емкости
  emkosti: [
    { key: "obyom", label: "Объём", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "forma", label: "Форма", type: "checkbox" },
    { key: "dlya-pitevoy-vody", label: "Для питьевой воды", type: "checkbox" },
    { key: "uf-stoykost", label: "УФ-стойкость", type: "checkbox", isExtra: true },
    { key: "kran-v-komplekte", label: "Кран в комплекте", type: "checkbox", isExtra: true },
  ],
  // Пульверизаторы
  pulverizatory: [
    { key: "obyom-baka", label: "Объём бака", type: "checkbox" },
    { key: "tip-raspylitelya", label: "Тип распылителя", type: "checkbox" },
    { key: "regulirovka-strui", label: "Регулировка струи", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "nagnetatelnyy-nasos", label: "Нагнетательный насос", type: "checkbox", isExtra: true },
  ],
  // Распылители
  raspyliteli: [
    { key: "tip-orositelya", label: "Тип оросителя", type: "checkbox" },
    { key: "ploshchad-poliva", label: "Площадь полива", type: "checkbox" },
    { key: "dalnost-poliva", label: "Дальность полива", type: "checkbox" },
    { key: "regulirovka-sektora", label: "Регулировка сектора", type: "checkbox" },
    {
      key: "diametr-podklyucheniya",
      label: "Диаметр подключения",
      type: "checkbox",
      isExtra: true,
    },
    { key: "chislo-rezhimov", label: "Число режимов", type: "checkbox", isExtra: true },
  ],
  // Шланги
  shlangi: [
    { key: "diametr-shlanga", label: "Диаметр шланга", type: "checkbox" },
    { key: "dlina", label: "Длина", type: "checkbox" },
    { key: "chislo-sloyov", label: "Число слоёв", type: "checkbox" },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "armirovannyy", label: "Армированный", type: "checkbox", isExtra: true },
    { key: "morozostoykost", label: "Морозостойкость", type: "checkbox", isExtra: true },
  ],
  // Газонокосилки и мотоблоки
  "gazonokosilki-i-motobloki": [
    { key: "vid-tekhniki", label: "Вид техники", type: "checkbox" },
    { key: "tip-dvigatelya", label: "Тип двигателя", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "shirina-obrabotki", label: "Ширина обработки", type: "checkbox" },
    { key: "vysota-skashivaniya", label: "Высота скашивания", type: "checkbox" },
    { key: "samokhodnaya", label: "Самоходная", type: "checkbox", isExtra: true },
    { key: "obyom-travosbornika", label: "Объём травосборника", type: "checkbox", isExtra: true },
  ],
  // Кусторезы
  kustorezy: [
    { key: "tip-kustoreza", label: "Тип кустореза", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "dlina-shiny", label: "Длина шины", type: "checkbox" },
    { key: "tolshchina-reza-maksimum", label: "Толщина реза максимум", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox", isExtra: true },
    {
      key: "teleskopicheskaya-shtanga",
      label: "Телескопическая штанга",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Мойки
  moyki: [
    { key: "tip-moyki", label: "Тип мойки", type: "checkbox" },
    { key: "davlenie-maksimum", label: "Давление максимум", type: "checkbox" },
    { key: "proizvoditelnost-vody", label: "Производительность воды", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "dlina-shlanga", label: "Длина шланга", type: "checkbox", isExtra: true },
    {
      key: "zabor-vody-iz-yomkosti",
      label: "Забор воды из ёмкости",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Опрыскиватели
  opryskivateli: [
    { key: "tip-opryskivatelya", label: "Тип опрыскивателя", type: "checkbox" },
    { key: "obyom-baka", label: "Объём бака", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox" },
    { key: "dlina-shtangi", label: "Длина штанги", type: "checkbox", isExtra: true },
    { key: "akkumulyatornyy", label: "Аккумуляторный", type: "checkbox", isExtra: true },
  ],
  // Садовые тачки
  "sadovye-tachki": [
    { key: "obyom-koryta", label: "Объём корыта", type: "checkbox" },
    { key: "gruzopodyomnost", label: "Грузоподъёмность", type: "checkbox" },
    { key: "chislo-kolyos", label: "Число колёс", type: "checkbox" },
    { key: "material-kuzova", label: "Материал кузова", type: "checkbox" },
    { key: "tip-kolesa", label: "Тип колеса", type: "checkbox", isExtra: true },
  ],
  // Триммеры
  trimmery: [
    { key: "tip-dvigatelya", label: "Тип двигателя", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "shirina-skashivaniya", label: "Ширина скашивания", type: "checkbox" },
    { key: "rezhushchiy-element", label: "Режущий элемент", type: "checkbox" },
    { key: "razbornaya-shtanga", label: "Разборная штанга", type: "checkbox", isExtra: true },
    { key: "tip-rukoyatki", label: "Тип рукоятки", type: "checkbox", isExtra: true },
  ],
  // Декоративные лампы
  "dekorativnye-lampy": [
    { key: "tip-lampy", label: "Тип лампы", type: "checkbox" },
    { key: "istochnik-pitaniya", label: "Источник питания", type: "checkbox" },
    { key: "tsvet-svecheniya", label: "Цвет свечения", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox", isExtra: true },
    { key: "forma", label: "Форма", type: "checkbox", isExtra: true },
  ],
  // Светильники
  "svetilniki-2": [
    { key: "vid-svetilnika", label: "Вид светильника", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "tsvetovaya-temperatura", label: "Цветовая температура", type: "checkbox" },
    { key: "montazh", label: "Монтаж", type: "checkbox", isExtra: true },
    { key: "datchik-dvizheniya", label: "Датчик движения", type: "checkbox", isExtra: true },
  ],
  // Солнечные светильники
  "solnechnye-svetilniki": [
    { key: "moshchnost-solnechnoy-paneli", label: "Мощность солнечной панели", type: "checkbox" },
    { key: "yomkost-akkumulyatora", label: "Ёмкость аккумулятора", type: "checkbox" },
    { key: "vremya-avtonomnoy-raboty", label: "Время автономной работы", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox" },
    { key: "svetovoy-potok", label: "Световой поток", type: "checkbox", isExtra: true },
    { key: "datchik-dvizheniya", label: "Датчик движения", type: "checkbox", isExtra: true },
  ],
  // Грабли и вилы
  "grabli-i-vily": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "shirina-rabochey-chasti", label: "Ширина рабочей части", type: "checkbox" },
    { key: "kolichestvo-zubev", label: "Количество зубьев", type: "checkbox" },
    { key: "material-rabochey-chasti", label: "Материал рабочей части", type: "checkbox" },
    { key: "dlina-cherenka", label: "Длина черенка", type: "checkbox", isExtra: true },
    { key: "teleskopicheskiy", label: "Телескопический", type: "checkbox", isExtra: true },
  ],
  // Лопаты
  lopaty: [
    { key: "tip-lopaty", label: "Тип лопаты", type: "checkbox" },
    { key: "material-polotna", label: "Материал полотна", type: "checkbox" },
    { key: "dlina-cherenka", label: "Длина черенка", type: "checkbox" },
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "skladnaya", label: "Складная", type: "checkbox", isExtra: true },
    { key: "material-rukoyatki", label: "Материал рукоятки", type: "checkbox", isExtra: true },
  ],
  // Ручные кусторезы
  "ruchnye-kustorezy": [
    { key: "dlina-lezviya", label: "Длина лезвия", type: "checkbox" },
    { key: "tip-lezviya", label: "Тип лезвия", type: "checkbox" },
    { key: "teleskopicheskie-ruchki", label: "Телескопические ручки", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    {
      key: "maksimalnyy-diametr-reza",
      label: "Максимальный диаметр реза",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Уголь и дрова
  "ugol-i-drova": [
    { key: "vid-topliva", label: "Вид топлива", type: "checkbox" },
    { key: "poroda-dereva", label: "Порода дерева", type: "checkbox" },
    { key: "massa-upakovki", label: "Масса упаковки", type: "checkbox" },
    { key: "vlazhnost", label: "Влажность", type: "checkbox" },
    { key: "fraktsiya", label: "Фракция", type: "checkbox", isExtra: true },
    { key: "forma-postavki", label: "Форма поставки", type: "checkbox", isExtra: true },
  ],
  // Алюминиевые двери
  "alyuminievye-dveri": [
    { key: "tip-dveri", label: "Тип двери", type: "checkbox" },
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "vysota-polotna", label: "Высота полотна", type: "checkbox" },
    { key: "osteklenie", label: "Остекление", type: "checkbox" },
    { key: "teploizolyatsiya", label: "Теплоизоляция", type: "checkbox" },
    { key: "tsvet-profilya", label: "Цвет профиля", type: "checkbox", isExtra: true },
    { key: "storona-otkryvaniya", label: "Сторона открывания", type: "checkbox", isExtra: true },
  ],
  // Входные двери
  "vkhodnye-dveri": [
    { key: "material-polotna", label: "Материал полотна", type: "checkbox" },
    { key: "shirina-dveri", label: "Ширина двери", type: "checkbox" },
    { key: "vysota-dveri", label: "Высота двери", type: "checkbox" },
    { key: "tolshchina-polotna", label: "Толщина полотна", type: "checkbox" },
    { key: "tolshchina-metalla", label: "Толщина металла", type: "checkbox" },
    { key: "termorazryv", label: "Терморазрыв", type: "checkbox", isExtra: true },
    {
      key: "chislo-konturov-uplotneniya",
      label: "Число контуров уплотнения",
      type: "checkbox",
      isExtra: true,
    },
    { key: "storona-otkryvaniya", label: "Сторона открывания", type: "checkbox", isExtra: true },
  ],
  // Двери экошпон
  "dveri-ekoshpon": [
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "vysota-polotna", label: "Высота полотна", type: "checkbox" },
    { key: "tsvet-i-dekor", label: "Цвет и декор", type: "checkbox" },
    { key: "glukhaya-ili-so-steklom", label: "Глухая или со стеклом", type: "checkbox" },
    { key: "tip-otkryvaniya", label: "Тип открывания", type: "checkbox", isExtra: true },
    { key: "komplekt-s-korobkoy", label: "Комплект с коробкой", type: "checkbox", isExtra: true },
  ],
  // Ламинированные двери
  "laminirovannye-dveri": [
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "vysota-polotna", label: "Высота полотна", type: "checkbox" },
    { key: "tsvet-i-dekor", label: "Цвет и декор", type: "checkbox" },
    { key: "glukhaya-ili-so-steklom", label: "Глухая или со стеклом", type: "checkbox" },
    { key: "tip-pokrytiya", label: "Тип покрытия", type: "checkbox", isExtra: true },
    { key: "komplekt-s-korobkoy", label: "Комплект с коробкой", type: "checkbox", isExtra: true },
  ],
  // Межкомнатные двери
  "mezhkomnatnye-dveri": [
    { key: "material-polotna", label: "Материал полотна", type: "checkbox" },
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "vysota-polotna", label: "Высота полотна", type: "checkbox" },
    { key: "tsvet-i-dekor", label: "Цвет и декор", type: "checkbox" },
    { key: "glukhaya-ili-so-steklom", label: "Глухая или со стеклом", type: "checkbox" },
    { key: "sposob-otkryvaniya", label: "Способ открывания", type: "checkbox", isExtra: true },
    { key: "storona-otkryvaniya", label: "Сторона открывания", type: "checkbox", isExtra: true },
  ],
  // Пластиковые двери
  "plastikovye-dveri": [
    { key: "tip-profilya", label: "Тип профиля", type: "checkbox" },
    { key: "shirina-dveri", label: "Ширина двери", type: "checkbox" },
    { key: "vysota-dveri", label: "Высота двери", type: "checkbox" },
    { key: "chislo-kamer-profilya", label: "Число камер профиля", type: "checkbox" },
    { key: "steklopaket", label: "Стеклопакет", type: "checkbox" },
    { key: "tsvet-profilya", label: "Цвет профиля", type: "checkbox", isExtra: true },
    { key: "sposob-otkryvaniya", label: "Способ открывания", type: "checkbox", isExtra: true },
  ],
  // Раздвижные двери
  "razdvizhnye-dveri": [
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "shirina-polotna", label: "Ширина полотна", type: "checkbox" },
    { key: "vysota-polotna", label: "Высота полотна", type: "checkbox" },
    { key: "kolichestvo-stvorok", label: "Количество створок", type: "checkbox" },
    { key: "tip-napravlyayushchey", label: "Тип направляющей", type: "checkbox" },
    { key: "osteklenie", label: "Остекление", type: "checkbox", isExtra: true },
    {
      key: "komplekt-napravlyayushchikh",
      label: "Комплект направляющих",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Рольставни и рольворота
  "rolstavni-i-rolvorota": [
    { key: "tip-izdeliya", label: "Тип изделия", type: "checkbox" },
    { key: "shirina-proyoma", label: "Ширина проёма", type: "checkbox" },
    { key: "vysota-proyoma", label: "Высота проёма", type: "checkbox" },
    { key: "material-profilya", label: "Материал профиля", type: "checkbox" },
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox" },
    { key: "privod-v-komplekte", label: "Привод в комплекте", type: "checkbox", isExtra: true },
    { key: "tsvet-ral", label: "Цвет RAL", type: "checkbox", isExtra: true },
  ],
  // Люки напольные
  "lyuki-napolnye": [
    { key: "shirina-proyoma", label: "Ширина проёма", type: "checkbox" },
    { key: "vysota-proyoma", label: "Высота проёма", type: "checkbox" },
    { key: "material-ramy", label: "Материал рамы", type: "checkbox" },
    { key: "nagruzka-na-lyuk", label: "Нагрузка на люк", type: "checkbox" },
    { key: "tip-kryshki", label: "Тип крышки", type: "checkbox", isExtra: true },
    { key: "gazovye-amortizatory", label: "Газовые амортизаторы", type: "checkbox", isExtra: true },
  ],
  // Люки-невидимки
  "lyuki-nevidimki": [
    { key: "shirina-proyoma", label: "Ширина проёма", type: "checkbox" },
    { key: "vysota-proyoma", label: "Высота проёма", type: "checkbox" },
    { key: "tip-otdelki", label: "Тип отделки", type: "checkbox" },
    { key: "tip-otkryvaniya", label: "Тип открывания", type: "checkbox" },
    { key: "material-ramy", label: "Материал рамы", type: "checkbox", isExtra: true },
    { key: "reguliruemye-petli", label: "Регулируемые петли", type: "checkbox", isExtra: true },
  ],
  // Люки ревизионные под плитку
  "lyuki-revizionnye-pod-plitku": [
    { key: "shirina-proyoma", label: "Ширина проёма", type: "checkbox" },
    { key: "vysota-proyoma", label: "Высота проёма", type: "checkbox" },
    { key: "nagruzka-na-dvertsu", label: "Нагрузка на дверцу", type: "checkbox" },
    { key: "tip-otkryvaniya", label: "Тип открывания", type: "checkbox" },
    { key: "material-ramy", label: "Материал рамы", type: "checkbox", isExtra: true },
    { key: "pod-razmer-plitki", label: "Под размер плитки", type: "checkbox", isExtra: true },
  ],
  // Люки ревизионные под покраску
  "lyuki-revizionnye-pod-pokrasku": [
    { key: "shirina-proyoma", label: "Ширина проёма", type: "checkbox" },
    { key: "vysota-proyoma", label: "Высота проёма", type: "checkbox" },
    { key: "material-ramy", label: "Материал рамы", type: "checkbox" },
    { key: "tip-otkryvaniya", label: "Тип открывания", type: "checkbox" },
    { key: "vlagostoykiy", label: "Влагостойкий", type: "checkbox", isExtra: true },
  ],
  // Люки сантехнические
  "lyuki-santekhnicheskie": [
    { key: "shirina-proyoma", label: "Ширина проёма", type: "checkbox" },
    { key: "vysota-proyoma", label: "Высота проёма", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox" },
    { key: "tip-zamka", label: "Тип замка", type: "checkbox", isExtra: true },
    { key: "tip-otkryvaniya", label: "Тип открывания", type: "checkbox", isExtra: true },
  ],
  // Алюминиевые окна
  "alyuminievye-okna": [
    { key: "shirina-okna", label: "Ширина окна", type: "checkbox" },
    { key: "vysota-okna", label: "Высота окна", type: "checkbox" },
    { key: "tip-profilya", label: "Тип профиля", type: "checkbox" },
    { key: "tyoplyy-ili-kholodnyy-profil", label: "Тёплый или холодный профиль", type: "checkbox" },
    { key: "kolichestvo-stvorok", label: "Количество створок", type: "checkbox" },
    { key: "sposob-otkryvaniya", label: "Способ открывания", type: "checkbox", isExtra: true },
    { key: "tsvet-profilya", label: "Цвет профиля", type: "checkbox", isExtra: true },
  ],
  // Деревянные окна
  "derevyannye-okna": [
    { key: "shirina-okna", label: "Ширина окна", type: "checkbox" },
    { key: "vysota-okna", label: "Высота окна", type: "checkbox" },
    { key: "poroda-drevesiny", label: "Порода древесины", type: "checkbox" },
    { key: "tip-steklopaketa", label: "Тип стеклопакета", type: "checkbox" },
    { key: "kolichestvo-stvorok", label: "Количество створок", type: "checkbox" },
    { key: "sposob-otkryvaniya", label: "Способ открывания", type: "checkbox", isExtra: true },
    { key: "pokrytie", label: "Покрытие", type: "checkbox", isExtra: true },
  ],
  // Пластиковые окна
  "plastikovye-okna": [
    { key: "shirina-okna", label: "Ширина окна", type: "checkbox" },
    { key: "vysota-okna", label: "Высота окна", type: "checkbox" },
    { key: "chislo-kamer-profilya", label: "Число камер профиля", type: "checkbox" },
    { key: "montazhnaya-glubina-profilya", label: "Монтажная глубина профиля", type: "checkbox" },
    { key: "tip-steklopaketa", label: "Тип стеклопакета", type: "checkbox" },
    { key: "kolichestvo-stvorok", label: "Количество створок", type: "checkbox", isExtra: true },
    { key: "sposob-otkryvaniya", label: "Способ открывания", type: "checkbox", isExtra: true },
  ],
  // Замки
  zamki: [
    { key: "tip-zamka", label: "Тип замка", type: "checkbox" },
    { key: "tip-mekhanizma", label: "Тип механизма", type: "checkbox" },
    {
      key: "dlya-vkhodnoy-ili-mezhkomnatnoy-dveri",
      label: "Для входной или межкомнатной двери",
      type: "checkbox",
    },
    { key: "mezhosevoe-rasstoyanie", label: "Межосевое расстояние", type: "checkbox" },
    { key: "bekset", label: "Бэксет", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "storona-otkryvaniya", label: "Сторона открывания", type: "checkbox", isExtra: true },
  ],
  // Петли дверные и оконные
  "petli-dvernye-i-okonnye": [
    { key: "tip-petli", label: "Тип петли", type: "checkbox" },
    { key: "dlya-dveri-ili-okna", label: "Для двери или окна", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "razmer", label: "Размер", type: "checkbox" },
    { key: "maksimalnaya-nagruzka", label: "Максимальная нагрузка", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    { key: "storona-otkryvaniya", label: "Сторона открывания", type: "checkbox", isExtra: true },
  ],
  // SSD и HDD диски
  "ssd-i-hdd-diski": [
    { key: "tip-nakopitelya", label: "Тип накопителя", type: "checkbox" },
    { key: "obyom-nakopitelya", label: "Объём накопителя", type: "checkbox" },
    { key: "form-faktor", label: "Форм-фактор", type: "checkbox" },
    { key: "interfeys-sata-nvme", label: "Интерфейс SATA/NVMe", type: "checkbox" },
    { key: "dlya-videonablyudeniya", label: "Для видеонаблюдения", type: "checkbox" },
    { key: "skorost-chteniya", label: "Скорость чтения", type: "checkbox", isExtra: true },
    { key: "skorost-zapisi", label: "Скорость записи", type: "checkbox", isExtra: true },
  ],
  // Кабельная продукция
  "kabelnaya-produktsiya": [
    { key: "tip-kabelya", label: "Тип кабеля", type: "checkbox" },
    { key: "kategoriya-kabelya", label: "Категория кабеля", type: "checkbox" },
    { key: "chislo-zhil", label: "Число жил", type: "checkbox" },
    { key: "sechenie-zhily", label: "Сечение жилы", type: "checkbox" },
    { key: "ekranirovanie", label: "Экранирование", type: "checkbox" },
    {
      key: "dlya-ulichnoy-prokladki",
      label: "Для уличной прокладки",
      type: "checkbox",
      isExtra: true,
    },
    { key: "dlina-bukhty", label: "Длина бухты", type: "checkbox", isExtra: true },
  ],
  // Клавиатуры для управления
  "klaviatury-dlya-upravleniya": [
    { key: "tip-klaviatury", label: "Тип клавиатуры", type: "checkbox" },
    { key: "sovmestimaya-sistema", label: "Совместимая система", type: "checkbox" },
    { key: "interfeys-podklyucheniya", label: "Интерфейс подключения", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "podsvetka", label: "Подсветка", type: "checkbox", isExtra: true },
  ],
  // Мониторы
  monitory: [
    { key: "diagonal-ekrana", label: "Диагональ экрана", type: "checkbox" },
    { key: "razreshenie", label: "Разрешение", type: "checkbox" },
    { key: "tip-matritsy", label: "Тип матрицы", type: "checkbox" },
    { key: "chastota-obnovleniya", label: "Частота обновления", type: "checkbox" },
    { key: "videovkhody", label: "Видеовходы", type: "checkbox", isExtra: true },
    { key: "kreplenie-vesa", label: "Крепление VESA", type: "checkbox", isExtra: true },
  ],
  // Доводчики
  dovodchiki: [
    { key: "ves-dveri-maksimum", label: "Вес двери максимум", type: "checkbox" },
    { key: "shirina-dveri-maksimum", label: "Ширина двери максимум", type: "checkbox" },
    { key: "klass-usiliya-en", label: "Класс усилия EN", type: "checkbox" },
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox" },
    {
      key: "fiksatsiya-v-otkrytom-polozhenii",
      label: "Фиксация в открытом положении",
      type: "checkbox",
      isExtra: true,
    },
    {
      key: "temperatura-ekspluatatsii",
      label: "Температура эксплуатации",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Электронные замки
  "elektronnye-zamki": [
    { key: "tip-zamka", label: "Тип замка", type: "checkbox" },
    { key: "sposob-dostupa", label: "Способ доступа", type: "checkbox" },
    { key: "protokol-podklyucheniya", label: "Протокол подключения", type: "checkbox" },
    { key: "tip-dveri", label: "Тип двери", type: "checkbox" },
    { key: "avtonomnyy", label: "Автономный", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    { key: "avariynoe-otkryvanie", label: "Аварийное открывание", type: "checkbox", isExtra: true },
  ],
  // Блок питания
  "blok-pitaniya": [
    { key: "vykhodnoe-napryazhenie", label: "Выходное напряжение", type: "checkbox" },
    { key: "vykhodnoy-tok", label: "Выходной ток", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "chislo-kanalov", label: "Число каналов", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "rezervirovanie-akb", label: "Резервирование АКБ", type: "checkbox", isExtra: true },
  ],
  // ИБП
  ibp: [
    { key: "tip-ibp", label: "Тип ИБП", type: "checkbox" },
    { key: "polnaya-moshchnost-va", label: "Полная мощность VA", type: "checkbox" },
    { key: "aktivnaya-moshchnost-w", label: "Активная мощность W", type: "checkbox" },
    { key: "vremya-avtonomnoy-raboty", label: "Время автономной работы", type: "checkbox" },
    { key: "tip-batarei", label: "Тип батареи", type: "checkbox" },
    { key: "chislo-rozetok", label: "Число розеток", type: "checkbox", isExtra: true },
    {
      key: "forma-vykhodnogo-signala",
      label: "Форма выходного сигнала",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // HD-TVI видеорегистраторы
  "hd-tvi-videoregistratory": [
    { key: "chislo-kanalov", label: "Число каналов", type: "checkbox" },
    { key: "podderzhivaemoe-razreshenie", label: "Поддерживаемое разрешение", type: "checkbox" },
    { key: "hdd-sloty", label: "HDD слоты", type: "checkbox" },
    { key: "formaty-video", label: "Форматы видео", type: "checkbox" },
    { key: "audiovkhody", label: "Аудиовходы", type: "checkbox", isExtra: true },
    { key: "udalyonnyy-dostup", label: "Удалённый доступ", type: "checkbox", isExtra: true },
  ],
  // HD-TVI камеры
  "hd-tvi-kamery": [
    { key: "razreshenie-kamery", label: "Разрешение камеры", type: "checkbox" },
    { key: "tip-korpusa-kamery", label: "Тип корпуса камеры", type: "checkbox" },
    { key: "fokusnoe-rasstoyanie", label: "Фокусное расстояние", type: "checkbox" },
    { key: "nochnaya-podsvetka", label: "Ночная подсветка", type: "checkbox" },
    { key: "dalnost-ik", label: "Дальность ИК", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "mikrofon", label: "Микрофон", type: "checkbox", isExtra: true },
  ],
  // IP видеорегистраторы
  "ip-videoregistratory": [
    { key: "chislo-ip-kanalov", label: "Число IP-каналов", type: "checkbox" },
    { key: "propusknaya-sposobnost", label: "Пропускная способность", type: "checkbox" },
    { key: "hdd-sloty", label: "HDD слоты", type: "checkbox" },
    { key: "poe-porty", label: "PoE-порты", type: "checkbox" },
    { key: "podderzhivaemoe-razreshenie", label: "Поддерживаемое разрешение", type: "checkbox" },
    { key: "kodek-h-265", label: "Кодек H.265", type: "checkbox", isExtra: true },
    { key: "analitika", label: "Аналитика", type: "checkbox", isExtra: true },
  ],
  // IP камеры
  "ip-kamery": [
    { key: "razreshenie-kamery", label: "Разрешение камеры", type: "checkbox" },
    { key: "tip-korpusa-kamery", label: "Тип корпуса камеры", type: "checkbox" },
    { key: "fokusnoe-rasstoyanie", label: "Фокусное расстояние", type: "checkbox" },
    { key: "dalnost-ik", label: "Дальность ИК", type: "checkbox" },
    { key: "poe", label: "PoE", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "mikrofon", label: "Микрофон", type: "checkbox", isExtra: true },
    { key: "videoanalitika", label: "Видеоаналитика", type: "checkbox", isExtra: true },
  ],
  // Металлодетекторы
  metallodetektory: [
    { key: "tip-metallodetektora", label: "Тип металлодетектора", type: "checkbox" },
    { key: "chuvstvitelnost", label: "Чувствительность", type: "checkbox" },
    { key: "chislo-zon-obnaruzheniya", label: "Число зон обнаружения", type: "checkbox" },
    { key: "shirina-prokhoda", label: "Ширина прохода", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    { key: "schyotchik-prokhodov", label: "Счётчик проходов", type: "checkbox", isExtra: true },
  ],
  // СКУД и домофоны
  "skud-i-domofony": [
    { key: "vid-ustroystva", label: "Вид устройства", type: "checkbox" },
    { key: "tip-podklyucheniya", label: "Тип подключения", type: "checkbox" },
    { key: "chislo-abonentov", label: "Число абонентов", type: "checkbox" },
    { key: "rfid-standart", label: "RFID стандарт", type: "checkbox" },
    { key: "videosvyaz", label: "Видеосвязь", type: "checkbox", isExtra: true },
    {
      key: "podderzhka-mobilnogo-prilozheniya",
      label: "Поддержка мобильного приложения",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Терминалы распознавания лиц
  "terminaly-raspoznavaniya-lits": [
    { key: "chislo-polzovateley", label: "Число пользователей", type: "checkbox" },
    { key: "sposob-identifikatsii", label: "Способ идентификации", type: "checkbox" },
    { key: "skorost-raspoznavaniya", label: "Скорость распознавания", type: "checkbox" },
    { key: "ekran", label: "Экран", type: "checkbox" },
    { key: "setevaya-integratsiya", label: "Сетевая интеграция", type: "checkbox", isExtra: true },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
  ],
  // Турникеты
  turnikety: [
    { key: "tip-turniketa", label: "Тип турникета", type: "checkbox" },
    { key: "propusknaya-sposobnost", label: "Пропускная способность", type: "checkbox" },
    { key: "shirina-prokhoda", label: "Ширина прохода", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "antipanika", label: "Антипаника", type: "checkbox", isExtra: true },
    { key: "sovmestimost-skud", label: "Совместимость СКУД", type: "checkbox", isExtra: true },
  ],
  // Шлагбаумы
  shlagbaumy: [
    { key: "dlina-strely", label: "Длина стрелы", type: "checkbox" },
    { key: "intensivnost-ispolzovaniya", label: "Интенсивность использования", type: "checkbox" },
    { key: "vremya-otkryvaniya", label: "Время открывания", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox" },
    { key: "komplekt-strely", label: "Комплект стрелы", type: "checkbox", isExtra: true },
    { key: "integratsiya-skud", label: "Интеграция СКУД", type: "checkbox", isExtra: true },
  ],
  // Безопасность и Защита
  "bezopasnost-i-zashchita": [
    { key: "vid-oborudovaniya", label: "Вид оборудования", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "klass-zashchity", label: "Класс защиты", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox" },
    { key: "montazh", label: "Монтаж", type: "checkbox", isExtra: true },
    { key: "standart", label: "Стандарт", type: "checkbox", isExtra: true },
  ],
  // Огнетушители
  ognetushiteli: [
    { key: "tip-ognetushitelya", label: "Тип огнетушителя", type: "checkbox" },
    { key: "massa-zaryada", label: "Масса заряда", type: "checkbox" },
    { key: "klass-pozhara", label: "Класс пожара", type: "checkbox" },
    { key: "ognetushashchaya-sposobnost", label: "Огнетушащая способность", type: "checkbox" },
    { key: "perezaryazhaemyy", label: "Перезаряжаемый", type: "checkbox", isExtra: true },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
  ],
  // Пожарные оповещатели
  "pozharnye-opoveshchateli": [
    { key: "vid-opoveshcheniya", label: "Вид оповещения", type: "checkbox" },
    { key: "zvukovoy-uroven", label: "Звуковой уровень", type: "checkbox" },
    { key: "svetovoe-opoveshchenie", label: "Световое оповещение", type: "checkbox" },
    { key: "napryazhenie-pitaniya", label: "Напряжение питания", type: "checkbox" },
    { key: "stepen-zashchity-ip", label: "Степень защиты IP", type: "checkbox", isExtra: true },
    { key: "dlya-ulitsy", label: "Для улицы", type: "checkbox", isExtra: true },
  ],
  // Пожарные щиты
  "pozharnye-shchity": [
    { key: "tip-shchita", label: "Тип щита", type: "checkbox" },
    { key: "komplektatsiya", label: "Комплектация", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "razmery", label: "Размеры", type: "checkbox" },
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox", isExtra: true },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
  ],
  // Приемно-контрольные системы
  "priemno-kontrolnye-sistemy": [
    { key: "tip-paneli", label: "Тип панели", type: "checkbox" },
    { key: "chislo-zon", label: "Число зон", type: "checkbox" },
    { key: "adresnaya-ili-neadresnaya", label: "Адресная или неадресная", type: "checkbox" },
    { key: "podklyuchenie-po-seti", label: "Подключение по сети", type: "checkbox" },
    { key: "rezervnoe-pitanie", label: "Резервное питание", type: "checkbox", isExtra: true },
    { key: "kolichestvo-shleyfov", label: "Количество шлейфов", type: "checkbox", isExtra: true },
  ],
  // Сигнализации
  signalizatsii: [
    { key: "tip-signalizatsii", label: "Тип сигнализации", type: "checkbox" },
    { key: "provodnaya-ili-besprovodnaya", label: "Проводная или беспроводная", type: "checkbox" },
    { key: "chislo-zon", label: "Число зон", type: "checkbox" },
    { key: "gsm-ili-wi-fi", label: "GSM или Wi-Fi", type: "checkbox" },
    { key: "tip-datchikov", label: "Тип датчиков", type: "checkbox", isExtra: true },
    { key: "rezervnoe-pitanie", label: "Резервное питание", type: "checkbox", isExtra: true },
  ],
  // Снаряжение
  snaryazhenie: [
    { key: "vid-snaryazheniya", label: "Вид снаряжения", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "razmer", label: "Размер", type: "checkbox" },
    { key: "material", label: "Материал", type: "checkbox" },
    { key: "klass-zashchity", label: "Класс защиты", type: "checkbox", isExtra: true },
    { key: "sertifikatsiya", label: "Сертификация", type: "checkbox", isExtra: true },
  ],
  // Коммутаторы
  kommutatory: [
    { key: "chislo-ethernet-portov", label: "Число Ethernet-портов", type: "checkbox" },
    { key: "skorost-portov", label: "Скорость портов", type: "checkbox" },
    { key: "poe", label: "PoE", type: "checkbox" },
    { key: "byudzhet-poe", label: "Бюджет PoE", type: "checkbox" },
    { key: "upravlyaemyy", label: "Управляемый", type: "checkbox" },
    { key: "sfp-porty", label: "SFP-порты", type: "checkbox", isExtra: true },
    { key: "montazh-v-stoyku", label: "Монтаж в стойку", type: "checkbox", isExtra: true },
  ],
  // Аудио и видео
  "audio-i-video-2": [
    { key: "vid-ustroystva", label: "Вид устройства", type: "checkbox" },
    { key: "naznachenie", label: "Назначение", type: "checkbox" },
    { key: "moshchnost-zvuka", label: "Мощность звука", type: "checkbox" },
    { key: "tip-podklyucheniya", label: "Тип подключения", type: "checkbox" },
    { key: "bluetooth", label: "Bluetooth", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox", isExtra: true },
    { key: "nalichie-hdmi", label: "Наличие HDMI", type: "checkbox", isExtra: true },
  ],
  // Компьютеры
  kompyutery: [
    { key: "tip-pk", label: "Тип ПК", type: "checkbox" },
    { key: "protsessor", label: "Процессор", type: "checkbox" },
    { key: "obyom-operativnoy-pamyati", label: "Объём оперативной памяти", type: "checkbox" },
    { key: "obyom-nakopitelya", label: "Объём накопителя", type: "checkbox" },
    { key: "videokarta", label: "Видеокарта", type: "checkbox" },
    {
      key: "operatsionnaya-sistema",
      label: "Операционная система",
      type: "checkbox",
      isExtra: true,
    },
    { key: "form-faktor", label: "Форм-фактор", type: "checkbox", isExtra: true },
  ],
  // Моноблоки
  monobloki: [
    { key: "diagonal-ekrana", label: "Диагональ экрана", type: "checkbox" },
    { key: "razreshenie-ekrana", label: "Разрешение экрана", type: "checkbox" },
    { key: "protsessor", label: "Процессор", type: "checkbox" },
    { key: "obyom-operativnoy-pamyati", label: "Объём оперативной памяти", type: "checkbox" },
    { key: "obyom-nakopitelya", label: "Объём накопителя", type: "checkbox", isExtra: true },
    {
      key: "operatsionnaya-sistema",
      label: "Операционная система",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Ноутбуки
  noutbuki: [
    { key: "diagonal-ekrana", label: "Диагональ экрана", type: "checkbox" },
    { key: "protsessor", label: "Процессор", type: "checkbox" },
    { key: "obyom-operativnoy-pamyati", label: "Объём оперативной памяти", type: "checkbox" },
    { key: "obyom-nakopitelya", label: "Объём накопителя", type: "checkbox" },
    { key: "videokarta", label: "Видеокарта", type: "checkbox" },
    { key: "razreshenie-ekrana", label: "Разрешение экрана", type: "checkbox", isExtra: true },
    {
      key: "operatsionnaya-sistema",
      label: "Операционная система",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Принтеры
  printery: [
    { key: "tekhnologiya-pechati", label: "Технология печати", type: "checkbox" },
    { key: "tsvetnost-pechati", label: "Цветность печати", type: "checkbox" },
    { key: "format-bumagi", label: "Формат бумаги", type: "checkbox" },
    { key: "dvustoronnyaya-pechat", label: "Двусторонняя печать", type: "checkbox" },
    { key: "wi-fi", label: "Wi-Fi", type: "checkbox" },
    { key: "skorost-pechati", label: "Скорость печати", type: "checkbox", isExtra: true },
    { key: "mfu", label: "МФУ", type: "checkbox", isExtra: true },
  ],
  // Сканеры
  skanery: [
    { key: "tip-skanera", label: "Тип сканера", type: "checkbox" },
    { key: "format-bumagi", label: "Формат бумаги", type: "checkbox" },
    { key: "opticheskoe-razreshenie", label: "Оптическое разрешение", type: "checkbox" },
    { key: "avtopodatchik", label: "Автоподатчик", type: "checkbox" },
    {
      key: "dvustoronnee-skanirovanie",
      label: "Двустороннее сканирование",
      type: "checkbox",
      isExtra: true,
    },
    { key: "interfeys-usb-wi-fi", label: "Интерфейс USB/Wi-Fi", type: "checkbox", isExtra: true },
  ],
  // Телевизоры
  "televizory-2": [
    { key: "diagonal-ekrana", label: "Диагональ экрана", type: "checkbox" },
    { key: "razreshenie-ekrana", label: "Разрешение экрана", type: "checkbox" },
    { key: "tip-matritsy", label: "Тип матрицы", type: "checkbox" },
    { key: "smart-tv", label: "Smart TV", type: "checkbox" },
    { key: "chastota-obnovleniya", label: "Частота обновления", type: "checkbox" },
    {
      key: "operatsionnaya-sistema",
      label: "Операционная система",
      type: "checkbox",
      isExtra: true,
    },
    { key: "hdr", label: "HDR", type: "checkbox", isExtra: true },
    { key: "kolichestvo-hdmi", label: "Количество HDMI", type: "checkbox", isExtra: true },
  ],
  // Весы
  vesy: [
    { key: "tip-vesov", label: "Тип весов", type: "checkbox" },
    { key: "maksimalnaya-nagruzka", label: "Максимальная нагрузка", type: "checkbox" },
    { key: "tochnost-izmereniya", label: "Точность измерения", type: "checkbox" },
    { key: "material-platformy", label: "Материал платформы", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    { key: "umnye-funktsii", label: "Умные функции", type: "checkbox", isExtra: true },
  ],
  // Климатическая техника
  "klimaticheskaya-tekhnika": [
    { key: "vid-tekhniki", label: "Вид техники", type: "checkbox" },
    { key: "ploshchad-pomeshcheniya", label: "Площадь помещения", type: "checkbox" },
    { key: "proizvoditelnost-vozdukha", label: "Производительность воздуха", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "tip-filtra", label: "Тип фильтра", type: "checkbox", isExtra: true },
    { key: "uroven-shuma", label: "Уровень шума", type: "checkbox", isExtra: true },
  ],
  // Кондиционеры
  konditsionery: [
    { key: "tip-konditsionera", label: "Тип кондиционера", type: "checkbox" },
    { key: "ploshchad-pomeshcheniya", label: "Площадь помещения", type: "checkbox" },
    { key: "kholodoproizvoditelnost", label: "Холодопроизводительность", type: "checkbox" },
    { key: "invertornyy", label: "Инверторный", type: "checkbox" },
    { key: "klass-energoeffektivnosti", label: "Класс энергоэффективности", type: "checkbox" },
    { key: "uroven-shuma", label: "Уровень шума", type: "checkbox", isExtra: true },
    { key: "wi-fi", label: "Wi-Fi", type: "checkbox", isExtra: true },
  ],
  // Обогреватели
  obogrevateli: [
    { key: "tip-obogrevatelya", label: "Тип обогревателя", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "ploshchad-obogreva", label: "Площадь обогрева", type: "checkbox" },
    { key: "termostat", label: "Термостат", type: "checkbox" },
    { key: "sposob-montazha", label: "Способ монтажа", type: "checkbox", isExtra: true },
    {
      key: "zashchita-ot-peregreva",
      label: "Защита от перегрева",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Пылесосы
  pylesosy: [
    { key: "tip-pylesosa", label: "Тип пылесоса", type: "checkbox" },
    { key: "moshchnost-vsasyvaniya", label: "Мощность всасывания", type: "checkbox" },
    { key: "tip-pylesbornika", label: "Тип пылесборника", type: "checkbox" },
    { key: "obyom-konteynera", label: "Объём контейнера", type: "checkbox" },
    { key: "besprovodnoy", label: "Беспроводной", type: "checkbox" },
    {
      key: "vremya-avtonomnoy-raboty",
      label: "Время автономной работы",
      type: "checkbox",
      isExtra: true,
    },
    { key: "moyushchiy", label: "Моющий", type: "checkbox", isExtra: true },
  ],
  // Стиральные машины
  "stiralnye-mashiny": [
    { key: "tip-zagruzki", label: "Тип загрузки", type: "checkbox" },
    { key: "zagruzka-belya", label: "Загрузка белья", type: "checkbox" },
    { key: "glubina-korpusa", label: "Глубина корпуса", type: "checkbox" },
    { key: "skorost-otzhima", label: "Скорость отжима", type: "checkbox" },
    { key: "klass-energoeffektivnosti", label: "Класс энергоэффективности", type: "checkbox" },
    { key: "sushka", label: "Сушка", type: "checkbox", isExtra: true },
    {
      key: "invertornyy-dvigatel",
      label: "Инверторный двигатель",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Фен
  fen: [
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    {
      key: "chislo-temperaturnykh-rezhimov",
      label: "Число температурных режимов",
      type: "checkbox",
    },
    { key: "ionizatsiya", label: "Ионизация", type: "checkbox" },
    { key: "kholodnyy-obduv", label: "Холодный обдув", type: "checkbox" },
    { key: "nasadki", label: "Насадки", type: "checkbox", isExtra: true },
    { key: "skladnaya-ruchka", label: "Складная ручка", type: "checkbox", isExtra: true },
  ],
  // Встраиваемая техника
  "vstraivaemaya-tekhnika": [
    { key: "vid-tekhniki", label: "Вид техники", type: "checkbox" },
    { key: "shirina-nishi", label: "Ширина ниши", type: "checkbox" },
    { key: "vysota-nishi", label: "Высота ниши", type: "checkbox" },
    { key: "glubina-nishi", label: "Глубина ниши", type: "checkbox" },
    { key: "tip-pitaniya", label: "Тип питания", type: "checkbox" },
    { key: "tsvet", label: "Цвет", type: "checkbox", isExtra: true },
    {
      key: "klass-energoeffektivnosti",
      label: "Класс энергоэффективности",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Вытяжки
  vytyazhki: [
    { key: "shirina-vytyazhki", label: "Ширина вытяжки", type: "checkbox" },
    { key: "proizvoditelnost-vozdukha", label: "Производительность воздуха", type: "checkbox" },
    { key: "tip-ustanovki", label: "Тип установки", type: "checkbox" },
    { key: "rezhim-retsirkulyatsii", label: "Режим рециркуляции", type: "checkbox" },
    { key: "uroven-shuma", label: "Уровень шума", type: "checkbox", isExtra: true },
    { key: "tip-filtra", label: "Тип фильтра", type: "checkbox", isExtra: true },
  ],
  // Мелкая кухонная техника
  "melkaya-kukhonnaya-tekhnika": [
    { key: "vid-tekhniki", label: "Вид техники", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "obyom-chashi", label: "Объём чаши", type: "checkbox" },
    { key: "chislo-rezhimov", label: "Число режимов", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox", isExtra: true },
    { key: "upravlenie", label: "Управление", type: "checkbox", isExtra: true },
  ],
  // Микроволновые печи
  "mikrovolnovye-pechi": [
    { key: "obyom-kamery", label: "Объём камеры", type: "checkbox" },
    { key: "moshchnost-svch", label: "Мощность СВЧ", type: "checkbox" },
    { key: "gril", label: "Гриль", type: "checkbox" },
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox" },
    { key: "diametr-poddona", label: "Диаметр поддона", type: "checkbox", isExtra: true },
    { key: "vstraivaemaya", label: "Встраиваемая", type: "checkbox", isExtra: true },
  ],
  // Мультиварки
  multivarki: [
    { key: "obyom-chashi", label: "Объём чаши", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "chislo-programm", label: "Число программ", type: "checkbox" },
    { key: "skorovarka", label: "Скороварка", type: "checkbox" },
    { key: "pokrytie-chashi", label: "Покрытие чаши", type: "checkbox", isExtra: true },
    { key: "otlozhennyy-start", label: "Отложенный старт", type: "checkbox", isExtra: true },
  ],
  // Плиты газовые и комбинированные
  "plity-gazovye-i-kombinirovannye": [
    { key: "tip-plity", label: "Тип плиты", type: "checkbox" },
    { key: "chislo-konforok", label: "Число конфорок", type: "checkbox" },
    { key: "shirina-plity", label: "Ширина плиты", type: "checkbox" },
    { key: "obyom-dukhovki", label: "Объём духовки", type: "checkbox" },
    { key: "gaz-kontrol", label: "Газ-контроль", type: "checkbox", isExtra: true },
    { key: "elektropodzhig", label: "Электроподжиг", type: "checkbox", isExtra: true },
  ],
  // Холодильники
  kholodilniki: [
    { key: "tip-kholodilnika", label: "Тип холодильника", type: "checkbox" },
    { key: "poleznyy-obyom", label: "Полезный объём", type: "checkbox" },
    { key: "sistema-razmorozki", label: "Система разморозки", type: "checkbox" },
    { key: "vysota", label: "Высота", type: "checkbox" },
    { key: "shirina", label: "Ширина", type: "checkbox" },
    {
      key: "klass-energoeffektivnosti",
      label: "Класс энергоэффективности",
      type: "checkbox",
      isExtra: true,
    },
    { key: "chislo-kamer", label: "Число камер", type: "checkbox", isExtra: true },
  ],
  // Электрическая кухонная плита
  "elektricheskaya-kukhonnaya-plita": [
    { key: "tip-poverkhnosti", label: "Тип поверхности", type: "checkbox" },
    { key: "chislo-konforok", label: "Число конфорок", type: "checkbox" },
    { key: "shirina-plity", label: "Ширина плиты", type: "checkbox" },
    { key: "obyom-dukhovki", label: "Объём духовки", type: "checkbox" },
    { key: "konvektsiya", label: "Конвекция", type: "checkbox", isExtra: true },
    { key: "tip-upravleniya", label: "Тип управления", type: "checkbox", isExtra: true },
  ],
  // Электрочайники
  elektrochayniki: [
    { key: "obyom", label: "Объём", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "material-korpusa", label: "Материал корпуса", type: "checkbox" },
    { key: "regulirovka-temperatury", label: "Регулировка температуры", type: "checkbox" },
    { key: "podderzhanie-tepla", label: "Поддержание тепла", type: "checkbox", isExtra: true },
    { key: "zakrytaya-spiral", label: "Закрытая спираль", type: "checkbox", isExtra: true },
  ],
  // Утюги
  "utyugi-2": [
    { key: "tip-utyuga", label: "Тип утюга", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "parovoy-udar", label: "Паровой удар", type: "checkbox" },
    { key: "postoyannaya-podacha-para", label: "Постоянная подача пара", type: "checkbox" },
    { key: "material-podoshvy", label: "Материал подошвы", type: "checkbox" },
    { key: "obyom-rezervuara", label: "Объём резервуара", type: "checkbox", isExtra: true },
    { key: "avtootklyuchenie", label: "Автоотключение", type: "checkbox", isExtra: true },
  ],
  // Вентиляция
  "ventilyatsiya-2": [
    { key: "vid-oborudovaniya", label: "Вид оборудования", type: "checkbox" },
    { key: "raskhod-vozdukha", label: "Расход воздуха", type: "checkbox" },
    { key: "diametr-vozdukhovoda", label: "Диаметр воздуховода", type: "checkbox" },
    { key: "moshchnost", label: "Мощность", type: "checkbox" },
    { key: "uroven-shuma", label: "Уровень шума", type: "checkbox" },
    { key: "tip-montazha", label: "Тип монтажа", type: "checkbox", isExtra: true },
    { key: "rekuperatsiya", label: "Рекуперация", type: "checkbox", isExtra: true },
  ],
  // Кондиционерные компрессоры
  "konditsionernye-kompressory": [
    { key: "tip-kompressora", label: "Тип компрессора", type: "checkbox" },
    { key: "tip-khladagenta", label: "Тип хладагента", type: "checkbox" },
    { key: "kholodoproizvoditelnost", label: "Холодопроизводительность", type: "checkbox" },
    { key: "napryazhenie", label: "Напряжение", type: "checkbox" },
    { key: "chastota-vrashcheniya", label: "Частота вращения", type: "checkbox", isExtra: true },
    { key: "tip-masla", label: "Тип масла", type: "checkbox", isExtra: true },
  ],
  // Масла холодильные
  "masla-kholodilnye": [
    { key: "tip-masla", label: "Тип масла", type: "checkbox" },
    { key: "vyazkost-iso-vg", label: "Вязкость ISO VG", type: "checkbox" },
    { key: "sovmestimost-s-khladagentom", label: "Совместимость с хладагентом", type: "checkbox" },
    { key: "obyom-upakovki", label: "Объём упаковки", type: "checkbox" },
    {
      key: "temperatura-zastyvaniya",
      label: "Температура застывания",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Медные трубы
  "mednye-truby-2": [
    { key: "diametr-truby", label: "Диаметр трубы", type: "checkbox" },
    { key: "tolshchina-stenki", label: "Толщина стенки", type: "checkbox" },
    { key: "myagkaya-ili-tvyordaya", label: "Мягкая или твёрдая", type: "checkbox" },
    { key: "dlina-bukhty", label: "Длина бухты", type: "checkbox" },
    { key: "dlya-khladagentov", label: "Для хладагентов", type: "checkbox", isExtra: true },
    { key: "standart", label: "Стандарт", type: "checkbox", isExtra: true },
  ],
  // Технические газы
  "tekhnicheskie-gazy": [
    { key: "tip-gaza", label: "Тип газа", type: "checkbox" },
    { key: "chistota", label: "Чистота", type: "checkbox" },
    { key: "obyom-ballona", label: "Объём баллона", type: "checkbox" },
    { key: "massa-gaza", label: "Масса газа", type: "checkbox" },
    { key: "tip-ventilya", label: "Тип вентиля", type: "checkbox", isExtra: true },
    { key: "naznachenie", label: "Назначение", type: "checkbox", isExtra: true },
  ],
  // Фильтры холодильные
  "filtry-kholodilnye": [
    { key: "tip-filtra", label: "Тип фильтра", type: "checkbox" },
    { key: "diametr-podklyucheniya", label: "Диаметр подключения", type: "checkbox" },
    { key: "tip-soedineniya", label: "Тип соединения", type: "checkbox" },
    { key: "sovmestimyy-khladagent", label: "Совместимый хладагент", type: "checkbox" },
    { key: "proizvoditelnost", label: "Производительность", type: "checkbox", isExtra: true },
    { key: "napravlenie-potoka", label: "Направление потока", type: "checkbox", isExtra: true },
  ],
  // Фреон, хладагенты
  "freon-khladagenty": [
    { key: "marka-khladagenta", label: "Марка хладагента", type: "checkbox" },
    { key: "massa-ballona", label: "Масса баллона", type: "checkbox" },
    { key: "klass-bezopasnosti", label: "Класс безопасности", type: "checkbox" },
    { key: "temperatura-kipeniya", label: "Температура кипения", type: "checkbox" },
    {
      key: "sovmestimost-s-oborudovaniem",
      label: "Совместимость с оборудованием",
      type: "checkbox",
      isExtra: true,
    },
    { key: "tip-upakovki", label: "Тип упаковки", type: "checkbox", isExtra: true },
  ],
  // Холодильные компрессоры
  "kholodilnye-kompressory": [
    { key: "tip-kompressora", label: "Тип компрессора", type: "checkbox" },
    { key: "kholodoproizvoditelnost", label: "Холодопроизводительность", type: "checkbox" },
    { key: "tip-khladagenta", label: "Тип хладагента", type: "checkbox" },
    { key: "napryazhenie", label: "Напряжение", type: "checkbox" },
    { key: "rabochiy-obyom", label: "Рабочий объём", type: "checkbox", isExtra: true },
    { key: "tip-masla", label: "Тип масла", type: "checkbox", isExtra: true },
  ],
  // Холодильный инструмент
  "kholodilnyy-instrument": [
    { key: "vid-instrumenta", label: "Вид инструмента", type: "checkbox" },
    { key: "dlya-khladagenta", label: "Для хладагента", type: "checkbox" },
    { key: "rabochee-davlenie", label: "Рабочее давление", type: "checkbox" },
    { key: "diametr-podklyucheniya", label: "Диаметр подключения", type: "checkbox" },
    { key: "diapazon-izmereniya", label: "Диапазон измерения", type: "checkbox", isExtra: true },
    {
      key: "dlya-valtsovki-ili-vakuuma",
      label: "Для вальцовки или вакуума",
      type: "checkbox",
      isExtra: true,
    },
  ],
  // Торговые весы
  "torgovye-vesy-2": [
    { key: "maksimalnaya-nagruzka", label: "Максимальная нагрузка", type: "checkbox" },
    { key: "tsena-deleniya", label: "Цена деления", type: "checkbox" },
    { key: "nalichie-pechati-etiketok", label: "Наличие печати этикеток", type: "checkbox" },
    { key: "tip-displeya", label: "Тип дисплея", type: "checkbox" },
    { key: "podklyuchenie-k-kasse", label: "Подключение к кассе", type: "checkbox" },
    { key: "pitanie", label: "Питание", type: "checkbox", isExtra: true },
    { key: "poverka", label: "Поверка", type: "checkbox", isExtra: true },
  ],

  // Стандартные фильтры (для категорий без специфичных)
  default: [
    { key: "brand", label: "Бренд", type: "checkbox" },
    { key: "inStock", label: "Наличие", type: "checkbox" },
    { key: "price", label: "Цена", type: "range" },
  ],
};

/**
 * Получить умные фильтры для категории по slug
 */
export function getSmartFiltersForCategory(categorySlug?: string | null): SmartFilterDefinition[] {
  if (!categorySlug) {
    return CATEGORY_SMART_FILTERS["default"];
  }
  const definitions = CATEGORY_SMART_FILTERS[categorySlug];
  if (!definitions) return CATEGORY_SMART_FILTERS["default"];
  const profile = getCategoryProfile(categorySlug);
  if (!profile) return definitions;
  return [...profile.primary, ...profile.additional].map((label) => {
    const existing = definitions.find((field) => field.label === label);
    const metadata = (
      profileData.attributes as Record<string, { type: string; unit: string | null }>
    )[label];
    return {
      ...existing,
      key: existing?.key ?? label,
      label,
      type:
        metadata?.type === "boolean"
          ? "boolean"
          : metadata?.type === "range"
            ? "range"
            : (existing?.type ?? "checkbox"),
      unit: metadata?.unit ?? existing?.unit,
      isExtra: profile.additional.includes(label),
      recommended: profile.recommended.includes(label),
    } as SmartFilterDefinition;
  });
}

/**
 * Найти категорию по slug (любого уровня)
 */
export function findCategoryNodeBySlug(slug: string): {
  top: TopCategoryNode | null;
  sub: SubcategoryNode | null;
  child: ChildCategoryNode | null;
} {
  for (const top of CATEGORIES_TREE) {
    if (top.slug === slug) {
      return { top, sub: null, child: null };
    }
    for (const sub of top.subcategories) {
      if (sub.slug === slug) {
        return { top, sub, child: null };
      }
      if (sub.children) {
        const child = sub.children.find((c) => c.slug === slug);
        if (child) {
          return { top, sub, child };
        }
      }
    }
  }
  return { top: null, sub: null, child: null };
}

/**
 * Получить все дочерние slug (рекурсивно)
 */
export function getAllDescendantSlugs(slug: string): string[] {
  const result: string[] = [slug];
  for (const top of CATEGORIES_TREE) {
    if (top.slug === slug) {
      for (const sub of top.subcategories) {
        result.push(sub.slug);
        if (sub.children) {
          for (const ch of sub.children) {
            result.push(ch.slug);
          }
        }
      }
      return result;
    }
    for (const sub of top.subcategories) {
      if (sub.slug === slug) {
        if (sub.children) {
          for (const ch of sub.children) {
            result.push(ch.slug);
          }
        }
        return result;
      }
    }
  }
  return result;
}

const normalizeCategoryName = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/^c(?=истем)/, "с")
    .replace(/\s*&\s*/g, " и ")
    .trim();
export function getCategoryProfile(slug?: string | null) {
  if (!slug) return undefined;
  const { top, sub, child } = findCategoryNodeBySlug(slug);
  if (!top || (!child && sub?.children?.length) || !sub) return undefined;
  const path = [top.nameRu, sub.nameRu, ...(child ? [child.nameRu] : [])]
    .map(normalizeCategoryName)
    .join("/");
  return profileData.categories.find(
    (profile) => profile.path.map(normalizeCategoryName).join("/") === path,
  );
}

export function getProductAttributeFields(
  slug: string | undefined,
  values: Record<string, string> = {},
) {
  const fields = getSmartFiltersForCategory(slug).filter(
    (field) => !["brand", "price", "inStock"].includes(field.key),
  );
  const profile = getCategoryProfile(slug);
  const rule = profileData.dependencies.find(
    (item) =>
      normalizeCategoryName(item.category) === normalizeCategoryName(profile?.path.at(-1) ?? ""),
  );
  if (!rule || !rule.when.includes("=")) return fields;
  const [controllerLabel, expected] = rule.when.split("=").map((value) => value.trim());
  const controller = fields.find((field) => field.label === controllerLabel);
  if (!controller) return fields;
  const chosen = normalizeCategoryName(values[controller.key] ?? values[controller.label] ?? "");
  const matches = chosen.includes(normalizeCategoryName(expected));
  return fields.filter((field) => !rule.then_show.includes(field.label) || matches);
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
  const all = getSmartFiltersForCategory(slug);
  const visible = getProductAttributeFields(slug, values);
  return Object.fromEntries(
    Object.entries(values).filter(
      ([key]) =>
        !all.some((field) => field.key === key || field.label === key) ||
        visible.some((field) => field.key === key || field.label === key),
    ),
  );
}
