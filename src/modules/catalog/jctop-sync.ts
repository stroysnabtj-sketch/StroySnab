import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import type { AppDatabase } from "../../db";
import {
  categories,
  files,
  productAttributes,
  productImages,
  products,
  supplierOffers,
  suppliers,
} from "../../db/schema";

export type JctopItem = {
  id: number;
  code: string;
  name: string;
  spec: string;
  page: number;
  printPage: string;
  category: string;
  crop: number[];
  flag: string;
  confidence: number;
  photo: number;
  duplicateCode: boolean;
};

export const CATEGORY_DEFINITIONS: Array<{
  slug: string;
  nameRu: string;
  nameTg: string;
  icon: string;
  description: string;
  representativePhoto: number;
}> = [
    {
      slug: "akkumulyatornyy-instrument",
      nameRu: "Аккумуляторный инструмент",
      nameTg: "Асбобҳои барқии аккумулаторӣ",
      icon: "BatteryCharging",
      description: "Дрели, шуруповёрты, гайковёрты, УШМ, перфораторы и пилы JCTOP",
      representativePhoto: 0,
    },
    {
      slug: "setevoy-elektroinstrument",
      nameRu: "Сетевой электроинструмент",
      nameTg: "Асбобҳои барқии шабакавӣ",
      icon: "Zap",
      description: "Угловые шлифмашины, перфораторы, отбойные молотки и пилы",
      representativePhoto: 40,
    },
    {
      slug: "silovoe-oborudovanie",
      nameRu: "Силовое оборудование",
      nameTg: "Таҷҳизоти барқдиҳӣ ва муҳаррикҳо",
      icon: "Cpu",
      description: "Бензиновые и дизельные генераторы, мотопомпы и вибраторы",
      representativePhoto: 101,
    },
    {
      slug: "ruletki-i-izmeritelnye-pribory",
      nameRu: "Рулетки и измерительные приборы",
      nameTg: "Ченакҳо ва асбобҳои ченкунӣ",
      icon: "Ruler",
      description: "Строительные рулетки, уровни, мультиметры и весы",
      representativePhoto: 113,
    },
    {
      slug: "klyuchi-i-nabory-golovok",
      nameRu: "Ключи и наборы головок",
      nameTg: "Калидҳо ва маҷмӯи саракҳо",
      icon: "Wrench",
      description: "Комбинированные, накидные, разводные ключи и торцевые головки",
      representativePhoto: 135,
    },
    {
      slug: "ploskogubtsy-i-kleshchi",
      nameRu: "Плоскогубцы и клещи",
      nameTg: "Анбӯрҳо ва кандворҳо",
      icon: "Scissors",
      description: "Плоскогубцы, длинногубцы, болторезы и переставные клещи",
      representativePhoto: 183,
    },
    {
      slug: "molotki-i-kuvaldy",
      nameRu: "Молотки и кувалды",
      nameTg: "Болғаҳо ва гурзҳо",
      icon: "Hammer",
      description: "Молотки-гвоздодёры, кувалды, киянки и топорики",
      representativePhoto: 206,
    },
    {
      slug: "stroitelnyy-ruchnoy-instrument",
      nameRu: "Строительный ручной инструмент",
      nameTg: "Асбобҳои дастии сохтмонӣ",
      icon: "Construction",
      description: "Шпатели, кельмы, стамески, заклёпочники и правила",
      representativePhoto: 211,
    },
    {
      slug: "rezhushchiy-ruchnoy-instrument",
      nameRu: "Режущий ручной инструмент",
      nameTg: "Асбобҳои дастии буранда",
      icon: "PenTool",
      description: "Строительные ножи, лезвия, ножовки по металлу и дереву",
      representativePhoto: 249,
    },
    {
      slug: "sadovyy-instrument",
      nameRu: "Садовый инструмент",
      nameTg: "Асбобҳои боғдорӣ",
      icon: "Trees",
      description: "Секаторы, кусторезы, садовые пилы и опрыскиватели",
      representativePhoto: 279,
    },
    {
      slug: "otvyortki-i-nabory-bit",
      nameRu: "Отвёртки и наборы бит",
      nameTg: "Бурғуҳо (отвёрткаҳо) ва маҷмӯи битҳо",
      icon: "Crosshair",
      description: "Крестовые, шлицевые отвёртки и наборы бит",
      representativePhoto: 303,
    },
    {
      slug: "osnastka-i-raskhodniki",
      nameRu: "Оснастка и расходники",
      nameTg: "Таҷҳизот ва маводи истеъмолӣ",
      icon: "Disc",
      description: "Отрезные диски, буры SDS-Plus, свёрла по металлу и бетону",
      representativePhoto: 310,
    },
    {
      slug: "germetiki-i-kleyevye-prinadlezhnosti",
      nameRu: "Герметики и клеевые принадлежности",
      nameTg: "Герметикҳо ва лавозимоти ширешӣ",
      icon: "Droplet",
      description: "Силиконовые герметики, монтажная пена и пистолеты",
      representativePhoto: 358,
    },
    {
      slug: "avtoinstrument-i-remont",
      nameRu: "Автоинструмент и ремонт",
      nameTg: "Асбобҳои худрав ва таъмир",
      icon: "Car",
      description: "Гидравлические домкраты, подставки и маслёнки",
      representativePhoto: 370,
    },
    {
      slug: "zashchitnaya-ekipirovka-i-bezopasnost",
      nameRu: "Защитная экипировка и безопасность",
      nameTg: "Либоси муҳофизатӣ ва бехатарӣ",
      icon: "ShieldCheck",
      description: "Рабочая обувь, перчатки, респираторы, очки и маски",
      representativePhoto: 390,
    },
    {
      slug: "svarochnye-prinadlezhnosti",
      nameRu: "Сварочные принадлежности",
      nameTg: "Лавозимоти кафшергарӣ",
      icon: "Flame",
      description: "Сварочные электроды, держатели и паяльники для труб",
      representativePhoto: 410,
    },
    {
      slug: "strubtsiny-i-prisoski",
      nameRu: "Струбцины и присоски",
      nameTg: "Гирандаҳо (струбсинаҳо) ва макандаҳо",
      icon: "Anchor",
      description: "G-образные струбцины, тиски и вакуумные присоски",
      representativePhoto: 414,
    },
    {
      slug: "reklamnaya-produktsiya",
      nameRu: "Рекламная продукция",
      nameTg: "Маҳсулоти таблиғотӣ",
      icon: "Sparkles",
      description: "Фирменные стенды JCTOP, рекламные поло и баннеры",
      representativePhoto: 422,
    },
  ];

export const PRODUCT_NAME_TG: Record<string, string> = {
  "Автоинструмент и ремонт": "Асбобҳои худрав ва таъмир",
  "Аккумуляторная батарея": "Батареяи аккумулаторӣ",
  "Аккумуляторная вакуумная присоска": "Макандаи вакуумии аккумулаторӣ",
  "Аккумуляторная машинка для вязки арматуры": "Дастгоҳи аккумулатории бастани арматура",
  "Аккумуляторная полировальная машинка 12В": "Дастгоҳи сайқалдиҳии аккумулаторӣ 12В",
  "Аккумуляторная сабельная пила": "Арраи шамшерии аккумулаторӣ",
  "Аккумуляторная угловая шлифмашина": "Дастгоҳи суфтакунии кунҷии аккумулаторӣ",
  "Аккумуляторная ударная дрель": "Бурғуи зарбавии аккумулаторӣ",
  "Аккумуляторная УШМ (болгарка)": "Болгаркаи аккумулаторӣ (УШМ)",
  "Аккумуляторная цепная пила": "Арраи занҷирии аккумулаторӣ",
  "Аккумуляторный воздуходув": "Боддиҳандаи аккумулаторӣ",
  "Аккумуляторный гайковёрт": "Гайкакушояки аккумулаторӣ",
  "Аккумуляторный гвоздезабивной пистолет": "Таппончаи мехзании аккумулаторӣ",
  "Аккумуляторный многофункциональный набор 9+1": "Маҷмӯи бисёрфунксионалии аккумулаторӣ 9+1",
  "Аккумуляторный перфоратор": "Перфоратори аккумулаторӣ",
  "Аккумуляторный секатор": "Қайчии аккумулатории боғдорӣ (секатор)",
  "Аккумуляторный ударный винтовёрт (импакт)": "Винттобкунаки зарбавии аккумулаторӣ (импакт)",
  "Алмазная коронка": "Тоҷи алмосӣ",
  "Алмазный диск для сухой резки": "Диски алмосӣ барои буриши хушк",
  "Алмазный шлифовальный круг": "Доираи суфтакунии алмосӣ",
  "Алюминиевое строительное правило": "Қоидаи сохтмонии алюминӣ",
  "Аппарат для сварки пластиковых труб": "Дастгоҳи кафшери қубурҳои пластикӣ",
  "Баллонный ключ": "Калиди чарх (баллонӣ)",
  "Баллонный крестовой ключ": "Калиди чархи салибӣ",
  "Безопасный нож": "Корди бехатар",
  "Бензиновая мотопомпа": "Мотопомпаи бензинӣ",
  "Бензиновая цепная пила": "Арраи занҷирии бензинӣ",
  "Бензиновый вибратор": "Ларзонандаи бензинӣ",
  "Бензиновый вибратор для бетона": "Ларзонандаи бензинӣ барои бетон",
  "Бензиновый генератор": "Генератори бензинӣ",
  "Бензиновый двигатель": "Муҳаррики бензинӣ",
  "Бензиновый триммер": "Алафдарави бензинӣ (триммер)",
  Бетономешалка: "Омехтакунандаи бетон (бетономешалка)",
  "Биты для шуруповёрта": "Битҳо барои тобдиҳанда",
  Болторез: "Болтбурак",
  "Бур для перфоратора": "Бур барои перфоратор",
  "Бур SDS-Plus для перфоратора": "Бур SDS-Plus барои перфоратор",
  "Валик малярный": "Ғалтаки рангубор",
  "Вибратор для бетона": "Ларзонанда барои бетон",
  "Воздушный компрессор": "Компрессори ҳавоӣ",
  "Г-образный торцевой ключ": "Калиди торсии Г-шакл",
  "Газовая горелка": "Маъхази газӣ (горелка)",
  "Герметики и клеевые принадлежности": "Герметикҳо ва лавозимоти ширешӣ",
  "Гибкий вал вибратора": "Вали чандири ларзонанда",
  "Гидравлический домкрат": "Домкрати гидравликӣ",
  "Гладилка штукатурная": "Молаи ҳамворкунии андова (гладилка)",
  "Дизельный генератор": "Генератори дизелӣ",
  Длинногубцы: "Анбӯри дароздаҳон",
  Дождевик: "Либоси боронӣ",
  "Зажимные клещи": "Кандвори чанголдор",
  "Заклёпочник для резьбовых заклёпок": "Парчинкунак барои парчинҳои риштадор",
  "Зарядное устройство": "Дастгоҳи барқпуркунӣ",
  "Зарядное устройство для АКБ": "Дастгоҳи барқпуркунӣ барои батарея",
  "Зарядное устройство для аккумулятора": "Дастгоҳи барқпуркунӣ барои аккумулятор",
  "Затирочная машина": "Дастгоҳи суфтакунии андова",
  "Защитная рабочая обувь": "Пойафзоли кории муҳофизатӣ",
  "Защитные очки": "Айнакҳои муҳофизатӣ",
  "Защитные перчатки": "Дастпӯшакҳои муҳофизатӣ",
  "Зубило по камню": "Искана барои санг",
  "Индикатор напряжения": "Нишондиҳандаи шиддат (индикатор)",
  Кабелерез: "Симбурак (кабелбурак)",
  "Кабельная стяжка нейлоновая, белая": "Тасмаи кабели нейлонӣ, сафед",
  "Кабельная стяжка нейлоновая, чёрная": "Тасмаи кабели нейлонӣ, сиёҳ",
  "Катушка для кабеля": "Ғалтаки кабели барқӣ",
  "Кельма каменщика": "Молаи хиштчин",
  "Клеевой пистолет": "Таппончаи ширешӣ",
  "Клещи для стопорных колец": "Кандвор барои ҳалқаҳои нигаҳдоранда",
  "Ключ комбинированный рожково-накидной": "Калиди якҷояи кушода-ҳалқавӣ",
  "Ключи и наборы головок": "Калидҳо ва маҷмӯи саракҳо",
  "Ковш штукатурный": "Чумчаи андовапартоӣ",
  "Комбинированный гаечный ключ": "Калиди гайкагии якҷоя",
  "Компрессорная головка": "Сараки компрессор",
  "Контроллер давления насоса": "Танзимгари фишори насос",
  "Кровельная газовая горелка": "Маъхази газии бомпӯшӣ",
  Кувалда: "Гурз",
  "Кусторез ручной": "Шохбураки дастӣ",
  "Кухонные весы": "Тарозуи ошхона",
  "Лазерный уровень": "Сатҳсанҷи лазерӣ (тарози лазерӣ)",
  "Лепестковый шлифовальный круг": "Доираи суфтакунии паррагӣ",
  "Лом-гвоздодёр": "Лом-мехкаш",
  Лопата: "Бел",
  "Магнитный держатель для сварки": "Нигаҳдорандаи магнитӣ барои кафшер",
  Маслёнка: "Равғанрез",
  Мачете: "Мачете (теғдаст)",
  "Мини-плоскогубцы": "Мини-анбӯр",
  "Мойка высокого давления": "Дастгоҳи шустушӯи фишори баланд",
  "Молоток-гвоздодёр": "Болғаи мехкаш",
  "Монтажная отрезная пила": "Арраи бурандаи монтажӣ",
  "Монтажная пена": "Кафки васлкунӣ (монтажная пена)",
  "Набор аккумуляторного инструмента": "Маҷмӯи асбобҳои аккумулаторӣ",
  "Набор ключей TORX": "Маҷмӯи калидҳои TORX",
  "Набор комбинированных ключей": "Маҷмӯи калидҳои якҷоя",
  "Набор коронок": "Маҷмӯи тоҷҳо",
  "Набор металлических щёток": "Маҷмӯи чуткаҳои филизӣ",
  "Набор торцевых головок": "Маҷмӯи саракҳои торсӣ",
  "Набор шестигранных ключей": "Маҷмӯи калидҳои шашкунҷа",
  "Напильник по металлу": "Сӯҳон барои металл",
  "Насос для чистой воды": "Насос барои оби тоза",
  "Нож строительный": "Корди сохтмонӣ",
  Ножницы: "Қайчӣ",
  "Ножницы по металлу": "Қайчии металлбур",
  "Ножовочная рамка": "Чорчӯбаи арраи оҳанбур",
  "Окрасочный аппарат": "Дастгоҳи рангпошӣ",
  "Отбойный молоток": "Болғаи калон (отбойник)",
  Отвёртка: "Отвёртка (печгӯш)",
  "Отрезной диск": "Диски буранда",
  "Патрон для дрели": "Патрон барои парма",
  "Переставные клещи": "Кандвори танзимшаванда",
  "Перовое сверло по дереву": "Пармаи паррагӣ барои чӯб",
  "Пильный диск": "Диски аррагӣ",
  "Пистолет для герметика": "Таппонча барои герметик",
  "Пистолет для монтажной пены": "Таппонча барои кафки васлкунӣ",
  "Платформенные весы": "Тарозуи платформавӣ",
  "Плиткорез ручной": "Сафолбураки дастӣ",
  "Пневматический гвоздезабиватель": "Мехзанаки пневматикӣ",
  "Пневматический краскопульт": "Рангпошаки пневматикӣ",
  "Пневматический продувочный пистолет": "Таппончаи боддиҳии пневматикӣ",
  "Погружной насос": "Насоси ғӯтавар",
  "Подставка под автомобиль": "Поя барои худрав",
  "Полотна для сабельной пилы": "Теғҳо барои арраи шамшерӣ",
  "Присоска для переноски плитки и стекла": "Маканда барои сафол ва шиша",
  "Промышленный пылесос": "Чакашаки саноатӣ",
  "Пружинная струбцина": "Струбсинаи пружинӣ",
  "Пузырьковый уровень": "Сатҳсанҷи ҳубобӣ (тароз)",
  "Разводной ключ": "Калиди танзимшаванда (шведӣ)",
  "Разметочный шнур": "Ресмони аломатгузорӣ",
  "Резиновая киянка": "Болғаи резинӣ (киёнка)",
  "Рекламная продукция": "Маҳсулоти таблиғотӣ",
  Респиратор: "Респиратор (ниқоби нафаскашӣ)",
  "Рулетка геодезическая": "Ченаки геодезӣ",
  "Рулетка измерительная": "Ченаки сохтмонӣ (рулетка)",
  "Рулетки и измерительные приборы": "Ченакҳо ва асбобҳои ченкунӣ",
  "Ручная гидравлическая тележка": "Аробаи гидравликии дастӣ (рохла)",
  "Ручная пила для бетона": "Арраи дастӣ барои бетон",
  "Ручной заклёпочник": "Парчинкунаки дастӣ",
  "Ручной опрыскиватель": "Дорупошаки дастӣ",
  "Ручной степлер": "Степлери дастӣ",
  "Ручной шарнирно-губцевый инструмент": "Асбобҳои дастии шарнирӣ",
  "Садовая пила": "Арраи боғдорӣ",
  "Сапоги резиновые": "Мӯзаҳои резинӣ",
  "Сварочная маска": "Ниқоби кафшергарӣ",
  "Сварочные электроды": "Электродҳои кафшерӣ",
  "Сварочный аппарат": "Дастгоҳи кафшергарӣ",
  "Свёрла по бетону": "Пармаҳо барои бетон",
  "Сверло по стеклу": "Парма барои шиша",
  Секатор: "Қайчии боғдорӣ (секатор)",
  "Силиконовый герметик": "Герметики силиконӣ",
  "Складной набор шестигранников": "Маҷмӯи қатшавандаи шашкунҷаҳо",
  Скребок: "Тарошак (скребок)",
  "Скребок-нож": "Корд-тарошак",
  "Слесарные тиски": "Гирандаи оҳангарӣ (тиски)",
  "Спиральное сверло по металлу": "Пармаи морпеч барои металл",
  "Стальной трос в бухте": "Симтанаи пӯлодӣ дар чанбар",
  "Стамеска по дереву": "Искана барои чӯб",
  "Страховочная привязь": "Камарбанди бехатарӣ",
  "Стриппер для снятия изоляции": "Силканаки симҳо (стриппер)",
  "Струбцина G-образная": "Струбсинаи G-шакл",
  "Ступенчатое сверло": "Пармаи зинагӣ",
  "Стяжной ремень": "Тасмаи бастан (ремни стяжной)",
  "Т-образный угольник": "Кунҷаки Т-шакл",
  "Тележка для инструментов": "Ароба барои асбобҳо",
  "Телескопическая лестница": "Нардбони телескопӣ",
  "Телескопическая ручка для малярного валика": "Дастаки телескопӣ барои ғалтаки рангубор",
  "Токовые клещи": "Кандвори ҷараёнсанҷ",
  Топорик: "Табарча",
  "Торговый стенд": "Стенди тиҷоратӣ",
  "Торцевая головка 1/2″, короткая": "Сараки торсӣ 1/2″, кӯтоҳ",
  "Торцевая головка 1/2″, удлинённая": "Сараки торсӣ 1/2″, дароз",
  "Торцовочная пила": "Арраи торсовкагӣ",
  "Точильный станок": "Дастгоҳи тезкунӣ",
  "Трапециевидное лезвие": "Теғи трапетсияшакл",
  Трещотка: "Калиди шарфадор (трешотка)",
  "Трубные клещи": "Кандвори қубургир",
  "Труборез для ПВХ труб": "Қубурбурак барои қубурҳои ПВХ",
  "Угловая шлифмашина": "Дастгоҳи суфтакунии кунҷӣ (болгарка)",
  "Угольник алюминиевый": "Кунҷаки алюминӣ",
  "Угольные щётки для электроинструмента": "Чӯткаҳои ангиштӣ барои асбоби барқӣ",
  "Ударная дрель": "Бурғуи зарбавӣ (парма)",
  "Фирменное поло JCTOP": "Либоси фирмавии поло JCTOP",
  Фрезер: "Фрезери барқӣ",
  "Футболка поло": "Футболкаи поло",
  "Хозяйственные перчатки ПВХ": "Дастпӯшакҳои хоҷагидории ПВХ",
  "Циркулярная настольная пила": "Арраи мизии даврагӣ",
  "Циркулярная пила": "Арраи даврагӣ (сиркулярка)",
  "Цифровой мультиметр": "Мултиметри рақамӣ",
  Шпатель: "Шпатели сохтмонӣ",
  "Шприц для смазки": "Шприс барои равғанзанӣ",
  "Щётка ручная": "Чӯткаи дастӣ",
  "Щётка чашечная проволочная": "Чӯткаи симдори косашакл",
  "Эксцентриковая шлифмашина": "Дастгоҳи суфтакунии эксцентрикӣ",
  "Электрическая цепная пила": "Арраи занҷирии барқӣ",
  "Электрический воздуходув": "Боддиҳандаи барқӣ",
  Электрододержатель: "Нигаҳдорандаи электрод",
  "Электроинструмент и оборудование": "Асбобҳои барқӣ ва таҷҳизот",
  Электролобзик: "Арраи каҷбури барқӣ (лобзик)",
};

const EXACT_CODE_SPECS: Record<string, string> = {
  SX0604: "21V/230-320N.m",
  SX0801: '21V/6"',
  SX0806: "21V/8000r/min",
  SX0703: "21V/4.0Ah/5C",
  SX0704: "21V/6.0Ah/5C",
  SU3712: "21V/2.0Ah",
  SU3713: "21V/4.0Ah",
  SU3714: "21V/6.0Ah",
  SD9010: "650W/13MM",
  SD9101: "750W/115MM",
  SD9102: "850W/115MM",
  SD9103: "950W/125MM",
  SD9104: "1100W/125MM",
  SD8906: "1500W/65MM",
  SA8004: "2.2KW/50L",
  SD3811: "2200W/355MM",
  SE1550: "550W/220V",
  SE1750: "750W/220V",
  SE2750: "750W/220V",
  SE3136: "220V/10Bar",
  SR5625: "12V-24V/180W",
  SR5626: "12V-24V/240W",
  SR5627: "12V-24V/320W",
  SK304: "12V-24V/30A",
  SR8510: "250A/220V",
  SE0395: "1200W/220V",
  SE0795: "1500W/220V",
  SZ1500: "1500W/220V",
  SF2200: "200L/2200W",
  SE1505: "1600W/60L",
  SE1506: "2400W/80L",
  CQ8665: "5.5HP/38MM",
  S132: "2.5KW/220V",
  ST9610: "1.0KW/220V",
  SE5713: "6.5HP/50MM",
  TOP78130125: "30M/12.5MM",
  AH7701: "600V AC/DC",
  AH7702: "600A/600V",
  AH7703: "1000V AC/DC",
  AH7704: "600A/1000V",
  AG3890: "12-1000V AC",
  AR7616: "16 Lines/360°",
  CE0706: "6PCS",
  CE0809: "9PCS",
  CE0912: "12PCS",
  CR5912: "12PCS",
  CR5908: "8PCS",
  CK0934: '1/2" 125MM',
  CK0935: '1/2" 250MM',
  CK0936: '1/2" 250MM T-Bar',
  CK0937: '1/2" Universal Joint',
  CR6010: '10PCS 1/2"',
  CK4146: "46PCS",
  CK4153: "53PCS",
  CK5121: "121PCS",
  CK5151: "151PCS",
  KY9801: "8-19MM/5PCS",
  CH7406: "6PCS",
  CH7409: "9PCS",
  BM4007: '10" 250MM',
  BN5008: '8" 200MM',
  BK7083: '7" 175MM',
  BK7084: '7" 175MM',
  BI3060: '6" 150MM',
  BT7082: '1000V 8" 200MM',
  BT7053: "1000V 3PCS",
  BR8606: '4.5" 115MM',
  BR8607: '4.5" 115MM',
  FG5004: "4LB(1.8KG)",
  FG5012: "12LB(5.4KG)",
  JH2030: '750MM(30")',
  JH2036: '900MM(36")',
  JK2001: "280MMx120MM",
  JA7006: "M3-M10",
  JR7015: "M3-M12",
  JR7040: "M4-M12",
  JR5718: '7" 180MM',
  JE2026: "4.8x300MM/100PCS",
  EQ4010: "18MMx100MM",
  EQ1802: "18MMx100MM",
  EQ2703: "18MMx100MM",
  EQ4366: "18MMx100MM",
  EQ5066: "18MM",
  EQ4011: "18MM",
  EA4017: "61MM/10PCS",
  EU6010: '10" 250MM',
  EU7010: '10" 250MM',
  EVO712: '12" 300MM',
  EA2306: '6" 150MM',
  EA2308: '8" 200MM',
  EA2310: '10" 250MM',
  ET7008: "800MM",
  ET6008: "600MM",
  ET8008: "800MM",
  GA7500: "500MM",
  GA7700: "700MM",
  GA0922: "350MM",
  EN0430: '12" 300MM',
  ENO0101: '12" 300MM',
  EN0104: '12" 300MM',
  EN3770: '12" 300MM',
  GB6694: '8" 200MM',
  DA82014: "6PCS",
  KD5060: '5" 125MM',
  KA4125: "125MM",
  KA7180: "180MM",
  KI4623: "230MM",
  KJ4115: "115MM",
  KB4115: "115MM",
  KB7180: "180MM",
  KJ5115: "115MM",
  KA6125: "125MM",
  KA6180: "180MM",
  KA6350: "350MM",
  KD8832: "230MM",
  KI0120: "12x210MM",
  KI0510: "10x160MM",
  KI0214: "14x210MM",
  KI0410: "10x210MM",
  KI7702: "10x260MM",
  KI7730: "14x300MM",
  KI7738: "16x380MM",
  KY9788: "10PCS",
  KR6125: "4-20MM",
  KR6180: "4-32MM",
  EY1911: "11PCS",
  KK6403: "3PCS",
  KK6405: "5PCS",
  HR8071: "3Mx25MM",
  HR8072: "5Mx25MM",
  HR8073: "8Mx50MM",
  HR8074: "10Mx50MM",
  OF7741: "41#",
  ON3545: "45#",
  OR9841: "41#",
  OD6044: "44#",
  OD5041: "41#",
  OE7001: "XL/XXL",
  OH7891: "L/100G",
  OH7891S: "M/100G",
  OH7892: "L/120G",
  OH7893: "XL/120G",
  XL260MM: "XL/260MM",
  OH6636: "XL/360MM",
  OE3816: "110x90MM",
  OE3818: "110x90MM",
  IG7781: "E6013 2.5MM",
  IG8881: "E6013 3.2MM",
  IG7782: "E6013 3.2MM",
  IG8882: "E6013 4.0MM",
  LC0704: '4" 100MM',
  LC0706: '6" 150MM',
  "POLO-2XL": "2XL",
  "POLO-XL": "XL",
  "POLO-L": "L",
  "POLO-M": "M",
};

function cleanItemSpec(raw: string): string {
  return raw
    .trim()
    .replaceAll("26mm soow", "26MM 800W")
    .replaceAll("em 850W", "26MM 850W")
    .replaceAll("750-950mmM", "750-950MM")
    .replaceAll("2000mAnh", "2000mAh")
    .replaceAll("4.5°115mm", '4.5" 115MM')
    .replaceAll("7°180mm", '7" 180MM')
    .replaceAll("9”230mm", '9" 230MM')
    .replaceAll("”", '"')
    .replaceAll("“", '"')
    .replace(/^Q"$/, '2"')
    .replace(/^"a$/, "18MM")
    .replace(/\s+/g, " ");
}

function inferMissingSpec(item: JctopItem, allItems: JctopItem[]): string {
  const cleaned = cleanItemSpec(item.spec || "");
  if (cleaned) return cleaned;

  return "";
}

export function cleanAndEnrichItems(rawItems: JctopItem[]): JctopItem[] {
  const renamed = rawItems.map((item) => ({
    ...item,
    name: item.name === "Рулетки и измерительные прибор" ? "Рулетки и измерительные приборы" : item.name,
  }));
  return renamed.map((item) => ({
    ...item,
    spec: inferMissingSpec(item, renamed),
  }));
}

function slugify(text: string) {
  const ruToEn: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => ruToEn[c] || c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductUnit(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("обувь") || n.includes("сапоги") || n.includes("перчатки")) return "пара";
  if (n.includes("набор")) return "набор";
  if (n.includes("стяжка")) return "упак.";
  if (n.includes("трос")) return "м";
  return "шт.";
}

function extractAttributes(item: JctopItem) {
  const attrs: Array<{ name: string; value: string }> = [];
  attrs.push({ name: "Тип", value: item.name });
  attrs.push({ name: "Бренд", value: "JCTOP" });
  attrs.push({ name: "Артикул JCTOP", value: item.code });
  if (item.spec && item.spec.trim()) {
    const s = item.spec.trim();
    attrs.push({ name: "Характеристика", value: s });

    const voltMatch = s.match(/(\d+)V\b/i);
    if (voltMatch) attrs.push({ name: "Напряжение", value: `${voltMatch[1]} В` });

    const powerMatch = s.match(/(\d+(?:\.\d+)?)\s*(KW|W|HP)\b/i);
    if (powerMatch)
      attrs.push({
        name: "Мощность",
        value: `${powerMatch[1]} ${powerMatch[2].toUpperCase()}`,
      });

    const mmMatch = s.match(/(\d+(?:\.\d+)?)\s*MM\b/i);
    if (mmMatch && !item.category.includes("Обувь")) {
      attrs.push({ name: "Размер", value: `${mmMatch[1]} мм` });
    }

    const gritMatch = s.match(/(\d+)#/);
    if (gritMatch) {
      if (item.category.includes("Защитная экипировка")) {
        attrs.push({ name: "Размер обуви", value: gritMatch[1] });
      } else {
        attrs.push({ name: "Зернистость", value: `${gritMatch[1]}#` });
      }
    }

    const pcsMatch = s.match(/(\d+)\s*(?:PCS|pcs|шт)/i);
    if (pcsMatch) attrs.push({ name: "Количество предметов", value: `${pcsMatch[1]} шт.` });
  }
  return attrs;
}

export async function ensureJctopCatalog(
  db: AppDatabase,
  options: { force?: boolean; items?: JctopItem[]; photos?: Buffer[] } = {},
) {
  // Import is an explicit bootstrap operation; never replace a working catalogue.
  if (!options.force) return { synced: false };

  const assetsItemsPath = path.resolve(process.cwd(), "assets", "jctop-2026-items.json");
  const publicPhotosDir = path.resolve(process.cwd(), "public", "images", "jctop");

  if (!options.items && !fs.existsSync(assetsItemsPath)) {
    console.warn("JCTOP catalog assets missing at", assetsItemsPath);
    return { synced: false };
  }

  const items = cleanAndEnrichItems(
    options.items ?? (JSON.parse(fs.readFileSync(assetsItemsPath, "utf-8")) as JctopItem[]),
  );
  const maxPhoto = Math.max(...items.map((item) => item.photo));
  const photoSizes: number[] = [];
  const storageDriver = process.env.STORAGE_DRIVER ?? "local";
  const storageDir = path.resolve(process.env.STORAGE_DIR ?? "./.data/storage");
  const productsStorageDir = path.join(storageDir, "products", "2026");

  if (storageDriver === "local") {
    fs.mkdirSync(productsStorageDir, { recursive: true });
  }

  for (let i = 0; i <= maxPhoto; i++) {
    const buffer =
      options.photos?.[i] ??
      fs.readFileSync(path.join(publicPhotosDir, `jctop-photo-${i}.webp`));
    photoSizes.push(buffer.length);
    if (storageDriver === "local") {
      fs.writeFileSync(path.join(productsStorageDir, `jctop-photo-${i}.webp`), buffer);
    }
  }

  const photoFileIds = photoSizes.map(() => crypto.randomUUID());

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('stroysnab-catalog-bootstrap'))`);
    const [existing] = await tx.select({ count: sql<number>`count(*)::int` }).from(products);
    if (existing.count > 0) throw new Error("catalog_not_empty: import cannot replace existing products");

    let supplierRows = await tx.select().from(suppliers).orderBy(suppliers.name);
    if (!supplierRows.length) {
      supplierRows = await tx
        .insert(suppliers)
        .values([
          {
            name: "Сомон Снаб",
            legalName: "ООО «Сомон Снаб»",
            phone: "+992900100001",
            email: "sales@somon.example",
            status: "ACTIVE",
          },
        ])
        .returning();
    }
    const defaultSupplier = supplierRows[0];


    for (let offset = 0; offset < photoFileIds.length; offset += 100) {
      const chunk = photoFileIds.slice(offset, offset + 100).map((id, idx) => ({
        id,
        storageKey: `products/2026/jctop-photo-${offset + idx}.webp`,
        mime: "image/webp",
        size: photoSizes[offset + idx],
      }));
      await tx.insert(files).values(chunk).onConflictDoNothing();
    }

    const categoryIdByName = new Map<string, string>();
    for (let idx = 0; idx < CATEGORY_DEFINITIONS.length; idx++) {
      const def = CATEGORY_DEFINITIONS[idx];
      const [inserted] = await tx
        .insert(categories)
        .values({
          slug: def.slug,
          nameRu: def.nameRu,
          nameTg: def.nameTg,
          sort: idx + 1,
          isActive: "true",
          parentId: null,
        })
        .returning();
      categoryIdByName.set(def.nameRu, inserted.id);
    }

    const productRows = items.map((item) => {
      const catId = categoryIdByName.get(item.category);
      if (!catId) {
        throw new Error(`Category not found for item ${item.name}: ${item.category}`);
      }
      const codeClean = (item.code || "JCTOP").trim();
      const sku = item.duplicateCode ? `${codeClean}-${item.id}` : codeClean;
      const slug = `${slugify(item.name)}-${slugify(codeClean)}-${item.id}`;
      const specText = item.spec ? ` (${item.spec})` : "";
      const nameRu = /\bJCTOP\b/i.test(item.name)
        ? `${item.name}${specText}`
        : `${item.name} JCTOP${specText}`;
      const tgName = PRODUCT_NAME_TG[item.name] || item.name;
      const nameTg = /\bJCTOP\b/i.test(tgName)
        ? `${tgName}${specText}`
        : `${tgName} JCTOP${specText}`;
      const pageInfo = item.printPage ? `каталог стр. ${item.printPage}` : `стр. ${item.page}`;

      return {
        id: crypto.randomUUID(),
        sku,
        slug,
        nameRu,
        nameTg,
        descriptionRu: `Профессиональный инструмент JCTOP. Модель: ${codeClean}. ${item.spec ? `Характеристики: ${item.spec}. ` : ""}Оригинальная продукция из официального каталога JCTOP 2026 (${pageInfo}). Гарантия качества, надёжность и долговечность.`,
        descriptionTg: `Асбоби касбии JCTOP. Модел: ${codeClean}. ${item.spec ? `Хусусиятҳо: ${item.spec}. ` : ""}Маҳсулоти аслӣ аз феҳристи расмии JCTOP 2026 (${pageInfo}). Кафолати сифат, боэътимодӣ ва умри дароз.`,
        categoryId: catId,
        brand: "JCTOP",
        unit: getProductUnit(item.name),
        markupPercent: "5",
        status: "PUBLISHED",
        photoIndex: item.photo,
        rawItem: item,
      };
    });

    for (let offset = 0; offset < productRows.length; offset += 200) {
      const chunk = productRows.slice(offset, offset + 200).map((p) => ({
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        nameRu: p.nameRu,
        nameTg: p.nameTg,
        descriptionRu: p.descriptionRu,
        descriptionTg: p.descriptionTg,
        categoryId: p.categoryId,
        brand: p.brand,
        unit: p.unit,
        markupPercent: p.markupPercent,
        status: p.status,
      }));
      await tx.insert(products).values(chunk);
    }

    const attributeValues = productRows.flatMap((p) =>
      extractAttributes(p.rawItem).map((attr) => ({
        productId: p.id,
        name: attr.name,
        value: attr.value,
      })),
    );
    for (let offset = 0; offset < attributeValues.length; offset += 500) {
      await tx.insert(productAttributes).values(attributeValues.slice(offset, offset + 500));
    }

    const imageValues = productRows.flatMap((p) => {
      const fileId = photoFileIds[p.photoIndex];
      return fileId ? [{ productId: p.id, fileId, sort: 0 }] : [];
    });
    for (let offset = 0; offset < imageValues.length; offset += 500) {
      await tx.insert(productImages).values(imageValues.slice(offset, offset + 500));
    }

    const offerValues = productRows.map((p) => ({
      productId: p.id,
      supplierId: defaultSupplier.id,
      supplierPriceDirams: 0n,
      stockQty: "0",
      reservedQty: "0",
      minOrderQty: "1",
      leadTimeDays: 1,
      isActive: "false",
    }));
    for (let offset = 0; offset < offerValues.length; offset += 500) {
      await tx.insert(supplierOffers).values(offerValues.slice(offset, offset + 500));
    }
  });

  // Ensure DB column default matches 5% markup
  await db
    .execute(sql`ALTER TABLE products ALTER COLUMN markup_percent SET DEFAULT 5`)
    .catch(() => { });

  return { synced: true, products: items.length, categories: CATEGORY_DEFINITIONS.length };
}
