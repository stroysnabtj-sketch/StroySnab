export interface DeliveryVehicle {
  id: string;
  code: "PICKUP" | "TAXI" | "PORTER" | "GAZELLE" | "MANIPULATOR" | "DUMP_TRUCK" | "LONG_HAUL";
  codeIndex: string; // e.g. V-01, V-077 (как на Скриншоте 1)
  category: "all" | "pickup" | "taxi" | "light" | "special" | "heavy";
  title: string;
  badge: string;
  capacityKg: number;
  capacityFormatted: string;
  volumeM3: number;
  volumeFormatted: string;
  dimensions: string;
  basePriceTJS: number;
  pricePerKmTJS: number;
  unloadingType: "MANUAL" | "LOADERS" | "CRANE_BOOM" | "DUMP" | "SELF_PICKUP";
  idealFor: string[];
  features: string[];
  imageVariant: "taxi" | "porter" | "gazelle" | "manipulator" | "dumptruck" | "longhaul" | "pickup";
  photoUrl: string;
  driverName: string;
  driverPhone: string;
  driverAvatar: string;
  plate: string;
  status: "available" | "in_service" | "ready";
  statusText: string;
  fuelPercent: number;
  dispatchTimeMins: number;
  homeTerminal: string;
}

export const DELIVERY_FLEET: DeliveryVehicle[] = [
  {
    id: "veh-pickup",
    code: "PICKUP",
    codeIndex: "V-00",
    category: "pickup",
    title: "Самовывоз со склада (Центральный хаб)",
    badge: "Бесплатно 0 TJS",
    capacityKg: 50000,
    capacityFormatted: "Без ограничений",
    volumeM3: 100,
    volumeFormatted: "Любой объём",
    dimensions: "Погрузочная рампа склада",
    basePriceTJS: 0,
    pricePerKmTJS: 0,
    unloadingType: "SELF_PICKUP",
    idealFor: [
      "Самостоятельный забор на личном транспорте",
      "Срочный вывоз в день заказа",
      "Любые объемы — от коробки до 20 тонн",
    ],
    features: [
      "Бесплатная погрузка автопогрузчиком склада",
      "Удобный подъезд для любого транспорта и фур",
      "Готовность заказа через 30 минут после подтверждения",
    ],
    imageVariant: "pickup",
    photoUrl: "/vehicles/pickup.jpg",
    driverName: "Складской терминал №1",
    driverPhone: "+992 90 000 1122",
    driverAvatar: "🏭",
    plate: "СКЛАД ДУШАНБЕ",
    status: "available",
    statusText: "Готов к выдаче (30 мин)",
    fuelPercent: 100,
    dispatchTimeMins: 30,
    homeTerminal: "Душанбе, Промзона (Рядом с ж/д веткой)",
  },
  {
    id: "veh-taxi",
    code: "TAXI",
    codeIndex: "V-01",
    category: "taxi",
    title: "Экспресс-такси / Daewoo Damas",
    badge: "Для мелких покупок",
    capacityKg: 250,
    capacityFormatted: "до 250 кг",
    volumeM3: 2.5,
    volumeFormatted: "до 2.5 м³",
    dimensions: "Багажник 1.4 × 1.1 м",
    basePriceTJS: 45,
    pricePerKmTJS: 1.5,
    unloadingType: "MANUAL",
    idealFor: [
      "Ручной и аккумуляторный инструмент",
      "Смесители, сифоны и сантехническая фурнитура",
      "Метизы, саморезы и крепеж в пачках",
      "Краски и эмали (1-3 ведра)",
      "Розетки, выключатели, автоматы и проводка",
    ],
    features: [
      "Мгновенная подача за 15-20 минут через городскую службу",
      "Проезд в любой двор, подземный паркинг или узкий переулок",
      "Минимальная стоимость доставки по городу (45 TJS)",
    ],
    imageVariant: "taxi",
    photoUrl: "/vehicles/taxi.jpg",
    driverName: "Алишер Каримов",
    driverPhone: "+992 98 444 7722",
    driverAvatar: "🚗",
    plate: "01 123 TJ",
    status: "available",
    statusText: "Свободен (подача 15 мин)",
    fuelPercent: 92,
    dispatchTimeMins: 15,
    homeTerminal: "Центр Душанбе / Кушониён",
  },
  {
    id: "veh-porter",
    code: "PORTER",
    codeIndex: "V-02",
    category: "light",
    title: "Лабо / Hyundai Porter (Бортовой)",
    badge: "Малый тоннаж",
    capacityKg: 1500,
    capacityFormatted: "до 1.5 тонн",
    volumeM3: 9,
    volumeFormatted: "до 9 м³",
    dimensions: "2.8 × 1.6 × 1.5 м",
    basePriceTJS: 120,
    pricePerKmTJS: 2.5,
    unloadingType: "MANUAL",
    idealFor: [
      "Крепеж, электротовары и сантехника оптом",
      "Краски, эмали и лаки (до 30 ведер)",
      "Сухие смеси (до 25-30 мешков по 50 кг)",
      "Кабель в бухтах, кабель-каналы и гофры",
      "Ручной и электроинструмент крупными партиями",
    ],
    features: [
      "Свободный проезд по узким улицам и дачным массивам",
      "Низкая погрузочная высота (80 см) для удобной ручной выгрузки",
      "Быстрая подача за 25-35 минут",
    ],
    imageVariant: "porter",
    photoUrl: "/vehicles/porter.jpg",
    driverName: "Дилшод Рахимов",
    driverPhone: "+992 93 555 8899",
    driverAvatar: "🛻",
    plate: "01 555 TJ",
    status: "in_service",
    statusText: "На рейсе (окно 25 мин)",
    fuelPercent: 78,
    dispatchTimeMins: 25,
    homeTerminal: "Душанбе, Терминал №1",
  },
  {
    id: "veh-gazelle",
    code: "GAZELLE",
    codeIndex: "V-03",
    category: "light",
    title: "Газель NEXT (4.2 м Борт / Тент)",
    badge: "Хит заказов",
    capacityKg: 3500,
    capacityFormatted: "до 3.5 тонн",
    volumeM3: 16,
    volumeFormatted: "до 16 м³",
    dimensions: "4.2 × 2.0 × 1.9 м",
    basePriceTJS: 220,
    pricePerKmTJS: 3.5,
    unloadingType: "MANUAL",
    idealFor: [
      "Сухие строительные смеси (до 70 мешков)",
      "Гипсокартон ГКЛ (листы 2.5 × 1.2 м)",
      "Профили для ГКЛ, рейки и брус до 4.2 м",
      "Трубы полипропиленовые до 4.0 м",
      "Утеплитель минвата (до 25 упаковок)",
    ],
    features: [
      "Верхняя и боковая растентовка кузова",
      "Перевозка профилей и досок до 4.2 м без заломов",
      "Оптимальный баланс цены и вместимости для ремонта",
    ],
    imageVariant: "gazelle",
    photoUrl: "/vehicles/gazelle.jpg",
    driverName: "Рустам Холов",
    driverPhone: "+992 92 333 4411",
    driverAvatar: "🚚",
    plate: "01 888 TJ",
    status: "available",
    statusText: "Свободен к выезду",
    fuelPercent: 88,
    dispatchTimeMins: 30,
    homeTerminal: "Терминал Западный",
  },
  {
    id: "veh-manipulator",
    code: "MANIPULATOR",
    codeIndex: "V-04",
    category: "special",
    title: "Кран-манипулятор (7 тонн, стрела 3 т)",
    badge: "Саморазгрузка стрелой",
    capacityKg: 7000,
    capacityFormatted: "до 7.0 тонн",
    volumeM3: 18,
    volumeFormatted: "до 18 м³",
    dimensions: "6.0 × 2.45 м (вылет 8 м)",
    basePriceTJS: 550,
    pricePerKmTJS: 6.0,
    unloadingType: "CRANE_BOOM",
    idealFor: [
      "Кирпич на европоддонах (до 6-8 поддонов)",
      "Газоблоки и пеноблоки стеновые",
      "ЖБИ перемычки, кольца колодцев и бордюры",
      "Цемент в биг-бэгах (МКР по 1 т)",
      "Тротуарная плитка в паллетах",
    ],
    features: [
      "Собственный гидроманипулятор: разгрузка без привлечения грузчиков",
      "Подача материалов прямо через забор, на фундамент или 2-й этаж",
      "Экономит до 4-5 человеко-часов тяжелой ручной работы",
    ],
    imageVariant: "manipulator",
    photoUrl: "/vehicles/manipulator.jpg",
    driverName: "Бахром Саидов",
    driverPhone: "+992 90 777 1234",
    driverAvatar: "🏗️",
    plate: "01 777 TJ",
    status: "available",
    statusText: "Свободен на базе",
    fuelPercent: 95,
    dispatchTimeMins: 40,
    homeTerminal: "База спецтехники Кушониён",
  },
  {
    id: "veh-dumptruck",
    code: "DUMP_TRUCK",
    codeIndex: "V-05",
    category: "heavy",
    title: "Самосвал HOWO / КАМАЗ (15 тонн)",
    badge: "Для сыпучих грузов",
    capacityKg: 15000,
    capacityFormatted: "до 15.0 тонн",
    volumeM3: 12,
    volumeFormatted: "до 12 м³",
    dimensions: "Кузов 12 м³",
    basePriceTJS: 450,
    pricePerKmTJS: 5.5,
    unloadingType: "DUMP",
    idealFor: [
      "Песок мытый речной и карьерный",
      "Щебень гранитный всех фракций",
      "Гравий, отсев и балласт",
      "Готовый товарный бетон",
      "Вывоз строительного грунта и боя",
    ],
    features: [
      "Мгновенная самосвальная выгрузка назад (за 3 минуты)",
      "Усиленная рессорная подвеска для стройплощадок без асфальта",
      "Тент для защиты сыпучих материалов в пути",
    ],
    imageVariant: "dumptruck",
    photoUrl: "/vehicles/dumptruck.jpg",
    driverName: "Джамшед Олимов",
    driverPhone: "+992 91 888 2233",
    driverAvatar: "🚜",
    plate: "01 444 TJ",
    status: "in_service",
    statusText: "На объекте (окно 45 мин)",
    fuelPercent: 71,
    dispatchTimeMins: 45,
    homeTerminal: "Карьер / Промбаза Душанбе",
  },
  {
    id: "veh-longhaul",
    code: "LONG_HAUL",
    codeIndex: "V-06",
    category: "heavy",
    title: "Тягач Длинномер / Шаланда (13.6 м, 25 т)",
    badge: "Арматура и опт 12м",
    capacityKg: 25000,
    capacityFormatted: "до 25.0 тонн",
    volumeM3: 45,
    volumeFormatted: "до 45 м³",
    dimensions: "13.6 × 2.45 м",
    basePriceTJS: 900,
    pricePerKmTJS: 9.0,
    unloadingType: "CRANE_BOOM",
    idealFor: [
      "Арматура стальная прутками по 11.7 м без резки",
      "Швеллеры, балки двутавровые и трубы 12 м",
      "Сэндвич-панели стеновые и кровельные",
      "Оптовые поставки цемента (до 500 мешков)",
      "Плиты перекрытия ПК и ПБ",
    ],
    features: [
      "Перевозка любого габаритного металлопроката 12 м без резки",
      "Полная открытая платформа под башенный или автомобильный кран",
      "Коники для надежной фиксации круглых труб и арматурных пачек",
    ],
    imageVariant: "longhaul",
    photoUrl: "/vehicles/semi-truck.jpg",
    driverName: "Фируз Шарипов",
    driverPhone: "+992 90 999 5566",
    driverAvatar: "🚛",
    plate: "01 999 TJ",
    status: "available",
    statusText: "Свободен на трассе",
    fuelPercent: 84,
    dispatchTimeMins: 50,
    homeTerminal: "Логистический хаб Душанбе — Бохтар",
  },
];

export function recommendVehicle(totalWeightKg: number, hasLongItems = false): DeliveryVehicle {
  if (hasLongItems || totalWeightKg > 15000) {
    return DELIVERY_FLEET.find((v) => v.code === "LONG_HAUL")!;
  }
  if (totalWeightKg > 7000) {
    return DELIVERY_FLEET.find((v) => v.code === "DUMP_TRUCK")!;
  }
  if (totalWeightKg > 3500) {
    return DELIVERY_FLEET.find((v) => v.code === "MANIPULATOR")!;
  }
  if (totalWeightKg > 1500) {
    return DELIVERY_FLEET.find((v) => v.code === "GAZELLE")!;
  }
  if (totalWeightKg > 250) {
    return DELIVERY_FLEET.find((v) => v.code === "PORTER")!;
  }
  return DELIVERY_FLEET.find((v) => v.code === "TAXI")!;
}
