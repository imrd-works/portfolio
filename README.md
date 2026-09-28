# Daniel Rassomakhin — Portfolio

Личный сайт-портфолио frontend-разработчика с fullstack-опытом и Team Lead. Vue 3 + Vite + TypeScript, две локали и **пререндер в статику**: каждый маршрут собирается в готовый HTML, браузер потом гидрирует ту же разметку.

Оформление — тушь на рисовой бумаге: живые WebGL-сцены (свиток на первом экране, река пути), картины проектов, которые проявляются на мокрой бумаге, курсор-кисть. Всё на бумаге одного тона `#ece8e1`, единственный цвет — киноварь печати.

```bash
npm install && npm run dev
```

Прод-сборка: `npm run build` (клиентский бандл → SSR-бандл → пререндер маршрутов → проверка выходного HTML). Полный прогон проверок перед сборкой: `npm run build:checked`.

---

## Что на сайте

Главная (`src/pages/home`) собрана из секций:

- **Hero** — свиток с тайгой, который рисуется тушью при загрузке; вечер наступает по прокрутке.
- **Путь** — река, по которой идёт росомаха: шаги карьеры проявляются по мере прокрутки, в конце — печать.
- **Работы** — стена листов с картинами проектов (проекты под NDA, поэтому вместо скриншотов — картины); фильтры, картина раскрывается с описанием, стеком и ролью.
- **Обо мне** и **Навыки** — сильные стороны и полка технологий с вкладками и поиском.
- **Контакты** — письмо с полями в тексте и печатью-кнопкой; отправка в Telegram через [portfolio-backend](https://github.com/imrd-works/portfolio-backend).

Ещё: страница **политики конфиденциальности** (`/privacy/`, `/en/privacy/`) и **404** со своей картиной. В углу страницы — наверх, согласие на аналитику и настройки (лёгкий режим графики для слабых устройств).

Язык живёт в URL: `/` — русская версия, `/en/` — английская. Переключатель — обычная ссылка на ту же страницу в другом языке, поэтому каждая версия индексируется, шарится и открывается на том языке, на котором её отправили. Контент — в локалях (`src/shared/locales`, `src/pages/*/locales`), через `vue-i18n`.

**Аналитика** (Яндекс Метрика, Google Analytics 4) загружается только после согласия посетителя (`src/shared/lib/consent.ts`), ответ хранится полгода.

---

## Пререндер и SEO

`npm run build` не отдаёт пустой `<div id="app">`:

1. `vite build` — клиентский бандл.
2. `vite build --ssr src/entry-server.ts` — тот же граф приложения, собранный под Node.
3. `scripts/prerender.mjs` — рендерит `/`, `/en/`, `/privacy/`, `/en/privacy/` и `/404` в готовые документы, подставляет теги `<head>` от unhead и генерирует `robots.txt` и `sitemap.xml` с `hreflang`.
4. `scripts/verify-build.mjs` — падает, если в HTML не оказалось контента, canonical, hreflang, Open Graph или JSON-LD.

В исходнике страницы без выполнения JS: весь текст, `title` и `description`, `canonical`, `hreflang` (`ru` / `en` / `x-default`), Open Graph и Twitter-карточка 1200×630, JSON-LD (`Person`, `WebSite`, `ProfilePage`, `ItemList` проектов).

- **Гидратация вместо перерисовки.** Точка входа сверяет отметку `data-prerendered` с текущим путём и гидрирует разметку только если они совпали.
- **Шрифты self-hosted** в `public/fonts`, `preload` ровно тех сабсетов, что нужны локали. Обновляются через `npm run fonts:sync`.
- **Превью ссылок** — одна карточка на английском для всех страниц (`public/og.jpg`), собирается `npm run og:generate` из картины `scripts/og/traveller.webp`.

---

## Технологии

| Слой       | Инструменты                                            |
| ---------- | ------------------------------------------------------ |
| Ядро       | Vue 3, Vite, TypeScript                                |
| Графика    | WebGL (three.js для свитка, свои шейдеры GLSL)         |
| Стили      | SCSS, дизайн-токены, BEM (stylelint)                   |
| SSG        | vue/server-renderer + собственный prerender-скрипт     |
| i18n / SEO | vue-i18n, @unhead/vue, JSON-LD, hreflang               |
| Формы      | vee-validate + yup, отправка `fetch` в Cloud Function  |
| UX         | vue-sonner (тосты)                                     |
| Качество   | ESLint, Stylelint, Prettier, Vitest, Playwright, Husky |

---

## Структура проекта

```
src/
├── app/
│   ├── config/        # site.ts — домен, локали, канонические пути
│   ├── i18n/          # настройка vue-i18n
│   ├── router/        # Vue Router
│   ├── seo/           # useSiteSeo — head, OG, hreflang, JSON-LD
│   └── create.ts      # общая сборка приложения для браузера и пререндера
├── layouts/           # PortfolioLayout, угол страницы, плашки согласия и лёгкого режима
├── pages/
│   ├── home/          # главная: views/sections (+ сцены и шейдеры), model, seo, locales
│   ├── privacy/       # политика конфиденциальности
│   └── not-found/     # 404
├── shared/
│   ├── ui/            # CustomCursor, кнопки и меню угла, переключатели
│   ├── composables/   # useLocale, useInView, useToast, аналитика
│   ├── config/        # контакты и идентичность (их читает и SEO-слой)
│   ├── lib/           # согласие, уровень графики, след росомахи, типограф
│   └── locales/       # общие переводы
└── assets/styles/     # tokens, mixins, base
```

Каждая страница — самодостаточный модуль: `views/`, `locales/`, `route.ts`, при необходимости `model/`, `seo/`, `composables/`, `lib/`. Ключи переводов объединяются по имени страницы: `t('home.hero.firstName')`.

Стили: `src/assets/styles/tokens/` — переменные (цвета, отступы, типографика), `mixins/` — брейкпоинты и типографика (`@use 'assets/styles/mixins' as *`, путь от `src/`). Секции держат свои цвета бумаги и туши в собственных CSS-переменных.

---

## Скрипты

| Команда                 | Описание                                                |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Dev-сервер                                              |
| `npm run build`         | Полная прод-сборка: бандлы → пререндер → проверка       |
| `npm run prerender`     | Только пререндер (после `build:client` + `build:ssr`)   |
| `npm run verify:build`  | Проверка готового `dist/` на контент, SEO-теги, JSON-LD |
| `npm run fonts:sync`    | Обновить self-hosted шрифты из @fontsource              |
| `npm run og:generate`   | Перерисовать превью ссылок и PNG-иконки                 |
| `npm run build:checked` | Проверки качества + сборка                              |
| `npm run preview`       | Просмотр собранного билда                               |
| `npm run build:analyze` | Сборка с анализом бандла (rollup-visualizer)            |
| `npm run verify`        | Prettier + ESLint + Stylelint + TypeScript + Vitest     |
| `npm run a11y`          | Проверка доступности Vue-шаблонов                       |
| `npm run lint`          | ESLint + Stylelint (BEM) с автофиксом                   |
| `npm run format`        | Prettier для всего проекта                              |
| `npm run test`          | Vitest в watch-режиме                                   |
| `npm run test:e2e`      | Playwright e2e-тесты                                    |

---

## Конвенции

**Husky:** pre-commit запускает `verify`, commit-msg проверяется Commitlint. Отключить: `HUSKY=0`.

**Коммиты:** `type(scope): subject` — например `feat(hero): add resume button`. Scope обязателен.

**Кириллица** в строковых литералах `.ts/.vue` запрещена (комментарии и локали — можно). Отключить: `ESLINT_NO_CYRILLIC=0`.

**BEM (stylelint):** блок `.block`, элемент `.block__element`, модификатор `.block--mod`; в начале `<style>` указывай `/** @define block-name */`. Kebab-case утилиты (`.flex`, `.gap-m`) разрешены.

**Окружение:** `VITE_SITE_URL` — канонический origin: canonical, hreflang, Open Graph, JSON-LD, `robots.txt`, `sitemap.xml`. Переезд на свой домен = одна переменная (локально в `.env`, в CI — секрет `VITE_SITE_URL`), после чего стоит перегенерировать превью (`npm run og:generate`): на нём напечатан адрес сайта. Форма отправляет письма на `VITE_CONTACT_API_URL` (без него — демо-режим, ничего не уходит).

---

## Деплой (Yandex Object Storage)

`dist/` заливается в бакет как есть. В настройках хостинга бакета:

- **Главная страница** — `index.html`
- **Страница ошибки** — `404.html`

`/en/` отдаётся из `dist/en/index.html`. Если хостинг всё же вернёт `404.html` на существующий путь, приложение это переживёт: отметка `data-prerendered` не совпадёт, и страница смонтируется на клиенте вместо кривой гидратации.

Object Storage не умеет content negotiation, поэтому `.gz`/`.br` рядом с файлами по умолчанию не создаются. За nginx (`gzip_static`) или другим хостингом, который их понимает, включаются переменной `PRERENDER_COMPRESS=1`.

### Переезд на свой домен

Object Storage требует, чтобы **имя бакета полностью совпадало с доменом**, поэтому переименованием не обойтись — заводится новый бакет, старый остаётся под редирект.

1. Купить домен и создать бакет с именем ровно как домен (`example.dev`). Хостинг: главная `index.html`, ошибка `404.html`, публичное чтение.
2. Создать публичную зону в Cloud DNS, у регистратора делегировать домен на `ns1.yandexcloud.net` и `ns2.yandexcloud.net`.
3. В зоне добавить `ANAME` на корень: `example.dev.` → `example.dev.website.yandexcloud.net.`, TTL 600. `CNAME` на корень зоны не вешается — только на третий уровень и ниже.
4. Certificate Manager → сертификат от Let's Encrypt → проверка прав **по CNAME** (единственный способ с автопродлением). На `_acme-challenge` не должно быть других записей.
5. Бакет → Безопасность → HTTPS → источник Certificate Manager. Доступ открывается примерно за полчаса, редирект HTTP → HTTPS включается сам.
6. Обновить секреты в GitHub: `YC_BUCKET` — новое имя бакета, `VITE_SITE_URL` — новый origin. То же в локальном `.env`.
7. `npm run og:generate` и закоммитить новый `public/og.jpg`: на карточке напечатан адрес сайта.
8. Старый бакет перевести в режим «Перенаправление всех запросов» на новый домен, чтобы уже разосланные ссылки не умерли.

После деплоя: `curl -sI https://example.dev/en/` должен вернуть `200`, а `curl -s https://example.dev/robots.txt` — показать новый домен в `Sitemap:`. Если `/en/` отдаёт 404, значит бакет не подставляет индексный документ внутри префикса — добавить routing rule `KeyPrefixEquals: en/` → `ReplaceKeyWith: en/index.html`.

Подробнее про настройку husky, GitHub Rulesets и линтеры — в [SETUP.md](./SETUP.md).
