/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the contact-form backend (Yandex Cloud Function).
  // Unset -> the form runs in demo mode (no real delivery).
  readonly VITE_CONTACT_API_URL?: string
}

declare module 'virtual:svg-icons-register' {
  const component: unknown
  export default component
}
