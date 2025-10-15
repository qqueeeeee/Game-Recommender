"use client";
import { useState } from "react";

// Utility: Extract SteamID or custom profile name from input.
function extractSteamId(input: string): string | null {
  input = input.trim();
  const directIdRegex = /^[0-9]{17}$/;
  const profileRegex = /steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)/i;
  // If input is just the numeric SteamID
  if (directIdRegex.test(input)) {
    return input;
  }
  // If input is a profile/custom URL
  const match = input.match(profileRegex);
  if (match && match[2]) {
    return match[2];
  }
  return null;
}

// Stub: Recommend games user owns but hasn't played (playtime < 1h)
function recommendGames(games: any[]): any[] {
  return games.filter(
    (game) => (game.playtime_forever ?? 0) < 60
  ).slice(0, 3); // Pick top 3 unplayed games
}

export default function Home() {
  const [steamId, setSteamId] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showAllGames, setShowAllGames] = useState(false);


  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSteamId(e.target.value);
    setInputError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInputError("");
    setLoading(true);
    setGames([]);
    setRecommendations([]);

    const extracted = extractSteamId(steamId);
    if (!extracted) {
      setInputError("Enter a valid Steam ID or profile URL.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId: extracted }),
      });
      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();
      const userGames = data.response?.games ?? [];
      setGames(userGames);
      if (!userGames.length) {
        setInputError("No games found for this profile.");
        setRecommendations([]);
      } else {
        const recs = recommendGames(userGames);
        setRecommendations(recs);
      }
    } catch (err) {
      setInputError("Could not fetch data from Steam.");
      setGames([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  return (
  <main className="flex justify-center min-h-screen bg-black p-4">
  {/* Main card - almost full screen */}
  <div className="w-full h-full bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden">
    {/* LEFT: Input + Games */}
    <section className="w-1/2 h-full flex flex-col px-8 py-10 border-r border-white/10 overflow-y-auto">
    <div className="mb-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 w-full"
      >
        <label htmlFor="steamId" className="text-lg font-semibold text-gray-200">
          Enter Steam ID or Profile Link
        </label>
        <input
          id="steamId"
          type="text"
          value={steamId}
          onChange={handleInputChange}
          className="border border-white/10 bg-black text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 76561198015XXXX or steamcommunity.com/id/username"
        />
        {inputError && <span className="text-red-400">{inputError}</span>}
        <button
          type="submit"
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg border border-white/10 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </form>
    </div>
    {/* Games List */}
    {games.length > 0 && (
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
          Your Top Games
        </h2>
        <ul className="space-y-2">
          {[...games].sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
            .map((game) => (
              <li key={game.appid} className="flex items-center gap-4 p-2 rounded-lg border border-white/10 hover:bg-neutral-800 transition">
                <img
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`}
                  alt={game.name}
                  className="w-14 h-7 rounded shadow object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-grow">
                  <p className="font-medium text-white truncate">{game.name}</p>
                  <p className="text-xs text-gray-400">
                    Played: {game.playtime_forever > 0
                      ? `${(game.playtime_forever / 60).toFixed(1)} h`
                      : "Never"}
                  </p>
                </div>
              </li>
            ))}
        </ul>
      </div>
    )}
  </section>

    {/* RIGHT: Recommendations + Unplayed */}
    <section className="w-1/2 h-full flex flex-col px-8 py-10 overflow-y-auto">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">
          🎲 Model Recommendations
        </h2>
        <p className="text-base text-gray-300 mb-5">
          Recommended by our AI model (coming soon!)
        </p>
        {/* Recommendations Placeholder */}
        <ul className="space-y-2 mb-8">
          <li className="p-3 rounded-lg border border-white/10 bg-neutral-900 text-gray-300 text-center">
            <span>Coming Soon: Real ML model recommendations here!</span>
          </li>
        </ul>
        {/* Unplayed Good Games */}
        {games.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
              Good Games You Own (But Haven&apos;t Played)
            </h2>
            <ul className="space-y-2">
              {games
                .filter((game) => (game.playtime_forever ?? 0) < 30)
                .map((game) => (
                  <li key={game.appid}>
                    <a
                      href={`https://store.steampowered.com/app/${game.appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg border border-white/10 hover:bg-neutral-800 transition group"
                    >
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`}
                        alt={game.name}
                        className="w-14 h-7 rounded shadow object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="font-medium text-white">{game.name}</span>
                      <span className="ml-2 text-xs text-yellow-400">Never played!</span>
                    </a>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </section>
  </div>
</main>
  );
}
