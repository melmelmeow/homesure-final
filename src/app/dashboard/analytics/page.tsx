import { getServerSupabase } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: gscMetrics } = await supabase.from("gsc_metrics").select("*").order("impressions", { ascending: false });
  const { data: searchLogs } = await supabase.from("search_demand_logs").select("*").order("created_at", { ascending: false }).limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-4">GSC Search Performance</h2>
          {gscMetrics && gscMetrics.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">URL</th>
                  <th className="border p-2 text-left">Query</th>
                  <th className="border p-2 text-left">Clicks</th>
                  <th className="border p-2 text-left">Impressions</th>
                  <th className="border p-2 text-left">CTR</th>
                  <th className="border p-2 text-left">Position</th>
                </tr>
              </thead>
              <tbody>
                {gscMetrics.slice(0, 20).map((m: any) => (
                  <tr key={m.id}>
                    <td className="border p-2 text-xs truncate max-w-xs">{m.url}</td>
                    <td className="border p-2">{m.query}</td>
                    <td className="border p-2">{m.clicks}</td>
                    <td className="border p-2">{m.impressions}</td>
                    <td className="border p-2">{(m.ctr * 100).toFixed(2)}%</td>
                    <td className="border p-2">{m.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No GSC data available. Run the GSC sync cron.</p>
          )}
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-4">Recent Search Logs</h2>
          {searchLogs && searchLogs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Query</th>
                  <th className="border p-2 text-left">Location</th>
                  <th className="border p-2 text-left">Min Price</th>
                  <th className="border p-2 text-left">Max Price</th>
                  <th className="border p-2 text-left">Results</th>
                  <th className="border p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {searchLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="border p-2">{log.search_query || "(view)"}</td>
                    <td className="border p-2">{log.location_tag || "-"}</td>
                    <td className="border p-2">{log.price_min ? `₱${log.price_min.toLocaleString()}` : "-"}</td>
                    <td className="border p-2">{log.price_max ? `₱${log.price_max.toLocaleString()}` : "-"}</td>
                    <td className="border p-2">{log.results_returned}</td>
                    <td className="border p-2">{new Date(log.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No search logs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
