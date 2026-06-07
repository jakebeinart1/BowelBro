const MARKUP = 5
const TAX_RATE = 0.08
const STRIPE_RATE = 0.03
const SHIPPING_BASE = 4.99

// Every shirt uses the same size-based price ladder regardless of product or
// garment, so customers see consistent pricing across the catalog. Derived from
// the variant size (the last "/"-separated token in the variant name).
const BASE_SHIRT_PRICE = 27.02
const SIZE_SURCHARGE: Record<string, number> = {
  '2XL': 2,
  XXL: 2,
  '3XL': 4,
  XXXL: 4,
  '4XL': 6,
  '5XL': 8
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export function normalizedShirtPrice(variantName: string): number {
  const size = (variantName.split('/').pop() ?? '').trim().toUpperCase()
  return roundCurrency(BASE_SHIRT_PRICE + (SIZE_SURCHARGE[size] ?? 0))
}

export function consumerPrice(baseCost: number) {
  const preTax = baseCost + MARKUP
  const withTax = preTax * (1 + TAX_RATE)
  const withStripe = withTax * (1 + STRIPE_RATE)
  return roundCurrency(withStripe)
}

export function shippingPrice() {
  return roundCurrency(SHIPPING_BASE)
}

export function formatCurrency(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
}
