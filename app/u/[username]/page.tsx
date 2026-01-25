import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStatsDateRangeByUserId } from "@/app/actions/writing-stats";
import { transformToHeatmapData } from "@/lib/stats-transform";
import ProfileHeatmap from "@/components/profile/ProfileHeatmap";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get current user (may be null if not logged in)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch profile by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profile.id;

  // Fetch public documents for this user
  const { data: publicDocuments } = await supabase
    .from("documents")
    .select("id, title, word_count, updated_at, published_at")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  // Fetch writing stats for heatmap (current year)
  const currentYear = new Date().getFullYear();
  const heatmapStartDate = `${currentYear}-01-01`;
  const heatmapEndDate = `${currentYear}-12-31`;

  const stats = await getStatsDateRangeByUserId(
    profile.id,
    heatmapStartDate,
    heatmapEndDate
  );
  const heatmapData = transformToHeatmapData(stats);

  // Calculate total words from public documents
  const totalPublicWords = publicDocuments?.reduce(
    (sum, doc) => sum + (doc.word_count || 0),
    0
  ) || 0;

  return (
    <main className="min-h-screen bg-background">
      {/* Simple header for public profile */}
      <header className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-text">Storyhenge</h1>
          </Link>
          {currentUser ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text transition-colors font-sans"
            >
              返回儀表板
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors font-sans"
            >
              登入
            </Link>
          )}
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-primary">
                {(profile.display_name || profile.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-text truncate">
                {profile.display_name || profile.username}
              </h2>
              {isOwnProfile && (
                <Link
                  href="/settings/profile"
                  className="text-sm text-text/50 hover:text-text transition-colors font-sans"
                >
                  編輯
                </Link>
              )}
            </div>
            <p className="text-text/50 font-sans mb-3">@{profile.username}</p>
            {profile.bio && (
              <p className="text-text/70 font-sans">{profile.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex gap-6 mt-4">
              <div>
                <span className="text-xl font-bold text-text tabular-nums">
                  {publicDocuments?.length || 0}
                </span>
                <span className="text-sm text-text/50 font-sans ml-1">公開作品</span>
              </div>
            </div>

            {/* Writing Heatmap - aligned with info column */}
            <div className="mt-6">
              <ProfileHeatmap data={heatmapData} />
            </div>
          </div>
        </div>

        {/* Public Works */}
        <div>
          <h3 className="text-xl font-bold text-text mb-4">公開作品</h3>
          {publicDocuments && publicDocuments.length > 0 ? (
            <div className="grid gap-3">
              {publicDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/u/${username}/${doc.id}`}
                  className="bg-white rounded-lg border border-border p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-lg font-semibold text-text">
                      {doc.title}
                    </h4>
                    <span className="text-sm text-text/50 font-sans tabular-nums">
                      {doc.word_count?.toLocaleString() || 0} 字
                    </span>
                  </div>
                  <p className="text-sm text-text/50 font-sans">
                    {doc.published_at
                      ? `發佈於 ${new Date(doc.published_at).toLocaleDateString("zh-TW", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`
                      : `更新於 ${new Date(doc.updated_at).toLocaleDateString("zh-TW", {
                        month: "long",
                        day: "numeric",
                      })}`}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-border p-12 text-center">
              <p className="text-text/50 font-sans">
                {isOwnProfile
                  ? "你還沒有公開任何作品"
                  : "這位作者還沒有公開作品"}
              </p>
              {isOwnProfile && (
                <Link
                  href="/documents"
                  className="inline-block mt-4 px-6 py-2 text-sm text-primary hover:text-primary/80 transition-colors font-sans"
                >
                  前往我的文件
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
