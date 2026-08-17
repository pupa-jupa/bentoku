import type { Language } from '../puzzle/types';
import type { CampaignChapterNumber, CampaignOrderId } from './campaignData';

export type StorySpeaker = 'narrator' | 'dunya' | 'visitor';
export type VisitorMood = 'neutral' | 'speaking' | 'pleased';
export type StoryPhase = 'intro' | 'chapterComplete';
export type CampaignStoryEventId = `chapter-${CampaignChapterNumber}:${'intro' | 'complete'}`;

export interface LocalizedStoryText {
  en: string;
  ru: string;
}

export interface CampaignStoryLine {
  speaker: StorySpeaker;
  mood: VisitorMood;
  text: LocalizedStoryText;
}

export interface CampaignVisitor {
  id: 'anya' | 'lev' | 'mina' | 'margot' | 'aoi';
  name: LocalizedStoryText;
  role: LocalizedStoryText;
  visualSummary: LocalizedStoryText;
  palette: readonly [number, number, number];
}

export interface CampaignStory {
  chapter: CampaignChapterNumber;
  firstOrderId: CampaignOrderId;
  finalOrderId: CampaignOrderId;
  visitor: CampaignVisitor;
  dayLabel: LocalizedStoryText;
  chapterTitle: LocalizedStoryText;
  setting: LocalizedStoryText;
  opening: LocalizedStoryText;
  lines: readonly CampaignStoryLine[];
  completionTitle: LocalizedStoryText;
  completionBody: LocalizedStoryText;
  completionNote: LocalizedStoryText;
}

const text = (en: string, ru: string): LocalizedStoryText => ({ en, ru });

export const localizeStoryText = (value: LocalizedStoryText, language: Language): string =>
  value[language];

export const storyEventId = (
  chapter: CampaignChapterNumber,
  phase: StoryPhase,
): CampaignStoryEventId => `chapter-${chapter}:${phase === 'intro' ? 'intro' : 'complete'}`;

export const visitorTextureKey = (visitorId: CampaignVisitor['id'], mood: VisitorMood): string =>
  `visitor_${visitorId}_${mood}`;

export const storyBackgroundTextureKey = (chapter: CampaignChapterNumber): string =>
  `story_background_chapter_${chapter}`;

export const CAMPAIGN_STORIES: readonly CampaignStory[] = [
  {
    chapter: 1,
    firstOrderId: 'chapter-1-order-1',
    finalOrderId: 'chapter-1-order-6',
    visitor: {
      id: 'anya',
      name: text('Anya', 'Аня'),
      role: text('Florist assistant', 'Помощница флориста'),
      visualSummary: text(
        'Honey-blonde side braid, mint spring coat, daisy hairpin and a small flower basket.',
        'Медово-светлая боковая коса, мятное весеннее пальто, заколка-ромашка и небольшая корзинка с цветами.',
      ),
      palette: [0xa9cdbb, 0xf3d478, 0xfff7e8],
    },
    dayLabel: text('Three mornings before the festival', 'За три утра до фестиваля'),
    chapterTitle: text('Morning Bows', 'Утренние банты'),
    setting: text('Opening time · clear spring morning', 'Открытие кафе · ясное весеннее утро'),
    opening: text(
      "Dunya turns the sign to OPEN and ties a fresh pink ribbon around the old order book. The café's first bell rings almost at once.",
      'Дуня переворачивает табличку на «Открыто» и завязывает свежий розовый бант на старой книге заказов. Почти сразу звенит первый колокольчик.',
    ),
    lines: [
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          "Good morning. I'm Anya from the flower shop across the square.",
          'Доброе утро. Я Аня, из цветочного магазина через площадь.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'Today is my first shift on my own. I keep pulling every bouquet ribbon too tight, as if the flowers might run away.',
          'Сегодня моя первая самостоятельная смена. Я затягиваю ленты на каждом букете слишком туго, будто цветы могут убежать.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'neutral',
        text: text(
          "Then breakfast should be the one thing you don't have to hurry. I'll make it neat, gentle and easy to read.",
          'Тогда хотя бы с завтраком не нужно спешить. Я соберу его аккуратно, спокойно и понятно.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'Could it feel like a tiny garden? Three little families, each with a place of its own.',
          'Можно сделать его похожим на маленький сад? Три маленьких семейства, и у каждого своё место.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'pleased',
        text: text(
          "Of course. We'll follow the order notes one clue at a time—just like tying one bow at a time.",
          'Конечно. Будем разбирать записку по одной подсказке — как будто завязываем по одному банту.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'pleased',
        text: text(
          'That already makes the morning feel easier. Thank you, Dunya.',
          'От одних этих слов утро уже стало легче. Спасибо, Дуня.',
        ),
      },
    ],
    completionTitle: text('The first ribbon', 'Первый бант'),
    completionBody: text(
      'By noon, six careful orders fill the first page. Anya leaves a daisy beside the very first stamp.',
      'К полудню шесть аккуратных заказов заполняют первую страницу. Аня оставляет ромашку рядом с самой первой печатью.',
    ),
    completionNote: text(
      'The café has found its morning rhythm. A strawberry delivery is due tomorrow.',
      'Кафе нашло свой утренний ритм. Завтра должна приехать клубничная доставка.',
    ),
  },
  {
    chapter: 2,
    firstOrderId: 'chapter-2-order-1',
    finalOrderId: 'chapter-2-order-6',
    visitor: {
      id: 'lev',
      name: text('Lev', 'Лев'),
      role: text('Pastry courier', 'Курьер кондитерской'),
      visualSummary: text(
        'Short auburn hair, cream delivery jacket, berry-red neckerchief and a wooden strawberry crate.',
        'Короткие каштаново-рыжие волосы, кремовая куртка курьера, ягодно-красный платок и деревянный ящик клубники.',
      ),
      palette: [0xc86758, 0xffe6b7, 0x8db88a],
    },
    dayLabel: text('Two afternoons before the festival', 'За два дня до фестиваля'),
    chapterTitle: text('Strawberry Garden', 'Клубничный сад'),
    setting: text('After lunch · warm sunshine', 'После обеда · тёплое солнце'),
    opening: text(
      'A sweet strawberry scent reaches the counter before Lev does. He balances a festival sample crate on one shoulder and a picnic cloth under his arm.',
      'Сладкий запах клубники добирается до стойки раньше Льва. На одном плече он держит ящик с фестивальными образцами, а под мышкой — плед для пикника.',
    ),
    lines: [
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          'Special delivery for Bentoku—and one slightly squashed courier.',
          'Особая доставка для Bentoku — и один слегка помятый курьер.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'I promised my younger sisters a picnic after my route. I packed the blanket, the juice and absolutely no lunch.',
          'Я обещал младшим сёстрам пикник после маршрута. Взял плед, сок и совершенно забыл про обед.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'neutral',
        text: text(
          'Then we need a bento that travels well and still looks like a celebration when you open it.',
          'Тогда нужно бенто, которое спокойно перенесёт дорогу, но при открытии всё равно будет выглядеть как праздник.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'Exactly. They judge every picnic by the number of delighted squeals.',
          'Именно. Они оценивают каждый пикник по количеству восторженных визгов.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'pleased',
        text: text(
          "I'll tuck every family snugly into place. Nothing will slide, even if you run the whole way.",
          'Я уложу каждое семейство точно на место. Ничего не сдвинется, даже если ты всю дорогу побежишь.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'pleased',
        text: text(
          "Perfect. If they squeal loudly enough, I'll bring you the best strawberries from the next crate.",
          'Идеально. Если они будут визжать достаточно громко, я принесу тебе лучшую клубнику из следующего ящика.',
        ),
      },
    ],
    completionTitle: text('A garden in the window', 'Сад на витрине'),
    completionBody: text(
      "Six new stamps join the book. Lev's brightest strawberries become the first festival display in Bentoku's window.",
      'В книге появляются ещё шесть печатей. Самая яркая клубника Льва становится первой фестивальной композицией на витрине Bentoku.',
    ),
    completionNote: text(
      'The display is cheerful, but the café still needs a festival sign that can be seen through the rain.',
      'Витрина получилась весёлой, но кафе всё ещё нужна фестивальная вывеска, которую будет видно даже сквозь дождь.',
    ),
  },
  {
    chapter: 3,
    firstOrderId: 'chapter-3-order-1',
    finalOrderId: 'chapter-3-order-6',
    visitor: {
      id: 'mina',
      name: text('Mina', 'Мина'),
      role: text('Illustrator', 'Иллюстратор'),
      visualSummary: text(
        'Straight black bob, navy raincoat, transparent umbrella, sketch folio and a tiny ink mark on one finger.',
        'Прямое чёрное каре, тёмно-синий плащ, прозрачный зонт, папка с эскизами и маленькое пятнышко туши на пальце.',
      ),
      palette: [0x344d71, 0xaac5d8, 0xead8e5],
    },
    dayLabel: text('One rainy noon before the festival', 'Дождливый полдень перед фестивалем'),
    chapterTitle: text('Rainy Noon', 'Дождливый полдень'),
    setting: text('Midday · rain at the windows', 'Полдень · дождь по окнам'),
    opening: text(
      'Raindrops turn the café window into frosted glass. Mina arrives carrying three versions of the same sign and trusting none of them.',
      'Капли дождя превращают окно кафе в матовое стекло. Мина приходит с тремя вариантами одной вывески и не доверяет ни одному.',
    ),
    lines: [
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          'Dunya, I drew your festival sign three times. Every version feels almost right, which is illustrator language for completely wrong.',
          'Дуня, я трижды нарисовала твою фестивальную вывеску. Каждый вариант кажется почти правильным, а на языке иллюстраторов это значит «совсем неправильным».',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'neutral',
        text: text(
          'Maybe your eyes need a different puzzle for a while. Sit down before the rain steals your last dry page.',
          'Может быть, глазам просто нужна другая задача. Садись, пока дождь не забрал последнюю сухую страницу.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'Could you make lunch into a composition? Something with a hidden balance I can study while I eat.',
          'Можешь превратить обед в композицию? Хочется чего-нибудь со скрытым равновесием, которое можно разглядывать во время еды.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'speaking',
        text: text(
          'The little sketches can slide, but their shapes never change. Once every clue agrees, the whole picture settles.',
          'Маленькие эскизы можно сдвигать, но их форма не меняется. Когда все подсказки совпадут, вся картина встанет на место.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          'A composition that explains itself… I think that is exactly what my sign is missing.',
          'Композиция, которая сама себя объясняет… Кажется, именно этого не хватает моей вывеске.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'pleased',
        text: text(
          "Then let's solve lunch first. The sign can wait somewhere warm and dry.",
          'Тогда сначала решим обед. Вывеска немного подождёт в тепле и сухости.',
        ),
      },
    ],
    completionTitle: text('A sign through the rain', 'Вывеска сквозь дождь'),
    completionBody: text(
      "Mina's final design places the Bentoku cameo inside a wreath of tiny bows. Six more orders dry safely beside it.",
      'В финальном эскизе Мина помещает камею Bentoku в венок из маленьких бантов. Рядом благополучно высыхают ещё шесть заказов.',
    ),
    completionNote: text(
      'The sign is ready. Dunya still needs the final lace details for her festival dress.',
      'Вывеска готова. Дуне всё ещё не хватает последних кружевных деталей для фестивального платья.',
    ),
  },
  {
    chapter: 4,
    firstOrderId: 'chapter-4-order-1',
    finalOrderId: 'chapter-4-order-6',
    visitor: {
      id: 'margot',
      name: text('Margot', 'Марго'),
      role: text('Costume designer', 'Художница по костюмам'),
      visualSummary: text(
        'Plum-brown curls, dark berry classic-Lolita coat, cameo earrings and a portfolio of cream lace samples.',
        'Сливово-каштановые локоны, тёмно-ягодное пальто в духе классической лолиты, серьги-камеи и папка с образцами кремового кружева.',
      ),
      palette: [0x6b3e55, 0xc4959e, 0xf4e7d3],
    },
    dayLabel: text('Festival eve', 'Канун фестиваля'),
    chapterTitle: text('Lace Rehearsal', 'Кружевная репетиция'),
    setting: text('Early evening · golden lamplight', 'Ранний вечер · золотистый свет ламп'),
    opening: text(
      "After closing time, Margot spreads lace samples across the counter. Dunya's festival apron waits on a dress form with one unfinished bow.",
      'После закрытия Марго раскладывает на стойке образцы кружева. Фестивальный фартук Дуни ждёт на манекене с одним незаконченным бантом.',
    ),
    lines: [
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          'The dress is finished. You are the one still treating it like a difficult customer.',
          'Платье готово. Это ты всё ещё обращаешься с ним как с трудным посетителем.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'speaking',
        text: text(
          "The ruffles look perfect on the stand. I'm not sure they'll look perfect while I serve a festival queue.",
          'На манекене рюши выглядят идеально. Не уверена, что так будет, когда я начну обслуживать фестивальную очередь.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'Good structure is not fragile, Dunya. Lace and logic agree on that. Each part supports another.',
          'Хорошая конструкция не бывает хрупкой, Дуня. В этом кружево и логика согласны: каждая часть поддерживает другую.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          'Make me one of your more intricate bentos. I want to see how you handle a pattern that refuses to explain itself at first glance.',
          'Собери для меня одно из своих более сложных бенто. Хочу увидеть, как ты справляешься с узором, который не раскрывается с первого взгляда.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'speaking',
        text: text(
          'One clue supports the next. I know. I suppose I should trust the dress the same way I trust the order notes.',
          'Одна подсказка поддерживает следующую. Я знаю. Наверное, платью стоит доверять так же, как запискам с заказами.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'pleased',
        text: text(
          'Precisely. Feed the designer, then we will tie the last bow together.',
          'Именно. Накорми художницу, а потом мы вместе завяжем последний бант.',
        ),
      },
    ],
    completionTitle: text('The last lace bow', 'Последний кружевной бант'),
    completionBody: text(
      "Six intricate orders later, Margot pins the final bow in place. Dunya's festival look is unmistakably her own.",
      'Шесть сложных заказов спустя Марго закрепляет последний бант. Фестивальный образ Дуни теперь невозможно спутать ни с чьим другим.',
    ),
    completionNote: text(
      'Outside, the first festival lanterns come alive. The order queue begins at dawn.',
      'Снаружи зажигаются первые фестивальные фонари. Очередь заказов начнётся на рассвете.',
    ),
  },
  {
    chapter: 5,
    firstOrderId: 'chapter-5-order-1',
    finalOrderId: 'chapter-5-order-6',
    visitor: {
      id: 'aoi',
      name: text('Aoi', 'Аой'),
      role: text('Festival organizer', 'Организатор фестиваля'),
      visualSummary: text(
        'Indigo high ponytail, berry-red tailored coat, gold festival pin and a clipboard filled with order slips.',
        'Высокий хвост цвета индиго, приталенное ягодно-красное пальто, золотой фестивальный значок и планшет с записками заказов.',
      ),
      palette: [0x33436e, 0xa33f55, 0xe4b95f],
    },
    dayLabel: text('Festival morning', 'Утро фестиваля'),
    chapterTitle: text('Festival Window', 'Фестивальная витрина'),
    setting: text('Dawn · lanterns across the square', 'Рассвет · фонари над площадью'),
    opening: text(
      'The square glows before sunrise. Aoi arrives with a clipboard, a precise schedule and six order slips clipped beneath a gold festival seal.',
      'Площадь светится ещё до восхода. Аой приходит с планшетом, точным расписанием и шестью записками под золотой фестивальной печатью.',
    ),
    lines: [
      {
        speaker: 'visitor',
        mood: 'neutral',
        text: text(
          'Good morning, Dunya. The first crew is in place, the lanterns are lit and the west gate has already lost one ribbon.',
          'Доброе утро, Дуня. Первая команда на местах, фонари зажжены, а западные ворота уже потеряли одну ленту.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'speaking',
        text: text(
          'So everything is going exactly according to a festival plan.',
          'Значит, всё идёт точно по обычному фестивальному плану.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'Exactly. I need the first bento for the setup crew. Five more slips will follow once the gates open.',
          'Именно. Первое бенто нужно монтажной команде. После открытия ворот придут ещё пять записок.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'neutral',
        text: text(
          'Six Master orders. One page at a time, one clue at a time.',
          'Шесть заказов уровня Master. По одной странице, по одной подсказке.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'speaking',
        text: text(
          'The final pickup has a strict deadline: one minute and forty-five seconds. There will be no time to reveal an answer.',
          'У последней выдачи строгий срок: одна минута сорок пять секунд. Времени открыть ответ не будет.',
        ),
      },
      {
        speaker: 'dunya',
        mood: 'pleased',
        text: text(
          'Then we make the first five with care—and the last one with care and speed. Bentoku is ready.',
          'Тогда первые пять соберём внимательно, а последнее — внимательно и быстро. Bentoku готово.',
        ),
      },
      {
        speaker: 'visitor',
        mood: 'pleased',
        text: text(
          "That's what I hoped to hear. Here is the first order.",
          'Именно это я и надеялась услышать. Вот первый заказ.',
        ),
      },
    ],
    completionTitle: text('Thirty stamps', 'Тридцать печатей'),
    completionBody: text(
      'The final bento crosses the counter as the festival clock chimes. Thirty stamps fill the old book from ribbon to ribbon.',
      'Последнее бенто пересекает стойку одновременно с боем фестивальных часов. Тридцать печатей заполняют старую книгу от банта до банта.',
    ),
    completionNote: text(
      "When the doors finally close, the new sign is glowing, Dunya's lace bow is still perfect, and Bentoku feels like her café at last.",
      'Когда двери наконец закрываются, новая вывеска сияет, кружевной бант Дуни всё ещё безупречен, а Bentoku наконец по-настоящему становится её кафе.',
    ),
  },
];

const storiesByChapter = new Map(CAMPAIGN_STORIES.map((story) => [story.chapter, story]));

export const getCampaignStory = (chapter: CampaignChapterNumber): CampaignStory =>
  storiesByChapter.get(chapter)!;

export const getCampaignStoryForOrder = (orderId: CampaignOrderId): CampaignStory | undefined =>
  CAMPAIGN_STORIES.find(
    (story) => story.firstOrderId === orderId || story.finalOrderId === orderId,
  );
