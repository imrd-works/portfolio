# Daniel Rassomakhin — Portfolio

Личный сайт-портфолио frontend-разработчика и Team Lead. Vue 3 + Vite + TypeScript, анимации на GSAP, дизайн-токены, две локали и **пререндер в статику**: каждый маршрут собирается в готовый HTML, браузер потом гидрирует ту же разметку.

```bash
npm install && npm run dev
```

Прод-сборка: `npm run build` (клиентский бандл → SSR-бандл → пререндер маршрутов → проверка выходного HTML). Полный прогон проверок перед сборкой: `npm run build:checked`.

> Сайт вырос из собственного Vue-стартера, поэтому в проекте остаётся «боевой» каркас (API-клиент с тостами, роутер с middleware, husky/commitlint, BEM-stylelint). Сейчас он используется как одностраничное портфолио, но инфраструктура готова к расширению.

---

## Что на сайте

Главная (`src/pages/home`) собрана из секций:

- **Hero** — имя, статус, кнопки (Telegram, e-mail, резюме).
- **About** — о себе + счётчики (систем в продакшене, продуктов с нуля, лет в роли Team Lead).
- **Skills** — стек: Core / Frontend / Data, DX & DevOps.
- **Work** — избранные проекты (energy trading, education platform, Bitcoin-лендинг, financial monitoring и др.).
- **Experience** — таймлайн ролей.
- **Contact** — форма заявки + ссылки.

Плюс страница **404** (`src/pages/not-found`). Контент вынесен в локали (`locales/ru.json`, `locales/en.json`) и подключается через `vue-i18n`.

Язык живёт в URL: `/` — русская версия, `/en/` — английская. Переключатель в шапке — обычная ссылка, а не скрытое состояние, поэтому каждая версия индексируется, шарится и открывается на том языке, на котором её отправили.

---

## Пререндер и SEO

`npm run build` не отдаёт пустой `<div id="app">`:

1. `vite build` — клиентский бандл.
2. `vite build --ssr src/entry-server.ts` — тот же граф приложения, собранный под Node.
3. `scripts/prerender.mjs` — рендерит `/`, `/en/` и `/404` в готовые документы, подставляет их в `index.html` вместе с тегами `<head>` от unhead и генерирует `robots.txt` и `sitemap.xml` с `hreflang`.
4. `scripts/verify-build.mjs` — падает, если в HTML не оказалось контента, canonical, hreflang, Open Graph или JSON-LD.

Что попадает в исходник страницы без выполнения JS: весь текст и заголовки, `title` и `description`, `canonical`, `hreflang` (`ru` / `en` / `x-default`), Open Graph и Twitter-карточка с картинкой 1200×630, JSON-LD (`Person`, `WebSite`, `ProfilePage`, `ItemList` проектов). Ссылку можно кинуть в Telegram, LinkedIn или в резюме — превью развернётся, парсер вакансий прочитает текст.

Дополнительно:

- **Гидратация вместо перерисовки.** Точка входа сверяет отметку `data-prerendered` с текущим путём и гидрирует разметку только если они совпали.
- **Анимации не мигают.** `Motion` и `CountUp` не переигрывают появление для блоков, которые уже видны на экране при первой гидратации (`src/shared/lib/hydration.ts`).
- **Шрифты self-hosted.** `public/fonts` вместо запроса к Google Fonts: минус блокирующий CSS и два внешних origin, плюс `preload` ровно тех сабсетов, которые нужны локали. Обновляются через `npm run fonts:sync`.
- **OG-картинки и иконки** генерируются из тех же токенов — `npm run og:generate` (headless Chromium).

---

## Технологии

| Слой          | Инструменты                                            |
| ------------- | ------------------------------------------------------ |
| Ядро          | Vue 3, Vite, TypeScript                                |
| Маршрутизация | Vue Router (+ middleware)                              |
| Состояние     | Pinia                                                  |
| Анимации      | GSAP, кастомные компоненты Motion / CountUp / Ticker   |
| Стили         | SCSS, дизайн-токены, BEM (stylelint)                   |
| SSG           | vue/server-renderer + собственный prerender-скрипт     |
| i18n / SEO    | vue-i18n, @unhead/vue, JSON-LD, hreflang               |
| UX            | vue-sonner (тосты), @vueuse/core                       |
| Качество      | ESLint, Stylelint, Prettier, Vitest, Playwright, Husky |

---

## Структура проекта

```
src/
├── app/
│   ├── api/           # API-клиент, адаптеры (axios)
│   ├── config/        # site.ts — домен, локали, канонические пути
│   ├── i18n/          # настройка vue-i18n
│   ├── router/        # Vue Router, middleware
│   ├── seo/           # useSiteSeo — head, OG, hreflang, JSON-LD
│   └── create.ts      # общая сборка приложения для браузера и пререндера
├── layouts/           # layout-обёртки
├── pages/             # модули страниц
│   ├── home/          # главная: views/sections, model, seo, locales
│   └── not-found/     # 404
├── shared/
│   ├── ui/            # Button, Icon, Text, Motion, CountUp,
│   │                  #   Ticker, CustomCursor, AuroraBackdrop, ScrollProgress
│   ├── layout/        # Container, Grid, Section, PageSection
│   ├── composables/   # useToast, useLocale, useInView
│   ├── config/        # контакты и идентичность (их читает и SEO-слой)
│   ├── lib/           # hydration — правила анимаций после пререндера
│   ├── directives/    # пользовательские директивы
│   ├── stores/        # Pinia-сторы
│   └── locales/       # общие переводы
└── assets/
    ├── styles/        # tokens, mixins, base
    └── icons/         # SVG-спрайт
```

Каждая страница — самодостаточный модуль: `views/`, `locales/en.json`, `route.ts`, при необходимости `api/`, `model/`, `seo/`, `composables/`. Ключи переводов объединяются по имени страницы: `t('home.hero.firstName')`.

---

## Анимации и UI-компоненты

В `src/shared/ui/` лежат самописные компоненты, на которых держится «живость» сайта:

- **Motion** — enter/scroll-анимации секций.
- **CountUp** — анимированные счётчики в About.
- **Ticker** — бегущая строка.
- **ScrollProgress** — индикатор прокрутки.
- **CustomCursor** — кастомный курсор.
- **AuroraBackdrop** — анимированный фон.

GSAP подключён для таймлайнов, scroll-driven эффектов и точного контроля easing.

---

## Стили: токены и миксины

`src/assets/styles/tokens/` — единый источник переменных: `colors/`, `radius/`, `spacing/`, `shadow/`, `gradient/`, `layout/`, `typography/`.

Подключение миксинов: `@use 'assets/styles/mixins' as *` (путь от `src/`, алиасы Vite в SCSS не работают).

### Основные миксины

| Миксин                                               | Назначение              |
| ---------------------------------------------------- | ----------------------- |
| `@include respond-to('mobile'\|'tablet'\|'desktop')` | Медиа-запрос            |
| `@include respond-below('tablet')`                   | max-width               |
| `@include flex-center` / `flex-between`              | Flex-раскладка          |
| `@include truncate` / `line-clamp(3)`                | Обрезка текста          |
| `@include visually-hidden`                           | Только для скринридеров |
| `@include absolute-fill`                             | inset: 0                |
| `@include aspect-ratio(16, 9)`                       | Соотношение сторон      |
| `@include text-style('type-headline-h1')`            | Токен типографики       |

### Функции и утилиты

`rem(16)`, `strip-unit()`, `contrast-color()`, `shade($color, 10)`. Глобальные классы раскладки в `base/_utils.scss`: `.flex`, `.flex-center`, `.flex-between`, `.gap-{xs..xl}`, `.items-*`, `.justify-*`.

---

## Скрипты

| Команда                 | Описание                                                |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Dev-сервер                                              |
| `npm run build`         | Полная прод-сборка: бандлы → пререндер → проверка       |
| `npm run prerender`     | Только пререндер (после `build:client` + `build:ssr`)   |
| `npm run verify:build`  | Проверка готового `dist/` на контент, SEO-теги, JSON-LD |
| `npm run fonts:sync`    | Обновить self-hosted шрифты из @fontsource              |
| `npm run og:generate`   | Перерисовать OG-картинки и PNG-иконки                   |
| `npm run build:checked` | Проверки качества + сборка                              |
| `npm run preview`       | Просмотр собранного билда                               |
| `npm run build:analyze` | Сборка с анализом бандла (rollup-visualizer)            |
| `npm run verify`        | Prettier + ESLint + Stylelint + TypeScript + Vitest     |
| `npm run a11y`          | Проверка доступности Vue-шаблонов                       |
| `npm run lint`          | ESLint + Stylelint (BEM) с автофиксом                   |
| `npm run format`        | Prettier для всего проекта                              |
| `npm run test`          | Vitest в watch-режиме                                   |
| `npm run test:e2e`      | Playwright e2e-тесты                                    |
| `npm run generate:api`  | TS-типы из OpenAPI → `src/app/api/contracts.d.ts`       |

---

## Конвенции

**Husky:** pre-commit запускает `verify`, commit-msg проверяется Commitlint. Отключить: `HUSKY=0`.

**Коммиты:** `type(scope): subject` — например `feat(hero): add resume button`. Scope обязателен.

**Кириллица** в строковых литералах `.ts/.vue` запрещена (комментарии и локали — можно). Отключить: `ESLINT_NO_CYRILLIC=0`.

**BEM (stylelint):** блок `.block`, элемент `.block__element`, модификатор `.block--mod`; в начале `<style>` указывай `/** @define block-name */`. Kebab-case утилиты (`.flex`, `.gap-m`) разрешены.

**Окружение:** `VITE_SITE_URL` — канонический origin: canonical, hreflang, Open Graph, JSON-LD, `robots.txt`, `sitemap.xml`. Переезд на свой домен = одна переменная (локально в `.env`, в CI — секрет `VITE_SITE_URL`), после чего стоит перегенерировать OG-картинки: на них напечатан адрес сайта.

---

## Деплой (Yandex Object Storage)

`dist/` заливается в бакет как есть. В настройках хостинга бакета:

- **Главная страница** — `index.html`
- **Страница ошибки** — `404.html`

`/en/` отдаётся из `dist/en/index.html`. Если хостинг всё же вернёт `404.html` на существующий путь, приложение это переживёт: отметка `data-prerendered` не совпадёт, и страница смонтируется на клиенте вместо кривой гидратации.

Object Storage не умеет content negotiation, поэтому `.gz`/`.br` рядом с файлами по умолчанию не создаются. За nginx (`gzip_static`) или другим хостингом, который их понимает, включаются переменной `PRERENDER_COMPRESS=1`.

Подробнее про настройку husky, GitHub Rulesets и линтеры — в [SETUP.md](./SETUP.md).
