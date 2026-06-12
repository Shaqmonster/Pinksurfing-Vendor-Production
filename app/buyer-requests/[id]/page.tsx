import BuyerRequestDetailClient from "./buyer-request-detail-client";

/** Static export shell — real request id comes from useParams() on the client. */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function BuyerRequestDetailPage() {
  return <BuyerRequestDetailClient />;
}
