# Bentoku — бриф и промпты для звука

Актуальность внешних сервисов проверена 14 августа 2026 года.

## 1. Звуковой образ игры

Bentoku — спокойная браузерная логическая головоломка про девять маленьких друзей-угощений в коробке бенто. Её мир собран из тёплого клёна, мягкой ткани, волокнистой бумаги, приглушённых пастельных цветов и рукотворных игрушечных форм. Звук должен продолжать именно эту материальность:

- близкий, сухой и камерный, словно всё происходит на небольшом столе;
- мягкий и округлый, без резких атак и «глянцевого» mobile-game блеска;
- тихо-позитивный, но не инфантильный и не анимешный;
- короткий: действие должно ощущаться сразу, а не оставлять длинный хвост;
- единый по палитре: мягкий клён/бамбук, фетр, лён, бумага, приглушённая калимба;
- без голоса, вокальных возгласов, буквальных звуков животных и еды.

Главный принцип: звук подтверждает осмысленное действие игрока, но не озвучивает каждое движение курсора. Поэтому не нужны звуки hover, непрерывный звук перетаскивания, звук каждой искры в победной анимации или постоянный шум кафе.

## 2. Как генерировать эффекты в SONILO

Для каждого эффекта использовать **Text to Sound Effect**, а не Video to SFX. Промпты ниже намеренно написаны по-английски и описывают слышимый результат через источник, действие, акустическое пространство и фактуру.

Практический режим работы:

1. Передать английский промпт без дополнительных художественных пояснений.
2. Указать целое значение `duration` из таблицы. SONILO принимает для `text-to-sfx` целые секунды, обычно от 1 до 180; генерации короче трёх секунд всё равно имеют трёхсекундный минимум тарификации.
3. Сделать 3–4 генерации каждого ключевого эффекта и выбрать не самый эффектный, а самый тихий и разборчивый вариант.
4. Обрезать результат до целевой монтажной длины, убрать ведущую тишину и слишком длинный хвост.
5. Сохранить мастер в WAV 48 kHz; уже после монтажа сделать игровой сжатый файл.

Все эффекты должны хорошо складываться в mono и не зависеть от широкого стерео. Пространственное положение фигур лучше задавать панорамированием в игре, а не запекать в файл.

## 3. Обязательный набор эффектов

### `piece_pick` — выбор или подъём фигурки

Событие: клик по фигурке или начало drag. Это самый частый звук, поэтому он должен быть почти невесомым.

- SONILO duration: `1`
- целевая длина после обрезки: 0.18–0.30 с
- приоритет: высокий

```text
Single isolated game UI one-shot: one tiny handmade mochi-like food toy gently lifted from a padded linen tray, a very soft tack release and faint felt touch ending with one quiet high bamboo tick. Close-miked, dry, warm, delicate, immediate start, about 0.25 seconds of audible sound followed by clean silence. No wet squish, no sticky slime, no voice, no melody, no reverb, no background ambience, no harsh click.
```

Критерий выбора: слышится лёгкий «подхват», а не кнопка мыши, писк или мокрая еда.

### `piece_drop` — укладка в пустую ячейку

Событие: фигурка мягко устраивается в деревянном бенто.

- SONILO duration: `1`
- целевая длина: 0.28–0.45 с
- приоритет: высокий

```text
Single isolated game interaction one-shot: a tiny soft handmade food toy placed gently into a shallow maple-wood bento compartment, one rounded pillowy plop with a subdued warm wooden contact underneath. Close-miked, dry, soft and satisfying, immediate start, about 0.35 seconds then clean silence. No bounce sequence, no wet food sound, no ceramic clank, no voice, no music, no echo, no heavy impact.
```

Критерий выбора: один округлый контакт; дерево присутствует, но не звучит как тяжёлая коробка.

### `piece_swap` — обмен двух уже размещённых фигурок

Событие: одна фигурка меняется местом с другой. Ритм должен отличаться от обычного drop.

- SONILO duration: `1`
- целевая длина: 0.45–0.70 с
- приоритет: высокий

```text
Single isolated game interaction one-shot: two tiny padded food toys quickly exchange places inside a small maple bento box, two gentle alternating pillowy taps with one muted bamboo tick between them, a clear soft double-event, playful and restrained. Close-miked, dry, centered, about 0.55 seconds then clean silence. No hard knocks, no wet squish, no whoosh, no voice, no musical phrase, no reverb, no background sound.
```

Критерий выбора: отчётливо слышны два мягких события, но общий звук не вдвое громче `piece_drop`.

### `piece_return` — возврат на поднос и undo

Событие: фигурка возвращается из бенто на тканевый поднос; этот же звук подходит для отмены хода. В текущем прототипе здесь используется общий `paper`, но материал действия — ткань, а не бумага, поэтому эффект стоит отделить.

- SONILO duration: `1`
- целевая длина: 0.35–0.60 с
- приоритет: высокий

```text
Single isolated game interaction one-shot: one tiny soft food toy makes a very short slide across a padded peach linen tray and settles with a muted cushioned tap, gentle fabric brush followed by one soft stop. Close-miked, dry, warm, calm, about 0.5 seconds then clean silence. No paper page turn, no long scrape, no wet sound, no voice, no music, no echo.
```

Критерий выбора: движение назад читается, но нет ощущения ошибки или наказания.

### `note_open` — открытие записки, помощи, выбора сложности или настроек

Событие: появляется карточка с пояснением или меню. Этот звук заменяет «бумажную» часть нынешнего `paper`.

- SONILO duration: `1`
- целевая длина: 0.40–0.75 с
- приоритет: высокий

```text
Single isolated stationery one-shot: a small thick fibrous café order note is gently lifted and opened by hand, one short clean paper flick, a soft page rustle, and a quiet fingertip stop. Close-miked, dry, warm paper texture, restrained, about 0.6 seconds then clean silence. No page sequence, no tearing, no crumpling, no pencil writing, no voice, no music, no room ambience.
```

Критерий выбора: одна небольшая карточка, не книга и не длинное перелистывание.

### `board_incorrect` — заполнено, но решение пока неверно

Событие: все девять мест заняты, однако условия не выполнены. Звук должен мягко сообщать «попробуй ещё», а не ругать.

- SONILO duration: `1`
- целевая длина: 0.55–0.90 с
- приоритет: высокий

```text
Single isolated gentle game feedback one-shot: two soft hollow bamboo taps, the second slightly lower than the first, both quickly damped, ending with a faint felt thud. Close-miked, dry, warm, quiet, unmistakably a mild try-again cue, about 0.75 seconds then clean silence. No buzzer, no alarm, no dissonant sting, no harsh transient, no voice, no sad trombone, no reverb, no background music.
```

Критерий выбора: сигнал различим даже на тихой громкости, но не тревожит и не звучит комично.

### `hint_reveal` — подсветка клетки после Reveal one

Событие: одна ячейка мягко подсвечивается на 2,8 секунды. Для Explain и Nudge достаточно `note_open`; отдельный сигнал нужен именно для появления полезного свечения.

- SONILO duration: `1`
- целевая длина: 0.55–0.90 с
- приоритет: средний

```text
Single isolated gentle hint one-shot: one tiny warm kalimba pluck followed by two extremely light muted sparkle tones, softly resolving, like a small golden glint above paper. Clean immediate attack, short damped tail, intimate and quiet, about 0.75 seconds then silence. No bright glass ping, no magic whoosh, no choir, no voice, no full melody, no long reverb, no background ambience.
```

Критерий выбора: эффект светлый, но заметно скромнее победного сигнала.

### `success` — полностью решённый бенто

Событие: последовательные подпрыгивания фигурок, искры и затем карточка `Bento complete!`. Это единственный эффект, которому позволено быть маленькой музыкальной фразой.

- SONILO duration: `2`
- целевая длина: 1.35–1.90 с
- приоритет: высокий

```text
Single isolated handcrafted puzzle-completion flourish: three warm ascending kalimba notes with very soft bamboo resonance, followed by one small padded paper stamp landing on a wooden café counter. Cheerful, intimate, tidy and gently conclusive, close-miked with a short natural tail, about 1.7 seconds total. No vocals, no crowd, no applause, no coin sound, no arcade jingle, no orchestral swell, no cymbal, no glitter explosion, no long reverb, no background music.
```

Критерий выбора: маленькое завершение ручной работы, а не награда из free-to-play игры. Бумажный штамп должен совпасть с появлением визуальной печати.

### `ui_tap` — подтверждённое нажатие кнопки

Событие: Daily, выбор сложности, кнопки модальных окон, закрытие, настройки, Copy seed. Не проигрывать на hover и не дублировать поверх более смыслового `note_open` или `success`.

- SONILO duration: `1`
- целевая длина: 0.10–0.20 с
- приоритет: средний

```text
Single isolated minimal game UI one-shot: one tiny rounded maple button pressed against a thin felt cushion, a soft dry bamboo tick with almost no tail. Close-miked, warm, very quiet, immediate, about 0.15 seconds followed by clean silence. No plastic click, no keyboard sound, no beep, no voice, no melody, no reverb, no ambience.
```

Критерий выбора: на обычной громкости он скорее ощущается, чем привлекает внимание.

## 4. Опциональный переход

### `new_bento` — новая случайная или ежедневная задача

Этот звук полезен, если при смене задачи появится хотя бы короткая визуальная пауза или анимация. При мгновенной перерисовке его можно не добавлять.

- SONILO duration: `1`
- целевая длина: 0.60–0.95 с

```text
Single isolated cozy transition one-shot: a small café order card slides a short distance onto a maple counter, followed by a light wooden bento tray settling into place. Soft paper swish and one warm restrained wood tap, close-miked, dry, tidy, about 0.85 seconds then clean silence. No long scrape, no lid slam, no dishes, no kitchen ambience, no voice, no music, no reverb.
```

## 5. Покрытие игровых событий

| Игровое событие | Звук |
| --- | --- |
| Выбор фигурки / начало drag | `piece_pick` |
| Укладка в свободную клетку | `piece_drop` |
| Обмен двух фигурок | `piece_swap` |
| Возврат на поднос / Undo | `piece_return` |
| Help / Difficulty / Settings / поясняющая карточка | `note_open` |
| Reveal one | `note_open`, затем `hint_reveal` |
| Полный, но неверный бенто | `board_incorrect` |
| Правильное решение | `success` |
| Обычное подтверждённое нажатие | `ui_tap`, если не звучит более специфичный эффект |
| Daily / New random | `new_bento` только при наличии перехода, иначе `ui_tap` |
| Hover, движение drag, idle-покачивание, каждая искра | тишина |

Минимальный набор для первой замены нынешнего процедурного аудио: `piece_pick`, `piece_drop`, `piece_swap`, `piece_return`, `note_open`, `board_incorrect`, `success`. `hint_reveal` и `ui_tap` добавляют ясность интерфейсу, но их можно подключить вторым проходом.

## 6. Общая обработка эффектов

- Удалить ведущую тишину: реакция интерфейса должна начинаться практически сразу.
- Оставить 10–30 мс безопасного fade-in и короткий fade-out, чтобы не было цифровых щелчков.
- Не нормализовать каждый эффект до одинакового пика вслепую. `piece_pick` и `ui_tap` должны быть тише `board_incorrect`, а `success` — самым заметным.
- Ориентир по пикам после монтажа: частые действия примерно −14…−11 dBFS, неверное решение около −10 dBFS, победа около −8 dBFS. Финальный баланс обязательно проверить внутри игры под музыкой.
- Низ ниже примерно 90 Hz для UI-эффектов можно аккуратно срезать: маленький браузерный пазл не нуждается в саб-басе.
- Не запекать длинный реверберационный хвост. Он быстро накапливается при серии кликов.

## 7. Фоновая музыка в SUNO

### Рекомендуемые настройки

- Режим: **Custom**.
- Переключатель: **Instrumental**.
- Модель: актуальная V5; если конкретная генерация в V4.5 звучит мягче, версия модели не важнее результата.
- Weirdness: примерно 20–30% — достаточно живости без случайных смен жанра.
- Style Influence: примерно 75–85%.
- Поле Lyrics: пустое.
- Сначала сгенерировать несколько полноразмерных вариантов. Для игрового цикла выбрать самый стабильный средний фрагмент, обрезать его по такту и сделать равномощный crossfade 1,5–3 секунды. Просьба о loop-friendly структуре помогает композиции, но не гарантирует бесшовный файл.

В Exclude лучше выносить нежелательные элементы отдельно, а не перегружать ими основной Style prompt.

### Вариант A — Warm Bento Counter (основной, рекомендуемый)

Замысел: тёплая миниатюрная камерная музыка с лёгким пульсом. Она поддерживает уют и собранность, но не пытается буквально «изображать Японию».

**Style:**

```text
Instrumental background music for a cozy tabletop logic puzzle, 78 BPM, relaxed 4/4. Warm felt piano plays a tiny four-note motif with generous pauses; muted marimba and soft nylon-string guitar answer sparingly; upright bass provides a simple light pulse; brushed shaker and fingertip percussion remain very quiet. Intimate sunlit café atmosphere, handmade miniature texture, warm acoustic mix, low melodic density, narrow dynamic range and no dramatic transitions. A stable circular eight-bar form with subtle variation, no featured solo, designed to sit behind concentration for many minutes and provide a clean loopable middle section.
```

**Exclude:**

```text
vocals, singing, spoken word, choir, whistling, vocal chops, trap drums, boom bap beat, strong kick, handclaps, cymbal crashes, bright bells, aggressive bass, dramatic build, drop, key change, cinematic swell, virtuoso solo, catchy pop chorus, abrupt ending, vinyl crackle, café chatter, kitchen sounds
```

Что искать в результате: мотив запоминается как часть комнаты, но игрок не начинает ждать его очередного возвращения.

### Вариант B — Paper Lantern Logic (чуть более японский)

Замысел: осторожный японский оттенок через фактуру инструментов, без театральной экзотики и аниме-интонации.

**Style:**

```text
Minimal Japanese-inspired acoustic instrumental for a calm logic puzzle, 72 BPM, gentle 6/8. Sparse softly damped koto plucks used only as punctuation, warm felt-piano chords, muted wooden marimba, quiet upright bass and feather-light brushed percussion. A small simple pentatonic motif with long breaths between phrases, intimate close room sound, soft daylight warmth, low energy and restrained dynamics. Circular twelve-bar arrangement with tiny textural changes, steady from beginning to end, suitable for long focused play and for extracting a seamless loopable middle passage.
```

**Exclude:**

```text
vocals, chanting, spoken word, anime soundtrack, epic traditional ensemble, taiko drums, shamisen solo, fast koto runs, shakuhachi lead, festival music, bright chimes, heavy percussion, cinematic build, emotional climax, key change, dramatic stop, pop chorus, vinyl noise, environmental ambience
```

Что искать: кото — редкая краска, не солирующий инструмент; музыка не должна превращаться в стилизацию исторического фильма.

### Вариант C — Tiny Curious Friends (чуть игривее)

Замысел: нейтральная камерная музыка для puzzle/cozy-жанра, которая подчёркивает любопытство маленьких персонажей.

**Style:**

```text
Light miniature chamber instrumental for a friendly deduction puzzle, 82 BPM, easy 4/4. Quiet pizzicato strings, mellow clarinet in its low register, warm felt piano, muted woodblocks and a soft upright bass. Curious but unhurried, with short question-and-answer phrases separated by silence, gentle consonant harmony, low melodic density and a restrained close-miked mix. Stable repeating eight-bar form, subtle variations only, no soloist and no large dynamic arc, comfortable as continuous background music during focused play.
```

**Exclude:**

```text
vocals, choir, whistling, comedy music, cartoon chase, busy staccato strings, high clarinet, brass, drum kit, cymbal, handclaps, dramatic crescendo, suspense, mystery sting, key change, virtuosic solo, catchy chorus, abrupt ending, room noise
```

Что искать: лёгкое любопытство без «мультяшной суеты» и без навязчивого остинато.

### Вариант D — Quiet Afternoon Notes (самый ненавязчивый)

Замысел: если A всё ещё отвлекает, это почти ambient, но с живой акустической основой. Лучший кандидат для долгих партий на Clever/Tricky.

**Style:**

```text
Very sparse warm acoustic-ambient instrumental for a contemplative logic game, 68 BPM, slow 4/4. Soft felt piano chords with long decay, occasional muted wooden plucks, a barely moving upright-bass pedal tone and a thin warm harmonium pad. No lead instrument; melody appears only as a quiet three-note fragment every few bars. Intimate dry room, gentle daylight, low volume impression, extremely even dynamics, abundant silence and a slow circular form intended for uninterrupted concentration and a loopable middle section.
```

**Exclude:**

```text
vocals, choir, humming, spoken word, drums, beat, arpeggiator, bright bell, high strings, deep sub bass, cinematic ambient, tension, dark drone, dramatic swell, emotional climax, key change, solo, hook, vinyl crackle, rain, birds, café ambience
```

Что искать: отсутствие ощущения «песни на переднем плане», но сохранение тепла и лёгкого движения.

### Короткий loop через Suno Sounds

Если важнее получить изначально циклический материал, чем полноценную композицию, можно открыть **Create → Custom → Sounds**, выбрать **Loop**, поставить 78 BPM и C major, затем использовать:

```text
Seamless cozy puzzle-game background loop: soft felt-piano four-note motif, muted marimba, very quiet upright bass and brushed shaker, warm intimate acoustic café texture, sparse and steady, low melodic density, restrained dynamics, no vocals and no dramatic changes.
```

Даже такой результат нужно проверить на стыке; режим Loop повышает шанс удачного цикла, но финальный монтаж всё равно остаётся частью производства.

## 8. Как выбрать финальную музыку

Проверять не только первые 30 секунд. Каждый кандидат стоит проиграть в цикле минимум 15–20 минут во время реального решения пазла.

Хороший трек:

- не заставляет ждать припев, дроп или кульминацию;
- не содержит частого высокого звона, хлопков и навязчивого соло;
- оставляет место коротким UI-эффектам;
- не становится грустным, тревожным или сонным после нескольких повторов;
- сохраняет примерно одну плотность и громкость по всей выбранной петле;
- после выключения ощущается как исчезнувшая атмосфера, а не как оборвавшаяся песня.

Начать лучше с варианта A. Если он кажется слишком «музыкальным», перейти к D; если игре не хватает характера — сравнить A и C; вариант B использовать только если его японский оттенок остаётся очень сдержанным.

## 9. Замечания для подключения в текущий проект

- В `AudioService` сейчас есть шесть процедурных имён: `pick`, `drop`, `swap`, `wrong`, `success`, `paper`. Первые пять напрямую заменяются файлами; `paper` нужно разделить на `piece_return` и `note_open`.
- При drag нынешний код фактически может вызвать `pick` трижды: через `selectPiece` на `pointerdown`, ещё один `selectPiece` на `dragstart` и прямой `audio.play('pick')` там же. Для финального ассета нужен только один запуск на одно поднятие, иначе мягкая атака превратится в тройной щелчок.
- На последнем правильном ходе `piece_drop` и `success` вызываются почти одновременно. Начало `success` лучше сдвинуть примерно на 80–120 мс, чтобы сначала читалась укладка последней фигурки, затем завершение.
- Для музыки нужен отдельный переключатель или уровень громкости. Нынешний общий `Sound on/off` технически может управлять всем аудио, но постоянная музыка и короткие подтверждения — разные пользовательские предпочтения.
- Фоновую музыку в браузере запускать только после первого пользовательского взаимодействия, затем плавно вводить за 0,8–1,5 секунды. При потере фокуса вкладки — приглушать или ставить на паузу.
- В итоговом миксе музыка должна оставаться значительно ниже эффектов. Удобная стартовая точка — около −23 LUFS integrated для музыкального файла с дополнительным игровым gain, затем проверка на ноутбучных динамиках и телефоне.

## 10. Источники и проверенные ограничения

- [SONILO: руководство по text-to-SFX и структуре промпта](https://sonilo.com/blog/guides/generate-ai-sound-effects-from-text)
- [SONILO: официальный Text to Sound Effect API](https://platform.sonilo.com/docs/api/text-to-sfx)
- [SONILO: официальный LLM-readable API reference](https://platform.sonilo.com/llms-full.txt)
- [SUNO: подробные Style instructions](https://help.suno.com/en/articles/5782849)
- [SUNO: Custom Mode и Instrumental](https://help.suno.com/en/articles/3726721)
- [SUNO: Exclude](https://help.suno.com/en/articles/3161921)
- [SUNO: Creative Sliders](https://help.suno.com/en/articles/6141377)
- [SUNO: музыкальный словарь для промптов](https://help.suno.com/en/articles/9010177)
- [SUNO: Sounds, One Shot и Loop](https://help.suno.com/en/articles/10625537)
- [SUNO: Song Editor, Crop и Fade](https://help.suno.com/en/articles/6141505)
