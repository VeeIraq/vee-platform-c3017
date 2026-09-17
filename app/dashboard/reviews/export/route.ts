import { NextResponse } from "next/server";
import { requireBusinessMembership } from "@/lib/auth/dal";
import { getReviewPageForBusiness, getReviewResults } from "@/lib/data/reviews";

// First Route Handler in this app -- justified specifically because a
// Server Action cannot set a Content-Disposition header or return an
// arbitrary file download; every other write/read in the dashboard goes
// through Server Actions / Server Components as usual (see AGENTS/handoff
// notes on this convention).
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

  let membership;
  try {
    membership = await requireBusinessMembership(businessId);
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!(membership.role === "owner" || membership.permissions.includes("reviews.manage"))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const page = await getReviewPageForBusiness(businessId);
  if (!page) return NextResponse.json({ error: "No review page configured" }, { status: 404 });

  const results = await getReviewResults(page.id, page.questions.map((q) => q.id));
  const questionHeaders = page.questions.map((q) => q.prompt.en || q.id);

  const header = ["submitted_at", "status", "average_rating", ...questionHeaders, "comment"];
  const rows = results.submissions.map((s) => {
    const questionCells = page.questions.map((q) => (s.ratings[q.id] != null ? String(s.ratings[q.id]) : ""));
    return [s.createdAt, s.status, s.averageRating.toFixed(2), ...questionCells, s.comment ?? ""].map((v) => csvEscape(String(v)));
  });

  const csv = [header.map(csvEscape).join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reviews-${businessId}.csv"`,
    },
  });
}
