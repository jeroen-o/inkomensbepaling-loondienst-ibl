# Stap-voor-stap GitHub Pages setup

Deze guide is voor mensen die **nooit eerder met GitHub of npm** hebben gewerkt. Tijdsindicatie: 30-45 minuten.

## Wat je vooraf nodig hebt

- [ ] **Computer** met internet
- [ ] **GitHub-account** (gratis op [github.com](https://github.com/signup) — duurt 2 min)
- [ ] **Node.js** geïnstalleerd ([nodejs.org/download](https://nodejs.org/download) — kies LTS-versie)
- [ ] **Git** geïnstalleerd ([git-scm.com/downloads](https://git-scm.com/downloads))

### Check of installaties werken

Open een terminal:
- **Windows**: zoek naar "PowerShell" of "Command Prompt"
- **Mac**: open "Terminal"
- **Linux**: je weet hoe ;)

Test de installaties:
```bash
node --version    # moet zoiets als v20.x.x of nieuwer geven
npm --version     # moet zoiets als 10.x.x geven
git --version     # moet git version 2.x geven
```

Werkt dit niet? Eerst installeren — installer-uitvoeringen vanaf bovenstaande sites.

## Deel 1: GitHub repo aanmaken

1. Ga naar [github.com/new](https://github.com/new)
2. **Repository name**: `ibl-toetsinkomen-tool` (of een andere naam — onthoud welke)
3. Public of Private: kies wat je wilt (Public is makkelijker voor GitHub Pages — Private kan ook maar vereist een paid plan voor Pages)
4. **Belangrijk**: Vink **NIET** "Add README", "Add .gitignore" of "license" aan — die zitten al in de package
5. Klik **"Create repository"**
6. Je krijgt nu een lege repo. Noteer de URL bovenaan: `https://github.com/JOUW_NAAM/ibl-toetsinkomen-tool`

## Deel 2: Lokaal de tool draaien (om te testen)

1. **Pak het zip-bestand uit** dat je van Claude hebt gekregen — bijvoorbeeld op je Bureaublad. Je krijgt een map `ibl-github-pkg`.
2. Open een terminal en navigeer naar die map:
   ```bash
   cd ~/Desktop/ibl-github-pkg
   ```
   (Of waar je hem hebt uitgepakt — gebruik tab-aanvulling als hulp.)
3. **Pas `vite.config.js` aan** (alleen als je repo geen `ibl-toetsinkomen-tool` heet). Open het bestand in een tekstbewerker en wijzig `'/ibl-toetsinkomen-tool/'` naar `'/JOUW-REPO-NAAM/'`.
4. **Installeer dependencies** (1× nodig, duurt 1-2 min):
   ```bash
   npm install
   ```
5. **Start de dev-server om te testen**:
   ```bash
   npm run dev
   ```
6. Open je browser en ga naar `http://localhost:5173`
7. Test of het werkt: upload een UWV Verzekeringsbericht. Als je de tool ziet en kan rekenen → 🎉
8. Stop de dev-server met `Ctrl+C` in de terminal.

> ⚠️ **Werkt het niet?** Veel gemaakte fouten:
> - "command not found: npm" → Node.js is niet (goed) geïnstalleerd. Herstart de terminal na installatie.
> - "EACCES" of permissie-fouten → run `npm install` zonder `sudo`
> - Witte pagina → check de browser console (F12 → Console) voor errors

## Deel 3: Code naar GitHub pushen

In dezelfde terminal, in de `ibl-github-pkg` map:

```bash
# Initialiseer git
git init

# Voeg alle bestanden toe
git add .

# Maak een commit
git commit -m "Initial commit"

# Stel main als hoofd-branch in
git branch -M main

# Verbind met je GitHub repo (vervang JOUW_NAAM en REPO_NAAM)
git remote add origin https://github.com/JOUW_NAAM/REPO_NAAM.git

# Push naar GitHub
git push -u origin main
```

De eerste keer pushen vraagt GitHub om in te loggen:
- **Username**: je GitHub gebruikersnaam
- **Password**: ❌ NIET je GitHub password! Je moet een **Personal Access Token** gebruiken
  - Ga naar [github.com/settings/tokens](https://github.com/settings/tokens) → "Generate new token (classic)"
  - Geef het de scope `repo` (volledige repo-toegang)
  - Kopieer de token en gebruik die als password
  - Onthoud / save deze ergens, hij wordt 1x getoond

Of makkelijker: gebruik [GitHub Desktop](https://desktop.github.com/) — een grafische tool die dit allemaal voor je regelt.

## Deel 4: GitHub Pages activeren

1. Ga naar je GitHub repo in de browser
2. Klik op **Settings** (boven, helemaal rechts)
3. In het linker menu: klik **Pages**
4. Onder **Build and deployment** → **Source** → kies **GitHub Actions**
5. Dat is alles — geen verdere instellingen nodig

## Deel 5: Wachten op de deploy

1. Klik bovenaan in je repo op **Actions**
2. Je ziet een workflow draaien: "Deploy to GitHub Pages"
3. Wacht 1-2 minuten tot het groen wordt (✅)
4. Ga terug naar **Settings → Pages**. Bovenaan staat nu:
   ```
   Your site is live at https://JOUW_NAAM.github.io/REPO_NAAM/
   ```
5. Klik op die link — je tool draait nu live op het web! 🚀

## Wijzigingen later doorvoeren

Bij elke wijziging die je maakt:

```bash
git add .
git commit -m "Beschrijving van wat je hebt gewijzigd"
git push
```

Binnen 1-2 minuten is de update live op je GitHub Pages URL.

## Troubleshooting

### "404 — File not found" op de GitHub Pages URL

Meestal het `base`-pad in `vite.config.js`. Check:
- Repo heet exact zoals het pad in `vite.config.js`?
- Probeer: open de URL met `/` aan het eind: `https://...github.io/REPO_NAAM/`

### Pagina laadt maar JS werkt niet

Open browser console (F12). Vaak een MIME-type issue. Oplossing: check of `base` in `vite.config.js` overeenkomt met de echte repo-naam.

### Actions-workflow faalt

Klik op de gefaalde workflow in **Actions** tab → bekijk de logs. Meestal is `npm ci` de fout — check `package.json` op typos.

### Custom domein werkt niet

Custom domeinen kosten meer setup. Zie hoofd-README sectie "Custom domein" voor details.

## Hulp nodig?

- GitHub docs: [docs.github.com/pages](https://docs.github.com/pages)
- Vite docs: [vitejs.dev/guide/static-deploy.html#github-pages](https://vitejs.dev/guide/static-deploy.html#github-pages)
- Of stel je vraag in een GitHub Issue op je eigen repo
