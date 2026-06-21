# Vue Starter

Стартовый проект на Vue 3 + Vite + TypeScript с Vue Router, Pinia, SCSS, тостами, i18n и VueUse.

```bash
npm install && npm run dev
```

---

## Структура проекта

```
src/
├── app/
│   ├── api/           # API-клиент, адаптеры (axios)
│   ├── i18n/          # настройка vue-i18n
│   └── router/        # Vue Router, middleware
├── layouts/           # GuestLayout, AuthLayout
├── pages/             # Модули страниц
│   └── {page}/
│       ├── api/       # API-вызовы страницы
│       ├── locales/   # en.json
│       ├── views/     # Vue-компоненты
│       ├── route.ts   # Описание маршрута
│       └── composables/  # опционально
├── shared/
│   ├── composables/   # useToast, useHelpers
│   ├── locales/       # общие переводы
│   ├── stores/        # Pinia-сторе
│   └── ui/            # общие UI-компоненты
└── assets/
```

---

## 1. API и тосты

**Ошибки:** интерцептор axios автоматически показывает toast (берёт `error.response?.data?.message` или fallback).

**Успех:** по умолчанию toast не показывается. Используй `config.toast.success`, когда нужно.

**Отключить тост:** `config.silent: true` — интерцептор не покажет toast, обработай в компоненте.

### Примеры

```ts
const { data } = await api.get<User>('/user/1')

await api.post('/user', payload, {
  toast: { success: 'Сохранено' },
})

await api.post('/user', payload, {
  toast: { error: 'Неверный формат email' },
})

await api.get('/data', { silent: true }).catch(() => {
  useToast().error('Своё сообщение об ошибке')
})
```

Бэкенд должен возвращать: `{ "message": "User not found" }`.

---

## 2. VueUse (composables)

Рекомендуемые функции из `@/composables/useHelpers` и напрямую из `@vueuse/core`:

| Composable          | Назначение                             |
| ------------------- | -------------------------------------- |
| `useDebounceFn`     | Поиск, ввод                            |
| `useThrottleFn`     | Обработчики scroll/resize              |
| `refDebounced`      | Debounced ref для v-model              |
| `refThrottled`      | Throttled ref                          |
| `useLocalStorage`   | Сохранение настроек                    |
| `useAsyncState`     | Загрузка с состоянием loading/error    |
| `computedAsync`     | Асинхронный computed                   |
| `useDebouncedInput` | Поле поиска с debounce (из useHelpers) |

### Примеры

```ts
const { input, debounced } = useDebouncedInput('', 300)
watch(debounced, (v) => fetchResults(v))

const onScroll = useThrottleFn(() => updatePosition(), 100)

const theme = useLocalStorage('theme', 'light')

const { state, isLoading, execute } = useAsyncState(fetchUsers, [])
```

---

## 3. GSAP (animations)

GSAP подключён для сложных анимаций: timelines, последовательности, SVG, scroll-driven эффекты, enter/leave-сцены и точный контроль easing.

Для простых hover/fade/active состояний сначала используй CSS transitions. GSAP лучше подключать там, где CSS уже становится неудобным.

```ts
import { gsap } from 'gsap'

gsap.from('.card', {
  opacity: 0,
  y: 16,
  duration: 0.4,
  ease: 'power2.out',
})
```

---

## 4. Маршруты и guards

Маршрут задаётся в `route.ts` страницы:

```ts
export const homeRoute: RouteRecordRaw = {
  path: '',
  name: 'Home',
  component: () => import('./views/HomePage.vue'),
  meta: {
    title: 'Home',
    middleware: ['auth'],
  },
}
```

### Добавление middleware

1. Создай `src/app/router/middleware/auth.ts`:

```ts
import type { Middleware } from './index'

export const authMiddleware: Middleware = ({ to }) => {
  if (!useUserStore().isAuthenticated) {
    return { name: 'Login' }
  }
}
```

2. Зарегистрируй в `src/app/router/middleware/index.ts`:

```ts
import { authMiddleware } from './auth'
registerMiddleware('auth', authMiddleware)
```

3. Укажи в meta маршрута: `meta: { middleware: ['auth'] }`.

**Возврат:** `return { name: 'Login' }` — редирект; `return false` — отмена перехода; `return` (void) — продолжить.

---

## 5. Смена API-клиента

1. Создай адаптер в `src/app/api/adapters/`, реализующий `ApiClient`:

```ts
export interface ApiClient {
  get<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>
  post<T>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>
  put<T>(...): Promise<ApiResponse<T>>
  patch<T>(...): Promise<ApiResponse<T>>
  delete<T>(...): Promise<ApiResponse<T>>
}
```

2. В `src/app/api/index.ts` экспортируй нужный клиент:

```ts
export const api = myCustomClient
```

---

## 6. SCSS: миксины и функции

Подключение: `@use 'assets/styles/mixins' as *` (путь от `src/`, алиасы Vite в SCSS не работают).

### Миксины

| Миксин                                                               | Использование                |
| -------------------------------------------------------------------- | ---------------------------- |
| `@include respond-to('mobile'\|'tablet'\|'desktop'\|'desktop-wide')` | Медиа-запрос                 |
| `@include respond-below('tablet')`                                   | max-width                    |
| `@include respond-between('tablet', 'desktop')`                      | Диапазон                     |
| `@include flex-center`                                               | Flex по центру               |
| `@include flex-between`                                              | space-between                |
| `@include truncate`                                                  | Ellipsis                     |
| `@include line-clamp(3)`                                             | Многострочный clamp          |
| `@include visually-hidden`                                           | Только для скринридеров      |
| `@include absolute-fill`                                             | position: absolute; inset: 0 |
| `@include aspect-ratio(16, 9)`                                       | Соотношение сторон           |
| `@include focus-ring`                                                | Обводка фокуса               |
| `@include text-style('type-headline-h1')`                            | Токен типографики            |

### Функции

| Функция                  | Использование                 |
| ------------------------ | ----------------------------- |
| `rem(16)`                | px → rem                      |
| `strip-unit($value)`     | Убрать единицу                |
| `contrast-color($color)` | Чёрный или белый по контрасту |
| `shade($color, 10)`      | Осветлить/затемнить           |

---

## 7. Утилиты Flex / Gap

Глобальные классы в `base/_utils.scss`:

| Класс                                                           | Назначение             |
| --------------------------------------------------------------- | ---------------------- |
| `.flex`                                                         | display: flex          |
| `.flex-col`                                                     | flex-direction: column |
| `.flex-row`                                                     | flex-direction: row    |
| `.flex-center`                                                  | центр по обеим осям    |
| `.flex-between`                                                 | space-between + center |
| `.flex-wrap`                                                    | flex-wrap: wrap        |
| `.gap-xs`, `.gap-s`, `.gap-m`, `.gap-l`, `.gap-xl`              | gap                    |
| `.items-start`, `.items-center`, `.items-end`, `.items-stretch` | align-items            |
| `.justify-start`, `.justify-center`, …                          | justify-content        |

Пример: `<div class="flex flex-between gap-m">`.

---

## 8. Токены стилей

`src/assets/styles/tokens/` — единый источник переменных.

- `colors/` — `--color-primary`, `--color-text` и т.д.
- `radius/` — `--radius-s`, `--radius-m`, `--radius-l`
- `fonts/` — `--font-family-base`, `--font-size-*`
- `z-index/` — `--z-dropdown` и др.
- `typography/` — `--type-headline-h1-*`, `--type-body-p1-*`
- `spacing/` — `--spacing-xs` … `--spacing-xxl`

---

## 9. Модуль страницы

У каждой страницы: `api/`, `locales/en.json`, `views/`, `route.ts`. В компонентах используй `t('home.title')` и т.п.; ключи объединяются по имени страницы.

---

## Скрипты

| Команда                 | Описание                                                     |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Dev-сервер                                                   |
| `npm run build`         | Production-сборка без повторного запуска проверок            |
| `npm run build:checked` | Проверка качества + production-сборка                        |
| `npm run preview`       | Просмотр собранного билда                                    |
| `npm run verify`        | Prettier check + ESLint + Stylelint + TypeScript + Vitest    |
| `npm run a11y`          | Проверка доступности Vue-шаблонов                            |
| `npm run lint`          | ESLint + Stylelint (BEM) с автофиксом                        |
| `npm run lint:check`    | ESLint + Stylelint без автофикса                             |
| `npm run format`        | Prettier для всего проекта                                   |
| `npm run format:check`  | Проверка форматирования без записи файлов                    |
| `npm run test`          | Vitest в watch-режиме                                        |
| `npm run test:run`      | Разовый запуск unit/component-тестов                         |
| `npm run test:e2e`      | Playwright e2e-тесты                                         |
| `npm run generate:api`  | Генерация TS-типов из OpenAPI → `src/app/api/contracts.d.ts` |
| `npm run patch`         | Увеличить patch-версию (package.json + git tag)              |
| `npm run minor`         | Увеличить minor-версию                                       |
| `npm run major`         | Увеличить major-версию                                       |

**Husky:** pre-commit запускает `npm run verify`, commit-msg проверяет название коммита через Commitlint. Отключить: `HUSKY=0` или см. SETUP.md.

**Формат коммитов:** `type(scope): subject`, например `feat(auth): add login form` или `fix(router): preserve redirect query`. Scope обязателен.

**GitHub protection:** прямой push в `main/master` запрещается через GitHub Rulesets. Настройки описаны в SETUP.md.

**Кириллица:** в коде (.ts/.vue) запрещена в строковых литералах (комментарии и локали — можно). Отключить: `ESLINT_NO_CYRILLIC=0`. Подробнее в SETUP.md.

---

## Stylelint (BEM)

Стили проверяются правилом `stylelint-selector-bem-pattern`:

- **BEM:** блок (`.block-name`), элемент (`.block__element`), модификатор (`.block--mod` или `.block__element--mod`).
- **Утилиты:** любые kebab-case классы (например `.flex`, `.gap-m`) разрешены вместе с BEM.
- В начале каждого `<style>` добавь `/** @define block-name */` — так Stylelint знает имя блока для проверки.

Игнорируются: `:root`, Vue scoped-атрибуты, классы переходов (`fade-*`), `.router-link-active`, токены, reset, шрифты, утилиты.
