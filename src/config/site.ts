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
