import { en, ru, type TranslationKey } from './translations';
import type { Language } from '../puzzle/types';

type Variables = Readonly<Record<string, string | number>>;

const dictionaries = { en, ru } as const;

export class I18nService {
  constructor(private currentLanguage: Language = 'en') {}

  get language(): Language {
    return this.currentLanguage;
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  t(key: TranslationKey, variables: Variables = {}): string {
    const template = dictionaries[this.currentLanguage][key] ?? en[key];
    return Object.entries(variables).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }

  moves(count: number): string {
    const category = new Intl.PluralRules(this.currentLanguage).select(count);
    const key: TranslationKey = category === 'one' ? 'moves.one' : 'moves.other';
    if (this.currentLanguage === 'ru') {
      if (category === 'few') return `${count} хода`;
      if (category === 'many') return `${count} ходов`;
    }
    return this.t(key, { count });
  }

  finished(count: number): string {
    const category = new Intl.PluralRules(this.currentLanguage).select(count);
    if (this.currentLanguage === 'ru') {
      if (category === 'one') return `${count} завершена`;
      if (category === 'few') return `${count} завершены`;
      return `${count} завершено`;
    }
    return this.t(category === 'one' ? 'finished.one' : 'finished.other', { count });
  }
}
