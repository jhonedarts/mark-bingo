import en from './en.json';
import es from './es.json';
import ptBR from './pt-br.json';
import type { Locale } from '../types';

export type Translation = typeof ptBR;

export const localeOrder: Locale[] = ['pt-BR', 'es', 'en'];

export const translations: Record<Locale, Translation> = {
  'pt-BR': ptBR,
  es,
  en,
};

export const localeNames: Record<Locale, string> = {
  'pt-BR': ptBR.LANGUAGE_NAME,
  es: es.LANGUAGE_NAME,
  en: en.LANGUAGE_NAME,
};

export const localeShortNames: Record<Locale, string> = {
  'pt-BR': ptBR.LANGUAGE_SHORT_NAME,
  es: es.LANGUAGE_SHORT_NAME,
  en: en.LANGUAGE_SHORT_NAME,
};

type MessageParameters = Record<string, string | number>;

export function formatMessage(message: string, parameters: MessageParameters = {}) {
  return message.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => {
    const value = parameters[key];
    return value === undefined ? placeholder : String(value);
  });
}
