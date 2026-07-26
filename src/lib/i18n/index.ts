import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  dictionaries,
  isLocale,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "./dictionaries";

export {
  DEFAULT_LOCALE,
  dictionaries,
  isLocale,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
};

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
