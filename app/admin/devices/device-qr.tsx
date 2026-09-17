"use client";

import { useState } from "react";
import QRCode from "qrcode";

// Renders a printable QR code for a device's /d/{serial} redirect URL.
// Generated entirely client-side as inline SVG (no external QR image
// service, no network call, no canvas dependency) so it works the same
// in dev, in a sandboxed build, and in production.
export function DeviceQr({ serial }: { serial: string }) {
  const [open, setOpen] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const targetUrl = siteUrl ? `${siteUrl}/d/${serial}` : `/d/${serial}`;

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (svg) return;
    try {
      const markup = await QRCode.toString(targetUrl, {
        type: "svg",
        margin: 1,
        width: 220,
        color: { dark: "#241f1b", light: "#fcfaf5" },
      });
      setSvg(markup);
    } catch {
      setError("Couldn't generate the QR code.");
    }
  }

  function download() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vee-${serial}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={toggle}
        className="min-h-9 rounded-[var(--radius-sm)] border border-line px-2.5 text-xs font-semibold text-ink-soft hover:bg-fog"
      >
        {open ? "Hide QR" : "QR code"}
      </button>
      {open && (
        <div className="mt-2 w-64 rounded-[var(--radius-md)] border border-line bg-fog p-3">
          {error && <p className="text-xs text-danger">{error}</p>}
          {!error && !svg && <p className="text-xs text-ink-muted">Generating…</p>}
          {svg && (
            <>
              <div
                className="mx-auto w-40 overflow-hidden rounded-[var(--radius-sm)] bg-paper p-2"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <p className="mt-2 break-all text-center font-mono text-[10px] text-ink-muted">{targetUrl}</p>
              <button
                type="button"
                onClick={download}
                className="mt-2 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-white"
              >
                Download SVG
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
