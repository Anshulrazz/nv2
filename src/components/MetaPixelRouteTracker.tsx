"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaEvent } from "@/lib/metaPixel";

export default function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const trackedNewUser = useRef(false);

  useEffect(() => {
    if (searchParams.get("is_new_user") === "true" && !trackedNewUser.current) {
      trackedNewUser.current = true;
      trackMetaEvent("CompleteRegistration", { method: "google" });
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackMetaEvent("PageView");
  }, [pathname, searchParams]);

  return null;
}
