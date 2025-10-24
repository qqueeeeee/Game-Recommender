"use client";
import { useEffect, useState } from "react";

interface SteamGame {
  appid: number;
  name?: string;
  playtime_forever?: number;
}

function extractSteamId(input: string): string | null {
  input = input.trim();
  const directIdRegex = /^[0-9]{17}$/;
  const profileRegex = /steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)/i;
  if (directIdRegex.test(input)) {
    return input;
  }
  const match = input.match(profileRegex);
  if (match && match[2]) {
    return match[2];
  }
  return null;
}

async function fetchRecommendations(userGames: SteamGame[]) {
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ games: userGames }),
  });
  if (!res.ok) throw new Error("Recommendation API failed");
  const data = await res.json();
  return data.recommendations || [];
}

async function fetchGamePrice(appid: number): Promise<number | null> {
  try {
    // Use full backend URL if running frontend locally and backend remotely
    const res = await fetch(`https://game-recommender-api-production-71d1.up.railway.app/price?appid=${appid}&cc=US`);
    const data = await res.json();
    console.log("Price API response:", appid, data);
    return typeof data.price === "number" ? data.price : null;
  } catch (err) {
    console.error("Price fetch error:", err);
    return null;
  }
}

export default function Home() {
  const [steamId, setSteamId] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [steamUsername, setSteamUsername] = useState("");
  const [steamAvatar, setSteamAvatar] = useState("");
  const [sortMode, setSortMode] = useState<"similarity" | "owners" | "price">("similarity");
  const [gamePrices, setGamePrices] = useState<Record<number, number | null>>({});

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
    setSteamUsername("");
    setSteamAvatar("");
    console.log("Submitted Steam ID / Profile:", steamId);

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

      // Set username and avatar from players array
      if (data.response?.players && data.response.players.length > 0) {
        setSteamUsername(data.response.players[0].personaname ?? "Unknown");
        setSteamAvatar(data.response.players[0].avatarfull ?? "");
      } else {
        setSteamUsername("Unknown");
        setSteamAvatar("");
      }

      const userGames = data.response?.games ?? [];
      setGames(userGames);

      if (!userGames.length) {
        setInputError("No games found for this profile.");
        setRecommendations([]);
      } else {
        const recs = await fetchRecommendations(userGames);
        setRecommendations(recs);
        setGamePrices({}); // reset previous prices
        console.log("Model recommendations from backend:", recs);
      }
    } catch (err) {
      setInputError("Could not fetch data from Steam.");
      setGames([]);
      setRecommendations([]);
      setSteamUsername("");
      setSteamAvatar("");
    } finally {
      setLoading(false);
    }
  }

  console.log("Current recommendations state:", recommendations);
  useEffect(() => {
    if (recommendations.length > 0) {
      (async () => {
        const pricesObj: Record<number, number | null> = {};
        await Promise.all(
          recommendations.map(async (game: any) => {
            console.log("Running price fetch for recommendations", recommendations);
            const price = await fetchGamePrice(game.appid);
            console.log("Steam price API response for", game.appid, price);
            pricesObj[game.appid] = price === null ? null : price;
          })
        );
        setGamePrices(pricesObj);
      })();
    }
  }, [recommendations]);

  return (
    <main className="flex justify-center min-h-screen bg-black p-4">
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
          {games.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
                Your Top Games
              </h2>
              <ul className="space-y-2">
                {[...games]
                  .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
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
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setSortMode("similarity")}
                className={`px-3 py-1 rounded ${sortMode === "similarity" ? "bg-blue-700 text-white" : "bg-neutral-800 text-gray-300"} font-semibold border border-blue-900/40`}
              >
                Sort by Similarity
              </button>
              <button
                onClick={() => setSortMode("owners")}
                className={`px-3 py-1 rounded ${sortMode === "owners" ? "bg-blue-700 text-white" : "bg-neutral-800 text-gray-300"} font-semibold border border-blue-900/40`}
              >
                Sort by Owners
              </button>
              <button
                onClick={() => setSortMode("price")}
                className={`px-3 py-1 rounded ${sortMode === "price" ? "bg-blue-700 text-white" : "bg-neutral-800 text-gray-300"} font-semibold border border-blue-900/40`}
              >
                Sort by Price
              </button>
            </div>
            <p className="text-base text-gray-300 mb-5">
              Recommended by our AI model (based on your most played games):
            </p>
            {recommendations.length > 0 ? (
              <ul className="space-y-2 mb-8">
                {[...recommendations]
                  .sort((a, b) => {
                    if (sortMode === "owners") {
                      return (b.owners ?? 0) - (a.owners ?? 0);
                    } else if (sortMode === "price") {
                      return (gamePrices[a.appid] ?? Infinity) - (gamePrices[b.appid] ?? Infinity);
                    } else {
                      return (b.score ?? 0) - (a.score ?? 0);
                    }
                  })
                  .map((game) => (
                    <li key={game.appid}>
                      <a
                        href={`https://store.steampowered.com/app/${game.appid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-lg border border-blue-600 bg-neutral-900 shadow-sm hover:bg-blue-900/10 transition group"
                      >
                        <img
                          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`}
                          alt={game.name}
                          className="w-14 h-7 rounded shadow object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div>
                          <span className="font-semibold text-white">{game.name}</span>
                          {game.genres && (
                            <span className="ml-2 text-xs text-gray-400">{game.genres}</span>
                          )}
                          {game.score && (
                            <span className="ml-2 text-xs text-green-400">
                              Similarity: {game.score.toFixed(2)}
                            </span>
                          )}
                          {(game.owners ?? 0) > 0 && (
                            <span className="ml-2 text-xs text-blue-400">
                              Owners: {typeof game.owners === "number" ? game.owners.toLocaleString() : game.owners}
                            </span>
                          )}
                          {gamePrices[game.appid] !== undefined && (
                            <span className="ml-2 text-xs text-purple-400">
                              Price: {gamePrices[game.appid] === null ? "N/A" : gamePrices[game.appid] === 0 ? "Free" : `$${gamePrices[game.appid]}`}
                            </span>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 italic bg-neutral-900 rounded-lg border border-white/10">
                No recommendations to show yet. Enter a Steam ID above!
              </div>
            )}
            {games.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
                  Good Games You Own (But Haven&apos;t Played)
                </h2>
                <ul className="space-y-2">
                  {games
                    .filter((game) => (game.playtime_forever ?? 0) < 1)   // Never played
                    .slice(0, 5)
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
