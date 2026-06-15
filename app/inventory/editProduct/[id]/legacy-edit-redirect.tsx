"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Loader from "@/components/common/Loader";
import {
  editProductHref,
  resolveStaticRouteId,
} from "@/utils/staticRouteId";

export default function LegacyEditProductRedirect() {
  const params = useParams();

  useEffect(() => {
    const id = resolveStaticRouteId(params?.id as string);
    const target = id ? editProductHref(id) : "/inventory/products";
    window.location.replace(target);
  }, [params?.id]);

  return <Loader />;
}
