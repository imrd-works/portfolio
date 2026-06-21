# Daniel Rassomakhin — Portfolio

Личный сайт-портфолио frontend-разработчика и Team Lead. Одностраничник на Vue 3 + Vite + TypeScript с анимациями на GSAP, дизайн-токенами, i18n и SEO.

```bash
npm install && npm run dev
```

Прод-сборка: `npm run build`. Полный прогон проверок перед сборкой: `npm run build:checked`.

> Сайт вырос из собственного Vue-стартера, поэтому в проекте остаётся «боевой» каркас (API-клиент с тостами, роутер с middleware, husky/commitlint, BEM-stylelint). Сейчас он используется как одностраничное портфолио, но инфраструктура готова к расширению.

---

## Что на сайте

Главная (`src/pages/home`) собрана из секций:

- **Hero** — имя, статус, кнопки (Telegram, e-mail, резюме).
- **About** — о себе + счётчики (лет в профессии, проектов, технологий).
- **Skills** — стек: Core / Frontend / Data, DX & DevOps.
- **Work** — избранные проекты (energy trading, education platform, Bitcoin-лендинг, financial monitoring и др.).
- **Experience** — таймлайн ролей.
- **Contact** — форма заявки + ссылки.

Плюс страница **404** (`src/pages/not-found`). Контент вынесен в локали (`locales/en.json`) и подключается через `vue-i18n`.

---

## Технологии

| Слой          | Инструменты                                            |
| ------------- | ------------------------------------------------------ |
| Ядро          | Vue 3, Vite, TypeScript                                |
| Маршрутизация | Vue Router (+ middleware)                              |
| Состояние     | Pinia                                                  |
| Анимации      | GSAP, кастомные компоненты Motion / CountUp / Ticker   |
| Стили         | SCSS, дизайн-токены, BEM (stylelint)                   |
| i18n / SEO    | vue-i18n, @unhead/vue, vite-plugin-sitemap             |
| UX            | vue-sonner (тосты), @vueuse/core                       |
| Качество      | ESLint, Stylelint, Prettier, Vitest, Playwright, Husky |

---

## Структура проекта

```
src/
├── app/
│   ├── api/           # API-клиент, адаптеры (axios)
│   ├── i18n/          # настройка vue-i18n
│   └── router/        # Vue Router, middleware
├── layouts/           # layout-обёртки
├── pages/             # модули страниц
│   ├── home/          # главная: views/sections, model, seo, locales
│   └── not-found/     # 404
├── shared/
│   ├── ui/            # Button, Icon, Text, Motion, CountUp,
│   │                  #   Ticker, CustomCursor, AuroraBackdrop, ScrollProgress
│   ├── layout/        # Container, Grid, Section, PageSection
│   ├── composables/   # useToast, useHelpers, useSeo
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

| Команда                 | Описание                                            |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Dev-сервер                                          |
| `npm run build`         | Production-сборка                                   |
| `npm run build:checked` | Проверки качества + сборка                          |
| `npm run preview`       | Просмотр собранного билда                           |
| `npm run build:analyze` | Сборка с анализом бандла (rollup-visualizer)        |
| `npm run verify`        | Prettier + ESLint + Stylelint + TypeScript + Vitest |
| `npm run a11y`          | Проверка доступности Vue-шаблонов                   |
| `npm run lint`          | ESLint + Stylelint (BEM) с автофиксом               |
| `npm run format`        | Prettier для всего проекта                          |
| `npm run test`          | Vitest в watch-режиме                               |
| `npm run test:e2e`      | Playwright e2e-тесты                                |
| `npm run generate:api`  | TS-типы из OpenAPI → `src/app/api/contracts.d.ts`   |

---

## Конвенции

**Husky:** pre-commit запускает `verify`, commit-msg проверяется Commitlint. Отключить: `HUSKY=0`.

**Коммиты:** `type(scope): subject` — например `feat(hero): add resume button`. Scope обязателен.

**Кириллица** в строковых литералах `.ts/.vue` запрещена (комментарии и локали — можно). Отключить: `ESLINT_NO_CYRILLIC=0`.

**BEM (stylelint):** блок `.block`, элемент `.block__element`, модификатор `.block--mod`; в начале `<style>` указывай `/** @define block-name */`. Kebab-case утилиты (`.flex`, `.gap-m`) разрешены.

**Окружение:** `VITE_SITE_URL` задаёт hostname для sitemap (см. `.env.example`).

Подробнее про настройку husky, GitHub Rulesets и линтеры — в [SETUP.md](./SETUP.md).
