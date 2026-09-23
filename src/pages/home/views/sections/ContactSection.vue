<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContactForm } from '../../composables/useContactForm'
import { contactChannels, socials } from '../../model/portfolio'
import type { Drying } from './contact/lib/drying'

const { t } = useI18n()
const {
  name,
  nameAttrs,
  contact,
  contactAttrs,
  message,
  messageAttrs,
  errors,
  loading,
  sent,
  submit,
  reset,
} = useContactForm()

const section = useTemplateRef<HTMLElement>('section')
const gl = useTemplateRef<HTMLCanvasElement>('gl')
const print = useTemplateRef<HTMLCanvasElement>('print')

// Client-only: the prerendered HTML is the letter on dry paper. The drying
// sheet and the print arrive once the page is live.
const live = ref(false)
// while the sheet is still wet the text on it is soft; dry, it is plain text
const wet = ref(false)
// once the envelope is up the letter is inside it and leaves the flow
const folded = ref(false)
let drying: Drying | null = null
let fold = 0
let unmounted = false
let dpr = 2

/** The blanks of the letter grow with what is written into them. */
const fit = (value: string, hint: string) => Math.max(3, value.length || hint.length)

const address = computed(() => [
  { id: 'telegram', href: contactChannels.telegramUrl, value: contactChannels.telegramHandle },
  { id: 'email', href: `mailto:${contactChannels.email}`, value: contactChannels.email },
  ...socials
    .filter(({ href }) => href)
    .map(({ label, href }) => ({
      id: label.toLowerCase(),
      href: href!,
      value: href!.replace(/^https?:\/\/[^/]+\//, ''),
    })),
  { id: 'resume', href: contactChannels.resumeUrl, value: t('home.contact.links.resumeNote') },
])

/** The painted envelope: the fold lines, the flap that swings down, the birds. */
const ENVELOPE = ['body', 'flap', 'birds'].map((layer) => `/contact/envelope-${layer}.webp`)

onMounted(async () => {
  dpr = Math.min(devicePixelRatio || 1, 2)
  live.value = true
  await nextTick()
  if (unmounted) return

  const [{ mountDrying }, { makePaw }] = await Promise.all([
    import('./contact/lib/drying'),
    import('./path/lib/paw'),
  ])
  if (unmounted) return

  try {
    // the text settles into the paper at the pace the paper dries
    drying = mountDrying({ root: section.value!, canvas: gl.value! }, (dry) => {
      section.value?.style.setProperty('--contact-dry', dry.toFixed(3))
      wet.value = dry < 0.999
    })
  } catch {
    // no drying sheet: the section stays the dry paper it is prerendered on
    live.value = false
  }

  // the envelope is fetched now, so it is there the moment the seal is pressed
  for (const src of ENVELOPE) new Image().src = src

  // one print: the wolverine walked across the letter on its way out
  const paw = makePaw(23, true)
  const host = print.value
  if (host) {
    const g = host.getContext('2d')!
    host.width = Math.round(paw.width * 0.66 * dpr)
    host.height = Math.round(paw.height * 0.66 * dpr)
    g.drawImage(paw.canvas, 0, 0, host.width, host.height)
  }
})

watch(sent, (done) => {
  clearTimeout(fold)
  folded.value = false
  if (!done) return
  // the letter has gone into the envelope by now, so it stops taking room
  fold = window.setTimeout(() => (folded.value = true), 1000)
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(fold)
  drying?.destroy()
  drying = null
})
</script>

<template>
  <section
    id="contact"
    ref="section"
    class="contact"
    :class="{ 'contact--live': live, 'contact--wet': live && wet }"
    data-ink-surface="paper"
  >
    <svg
      class="contact__defs"
      width="0"
      height="0"
      aria-hidden="true"
    >
      <filter
        id="contact-rough"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency=".9"
          numOctaves="2"
          seed="4"
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="2.6"
        />
      </filter>
    </svg>

    <canvas
      v-if="live"
      ref="gl"
      class="contact__sheet"
      aria-hidden="true"
    ></canvas>

    <div class="contact__inner">
      <p class="contact__eyebrow">{{ t('home.contact.eyebrow') }}</p>
      <h2 class="contact__title">{{ t('home.contact.title') }}</h2>

      <div class="contact__spread">
        <form
          v-if="!sent"
          class="contact__letter"
          novalidate
          @submit.prevent="submit"
        >
          <p class="contact__prose">
            <i18n-t
              keypath="home.contact.letter"
              scope="global"
              tag="span"
            >
              <template #name>
                <label
                  class="contact__blank"
                  for="contact-name"
                >
                  <span class="contact__sr">{{ t('home.contact.form.name') }}</span>
                  <input
                    id="contact-name"
                    v-model="name"
                    v-bind="nameAttrs"
                    class="contact__blank-input"
                    :class="{ 'contact__blank-input--bad': errors.name }"
                    type="text"
                    :size="fit(name, t('home.contact.form.phName'))"
                    :placeholder="t('home.contact.form.phName')"
                    :aria-invalid="Boolean(errors.name)"
                  />
                </label>
              </template>
              <template #contact>
                <label
                  class="contact__blank"
                  for="contact-handle"
                >
                  <span class="contact__sr">{{ t('home.contact.form.contact') }}</span>
                  <input
                    id="contact-handle"
                    v-model="contact"
                    v-bind="contactAttrs"
                    class="contact__blank-input"
                    :class="{ 'contact__blank-input--bad': errors.contact }"
                    type="text"
                    :size="fit(contact, t('home.contact.form.phContact'))"
                    :placeholder="t('home.contact.form.phContact')"
                    :aria-invalid="Boolean(errors.contact)"
                  />
                </label>
              </template>
            </i18n-t>
          </p>

          <label for="contact-about">
            <span class="contact__sr">{{ t('home.contact.form.about') }}</span>
            <textarea
              id="contact-about"
              v-model="message"
              v-bind="messageAttrs"
              class="contact__area"
              :class="{ 'contact__area--bad': errors.message }"
              rows="4"
              :placeholder="t('home.contact.form.phAbout')"
              :aria-invalid="Boolean(errors.message)"
            ></textarea>
          </label>

          <p
            v-if="errors.name || errors.contact || errors.message"
            class="contact__errors"
            role="alert"
          >
            <span v-if="errors.name">{{ t(errors.name) }}</span>
            <span v-if="errors.contact">{{
              t(errors.contact, {
                email: contactChannels.email,
                handle: contactChannels.telegramHandle,
              })
            }}</span>
            <span v-if="errors.message">{{ t(errors.message) }}</span>
          </p>

          <div class="contact__send">
            <button
              class="contact__stamp"
              type="submit"
              :disabled="loading"
            >
              {{ t('home.contact.seal') }}
            </button>
            <span class="contact__hint">{{
              loading ? t('home.contact.form.sending') : t('home.contact.sealHint')
            }}</span>
          </div>
        </form>

        <div
          v-else
          class="contact__fold"
        >
          <p
            v-if="!folded"
            class="contact__written"
          >
            <i18n-t
              keypath="home.contact.letter"
              scope="global"
              tag="span"
            >
              <template #name>
                <span class="contact__written-in">{{ name }}</span>
              </template>
              <template #contact>
                <span class="contact__written-in">{{ contact }}</span>
              </template>
            </i18n-t>
            {{ message }}
          </p>

          <div
            class="contact__envelope"
            :class="{ 'contact__envelope--over': !folded }"
          >
            <img
              class="contact__envelope-body"
              :src="ENVELOPE[0]"
              alt=""
            />
            <img
              class="contact__envelope-flap"
              :src="ENVELOPE[1]"
              alt=""
            />
            <img
              class="contact__envelope-birds"
              :src="ENVELOPE[2]"
              alt=""
            />
            <span
              class="contact__seal"
              aria-hidden="true"
              >{{ t('home.contact.seal') }}</span
            >
          </div>

          <p class="contact__sealed">{{ t('home.contact.success.text') }}</p>
          <button
            class="contact__again"
            type="button"
            @click="reset"
          >
            {{ t('home.contact.success.again') }}
          </button>
        </div>

        <aside class="contact__address">
          <p
            v-for="row in address"
            :key="row.id"
            class="contact__row"
          >
            <span class="contact__row-key">{{ t(`home.contact.links.${row.id}`) }}</span>
            <a
              class="contact__row-value"
              :href="row.href"
              :target="row.href.startsWith('http') ? '_blank' : undefined"
              :rel="row.href.startsWith('http') ? 'noopener' : undefined"
              >{{ row.value }}</a
            >
          </p>
          <p class="contact__note">{{ t('home.contact.lead') }}</p>
          <canvas
            v-if="live"
            ref="print"
            class="contact__print"
            aria-hidden="true"
          ></canvas>
        </aside>
      </div>

      <footer class="contact__sign">
        <span>{{ t('home.footer.name') }}</span>
        <span>{{ t('home.footer.note') }}</span>
      </footer>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/** @define contact */
.contact {
  /* the one sheet where the ink has dried: every tone here is a faded,
     warm version of the site's ink; only the seal stays fresh */
  --contact-paper: #ece8e1;
  --contact-aged: #eae1cc;
  --contact-ink: #231d19;
  --contact-ink-soft: #6b5c50;
  --contact-text: #3b322b;
  --contact-seal: #c23b2a;
  --contact-rule: rgb(107 92 80 / 35%);
  --contact-dry: 1;

  position: relative;
  padding: clamp(80px, 9vw, 130px) clamp(20px, 6vw, 96px) clamp(40px, 6vw, 80px);
  overflow: hidden;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  line-height: normal;
  color: var(--contact-ink);
  background-color: var(--contact-paper);
  /* without the drying sheet it is still the old, yellowed page */
  background-image: linear-gradient(var(--contact-paper), var(--contact-aged) 220px);
  -webkit-font-smoothing: antialiased;

  &__defs {
    position: absolute;
  }

  &__sheet {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  /* one column down the middle of the sheet: the heading, the letter, and
     the addresses under it */
  &__inner {
    position: relative;
    z-index: 1;
    max-width: 880px;
    margin: 0 auto;
    text-align: center;
  }

  &__eyebrow {
    margin: 0 0 10px;
    font-size: 11.5px;
    color: var(--contact-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.22em;
  }

  &__title {
    max-width: 20ch;
    margin: 0 auto clamp(32px, 4.4vw, 56px);
    font-family: Unbounded, 'Arial Black', system-ui, sans-serif;
    font-size: clamp(28px, 3.6vw, 46px);
    font-weight: 400;
    line-height: 1.08;
    letter-spacing: -0.03em;
  }

  &__spread {
    display: grid;
    gap: clamp(40px, 5vw, 64px);
    justify-items: center;
  }

  &__letter,
  &__fold {
    width: min(560px, 100%);
    text-align: left;
  }

  /* on a wet sheet ink is soft: the heavy title settles into the paper
     first, the thin text after it, both at the pace the sheet dries */
  &--wet &__title {
    opacity: calc(0.45 + 0.55 * min(1, var(--contact-dry) * 1.6));
    filter: blur(calc(max(0, 1 - var(--contact-dry) * 1.6) * 6px));
  }

  &--wet &__eyebrow,
  &--wet &__spread,
  &--wet &__sign {
    opacity: calc(0.35 + 0.65 * min(1, max(0, var(--contact-dry) * 1.5 - 0.3)));
    filter: blur(calc(max(0, 1.3 - var(--contact-dry) * 1.5) * 3px));
  }

  /* the letter: one paragraph whose blanks are the fields */
  &__prose,
  &__written {
    max-width: 42ch;
    margin: 0;
    font-size: clamp(16px, 1.3vw, 19px);
    line-height: 1.95;
    color: var(--contact-text);
  }

  &__written-in {
    font-weight: 400;
    color: var(--contact-ink);
    border-bottom: 1.5px solid var(--contact-rule);
  }

  &__blank {
    display: inline-block;
    margin: 0 1px;
  }

  &__blank-input {
    width: auto;
    min-width: 3ch;
    padding: 0 4px 3px;
    font: inherit;
    color: var(--contact-ink);
    text-align: center;
    background: none;
    border: 0;
    border-bottom: 1.5px solid var(--contact-rule);
    outline: none;
    transition: border-color 0.2s;
  }

  &__blank-input:focus {
    border-bottom-color: var(--contact-ink);
  }

  &__blank-input--bad {
    border-bottom-color: var(--contact-seal);
  }

  /* the sheet of a letter is ruled, and the lines show through the text */
  &__area {
    display: block;
    width: 100%;
    max-width: 42ch;
    padding: 0;
    margin-top: 14px;
    font: inherit;
    font-size: clamp(16px, 1.3vw, 19px);
    line-height: 31px;
    color: var(--contact-ink);
    resize: none;
    background: repeating-linear-gradient(transparent 0 30px, rgb(107 92 80 / 24%) 30px 31px);
    border: 0;
    outline: none;
  }

  &__area:focus {
    background: repeating-linear-gradient(transparent 0 30px, rgb(107 92 80 / 45%) 30px 31px);
  }

  &__blank-input::placeholder,
  &__area::placeholder {
    color: rgb(107 92 80 / 55%);
  }

  &__area--bad {
    background: repeating-linear-gradient(transparent 0 30px, rgb(194 59 42 / 45%) 30px 31px);
  }

  &__errors {
    display: grid;
    gap: 4px;
    max-width: 42ch;
    margin: 14px 0 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--contact-seal);
  }

  &__send {
    display: flex;
    gap: 18px;
    align-items: center;
    margin-top: 32px;
  }

  /* the seal that sends the letter */
  &__stamp {
    display: grid;
    width: 80px;
    height: 80px;
    font-family: Unbounded, sans-serif;
    font-size: 21px;
    color: var(--contact-paper);
    cursor: pointer;
    background: var(--contact-seal);
    border: 0;
    border-radius: 50%;
    place-items: center;
    transform: rotate(-6deg);
    transition: transform 0.18s cubic-bezier(0.2, 1.4, 0.4, 1);
  }

  &--live &__stamp {
    filter: url('#contact-rough');
  }

  &__stamp:hover:not(:disabled) {
    transform: rotate(-3deg) scale(1.04);
  }

  &__stamp:active:not(:disabled) {
    transform: rotate(-9deg) scale(0.93);
  }

  &__stamp:disabled {
    cursor: progress;
    opacity: 0.7;
  }

  &__hint {
    max-width: 16ch;
    font-size: 11px;
    line-height: 1.6;
    color: var(--contact-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* the letter folds itself into the envelope and the seal closes it */
  &__fold {
    display: grid;
    gap: 18px;
    justify-items: center;
    text-align: center;
  }

  &__written {
    animation: contact-away 0.8s ease 0.8s both;
  }

  /* the painted envelope: layers cut from one sheet, so they stack exactly */
  &__envelope {
    position: relative;
    width: min(540px, 100%);
    aspect-ratio: 1200 / 635;
    perspective: 1200px;
  }

  &__envelope--over {
    margin-top: -150px;
  }

  &__envelope-body,
  &__envelope-flap,
  &__envelope-birds {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* the fold lines are laid down first, wet */
  &__envelope-body {
    animation: contact-bloom 0.7s ease 1s both;
  }

  /* then the flap with its mountains swings down from its hinge */
  &__envelope-flap {
    transform-origin: 50% 18%;
    backface-visibility: hidden;
    animation: contact-close 0.85s cubic-bezier(0.3, 0.1, 0.2, 1) 1.25s both;
  }

  /* and once it is sealed the birds take off */
  &__envelope-birds {
    animation: contact-fly 1.6s cubic-bezier(0.2, 0.6, 0.3, 1) 2.45s both;
  }

  /* the site's own mark closes the letter: the same cinnabar circle as the
     hero, the nails on the Work sheets and the send button, on the apex of V */
  &__seal {
    position: absolute;
    top: 57.1%;
    left: 47.3%;
    display: grid;
    width: 72px;
    height: 72px;
    margin: -36px 0 0 -36px;
    font-family: Unbounded, sans-serif;
    font-size: 24px;
    font-weight: 500;
    color: var(--contact-paper);
    letter-spacing: -0.04em;
    background: var(--contact-seal);
    border-radius: 50%;
    box-shadow: 0 4px 8px rgb(0 0 0 / 22%);
    place-items: center;
    transform: rotate(-6deg);
    animation: contact-press 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) 2s both;
  }

  &--live &__seal {
    filter: url('#contact-rough');
  }

  &__sealed,
  &__again {
    margin: 0;
    font-size: 11px;
    color: var(--contact-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    animation: contact-settle 0.5s ease 2.1s both;
  }

  &__again {
    padding: 0;
    font-family: inherit;
    cursor: pointer;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--contact-rule);
  }

  &__again:hover {
    color: var(--contact-ink);
    border-bottom-color: var(--contact-seal);
  }

  /* the addresses, in a row under the letter */
  &__address {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    border-top: 1px solid rgb(107 92 80 / 20%);
  }

  &__row {
    display: grid;
    gap: 6px;
    padding: 18px 8px 0;
    margin: 0;
  }

  &__row-key {
    font-size: 10.5px;
    color: var(--contact-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__row-value {
    font-size: 15px;
    color: var(--contact-ink);
    text-decoration: none;
    border-bottom: 1px solid transparent;
  }

  &__row-value:hover {
    border-bottom-color: var(--contact-seal);
  }

  &__note {
    grid-column: 1 / -1;
    max-width: 52ch;
    margin: 28px auto 0;
    font-size: 12.5px;
    line-height: 1.75;
    color: var(--contact-ink-soft);
  }

  /* the print the wolverine left on the corner of the letter */
  &__print {
    position: absolute;
    top: -96px;
    right: 4px;
    width: 61px;
    height: 69px;
    opacity: 0.55;
    transform: rotate(18deg);
  }

  &__sign {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-top: clamp(36px, 5vw, 64px);
    font-size: 11px;
    color: var(--contact-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (width < 700px) {
    &__address {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__envelope--over {
      margin-top: -120px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__written,
    &__envelope-body,
    &__envelope-flap,
    &__envelope-birds,
    &__seal,
    &__sealed,
    &__again {
      animation: none;
    }
  }
}

@keyframes contact-away {
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
  }
}

@keyframes contact-settle {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes contact-bloom {
  from {
    opacity: 0;
    filter: blur(6px);
  }

  to {
    opacity: 1;
    filter: none;
  }
}

@keyframes contact-close {
  from {
    opacity: 0;
    transform: rotateX(96deg);
  }

  30% {
    opacity: 1;
  }

  to {
    transform: rotateX(0deg);
  }
}

@keyframes contact-fly {
  from {
    opacity: 0;
    transform: translate(-18px, 22px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes contact-press {
  0% {
    opacity: 0;
    transform: scale(1.8) rotate(-14deg);
  }

  60% {
    opacity: 1;
  }

  100% {
    opacity: 1;
    transform: scale(1) rotate(-6deg);
  }
}
</style>
