import { AdminDashboard } from "@/components/app/admin-dashboard";
import { isOpenAiConfigured } from "@/lib/ai/openai-verify";
import { getOfficialNewsChannel } from "@/server/actions/official-channel";
import { getOfficialQubicChannel } from "@/server/actions/official-channel-qubic";
import { getEchonXReadingRecommendation } from "@/server/actions/recommended-reading";

export default async function AdminPage() {
  const [recommendation, officialChannel, qubicChannel] = await Promise.all([
    getEchonXReadingRecommendation(),
    getOfficialNewsChannel(),
    getOfficialQubicChannel(),
  ]);
  return (
    <AdminDashboard
      initialRecommendation={recommendation}
      initialOfficialChannel={officialChannel}
      initialQubicChannel={qubicChannel}
      openAiConfigured={isOpenAiConfigured()}
    />
  );
}
