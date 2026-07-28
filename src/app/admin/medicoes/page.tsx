import { AdminMetricsView } from "@/views/admin/metrics-view";

export default function AdminMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  return <AdminMetricsView searchParams={searchParams} />;
}
