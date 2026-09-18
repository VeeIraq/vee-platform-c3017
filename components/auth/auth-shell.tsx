import Image from "next/image";
import { Link } from "next-view-transitions";
import type { ReactNode } from "react";

export function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fog px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center" aria-label="Vee">
          <Image src="/brand/vee-logo-black.png" alt="Vee" width={110} height={38} />
        </Link>
        <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-6 shadow-md sm:p-8">
          <h1 className="text-center text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1.5 text-center text-sm text-ink-muted">{sub}</p>
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}
