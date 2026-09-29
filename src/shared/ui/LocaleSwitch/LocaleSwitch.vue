<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLocale } from '@/composables/useLocale'

defineOptions({ name: 'UiLocaleSwitch' })

/*
 * A link to the same page in the other language: "EN" on the Russian page, "RU"
 * on the English one. A real link (crawlable, opens in a new tab), named in the
 * language it leads to ("English", "Русский"). It carries no style of its own:
 * where it stands, it takes the look of the controls around it.
 */
const { t } = useI18n()
const { other, pathFor } = useLocale()
</script>

<template>
  <RouterLink
    :to="pathFor(other)"
    :hreflang="other"
    :lang="other"
    :aria-label="t('language.name', {}, { locale: other })"
    >{{ other.toUpperCase() }}</RouterLink
  >
</template>
