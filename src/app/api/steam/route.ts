// src/app/api/steam/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { steamId } = await req.json();

  // TODO: add Steam API key here securely
  const apiKey = process.env.STEAM_API_KEY;
  
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;

  const response = await fetch(url);
  const data = await response.json();

  return NextResponse.json(data);
}
