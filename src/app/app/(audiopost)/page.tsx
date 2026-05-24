import { AudiopostDashboard } from "@/components/app/audiopost-dashboard";
import { getEchonXReadingRecommendation } from "@/server/actions/recommended-reading";

export default async function AppHomePage() {
  const fixedRecommendation = await getEchonXReadingRecommendation();
  return <AudiopostDashboard fixedRecommendation={fixedRecommendation} />;
}
