import { Suspense } from "react";
import Script from "next/script";
import { AnalyticsPageViews } from "@/components/AnalyticsPageViews";

type Props = { measurementId: string };

export function AnalyticsScripts({ measurementId }: Props) {
  if (!measurementId) return null;
  return (
    <>
      {/* Google tag (gtag.js) — same as GA4 “View tag instructions”; ID comes from Admin → Analytics. */}
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-gtag" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');
`}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsPageViews measurementId={measurementId} />
      </Suspense>
    </>
  );
}
