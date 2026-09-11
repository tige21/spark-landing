export const APP_NAME = 'Spark Cards';

export const TELEGRAM_BOT_URL = 'https://t.me/SparkCardsBot';

export const STORE_LINKS = {
  appStore: '',
  googlePlay: '',
};

export interface NavLink {
  id: string;
  ru: string;
  en: string;
}

export const NAV_LINKS: NavLink[] = [
  { id: 'how', ru: 'Как это работает', en: 'How it works' },
  { id: 'decks', ru: 'Колоды', en: 'Decks' },
  { id: 'order', ru: 'Создать колоду', en: 'Create a deck' },
];

export type StampInk = 'blue' | 'ochre' | 'vermillion' | 'wine';

export interface DeckInfo {
  id: string;
  stamp: string;
  ink: StampInk;
  name: { ru: string; en: string };
  sample: { ru: string; en: string };
}

export const DECKS: DeckInfo[] = [
  {
    id: 'icebreaker',
    stamp: 'stamp-icebreaker.svg',
    ink: 'blue',
    name: { ru: 'Знакомство', en: 'Icebreaker' },
    sample: {
      ru: 'Что про тебя точно не угадаешь с первого взгляда?',
      en: "What about you would nobody guess at first sight?",
    },
  },
  {
    id: 'classic',
    stamp: 'stamp-classic.svg',
    ink: 'ochre',
    name: { ru: 'Классика вечеринок', en: 'Party Classic' },
    sample: {
      ru: 'За какой свой поступок тебе до сих пор неловко?',
      en: 'Which of your own moves still makes you cringe?',
    },
  },
  {
    id: 'couples',
    stamp: 'stamp-couples-v2.svg',
    ink: 'wine',
    name: { ru: 'Для пар', en: 'Couples' },
    sample: {
      ru: 'Когда ты впервые понял(а), что это серьёзно?',
      en: 'When did you first realise this was serious?',
    },
  },
  {
    id: 'family',
    stamp: 'stamp-family.svg',
    ink: 'ochre',
    name: { ru: 'Семья', en: 'Family' },
    sample: {
      ru: 'Какая семейная традиция тебе дороже всего?',
      en: 'Which family tradition means the most to you?',
    },
  },
  {
    id: 'drinking',
    stamp: 'stamp-drinking.svg',
    ink: 'vermillion',
    name: { ru: 'За бокалом', en: 'Drinks' },
    sample: {
      ru: 'Признайся в чём-то, о чём узнают только за этим столом.',
      en: 'Confess something only this table will ever hear.',
    },
  },
  {
    id: 'truth',
    stamp: 'stamp-truth.svg',
    ink: 'blue',
    name: { ru: 'Правда', en: 'Truth' },
    sample: {
      ru: 'О чём ты молчишь, хотя давно стоило сказать?',
      en: "What have you stayed silent about for too long?",
    },
  },
  {
    id: 'dare',
    stamp: 'stamp-dare.svg',
    ink: 'vermillion',
    name: { ru: 'Действие', en: 'Dare' },
    sample: {
      ru: 'Напиши сейчас сообщение, которое давно откладывал(а).',
      en: "Send the message you've been putting off — right now.",
    },
  },
  {
    id: 'newyear',
    stamp: 'stamp-newyear.svg',
    ink: 'wine',
    name: { ru: 'Новый год', en: 'New Year' },
    sample: {
      ru: 'Каким был твой лучший Новый год и с кем?',
      en: 'What was your best New Year, and who was there?',
    },
  },
  {
    id: 'spicy',
    stamp: 'stamp-spicy.svg',
    ink: 'vermillion',
    name: { ru: 'Только 18+', en: 'Grown-ups 18+' },
    sample: {
      ru: 'Что тебя заводит сильнее, чем ты готов(а) признать?',
      en: "What turns you on more than you'd admit?",
    },
  },
];

export const MERCHANT = {
  name: {
    ru: 'Перебейнос Егор Игоревич, самозанятый',
    en: 'Egor Igorevich Perebeynos, self-employed',
  },
  innLabel: { ru: 'ИНН', en: 'Tax ID (INN)' },
  inn: '781302631519',
  phone: '+7 911 246-51-39',
  phoneUrl: 'tel:+79112465139',
  email: 'eeper03@mail.ru',
};

export const LEGAL_LINKS = [
  {
    href: '/play/legal?tab=terms',
    ru: 'Пользовательское соглашение и оферта',
    en: 'Terms of Service and offer',
  },
  {
    href: '/play/legal',
    ru: 'Политика конфиденциальности',
    en: 'Privacy Policy',
  },
];

export const PRICING = {
  heading: { ru: 'Стоимость', en: 'Pricing' },
  items: [
    {
      amount: '149 ₽',
      ru: 'Колода — бессрочный доступ',
      en: 'A deck — lifetime access',
    },
    {
      amount: '599 ₽',
      ru: 'Все колоды',
      en: 'All decks',
    },
    {
      amount: '299 ₽',
      ru: 'Spark AI без лимитов, 30 дней',
      en: 'Spark AI unlimited, 30 days',
    },
  ],
  note: {
    ru: 'Оплата банковской картой, доступ к колоде открывается сразу после оплаты. Возврат — в течение 14 дней после покупки, запрос на eeper03@mail.ru.',
    en: 'Payment by bank card; the deck unlocks right after payment. Refunds within 14 days of purchase, request at eeper03@mail.ru.',
  },
};
