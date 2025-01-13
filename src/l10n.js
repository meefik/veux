import { isArray, isNumber, isObject, isString, isDate } from './utils';

/**
 * Create a localization.
 *
 * @param {object} locales
 * @param {object} [options]
 * @param {string} [options.lang=navigator.language]
 * @param {string} [options.fallback="en"]
 * @returns {object}
 */
export function createL10n(locales, options) {
  const {
    lang = navigator.language,
    fallback = 'en',
  } = options || {};

  const translate = (path, data, lang) => {
    if (isString(data)) {
      lang = data;
      data = null;
    }
    if (!lang) {
      lang = l10n.lang;
    }
    if (!lang || !locales[lang]) {
      lang = fallback;
    }
    const arr = `${path}`.split('.');
    let text = arr.reduce((o, k) => (isObject(o) ? o[k] : ''), locales[lang]);
    for (const k in data) {
      const re = new RegExp(`%\\{${k}\\}`, 'gu');
      let replaceValue = data[k];
      if (isArray(replaceValue)) {
        const [value, format] = replaceValue;
        if (isObject(format)) {
          if (isNumber(value)) {
            replaceValue = value.toLocaleString(lang, format);
          }
          else if (isDate(value)) {
            replaceValue = value.toLocaleString(lang, format);
          }
        }
      }
      text = text.replace(re, replaceValue);
    }
    return text;
  };

  const l10n = {
    lang: locales[lang] ? lang : fallback,
    locales: Object.keys(locales),
    translate,
  };
  Object.seal(l10n);

  return l10n;
}
