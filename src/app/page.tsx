import LandingPage from "@/components/landing/LandingPage";
import { getLandingData } from "@/lib/landing";

// Public data only (no cookies are read), so Next can build this page once and refresh it in the
// background every minute instead of querying Supabase for every visitor.
export const revalidate = 60;

export default async function HomePage() {
  const { stats, barangayCounts, featured } = await getLandingData();
  return <LandingPage stats={stats} barangayCounts={barangayCounts} featured={featured} />;
}
