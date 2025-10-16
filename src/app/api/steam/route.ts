import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { steamId } = await req.json();

  const apiKey = process.env.STEAM_API_KEY;
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("Steam API request URL:", url);
    console.log("Steam API response:", data); // backend log

    if (!response.ok) {
      console.error("Steam API HTTP error:", response.status, data);
      return NextResponse.json({ error: "Steam API request failed", status: response.status, data });
    }

    if (!data.response || !data.response.games || !Array.isArray(data.response.games)) {
      console.error("Steam API: No games found!", steamId, data);
      return NextResponse.json({ error: "No games found for this Steam ID (may be private, incorrect, or empty library)", data });
    }


    return NextResponse.json(data);
  } catch (error) {

    console.error("Steam API fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch from Steam API", details: String(error) });
  }
}
