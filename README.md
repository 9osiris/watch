watch - movie and tv discovery hub [discovery]

disclaimer:
this does not stream or host video. it is a discovery front end. movie and show data comes from tmdb, trailers come from youtube, and where to watch links out to licensed providers like netflix and hulu. nothing here plays a full movie or a full episode.

why i made this:
i wanted a clean place to find stuff to watch. search around, check what is trending, save things to my list, watch a trailer, then go watch it for real on the service that has it. i built the first version with the player stuff in it and cut all of that out, this is just the discovery part now.

the guide:
open index.html in a browser to poke around locally, or run a simple static server from this folder. the live site deploys from github main on vercel at watch.osiris.rocks. ai search needs groq keys set as server env vars in vercel, check env.example for the names. tmdb data needs the key already in orc-script.js.
