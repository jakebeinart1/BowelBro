export default function SuccessPage() {
  return (
    <div className="max-w-xl mx-auto text-center space-y-3">
      <h1 className="text-3xl font-bold">Thanks for your order 🎉</h1>
      <p>We’ve received your payment. You’ll get an email when your order ships.</p>
      <a className="underline" href="/products">
        Continue shopping
      </a>
    </div>
  )
}
