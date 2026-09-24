import { describe, expect, it } from 'vitest'
import { typograph, typographMessages } from './typograph'

const N = ' '

describe('typograph', () => {
  it('keeps a short Russian word with the word after it', () => {
    expect(typograph('Работаю в команде и с нуля', 'ru')).toBe(
      `Работаю в${N}команде и${N}с${N}нуля`
    )
    expect(typograph('для продукта или сайта', 'ru')).toBe(`для${N}продукта или${N}сайта`)
  })

  it('never lets a line start with a dash, or split a number from its word', () => {
    expect(typograph('Путь — это рост', 'ru')).toBe(`Путь${N}— это рост`)
    expect(typograph('25+ систем за 2 года', 'ru')).toBe(`25+${N}систем за${N}2${N}года`)
  })

  it('keeps particles with the word before them', () => {
    expect(typograph('Сделал бы иначе', 'ru')).toBe(`Сделал${N}бы иначе`)
  })

  it('leaves long words, links and placeholders alone', () => {
    expect(typograph('imld.works@yandex.ru', 'ru')).toBe('imld.works@yandex.ru')
    expect(typograph('Меня зовут {name}, пишите', 'ru')).toBe('Меня зовут {name}, пишите')
  })

  it('binds the short English words too', () => {
    expect(typograph('I lead a team to the release', 'en')).toBe(
      `I${N}lead a${N}team to${N}the${N}release`
    )
  })

  it('walks a whole message tree', () => {
    expect(typographMessages({ a: { b: 'в доме' }, c: ['и сад'] }, 'ru')).toEqual({
      a: { b: `в${N}доме` },
      c: [`и${N}сад`],
    })
  })
})
