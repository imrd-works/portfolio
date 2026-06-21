import { useSeoMeta } from '@/composables/useSeo'

export function usePageSeo() {
  useSeoMeta({
    title: 'Page not found',
    description: 'The page you are looking for does not exist.',
  })
}
