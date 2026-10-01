import { Suspense } from "react";
import Script from "next/script";
import { AnalyticsPageViews } from "@/components/AnalyticsPageViews";

type Props = { measurementId: string };

export function AnalyticsScripts({ measurementId }: Props) {
  if (!measurementId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="scpo-ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: false });
`}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsPageViews measurementId={measurementId} />
      </Suspense>
    </>
  );
}
