"use client";

import { useEffect } from "react";

// Last-resort boundary: fires only if RootLayout itself throws while
// rendering, which means <LocaleProvider> and every other provider may
// never have mounted. Per Next.js's documented pattern, this file must
// render its own <html>/<body> (it replaces the root layout entirely) and
// deliberately does not depend on globals.css, fonts, or app components --
// all of those could be part of what failed. Kept in English only and
// inline-styled for that reason, not as an i18n oversight.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f4f2ee",
          color: "#1c1a17",
          textAlign: "center",
          padding: "16px",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#b3261e" }}>
          Something went wrong
        </p>
        <p style={{ marginTop: 8, maxWidth: 360, fontSize: 14, color: "#6b665e" }}>
          An unexpected error occurred and this page couldn&apos;t load. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 24,
            minHeight: 44,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#7a3a28",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
