# Checklist final — submit hackathon (AlphaForge)

Folosește această listă înainte de deadline. Bifează fiecare punct când e gata.

---

## Eligibilitate și înregistrare

- [ ] Proiect înregistrat pe [early.surge.xyz](https://early.surge.xyz) (obligatoriu pentru premii)
- [ ] Link-ul repo-ului / demo-ului actualizat în platforma hackathonului (dacă se cere acolo)

---

## Provocarea Kraken (execuție + leaderboard PnL)

- [ ] Kraken CLI instalat pe mediul unde rulează agentul; `KRAKEN_CLI_PATH` setat corect în producție
- [ ] `KRAKEN_CLI_SIMULATE=false` pentru rulare reală (după ce ești pregătit); paper rămâne pentru teste
- [ ] Cheie API Kraken **read-only** (fără withdraw) pregătită pentru verificare / leaderboard — trimisă conform instrucțiunilor lablab/Kraken (nu în repo)
- [ ] Confirmat că execuția tranzacțiilor trece prin **Kraken CLI** (cerință hackathon)

---

## Provocarea ERC-8004 (on-chain)

- [ ] `public/agent-registration.json` și `ERC8004_AGENT_ID` aliniate cu ce ai înregistrat on-chain
- [ ] Verificat fluxul: Vault / Risk Router / registre (Sepolia) conform ghidului hackathonului — intents semnate, evenimente unde e cazul
- [ ] `AGENT_PRIVATE_KEY` / RPC doar în env (Vercel / local), niciodată în git

---

## Deploy și mediu

- [ ] Variabile de mediu setate pe Vercel: `DATABASE_URL`, `CRON_SECRET`, PRISM, Kraken, LLM, on-chain, `TRADING_MODE`, etc.
- [ ] Cron `/api/cron/agent-tick` funcționează cu `Authorization: Bearer <CRON_SECRET>`
- [ ] Demo live accesibil: README indică URL-ul corect (ex. Vercel)

---

## Social & build in public (scor separat)

- [ ] Conturi / postări legate în platforma care măsoară engagement-ul (conform lablab)
- [ ] Postări cu tag-uri: **@krakenfx**, **@lablabai**, **@Surgexyz_** (și Surge pe LinkedIn dacă e relevant)
- [ ] Frecvență și conținut suficient pe durata ferestrei de competiție

---

## Repo și prezentare

- [ ] `.env` / `.env.local` **nu** sunt comise; `.env.example` este la zi
- [ ] `README.md`: pași de demo clari; link demo + (opțional) screenshot-uri sau GIF
- [ ] Licență MIT (sau ce cere submit-ul) și absența secretelor în istoricul git
- [ ] (Opțional) Screenshots sau GIF în README pentru juriu / revieweri

---

## Închidere

- [ ] Ultimul `pnpm build` / CI verde
- [ ] Submit final în formularul/platforma lablab (video, repo, descriere — conform cerințelor actuale de pe site)

---

*Ultima actualizare: checklist intern proiect AlphaForge. Regulile oficiale și deadline-urile sunt pe site-ul hackathonului.*
