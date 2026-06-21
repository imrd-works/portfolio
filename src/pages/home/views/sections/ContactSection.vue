<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PageSection, Motion, Text, Button } from '@/shared/ui'
import { useContactForm } from '../../composables/useContactForm'
import { contactChannels, socials } from '../../model/portfolio'

const { t } = useI18n()
const { form, loading, sent, submit, reset } = useContactForm()
</script>

<template>
  <PageSection
    id="contact"
    relative
    padding-top="none"
    padding-bottom="band-sm"
  >
    <Motion
      preset="fade-up"
      trigger="visible"
      tag="div"
      class="contact__card"
    >
      <span class="contact__halo"></span>
      <div class="contact__grid">
        <div class="contact__info">
          <Text
            tag="h2"
            variant="display-l"
            class="contact__title"
          >
            <i18n-t
              keypath="home.contact.title"
              scope="global"
            >
              <template #br><br /></template>
              <template #accent>
                <span class="contact__title-accent">{{ t('home.contact.titleAccent') }}</span>
              </template>
            </i18n-t>
          </Text>
          <Text
            tag="p"
            variant="body-m"
            tone="secondary"
            class="contact__lead"
          >
            {{ t('home.contact.lead') }}
          </Text>

          <div class="contact__channels">
            <a
              v-magnetic
              :href="contactChannels.telegramUrl"
              target="_blank"
              rel="noopener"
              class="contact__channel"
            >
              <span class="contact__channel-label">
                <span class="contact__channel-icon">✈</span> {{ t('home.contact.links.telegram') }}
              </span>
              <span class="contact__channel-value">{{ contactChannels.telegramHandle }} ↗</span>
            </a>
            <a
              v-magnetic
              :href="`mailto:${contactChannels.email}`"
              class="contact__channel"
            >
              <span class="contact__channel-label">
                <span class="contact__channel-icon">✉</span> {{ t('home.contact.links.email') }}
              </span>
              <span class="contact__channel-value">{{ contactChannels.email }} ↗</span>
            </a>
            <!-- <a
              v-magnetic
              :href="contactChannels.phoneUrl"
              class="contact__channel"
            >
              <span class="contact__channel-label">
                <span class="contact__channel-icon">☎</span> {{ t('home.contact.links.phone') }}
              </span>
              <span class="contact__channel-value">{{ contactChannels.phone }} ↗</span>
            </a> -->
            <div class="contact__socials">
              <Button
                v-for="social in socials"
                :key="social.label"
                v-magnetic
                :tag="social.href ? 'a' : 'button'"
                variant="outline"
                size="s"
                :href="social.href"
                :target="social.href ? '_blank' : undefined"
                :rel="social.href ? 'noopener' : undefined"
                :disabled="!social.href"
                class="contact__social"
              >
                {{ social.label }}
              </Button>
            </div>
          </div>
        </div>

        <transition
          name="fade"
          mode="out-in"
        >
          <form
            v-if="!sent"
            key="form"
            class="contact__form"
            @submit.prevent="submit"
          >
            <label
              class="contact__field"
              for="contact-name"
            >
              <Text
                tag="span"
                variant="label-s"
                tone="tertiary"
                class="contact__label"
              >
                {{ t('home.contact.form.name') }}
              </Text>
              <input
                id="contact-name"
                v-model="form.name"
                class="contact__input"
                type="text"
                required
              />
            </label>
            <label
              class="contact__field"
              for="contact-handle"
            >
              <Text
                tag="span"
                variant="label-s"
                tone="tertiary"
                class="contact__label"
              >
                {{ t('home.contact.form.contact') }}
              </Text>
              <input
                id="contact-handle"
                v-model="form.contact"
                class="contact__input"
                type="text"
                required
              />
            </label>
            <label
              class="contact__field"
              for="contact-about"
            >
              <Text
                tag="span"
                variant="label-s"
                tone="tertiary"
                class="contact__label"
              >
                {{ t('home.contact.form.about') }}
              </Text>
              <textarea
                id="contact-about"
                v-model="form.message"
                class="contact__input contact__input--area"
                rows="4"
                required
              ></textarea>
            </label>
            <Button
              v-magnetic
              variant="brand"
              type="submit"
              size="l"
              class="contact__submit"
              :disabled="loading"
            >
              {{ loading ? t('home.contact.form.sending') : t('home.contact.form.submit') }}
            </Button>
          </form>

          <div
            v-else
            key="done"
            class="contact__done"
          >
            <div
              class="contact__check"
              aria-hidden="true"
            >
              ✓
            </div>
            <Text
              tag="h3"
              variant="heading-l"
              class="contact__done-title"
            >
              {{ t('home.contact.success.title') }}
            </Text>
            <Text
              tag="p"
              variant="body-m"
              tone="secondary"
              class="contact__done-text"
            >
              {{ t('home.contact.success.text') }}
            </Text>
            <Button
              v-magnetic
              variant="outline"
              size="m"
              class="contact__again"
              @click="reset"
            >
              <span
                class="contact__again-icon"
                aria-hidden="true"
                >↺</span
              >
              {{ t('home.contact.success.again') }}
            </Button>
          </div>
        </transition>
      </div>
    </Motion>

    <footer class="contact__footer">
      <Text
        tag="span"
        variant="heading-xs"
        class="contact__footer-name"
      >
        {{ t('home.footer.name') }}
      </Text>
      <Text
        tag="span"
        variant="caption"
        tone="tertiary"
        class="contact__footer-note"
      >
        {{ t('home.footer.note') }}
      </Text>
    </footer>
  </PageSection>
</template>

<style lang="scss" scoped>
/** @define contact */
.contact__card {
  position: relative;
  padding: clamp(34px, 5vw, 68px);
  overflow: hidden;
  background: linear-gradient(
    160deg,
    rgb(99 102 241 / 14%),
    rgb(167 139 250 / 5%),
    rgb(255 255 255 / 1%)
  );
  border: 1px solid var(--color-border-default);
  border-radius: 32px;
}

.contact__halo {
  position: absolute;
  top: -30%;
  right: -10%;
  width: 50%;
  height: 160%;
  pointer-events: none;
  background: radial-gradient(circle, rgb(167 139 250 / 25%), transparent 60%);
  filter: blur(40px);
}

.contact__grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 50px;

  @media (min-width: 860px) {
    grid-template-columns: 1fr 1fr;
  }
}

.contact__title {
  margin: 0 0 22px;
}

.contact__title-accent {
  font-family: var(--font-family-serif);
  font-weight: 400;
  font-style: italic;
  background: var(--gradient-accent);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.contact__lead {
  max-width: 420px;
  margin: 0 0 30px;
}

.contact__channels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact__channel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  color: var(--color-text-primary);
  text-decoration: none;
  background: var(--color-bg-surface-sunken);
  border: 1px solid var(--color-border-default);
  border-radius: 16px;
  transition:
    border-color 0.3s,
    transform 0.3s;

  &:hover {
    border-color: rgb(167 139 250 / 45%);
  }
}

.contact__channel-label {
  display: flex;
  gap: 12px;
  align-items: center;
}

.contact__channel-icon {
  color: var(--color-accent);
}

.contact__channel-value {
  color: var(--color-text-tertiary);
}

.contact__socials {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.contact__social {
  flex: 1;
}

.contact__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact__input {
  width: 100%;
  padding: 15px 18px;
  font-family: var(--font-family-sans);
  font-size: 15px;
  color: var(--color-text-primary);
  background: rgb(8 6 20 / 50%);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-field);
  outline: none;
  transition:
    border-color 0.25s,
    background 0.25s;

  &:focus {
    background: rgb(8 6 20 / 80%);
    border-color: rgb(167 139 250 / 70%);
  }

  &--area {
    resize: vertical;
  }
}

.contact__submit {
  width: 100%;
  margin-top: 4px;
}

.contact__done {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: flex-start;
  justify-content: center;
  min-height: 360px;
  padding: 6px;
}

.contact__check {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  font-size: 30px;
  color: var(--color-on-accent);
  background: var(--gradient-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-glow);
  animation: floaty 3s ease-in-out infinite;
}

.contact__done-title {
  margin: 0;
}

.contact__done-text {
  max-width: 360px;
  margin: 0;
}

.contact__again {
  margin-top: 6px;
}

.contact__again-icon {
  color: var(--color-accent);
}

.contact__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 26px;
  margin-top: 46px;
  border-top: 1px solid var(--color-border-subtle);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
