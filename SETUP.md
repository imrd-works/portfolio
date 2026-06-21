# Настройка и конфигурация

## Head / SEO (useHead, useSeoMeta)

В проекте используется **@unhead/vue** (рекомендуемая замена @vueuse/head). Подключение в `main.ts` через `createHead()`.

Импорт из общего composable:

```ts
import { useHead, useSeoMeta } from '@/composables/useSeo'

useSeoMeta({
  title: 'Заголовок страницы',
  description: 'Описание страницы',
  ogTitle: 'Заголовок для шаринга',
  ogDescription: 'Описание для шаринга',
})
```

`useHead()` — произвольные теги в `<head>`. `useSeoMeta()` — типизированные meta для SEO (title, description, og*, twitter*).

---

## npm install

Если проект разворачивается из чистой папки, сначала инициализируй git:

```bash
git init
npm install
npm run prepare
```

В корне лежит `.npmrc` с `legacy-peer-deps=true` из‑за `eslint-plugin-import` (peer только до ESLint 9, в проекте ESLint 10). Без этого `npm i` падает с ERESOLVE. Удалять не нужно.

В `package.json` заданы **overrides** для `braces`, `micromatch`, `postcss` — чтобы закрыть уязвимости в транзитивных зависимостях (vite-plugin-svg-icons). После этого `npm audit` показывает 0 уязвимостей.

---

## Переменные окружения

Скопируй `.env.example` в `.env`:

| Переменная          | Описание                                  |
| ------------------- | ----------------------------------------- |
| `VITE_API_BASE_URL` | Базовый URL API (по умолчанию: `/api`)    |
| `VITE_SITE_URL`     | URL сайта для sitemap/robots (production) |

---

## Vite

- **Алиасы:** `@/` → `src/`, `@/api`, `@/i18n`, `@/router`, `@/stores`, `@/composables`, `@/locales`, `@/shared/styles` → `src/assets/styles`
- **SCSS:** `loadPaths` включает `./src` для разрешения `@use`
- **Плагины:** vue, compression (gzip/brotli), sitemap, robots.txt

---

## ESLint

- Vue 3 recommended + strongly-recommended
- vuejs-accessibility
- TypeScript recommended
- Prettier (без конфликтов)
- **import/no-unresolved** — ошибка на любой неразрешённый импорт. Резолвер берёт алиасы из `tsconfig.app.json`, виртуальные модули (`virtual:*`) игнорируются.
- **no-cyrillic-string** — ошибка на кириллицу в строковых литералах в `.ts`/`.vue` (комментарии разрешены). Файлы в `**/locales/**` и `*.json` не проверяются. Выключить: `ESLINT_NO_CYRILLIC=0`.
- `--max-warnings 0` — сборка падает при любом предупреждении

### Accessibility

Для быстрой проверки доступности Vue-шаблонов используй:

```bash
npm run a11y
```

Проверка подсказывает типичные проблемы:

- у изображений нет `alt`
- у `input`, `textarea`, `select` нет доступного label
- у `iframe` нет `title`
- есть невалидные `aria-*` или неподходящий `role`
- кликабельный элемент не поддерживает клавиатуру
- интерактивный элемент не может получить focus
- focusable-элемент скрыт через `aria-hidden`
- положительный `tabindex`

Эта проверка входит в общий `npm run lint:check`, поэтому запускается и через `npm run verify`.

---

## Prettier, Husky и Commitlint

`npm run verify` — единый quality gate для локальной проверки, pre-commit и CI. Он запускает:

```bash
npm run format:check
npm run lint:check
npm run typecheck
npm run test:run
```

Для автоисправления используй:

```bash
npm run format
npm run lint
```

Husky-хуки:

| Хук          | Что проверяет                             |
| ------------ | ----------------------------------------- |
| `pre-commit` | `npm run verify`                          |
| `commit-msg` | формат сообщения коммита через Commitlint |

Формат коммита:

```text
type(scope): subject
```

Примеры:

```text
feat(auth): add login form
fix(router): preserve redirect query
chore(deps): update eslint
```

Разрешённые типы: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `build`, `ci`, `perf`. Scope обязателен, чтобы история git сразу показывала область изменения.

---

## CI: быстрый и полный контур

`npm run build` делает только production-сборку. Он не запускает `verify`, чтобы CI не прогонял одни и те же проверки дважды.

Для локального полного прогона перед релизом используй:

```bash
npm run build:checked
```

GitHub Actions делает быстрый PR-контур:

```bash
npm ci --prefer-offline --no-audit
npm run verify
npm run build
```

В workflow также включены:

| Настройка         | Зачем нужна                                              |
| ----------------- | -------------------------------------------------------- |
| `cache: npm`      | ускоряет повторные установки зависимостей                |
| `concurrency`     | отменяет старый CI-запуск, если в PR прилетел новый push |
| `timeout-minutes` | не даёт зависшим проверкам жечь минуты бесконечно        |
| `permissions`     | оставляет workflow только минимальный read-доступ        |

E2E-тесты (`npm run test:e2e`) не входят в pre-commit и быстрый PR-контур. Их лучше запускать отдельным job/workflow перед релизом, на `main/master` или вручную, когда появятся реальные e2e-сценарии.

---

## Тестирование

В проекте настроен Vitest для быстрых unit/component-тестов. Тесты лежат рядом с кодом и называются `*.test.ts`.

Что уже покрыто:

| Область               | Что проверяется                                          |
| --------------------- | -------------------------------------------------------- |
| `shared/stores`       | состояние пользователя, login/logout                     |
| `router/middleware`   | редиректы auth/guest/notFound                            |
| `contacts` composable | submit формы, очистка полей, сохранение ввода при ошибке |
| `shared/composables`  | debounce-поведение пользовательского ввода               |
| `layouts`             | навигация гостевого layout и logout в auth layout        |

Команды:

```bash
npm run test
npm run test:run
npm run test:e2e
```

Правило для будущих проектов: тестируй поведение, которое может сломать пользователя или бизнес-логику. Не нужно покрывать каждый статический блок разметки.

---

## GSAP и анимации

В проекте установлен `gsap` как runtime-зависимость. Это хороший выбор для сложных анимаций, где нужен точный контроль:

- timelines и последовательности
- SVG-анимации
- scroll-driven эффекты
- анимации появления/ухода сложных блоков
- синхронизация нескольких элементов

Для простых состояний оставляй CSS:

- `:hover`
- `:focus-visible`
- короткий fade/opacity
- transform на кнопках и карточках
- простые `transition`

Базовый пример:

```ts
import { gsap } from 'gsap'

gsap.from(element, {
  opacity: 0,
  y: 16,
  duration: 0.4,
  ease: 'power2.out',
})
```

В Vue-компонентах запускай GSAP после mount и чисти timeline при unmount:

```ts
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { gsap } from 'gsap'

const root = useTemplateRef<HTMLElement>('root')
let timeline: gsap.core.Timeline | null = null

onMounted(() => {
  timeline = gsap.timeline()
  timeline.from(root.value, { opacity: 0, y: 16, duration: 0.4 })
})

onUnmounted(() => {
  timeline?.kill()
})
```

---

## GitHub: запрет прямого push в main/master

GitHub не читает branch protection из файлов репозитория, поэтому это включается в настройках самого репозитория после первого push.

Открой `Settings` → `Rules` → `Rulesets` → `New ruleset` → `New branch ruleset` и настрой:

| Настройка                               | Значение                             |
| --------------------------------------- | ------------------------------------ |
| `Target branches`                       | `main` и/или `master`                |
| `Require a pull request before merging` | включено                             |
| `Required approvals`                    | минимум `1`                          |
| `Require status checks to pass`         | включено                             |
| `Required checks`                       | CI job из `.github/workflows/ci.yml` |
| `Block force pushes`                    | включено                             |
| `Restrict deletions`                    | включено                             |

После этого изменения в основную ветку должны попадать через pull request: локально работаешь в feature-ветке, пушишь её на GitHub, открываешь PR, ждёшь зелёный CI и merge.

```bash
git checkout -b feat/my-feature
git push -u origin feat/my-feature
```

---

## Подключение шрифтов

1. Добавь `@font-face` в `src/assets/styles/base/_fonts.scss`:

```scss
@font-face {
  font-family: 'CustomFont';
  src: url('@/assets/fonts/CustomFont.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}
```

2. Укажи в `src/assets/styles/tokens/fonts/_fonts.scss`:

```scss
--font-family-base: 'CustomFont', sans-serif;
```

3. Положи файлы шрифтов в `src/assets/fonts/`

---

## Токен авторизации в интерцепторе

В axios-адаптере при необходимости добавляй заголовок:

```ts
const token = useUserStore().token
if (token) config.headers.Authorization = `Bearer ${token}`
```

(В текущем коде интерцептор запроса можно расширить в `src/app/api/adapters/axiosAdapter.ts`.)

---

## Обработка 401

В axiosAdapter при ответе 401 вызывается `useUserStore().logout()`.

---

## Sitemap

В `vite.config.ts` — массив `dynamicRoutes`. Добавляй новые маршруты для генерации sitemap.

---

## OpenAPI / Swagger → TypeScript-контракты

Типы генерируются из спецификации OpenAPI 3 (Swagger) с помощью **openapi-typescript**. Результат: `src/app/api/contracts.d.ts`.

**Генерация из локального файла (по умолчанию `openapi.json`):**

```bash
npm run generate:api
```

**Генерация по URL бэкенда:**

```bash
OPENAPI_SPEC_URL=https://api.example.com/openapi.json npm run generate:api
```

**Использование в коде:**

```ts
import type { paths, components } from '@/api/contracts'

type User = components['schemas']['User']

const { data } =
  await api.get<paths['/user/{id}']['get']['responses'][200]['content']['application/json']>(
    '/user/1'
  )
```

Замени или дополни корневой `openapi.json` своей спецификацией; после изменений схемы запускай `npm run generate:api`.

---

## SVG Sprite (иконки)

Иконки кладутся в **`src/assets/icons/`** (один файл = одна иконка, имя файла без `.svg` = `name`). Плагин собирает их в спрайт, в приложении используется компонент **`<Icon>`**.

**Использование:**

```vue
<Icon name="sample" />
<Icon name="arrow" :size="32" />
<Icon name="close" width="20" height="20" class="text-primary" />
```

**Размер:** через `size` (одинаковые width/height) или через `width` и `height`.

**Цвет:** у компонента в CSS стоит `fill: currentColor`, цвет наследуется от родителя. Чтобы иконка меняла цвет от `color`, в SVG должны быть `fill="currentColor"` или `stroke="currentColor"` (не жёсткий `#000`). Рекомендуется класть в папку уже подготовленные SVG с currentColor.

---

## Fluid / clamp (миксины)

Файл: `src/assets/styles/mixins/_fluid.mixins.scss`. В коде импорт через алиас: `@/shared/styles/...` (указывает на `src/assets/styles`).

**Карта брейкпоинтов** `$fluid-breakpoints` — по умолчанию: `mobile` 320px, `mobile-lg` 480px, `tablet` 768px, `laptop` 900px, `desktop` 1024px, `desktop-wide` 1400px, `wide` 1920px. Свои значения можно добавить в карту перед первым `@use` миксинов:

```scss
@use 'assets/styles/mixins' as * with (
  $fluid-breakpoints: (
    'mobile': 320px,
    'mobile-lg': 480px,
    'tablet': 768px,
    'laptop': 900px,
    'desktop': 1024px,
    'desktop-wide': 1400px,
    'wide': 1920px,
    'ultrawide': 2560px,
  )
);
```

**Именованные диапазоны** — `$min-val` на брейкпоинте `$from` и `$max-val` на `$to`:

```scss
@include fluid-between(padding-inline, 0.5rem, 2rem, 'tablet', 'desktop');
@include fluid-between(font-size, 0.875rem, 1.25rem, 'mobile-lg', 'laptop');
```

**Произвольные ширины в px** (без карты):

```scss
@include fluid(padding-inline, 0.5rem, 2rem, 768px, 1024px);
@include fluid(margin-block, 1rem, 3rem, 480px, 1200px);
```

**Короткие пресеты:** `fluid-tablet-to-desktop`, `fluid-tablet-to-wide`, `fluid-desktop-to-wide` — те же имена из карты.

**Простой clamp** (без привязки к ширине):

```scss
@include clamp(font-size, 0.875rem, 1.25rem);
@include clamp(padding, 0.5rem, 2rem, 4vw + 0.5rem);
```

---

## Отключение опциональных возможностей

| Возможность                                      | Как отключить                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Husky** (`pre-commit` и `commit-msg`)          | `HUSKY=0` в окружении или перед командой: `HUSKY=0 git commit`. Либо удалить скрипт `prepare` из `package.json` и папку `.husky`. |
| **Правило «нет кириллицы»** (ESLint)             | Запуск линта с `ESLINT_NO_CYRILLIC=0` или в `.env`: `ESLINT_NO_CYRILLIC=0`.                                                       |
| **Скрипты версии** (`patch` / `minor` / `major`) | Просто не вызывать эти скрипты; при необходимости удалить их из `package.json`.                                                   |

**Версия проекта:** для смены версии используй `npm run patch`, `npm run minor`, `npm run major` — обновится `version` в `package.json` и создастся git-тег (если репозиторий git).

---

## Ленивая подгрузка тостов (vue-sonner)

Библиотека тостов и компонент `<Toaster />` подгружаются только при первом вызове `useToast()` (например из интерцептора API). До этого в начальный бандл они не попадают. Реализация: `@/composables/useToast.ts` и `@/components/ToasterLazy.vue`.

---

## Ленивые локали i18n

Локаль `en` загружается при старте. Остальные языки — по требованию через `loadLocaleAsync(locale)` из `@/i18n`. Структура как у `en`: общий файл `shared/locales/{locale}.json` и в каждой странице `pages/{page}/locales/{locale}.json`. Добавляешь, например, `shared/locales/ru.json` и `pages/about/locales/ru.json` и т.д. Пример переключения:

```ts
import { i18n, loadLocaleAsync } from '@/i18n'

async function setLocale(locale: string) {
  await loadLocaleAsync(locale)
  i18n.global.locale = locale
}
```

Подробнее в `src/app/i18n/locales/README.md`.

---

## Анализ бандла

Чтобы построить отчёт по размеру чанков и открыть интерактивную карту модулей:

```bash
npm run build:analyze
```

Сборка идёт в режиме `analyze` (читается `.env.analyze`), в конце создаётся `dist/stats.html` и открывается в браузере. Используй для поиска тяжёлых зависимостей и решения, что вынести в отдельный чанк или загружать лениво.
