import { getMetrics } from "@/lib/analytics";
import { requireAdmin, isAdminLocked } from "@/lib/admin/auth";
import { getCatalogBackend } from "@/lib/catalog";

import { AdminShell } from "./admin-shell";
import { MetricsBoard } from "./metrics-board";

/** Windows the shop can ask for. Kept short — more choices, less thinking. */
const RANGES = [7, 30, 90] as const;
export type MetricsRange = (typeof RANGES)[number];

const parseRange = (value: string | undefined): MetricsRange => {
  const days = Number(value);
  return (RANGES as readonly number[]).includes(days)
    ? (days as MetricsRange)
    : 30;
};

export interface AdminMetricsViewProps {
  searchParams: Promise<{ dias?: string }>;
}

/** "Medições" — what the site did, and which pieces people asked about. */
export const AdminMetricsView = async ({
  searchParams,
}: AdminMetricsViewProps) => {
  await requireAdmin();

  const days = parseRange((await searchParams).dias);
  const [summary, locked] = await Promise.all([
    getMetrics(days),
    isAdminLocked(),
  ]);

  return (
    <AdminShell
      backend={getCatalogBackend()}
      locked={locked}
      tab="medicoes"
      title="Medições"
    >
      <MetricsBoard summary={summary} ranges={[...RANGES]} />
    </AdminShell>
  );
};
