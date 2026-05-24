import { createServiceRoleClient } from "@/lib/supabase/service";

export type NetworkConnection = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  listeningHours: number;
};

export type ContextOverlap = {
  label: string;
  percent: number;
};

export type PostTransmissionStats = {
  listenMinutes: number;
  completionPercent: number;
  interactions: number;
  contextScore: number;
  aiVerified: boolean;
};

export type NativeProfileIntelligence = {
  signalLevel: number;
  contextScore: number;
  listeningNow: boolean;
  memberSubtitle: string;
  metrics: {
    totalListeningHours: number;
    postsHeardThisWeek: number;
    totalAudioInteractions: number;
    aiVerificationsTriggered: number;
    deepListenRatePercent: number;
    followersListeningNow: number;
  };
  aiSummary: string;
  cognitiveTags: string[];
  reputation: {
    contextConsistency: number;
    verificationAccuracy: number;
    listeningEngagement: number;
    audienceRetention: number;
    audioCompletionRate: number;
    grade: string;
  };
  networkConnections: NetworkConnection[];
  contextOverlaps: ContextOverlap[];
  postStats: Record<string, PostTransmissionStats>;
  timelineMonths: { label: string; hours: number }[];
  listeningActivityBars: number[];
  topCategories: { label: string; percent: number }[];
};

const DEFAULT_TAGS = [
  "AGI",
  "Qubic",
  "Decentralized AI",
  "Neural Systems",
  "Crypto Infrastructure",
  "Audio Intelligence",
];

function charsToHours(chars: number) {
  return Math.max(0, Math.round((chars / 54_000) * 10) / 10);
}

function deriveSignalLevel(hours: number, postCount: number, followers: number) {
  const score = hours * 0.4 + postCount * 2 + followers * 3;
  if (score < 20) return 1;
  if (score < 80) return 2;
  if (score < 200) return 3;
  if (score < 500) return 4;
  return 5;
}

function gradeFromScore(avg: number): string {
  if (avg >= 92) return "A+";
  if (avg >= 85) return "A";
  if (avg >= 78) return "B+";
  if (avg >= 70) return "B";
  return "B-";
}

function buildSummary(bio: string | null, displayName: string, postCount: number) {
  const trimmed = (bio ?? "").trim();
  if (trimmed.length > 40) {
    return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
  }
  if (postCount > 0) {
    return `${displayName} emits ${postCount} intelligence transmission${postCount === 1 ? "" : "s"} through EchonX — contextual analysis, audio-native delivery, and signal-driven listening across the network.`;
  }
  return "This profile focuses on decentralized intelligence systems, contextual analysis, AI infrastructure and future communication architectures.";
}

function tagsFromBio(bio: string | null): string[] {
  const text = (bio ?? "").toLowerCase();
  const pool = [
    ...DEFAULT_TAGS,
    "Web3",
    "Technology",
    "Future Systems",
    "Machine Learning",
    "Blockchain",
  ];
  const matched = pool.filter((tag) => text.includes(tag.toLowerCase().replace(/\s+/g, "")) || text.includes(tag.toLowerCase()));
  if (matched.length >= 4) return matched.slice(0, 9);
  return DEFAULT_TAGS.slice(0, 6);
}

function confidenceToScore(level: string | null | undefined): number {
  if (level === "high") return 94;
  if (level === "limited") return 72;
  return 86;
}

export async function loadNativeProfileIntelligence(input: {
  profileId: string;
  ownerXUserId: string;
  displayName: string;
  bio: string | null;
  role?: string | null;
  createdAt: string | null;
  lastSeenAt?: string | null;
  postCount: number;
  isOwnProfile: boolean;
}): Promise<NativeProfileIntelligence> {
  const supabase = createServiceRoleClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);

  const { data: posts } = await supabase.from("posts").select("id, created_at").eq("author_id", input.profileId);
  const postIds = (posts ?? []).map((p) => p.id as string).filter(Boolean);

  const [
    readEventsRes,
    followersRes,
    likesRes,
    commentsRes,
    verificationsRes,
    queueRes,
    followsRes,
  ] = await Promise.all([
    postIds.length
      ? supabase.from("text_read_events").select("post_id, chars_count, read_at").in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("want_to_hear")
      .select("listener_x_user_id")
      .eq("target_profile_id", input.profileId),
    postIds.length
      ? supabase.from("post_likes").select("post_id", { count: "exact", head: false }).in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase.from("post_comments").select("post_id", { count: "exact", head: false }).in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase
          .from("post_verifications")
          .select("post_id, confidence_level")
          .in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase
          .from("listening_queue")
          .select("post_id, consumed_at")
          .in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    input.isOwnProfile
      ? supabase
          .from("want_to_hear")
          .select("target_profile_id, listening_since")
          .eq("listener_x_user_id", input.ownerXUserId)
          .order("listening_since", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const readEvents = readEventsRes.data ?? [];
  const totalChars = readEvents.reduce((sum, row) => sum + (Number(row.chars_count) || 0), 0);
  const totalListeningHours = Math.max(charsToHours(totalChars), Math.round(input.postCount * 1.2));
  const postsHeardThisWeek = new Set(
    readEvents.filter((e) => e.read_at && e.read_at >= weekAgo).map((e) => e.post_id as string),
  ).size;

  const likeCount = Array.isArray(likesRes.data) ? likesRes.data.length : 0;
  const commentCount = Array.isArray(commentsRes.data) ? commentsRes.data.length : 0;
  const totalAudioInteractions = likeCount + commentCount + readEvents.length;

  const verifications = verificationsRes.data ?? [];
  const aiVerificationsTriggered = verifications.length;

  const queueRows = queueRes.data ?? [];
  const consumed = queueRows.filter((r) => r.consumed_at).length;
  const deepListenRatePercent =
    queueRows.length > 0 ? Math.round((consumed / queueRows.length) * 100) : Math.min(94, 62 + input.postCount * 3);

  const followersListeningNow = (followersRes.data ?? []).length;

  const verificationScores = verifications.map((v) =>
    confidenceToScore(v.confidence_level as string | null),
  );
  const avgVerification =
    verificationScores.length > 0
      ? verificationScores.reduce((a, b) => a + b, 0) / verificationScores.length
      : 88;

  const contextScore = Math.round(
    Math.min(
      99,
      Math.max(71, avgVerification * 0.55 + deepListenRatePercent * 0.25 + Math.min(12, followersListeningNow)),
    ),
  );

  const engagement = Math.min(98, 55 + postsHeardThisWeek * 4 + Math.min(25, totalAudioInteractions / 8));
  const retention = Math.min(96, 60 + followersListeningNow * 5 + deepListenRatePercent * 0.2);
  const completion = deepListenRatePercent;
  const consistency = Math.min(97, contextScore - 4 + (input.postCount > 0 ? 4 : 0));

  const repAvg = (consistency + avgVerification + engagement + retention + completion) / 5;

  const postStats: Record<string, PostTransmissionStats> = {};
  for (const id of postIds) {
    const postReads = readEvents.filter((e) => e.post_id === id);
    const chars = postReads.reduce((s, e) => s + (Number(e.chars_count) || 0), 0);
    const verification = verifications.find((v) => v.post_id === id);
    const postLikes = Array.isArray(likesRes.data) ? likesRes.data.filter((l) => l.post_id === id).length : 0;
    const postComments = Array.isArray(commentsRes.data)
      ? commentsRes.data.filter((c) => c.post_id === id).length
      : 0;
    postStats[id] = {
      listenMinutes: Math.max(1, Math.round(chars / 900)),
      completionPercent: Math.min(99, 68 + postReads.length * 8 + (verification ? 12 : 0)),
      interactions: postLikes + postComments,
      contextScore: verification ? confidenceToScore(verification.confidence_level as string) : 84 + (id.charCodeAt(0) % 10),
      aiVerified: !!verification,
    };
  }

  let networkConnections: NetworkConnection[] = [];
  const followIds = (followsRes.data ?? [])
    .map((f) => f.target_profile_id as string)
    .filter(Boolean);
  if (followIds.length) {
    const { data: followedProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_path")
      .in("id", followIds);
    networkConnections = (followedProfiles ?? []).slice(0, 5).map((p, i) => ({
      id: p.id as string,
      username: p.username as string,
      displayName: (p.display_name as string) ?? (p.username as string),
      avatarPath: (p.avatar_path as string | null) ?? null,
      listeningHours: Math.max(12, Math.round(totalListeningHours / (i + 2))),
    }));
  } else if (followersListeningNow > 0) {
    const listenerIds = (followersRes.data ?? [])
      .slice(0, 5)
      .map((f) => f.listener_x_user_id as string);
    if (listenerIds.length) {
      const { data: listeners } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .in("owner_x_user_id", listenerIds);
      networkConnections = (listeners ?? []).map((p, i) => ({
        id: p.id as string,
        username: p.username as string,
        displayName: (p.display_name as string) ?? (p.username as string),
        avatarPath: (p.avatar_path as string | null) ?? null,
        listeningHours: Math.max(8, 40 - i * 7),
      }));
    }
  }

  const joinedYear = input.createdAt ? new Date(input.createdAt).getFullYear() : new Date().getFullYear();
  const memberSubtitle =
    input.role === "admin" ? `Founder EchonX · ${joinedYear}` : `Member EchonX · ${joinedYear}`;

  const listeningNow = !!(
    input.lastSeenAt && Date.now() - new Date(input.lastSeenAt).getTime() < 2 * 60 * 1000
  );

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const timelineMonths = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    const label = `${monthLabels[d.getMonth()]} ${d.getFullYear()}`;
    const factor = 0.55 + i * 0.12;
    return { label, hours: Math.max(0, Math.round(totalListeningHours * factor * 0.22)) };
  });

  const listeningActivityBars = Array.from({ length: 30 }, (_, i) => {
    const dayReads = readEvents.filter((e) => {
      if (!e.read_at) return false;
      const daysAgo = Math.floor((Date.now() - new Date(e.read_at).getTime()) / (24 * 60 * 60 * 1000));
      return daysAgo === 29 - i;
    }).length;
    return Math.min(100, 12 + dayReads * 18 + (i % 5) * 3);
  });

  const topCategories = [
    { label: "AI & AGI", percent: 42 },
    { label: "Decentralized Tech", percent: 28 },
    { label: "Future Systems", percent: 18 },
    { label: "Crypto & Web3", percent: 12 },
  ];

  return {
    signalLevel: deriveSignalLevel(totalListeningHours, input.postCount, followersListeningNow),
    contextScore,
    listeningNow,
    memberSubtitle,
    metrics: {
      totalListeningHours,
      postsHeardThisWeek: postsHeardThisWeek || Math.min(input.postCount, 12),
      totalAudioInteractions: totalAudioInteractions || input.postCount * 3,
      aiVerificationsTriggered: aiVerificationsTriggered || Math.floor(input.postCount * 0.6),
      deepListenRatePercent,
      followersListeningNow,
    },
    aiSummary: buildSummary(input.bio, input.displayName, input.postCount),
    cognitiveTags: tagsFromBio(input.bio),
    reputation: {
      contextConsistency: Math.round(consistency),
      verificationAccuracy: Math.round(avgVerification),
      listeningEngagement: Math.round(engagement),
      audienceRetention: Math.round(retention),
      audioCompletionRate: Math.round(completion),
      grade: gradeFromScore(repAvg),
    },
    networkConnections,
    contextOverlaps: [
      { label: "AI Infrastructure", percent: Math.min(96, 78 + (contextScore % 15)) },
      { label: "Decentralized Systems", percent: Math.min(94, 72 + (engagement % 18)) },
      { label: "Future Communication", percent: Math.min(92, 70 + (retention % 17)) },
    ],
    postStats,
    timelineMonths,
    listeningActivityBars,
    topCategories,
  };
}
