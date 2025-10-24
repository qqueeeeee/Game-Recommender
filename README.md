# Steam Game Recommender

A cloud-hosted machine learning app that recommends Steam games based on your play history. Built with **FastAPI** (Python), **Next.js** (TypeScript), and **scikit-learn**.  
Live demo: [https://game-recommender-phi.vercel.app/](https://game-recommender-phi.vercel.app/)

![Screenshot](https://github.com/user-attachments/assets/19d97d88-79a0-4014-9035-8252f9062f2b)

---

## Features

- Personalized recommendations powered by advanced NLP and genre analysis
- Live pricing, owner counts with Steam API integrations
- Sort recommendations by similarity, ownership, or price
- Responsive, modern UI
- CORS-safe backend proxy for all third-party API data to support real production deployments

---

## Tech Stack

- **Frontend:** Next.js (React, TypeScript, TailwindCSS)
- **Backend:** FastAPI (Python 3.11+)
- **Machine Learning:** scikit-learn, pandas, cosine similarity
- **Deployment:** Vercel (frontend), Railway (backend)
- **Integrations:** Steam Web API

---

## Getting Started

1. Clone this repo  
git clone https://github.com/qqueeeeee/Game-Recommender.git
cd game-recommender


2. Backend setup
- `cd src/app/api/recommend`
- Install requirements: `pip install -r requirements.txt`
- Set `STEAM_API_KEY` environment variable (see [Steam Web API](https://steamcommunity.com/dev/apikey))
- Run: `uvicorn recommend_api:app --reload`

3. Frontend setup  
- `npm install`
- `npm run dev` (edit API endpoint URL if not running locally)

4. Demo  
- Visit [https://game-recommender-phi.vercel.app/](https://game-recommender-phi.vercel.app/) and enter your Steam ID or profile URL.

---

## How It Works

- User enters Steam ID or profile link
- Backend fetches owned games and user summary via Steam API
- NLP and ML compute a profile of top-played genres/tags
- Recommendations generated with cosine similarity
- Frontend displays recommendations and live price info via backend proxy

---

## Acknowledgments

- Steam for API/data
- scikit-learn open-source ML stack
- Project inspired by [SteamDiscoveryQueue](https://store.steampowered.com/explore/)

---

## License

MIT

---

