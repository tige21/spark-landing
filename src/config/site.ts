export const APP_NAME = 'Spark Cards';

export const TELEGRAM_BOT_URL = 'https://t.me/SparkCardsBot';

// The web build of the game, served from this same domain by the ../spark repo.
// Same-origin, so CTAs pointing here stay in the tab instead of opening a new one.
export const PLAY_URL = '/play';

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

export interface DeckInfo {
  id: string;
  stamp: string;
  name: { ru: string; en: string };
  sample: { ru: string; en: string };
}

// Mirrors the app's catalogue (../spark/assets/data/decks/*.json) deck for deck:
// names and sample questions are quoted from it. The landing used to advertise
// «Правда», «Действие» and «Новый год», which do not exist in the game, and to
// hide «Между нами» and «Давай поболтаем», which do — so anyone who clicked
// through landed in a different catalogue than the one they had just read.
export const DECKS: DeckInfo[] = [
  {
    id: 'ice-breaker',
    stamp: 'stamp-icebreaker.svg',
    name: { ru: 'Знакомство', en: 'Ice Breaker' },
    sample: {
      ru: 'Твои мысли после фразы «включите камеру пожалуйста»?',
      en: "What goes through your head after 'please turn your camera on'?",
    },
  },
  {
    id: 'classic-party',
    stamp: 'stamp-classic.svg',
    name: { ru: 'Классика вечеринок', en: 'Classic Party' },
    sample: {
      ru: 'Что ты чувствуешь, когда тебе пишут «нам надо поговорить»?',
      en: "How do you feel when someone texts you 'we need to talk'?",
    },
  },
  {
    id: 'honest-collab',
    stamp: 'stamp-truth.svg',
    name: { ru: 'Давай поболтаем', en: 'Honest Talk' },
    sample: {
      ru: 'Как ты относишься к культу продуктивности?',
      en: 'How do you feel about the cult of productivity?',
    },
  },
  {
    id: 'couples-love',
    stamp: 'stamp-couples-v2.svg',
    name: { ru: 'Связь для пар', en: 'Couples Connection' },
    sample: {
      ru: 'Какая моя мелкая привычка тебя умиляет?',
      en: 'What small habit of mine melts your heart?',
    },
  },
  {
    id: 'family-fun',
    stamp: 'stamp-family.svg',
    name: { ru: 'Семейное веселье', en: 'Family Fun' },
    sample: {
      ru: 'Какой запах сразу напоминает тебе о детстве и доме?',
      en: 'What smell instantly takes you back to childhood and home?',
    },
  },
  {
    id: 'drinking-games',
    stamp: 'stamp-drinking.svg',
    name: { ru: 'Алкогольные игры', en: 'Drinking Games' },
    sample: {
      ru: 'Правда или выпей: назови самую глупую трату за этот месяц.',
      en: 'Truth or drink: name your dumbest purchase this month.',
    },
  },
  {
    id: 'between-us',
    stamp: 'stamp-dare.svg',
    name: { ru: 'Между нами', en: 'Just Between Us' },
    sample: {
      ru: 'Какой эмодзи ты используешь пассивно-агрессивно?',
      en: 'Which emoji do you use passive-aggressively?',
    },
  },
  {
    id: 'spicy-couples',
    stamp: 'stamp-spicy.svg',
    name: { ru: 'Пикантное для пар 18+', en: 'Spicy Couples 18+' },
    sample: {
      ru: 'По какому незаметному сигналу ты понимаешь, что я тебя хочу?',
      en: 'By which subtle signal do you know that I want you?',
    },
  },
  {
    // Borrowed mark: the party deck has no engraving of its own yet, so it runs
    // the chilli one its couples sibling uses. Replace when the mark is drawn.
    id: 'spicy-party',
    stamp: 'stamp-spicy.svg',
    name: { ru: 'Пикантная вечеринка 18+', en: 'Spicy Party 18+' },
    sample: {
      ru: 'Ты хоть раз флиртовал(а) на работе?',
      en: 'Have you ever flirted at work?',
    },
  },
];

export const MERCHANT = {
  name: {
    ru: 'Белая Элина Игоревна, самозанятая',
    en: 'Elina Igorevna Belaya, self-employed',
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
