import React from 'react'

export default function ProductDetail({ params }: { params: { id: string } }) {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Product {params.id}</h1>
      <p>Build out variant selection and Add to Cart here.</p>
    </div>
  );
}
