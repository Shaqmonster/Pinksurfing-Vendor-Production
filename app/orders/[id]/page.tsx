import OrderDetailClient from "./order-detail-client";

/** Static export shell — real order id comes from useParams() on the client. */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
