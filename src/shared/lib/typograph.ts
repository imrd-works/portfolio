/**
 * Typesetting rules for line breaks, applied to the copy once as it is loaded,
 * so every string on the page follows them wherever it is shown — text,
 * attributes, the prerendered HTML — and the locale files stay plain to edit.
 *
 * A non-breaking space keeps together what must not be split across lines:
 * - a short preposition, conjunction or particle with the word after it
 *   ("в продакшене", "и команду", "a team"), so no line ends on one;
 * - a dash with the word before it, so no line starts with a dash;
 * - "же", "ли", "бы" with the word before them;
 * - a number with the word after it ("25+ систем", "2 года").
 */

const NBSP = '\u00a0'

// Russian words short enough that they must not end a line
const RU_SHORT = [
  'а',
  'в',
  'во',
  'и',
  'к',
  'ко',
  'о',
  'об',
  'обо',
  'с',
  'со',
  'у',
  'я',
  'на',
  'по',
  'до',
  'от',
  'за',
  'из',
  'не',
  'но',
  'ни',
  'да',
  'то',
  'же',
  'для',
  'при',
  'без',
  'над',
  'под',
  'про',
  'или',
  'как',
  'что',
  'его',
  'их',
]
const EN_SHORT = [
  'a',
  'an',
  'the',
  'I',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'or',
  'and',
  'my',
  'no',
]

const LETTER = 'A-Za-zА-Яа-яЁё'

function rules(words: string[]) {
  const list = words.join('|')
  return [
    // a short word binds to the next one (after a start, a space or an opening mark)
    new RegExp(`(^|[\\s(«"„'${NBSP}])(${list}) (?=[${LETTER}0-9«"(])`, 'giu'),
  ]
}

const RU = rules(RU_SHORT)
const EN = rules(EN_SHORT)

export function typograph(text: string, locale: string): string {
  let out = text
  // twice: "и в продакшене" has two short words in a row
  for (let pass = 0; pass < 2; pass++) {
    for (const re of locale === 'ru' ? RU : EN) out = out.replace(re, `$1$2${NBSP}`)
  }
  return (
    out
      // no line starts with a dash
      .replace(/ (—|–) /g, `${NBSP}$1 `)
      // particles stay with the word before them
      .replace(/ (же|ли|бы)(?=[\s.,!?;:]|$)/giu, `${NBSP}$1`)
      // a number stays with what it counts
      .replace(/(\d[\d+%]*) (?=[A-Za-zА-Яа-яЁё])/gu, `$1${NBSP}`)
  )
}

/** Applies `typograph` to every string in a message tree, returning a copy. */
export function typographMessages<T>(messages: T, locale: string): T {
  if (typeof messages === 'string') return typograph(messages, locale) as T
  if (Array.isArray(messages)) return messages.map((m) => typographMessages(m, locale)) as T
  if (messages && typeof messages === 'object') {
    return Object.fromEntries(
      Object.entries(messages).map(([k, v]) => [k, typographMessages(v, locale)])
    ) as T
  }
  return messages
}
