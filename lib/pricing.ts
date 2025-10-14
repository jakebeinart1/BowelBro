const MARKUP = 5
const TAX_RATE = 0.08
const STRIPE_RATE = 0.03
const SHIPPING_BASE = 4.99

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
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
