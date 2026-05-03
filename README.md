# IBL Toetsinkomen Rekentool

Een open implementatie van de **Rekenregels Inkomensbepaling Loondienst (IBL) versie 8.1.1** als React-webapplicatie. Berekent het toetsinkomen voor hypotheekaanvragen op basis van een UWV Verzekeringsbericht (VZB).

> ⚠️ **Disclaimer**: Dit is een onafhankelijke implementatie ter ondersteuning, niet de officiële tool. Voor formele hypotheekaanvragen gebruik altijd [toetsinkomenberekenen.nl](https://www.toetsinkomenberekenen.nl) van HDN. Cryptografische verificatie van het UWV-certificaat is niet ingebouwd (vereist UWV PKI).

## Functies

- 📄 **PDF parsing** van UWV Verzekeringsbericht (VZB-004 t/m VZB-006)
- 🧮 Volledige **A/B/C/D-berekening** per Rekenregels 8.1.1
- 🔍 **Sanity checks** met officiële foutcodes (2030, 2034-2038)
- 🔄 **Voorbewerking**: contractsamenvoeging (5.5), verlofregel (5.1), betaaltermijn-omrekening (5.6.5/5.6.6)
- 📊 **Beslisboom-visualisatie** met alle 9 stappen
- 📥 **Export** naar PDF (echte tekst), Excel (4 sheets), JSON (API v10 spec)
- 👥 **Multi-VZB vergelijking** voor partner / co-aanvragers
- ✏️ **Volledig bewerkbaar** — voeg werkgevers/loonitems toe of verwijder ze
- ♿ **Toegankelijkheid**: skip-link, ARIA-labels, keyboard-navigatie
- 🖨️ **Print-optimalisatie** met A4-paginabreuks

## Snelstart lokaal

Vereist: **Node.js 18+** en **npm** ([download hier](https://nodejs.org)).

```bash
# 1. Clone of download deze repo
git clone https://github.com/JOUW_GEBRUIKER/ibl-toetsinkomen-tool.git
cd ibl-toetsinkomen-tool

# 2. Installeer dependencies
npm install

# 3. Start de dev-server
npm run dev
```

De tool draait nu op `http://localhost:5173`. Open deze URL in je browser.

## Deploy naar GitHub Pages

### Methode 1 — Automatisch via GitHub Actions (aanbevolen) ⭐

Deze repo bevat al een workflow (`.github/workflows/deploy.yml`) die bij elke push automatisch deployt.

**Stappen:**

1. **Maak een nieuwe repo op GitHub** (bv. `ibl-toetsinkomen-tool`).
2. **Pas `vite.config.js` aan** als je repo-naam anders is dan `ibl-toetsinkomen-tool`. Open `vite.config.js` en wijzig:
   ```js
   base: process.env.NODE_ENV === 'production' ? '/JOUW-REPO-NAAM/' : '/',
   ```
3. **Push de code naar GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/JOUW_GEBRUIKER/JOUW-REPO-NAAM.git
   git push -u origin main
   ```
4. **Activeer GitHub Pages**:
   - Ga naar je repo op GitHub
   - Settings → Pages
   - Bij "Build and deployment" kies **Source: GitHub Actions**
5. **Wacht 1-2 minuten** — de Actions-workflow bouwt en deployt automatisch.
6. Je site staat nu op: `https://JOUW_GEBRUIKER.github.io/JOUW-REPO-NAAM/`

Bij elke `git push` naar `main` wordt automatisch opnieuw gebouwd en gedeployed.

### Methode 2 — Handmatig via gh-pages

Als je liever handmatig deploy't (bijvoorbeeld zonder Actions):

```bash
npm run build
npm run deploy
```

De `deploy`-script gebruikt het `gh-pages` package om de `dist`-folder naar de `gh-pages` branch te pushen.

In dat geval moet je in de GitHub Pages settings kiezen:
- Source: **Deploy from a branch**
- Branch: **gh-pages** / `(root)`

## Custom domein

Wil je dit op `mijn-ibl-tool.nl` hosten?

1. Voeg een `CNAME`-bestand toe in `public/` met daarin alleen je domein:
   ```
   mijn-ibl-tool.nl
   ```
2. Pas in `vite.config.js` `base` aan naar `'/'`:
   ```js
   base: '/',
   ```
3. Stel bij je domeinprovider een CNAME-record in dat naar `JOUW_GEBRUIKER.github.io` wijst.
4. In GitHub repo Settings → Pages → "Custom domain" voer je je domein in.

## Projectstructuur

```
.
├── .github/workflows/deploy.yml   GitHub Actions workflow
├── public/
│   └── favicon.svg                Favicon
├── src/
│   ├── App.jsx                    Hoofdcomponent (3700+ regels — alle logica + UI)
│   ├── main.jsx                   React entry point
│   └── index.css                  Tailwind imports
├── index.html                     HTML template
├── package.json                   Dependencies
├── postcss.config.js              PostCSS / Tailwind config
├── tailwind.config.js             Tailwind config
└── vite.config.js                 Vite build config
```

## Dependencies

| Package | Doel |
|---|---|
| `react` + `react-dom` | UI framework |
| `lucide-react` | Iconen |
| `recharts` | Staafdiagrammen voor SV-loon visualisatie |
| `tailwindcss` | Styling |
| `vite` | Build tool |

Aanvullende libraries worden **dynamisch geladen** vanaf cdnjs (alleen wanneer nodig):
- `pdf.js` — voor PDF parsing
- `jsPDF` — voor PDF-export
- `xlsx` (SheetJS) — voor Excel-export
- `html2canvas` — werd voorheen gebruikt, nu vervangen door directe tekst-PDF

## Gebruik

1. Klant downloadt het **UWV Verzekeringsbericht** via [Mijn UWV](https://www.uwv.nl/particulieren/persoonlijk/mijn-uwv) (Digid). **Niet** als afbeelding scannen — origineel PDF behouden voor digitaal waarmerk.
2. Sleep de PDF in de tool of klik om te uploaden.
3. Bewerk eventueel de werkgever-gegevens of voeg eigen bijdrage pensioen toe.
4. Klik **Bereken toetsinkomen**.
5. Bekijk het resultaat, download als PDF/Excel, of vergelijk met een tweede VZB voor een partner.

## Validatie

De tool is gevalideerd tegen:

- ✅ **Officieel resultaat** (Oversteegen-casus): € 188.332,39 EXACT match
- ✅ **Appendix 13 Rekenregels** (Excessieve Incidentele Piek): GPI binnen 10% van € 2.611,76
- ✅ **Appendix 5.6.5.1** (Bron→Doel): exact € 677,42 + € 322,58
- ✅ **Appendix 5.6.6.1** (4wk → maandelijks): exact € 250,00 + € 750,00

Voor productiegebruik wordt aanbevolen een tweede berekening te draaien op de officiële tool ter cross-check.

## Wat de tool **niet** doet

- ❌ Cryptografische verificatie van het UWV-certificaat in de PDF (vereist UWV PKI)
- ❌ Cryptografisch ondertekenen van uitvoer-PDF (vereist HDN signing-key)
- ❌ HDN-API integratie naar hypotheekaanvragen
- ❌ Echte API-hash + verificatiecode (placeholder waarden)

## Licentie

Geen expliciete licentie. Persoonlijk en niet-commercieel gebruik is toegestaan.

De Rekenregels IBL zijn eigendom van de Werkgroep Rekenregels & Beheer IBL en HDN. Zie [hdn.nl/diensten/inkomensbepalingloondienst](https://hdn.nl/diensten/inkomensbepalingloondienst) voor de officiële documentatie.

## Bijdragen

Pull requests welkom — vooral voor:

- Validatie tegen meer officiële uitkomsten (extra testcases)
- Ondersteuning voor oudere VZB-versies
- Verbeterde mobiele UI
- Vertalingen (Engels?)

Open een issue als je een bug vindt of een feature mist.
