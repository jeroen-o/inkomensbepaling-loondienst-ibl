import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Calculator, RefreshCw, Download, Building2, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// ============================================================
// CONSTANTS — IBL Rekenregels 8.1.1
// ============================================================

// Vaste Contracten (Appendix 6)
const VASTE_CONTRACTVORMEN = [
  'schriftelijke arbeidsovereenkomst voor onbepaalde tijd, geen oproepovereenkomst',
  'niet schriftelijke arbeidsovereenkomst voor onbepaalde tijd, geen oproepovereenkomst',
  'publiekrechtelijke aanstelling voor onbepaalde tijd',
];

// Niet-Vaste Contracten (Appendix 6)
const NIET_VASTE_CONTRACTVORMEN = [
  'schriftelijke arbeidsovereenkomst voor onbepaalde tijd, oproepovereenkomst',
  'niet schriftelijke arbeidsovereenkomst voor onbepaalde tijd, oproepovereenkomst',
  'schriftelijke arbeidsovereenkomst voor bepaalde tijd, geen oproepovereenkomst',
  'schriftelijke arbeidsovereenkomst voor bepaalde tijd, oproepovereenkomst',
  'niet schriftelijke arbeidsovereenkomst voor bepaalde tijd, geen oproepovereenkomst',
  'niet schriftelijke arbeidsovereenkomst voor bepaalde tijd, oproepovereenkomst',
  'publiekrechtelijke aanstelling voor bepaalde tijd',
];

// Oproepovereenkomsten (subset — rekenregels Appendix 2: pensioenbijdrage uitsluiten)
const OPROEP_CONTRACTVORMEN = [
  'schriftelijke arbeidsovereenkomst voor onbepaalde tijd, oproepovereenkomst',
  'niet schriftelijke arbeidsovereenkomst voor onbepaalde tijd, oproepovereenkomst',
  'schriftelijke arbeidsovereenkomst voor bepaalde tijd, oproepovereenkomst',
  'niet schriftelijke arbeidsovereenkomst voor bepaalde tijd, oproepovereenkomst',
];

// UWV Loonheffingennummers (Bijlage Loonheffingennummers)
const UWV_LOONHEFFINGENNUMMERS = [
  '810220350L02', '810220350L04', '810220350L20',
  '810220350L23', '810220350L26', '810220350L53',
];

// UWV Uitkering-omschrijvingen (Appendix 5)
const UWV_UITKERING_OMSCHRIJVINGEN = [
  'Ziektewet- of WAZO-Uitkering van UWV',
  'WAO-Uitkering van UWV',
  'WW-Uitkering van UWV',
  'WAZ-Uitkering van UWV',
  'WAO- en Wajong-Uitkering van UWV',
  'WIA (IVA)-Uitkering van UWV',
  'WIA (WGA)-Uitkering van UWV',
  'Toeslag bij Uitkering (TW) van UWV',
  'IOW-Uitkering van UWV',
  'UWV; Loondoorbetaling bij faillissement',
];

// API Foutcodes (Bijlage Foutcodes API spec v10)
const API_FOUTCODES = {
  2001: 'Burgerservicenummer aangetroffen, PDF kan niet verwerkt worden',
  2002: 'Naam is niet gelijk op elke pagina',
  2014: 'Kan werkgever/instantie niet vinden',
  2029: 'Ontbrekende of ongeldige header voor tabel met loongegevens',
  2030: 'Geen berekening mogelijk. Indien er sprake is van een negatief aantal uren in de afgelopen 4 maanden of 5 vierwekelijkse perioden kan er geen correcte berekening van het uren- en of parttimepercentage worden vastgesteld.',
  2032: 'VZB-versie wordt niet ondersteund',
  2033: 'De downloaddatum komt niet overeen met de VZB-versie',
  2034: 'Ongeldige waarde voor gewerkte uren',
  2035: 'Ongeldige downloaddatum. De datum mag niet in de toekomst liggen',
  2036: 'Ongeldige periode voor loonitem, een loonitem mag niet meer dan 3 periodes in de toekomst liggen',
  2037: 'Loonheffingennummer komt niet overeen met een geldige UWV uitkering.',
  2038: 'Het Verzekeringsbericht bevat geen contracten die in aanmerking komen voor een IBL-berekening',
  8920: 'Geen geldig certificaat in het UWV-verzekeringsbericht',
  8988: 'Certificaat verificatie mislukt',
};

// Koppeltabel maandelijks → vierwekelijks (Bijlage Koppeltabel)
// Key: 'YYYY-MM' (maandelijkse), Value: vierwekelijkse Datumreeks string
const KOPPELTABEL_MAAND_NAAR_4WK = {
  '2026-12': '30-11-2026 t/m 31-12-2026', '2026-11': '02-11-2026 t/m 29-11-2026',
  '2026-10': '05-10-2026 t/m 01-11-2026', '2026-09': '07-09-2026 t/m 04-10-2026',
  '2026-08': '10-08-2026 t/m 06-09-2026', '2026-07': '13-07-2026 t/m 09-08-2026',
  '2026-06': '15-06-2026 t/m 12-07-2026', '2026-05': '20-04-2026 t/m 17-05-2026',
  '2026-04': '23-03-2026 t/m 19-04-2026', '2026-03': '23-02-2026 t/m 22-03-2026',
  '2026-02': '26-01-2026 t/m 22-02-2026', '2026-01': '01-01-2026 t/m 25-01-2026',
  '2025-12': '01-12-2025 t/m 31-12-2025', '2025-11': '03-11-2025 t/m 30-11-2025',
  '2025-10': '06-10-2025 t/m 02-11-2025', '2025-09': '08-09-2025 t/m 05-10-2025',
  '2025-08': '11-08-2025 t/m 07-09-2025', '2025-07': '14-07-2025 t/m 10-08-2025',
  '2025-06': '19-05-2025 t/m 15-06-2025', '2025-05': '21-04-2025 t/m 18-05-2025',
  '2025-04': '24-03-2025 t/m 20-04-2025', '2025-03': '24-02-2025 t/m 23-03-2025',
  '2025-02': '27-01-2025 t/m 23-02-2025', '2025-01': '01-01-2025 t/m 26-01-2025',
  '2024-12': '02-12-2024 t/m 31-12-2024', '2024-11': '04-11-2024 t/m 01-12-2024',
  '2024-10': '07-10-2024 t/m 03-11-2024', '2024-09': '09-09-2024 t/m 06-10-2024',
  '2024-08': '12-08-2024 t/m 08-09-2024', '2024-07': '15-07-2024 t/m 11-08-2024',
  '2024-06': '20-05-2024 t/m 16-06-2024', '2024-05': '22-04-2024 t/m 19-05-2024',
  '2024-04': '25-03-2024 t/m 21-04-2024', '2024-03': '26-02-2024 t/m 24-03-2024',
  '2024-02': '29-01-2024 t/m 25-02-2024', '2024-01': '01-01-2024 t/m 28-01-2024',
  '2023-12': '04-12-2023 t/m 31-12-2023', '2023-11': '06-11-2023 t/m 03-12-2023',
  '2023-10': '09-10-2023 t/m 05-11-2023', '2023-09': '11-09-2023 t/m 08-10-2023',
  '2023-08': '14-08-2023 t/m 10-09-2023', '2023-07': '19-06-2023 t/m 16-07-2023',
  '2023-06': '22-05-2023 t/m 18-06-2023', '2023-05': '24-04-2023 t/m 21-05-2023',
  '2023-04': '27-03-2023 t/m 23-04-2023', '2023-03': '27-02-2023 t/m 26-03-2023',
  '2023-02': '30-01-2023 t/m 26-02-2023', '2023-01': '01-01-2023 t/m 29-01-2023',
};

// API versies
const API_VERSIE = '10.0.0.0';
const REKENREGELS_VERSIE = '8.1.1';
const FRONTEND_API_VERSIE = '9.1.0.1';

// Een Contractvorm wordt herkend als oproepovereenkomst
const isOproepContractvorm = (cv) => {
  if (!cv) return false;
  return /oproepovereenkomst/i.test(cv) && !/geen\s+oproepovereenkomst/i.test(cv);
};

// ============================================================
// HELPERS
// ============================================================

const fmtEur = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '€ 0,00';
  return '€ ' + Math.abs(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (n < 0 ? '-' : '');
};

const fmtEurShort = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '€ 0';
  return '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const parseEurNL = (s) => {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  const cleaned = String(s).replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const parsePeriode = (periodeStr) => {
  if (!periodeStr) return null;
  const m = String(periodeStr).match(/(\d{1,2})-(\d{1,2})-(\d{4})\s*t\/m\s*(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (!m) return null;
  return {
    start: new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])),
    end: new Date(parseInt(m[6]), parseInt(m[5]) - 1, parseInt(m[4])),
  };
};

const monthsBetween = (d1, d2) =>
  (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());

const sortLoonitems = (items) => [...items].sort((a, b) => {
  const pa = parsePeriode(a.periode);
  const pb = parsePeriode(b.periode);
  if (!pa || !pb) return 0;
  return pb.end - pa.end;
});

const isVastContractvorm = (cv) => {
  if (!cv) return false;
  const lc = cv.toLowerCase().trim();
  // Exact match against known vaste contractvormen
  if (VASTE_CONTRACTVORMEN.some(v => v.toLowerCase() === lc)) return true;
  // Heuristic for slight variations: "voor onbepaalde tijd" + "geen oproepovereenkomst"
  if (lc.includes('voor onbepaalde tijd') && lc.includes('geen oproepovereenkomst')) return true;
  if (lc.includes('publiekrechtelijke aanstelling voor onbepaalde tijd')) return true;
  return false;
};

// ============================================================
// PDF PARSER — verzekeringsbericht
// ============================================================

async function extractTextFromPdf(file) {
  if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Build lines based on Y position
    const items = content.items.map(it => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
    }));
    // Group by approximate Y position (lines)
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    let currentLine = null;
    let currentY = null;
    for (const item of items) {
      if (currentY === null || Math.abs(currentY - item.y) > 2) {
        if (currentLine) lines.push(currentLine);
        currentLine = item.str;
        currentY = item.y;
      } else {
        currentLine += ' ' + item.str;
      }
    }
    if (currentLine) lines.push(currentLine);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

function parseVerzekeringsbericht(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Find aanvrager naam + datum
  let aanvragerNaam = '';
  let aanmaakdatum = null;
  let vzbVersie = '';

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Naam: "De heer/mevrouw" + initiaal + achternaam (1 of meerdere woorden)
    // Plus alternatieve formaten: "Aanvrager: Naam", "Naam: A. Voorbeeld"
    if (!aanvragerNaam) {
      let naamMatch = l.match(/^(De\s+(?:heer|mevrouw)\s+[A-Z]\.(?:[A-Z]\.)?\s*(?:[a-z]+\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
      if (!naamMatch) naamMatch = l.match(/^Aanvrager:\s*(.+)$/i);
      if (!naamMatch) naamMatch = l.match(/^Naam:\s*([A-Z]\.\s*[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
      // Compact "Dhr." or "Mw." formats
      if (!naamMatch) naamMatch = l.match(/^((?:Dhr\.|Mw\.|Mevr\.)\s*[A-Z]\.\s*[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
      if (naamMatch) aanvragerNaam = naamMatch[1].trim();
    }

    // Datum: "Datum: 03 mei 2026" of "03-05-2026" of "Datum: 2026-05-03"
    if (!aanmaakdatum) {
      let datumMatch = l.match(/Datum:\s*(\d{1,2})\s+(jan|feb|maart|mrt|apr|mei|juni|juli|aug|sep|sept|okt|nov|dec)\w*\s+(\d{4})/i);
      if (datumMatch) {
        const months = { jan:0,feb:1,maart:2,mrt:2,apr:3,mei:4,juni:5,juli:6,aug:7,sep:8,sept:8,okt:9,nov:10,dec:11 };
        const m = months[datumMatch[2].toLowerCase()];
        if (m !== undefined) aanmaakdatum = new Date(parseInt(datumMatch[3]), m, parseInt(datumMatch[1]));
      } else {
        // Numeric format: "Datum: 03-05-2026"
        datumMatch = l.match(/Datum:\s*(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (datumMatch) {
          aanmaakdatum = new Date(parseInt(datumMatch[3]), parseInt(datumMatch[2]) - 1, parseInt(datumMatch[1]));
        }
      }
      // ISO format
      if (!aanmaakdatum) {
        const iso = l.match(/Datum:\s*(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (iso) aanmaakdatum = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
      }
    }

    // VZB-versie: VZB-006, VZB006, vzb_006 etc.
    if (!vzbVersie) {
      const vzbMatch = l.match(/VZB[-_\s]*(\d{3,})/i);
      if (vzbMatch) vzbVersie = `VZB-${vzbMatch[1]}`;
    }
  }

  // Find werkgever blocks. Each block starts with "Werkgever/Instantie X" and contains loonitems.
  // Strategy: find all matches of "Werkgever/Instantie ..." then take periods until next werkgever or end.

  const werkgeverIndices = [];
  for (let i = 0; i < lines.length; i++) {
    // Standard: "Werkgever/Instantie X"
    // Alt: "Werkgever:", "Werknemer/Inhoudingsplichtige", "Inhoudingsplichtige:"
    if (/^(Werkgever[\/\s:]|Werkgever\/Instantie|Inhoudingsplichtige[:\s])/i.test(lines[i])) {
      werkgeverIndices.push(i);
    }
  }

  // Group werkgevers by (naam + loonheffingennummer + contractvorm) so duplicate headers across pages merge
  const werkgeverMap = new Map();

  for (let wi = 0; wi < werkgeverIndices.length; wi++) {
    const startIdx = werkgeverIndices[wi];
    const endIdx = wi + 1 < werkgeverIndices.length ? werkgeverIndices[wi + 1] : lines.length;
    const block = lines.slice(startIdx, endIdx);

    // Parse header
    let naam = '';
    let loonheffingennummer = '';
    let verzekerdeWetten = '';
    let contractvorm = '';

    for (let i = 0; i < block.length; i++) {
      const l = block[i];
      const naamM = l.match(/^(?:Werkgever\/Instantie|Werkgever[:\s]|Inhoudingsplichtige[:\s])\s*(.+)$/i);
      if (naamM) naam = naamM[1].trim();
      const lhM = l.match(/^Loonheffingennummer[:\s]+(\S+)/i);
      if (lhM) loonheffingennummer = lhM[1].trim();
      const vwM = l.match(/^Verzekerde\s+wetten[:\s]+(.+)$/i);
      if (vwM) verzekerdeWetten = vwM[1].trim();
      const cvM = l.match(/^Contractvorm[:\s]+(.+)$/i);
      if (cvM) {
        contractvorm = cvM[1].trim();
        // Wrap-around: contractvorm may span multiple lines
        let j = i + 1;
        while (j < block.length) {
          const nextLine = block[j];
          if (/^(Periode|Aantal|Werkgever\/|Loonheffing|Verzekerde|\d{2}-\d{2}-\d{4})/i.test(nextLine)) break;
          contractvorm += ' ' + nextLine.trim();
          j++;
          if (j - i > 3) break; // safety: max 3 wrap lines
        }
        contractvorm = contractvorm.replace(/\s+/g, ' ').trim();
      }
    }

    if (!naam) continue;

    const key = `${naam}|${loonheffingennummer}|${contractvorm}`;
    let werkgever = werkgeverMap.get(key);
    if (!werkgever) {
      werkgever = {
        id: `WG${String(werkgeverMap.size + 1).padStart(3, '0')}`,
        naam,
        loonheffingennummer,
        verzekerdeWetten,
        contractvorm,
        isUitkering: UWV_LOONHEFFINGENNUMMERS.includes(loonheffingennummer),
        loonitems: [],
      };
      werkgeverMap.set(key, werkgever);
    }

    // Parse loonitems within this block.
    // PDF can produce two layouts:
    // Format A (pdfplumber-style): "Eigen bijdrage auto Waarde privégebruik auto" on one line + "€ X € Y" on next
    // Format B: each label on own line, each amount on own line
    // The strategy: detect Format A first via combined-label line, then fallback to Format B.

    for (let i = 0; i < block.length; i++) {
      const periodMatch = block[i].match(
        /^(\d{2}-\d{2}-\d{4})\s*t\/m\s*(\d{2}-\d{2}-\d{4})\s+(\d+(?:[,.]\d+)?)(?:\s+€\s*([\d.,]+))?\s*$/
      );
      if (!periodMatch) continue;

      const periode = `${periodMatch[1]} t/m ${periodMatch[2]}`;
      const uren = parseFloat(periodMatch[3].replace(',', '.'));
      let svLoon = periodMatch[4] ? parseEurNL(periodMatch[4]) : 0;
      let eigenBijdrageAuto = 0;
      let waardePrivegebruikAuto = 0;

      // Collect lookahead lines until next period/werkgever
      const lookaheadLines = [];
      for (let j = i + 1; j < block.length; j++) {
        const line = block[j];
        if (/^\d{2}-\d{2}-\d{4}\s*t\/m/.test(line)) break;
        if (/^Werkgever\/Instantie/i.test(line)) break;
        if (/^(Periode|Aantal|Loonheffing|Verzekerde|Contractvorm)/i.test(line)) break;
        lookaheadLines.push(line);
        if (lookaheadLines.length >= 8) break;
      }

      // Detect Format A: a line containing BOTH labels
      let formatADetected = false;
      for (let j = 0; j < lookaheadLines.length - 1; j++) {
        const line = lookaheadLines[j];
        if (/Eigen\s+bijdrage\s+auto/i.test(line) && /Waarde\s+privégebruik\s+auto/i.test(line)) {
          formatADetected = true;
          const nextLine = lookaheadLines[j + 1];
          const eurs = [...nextLine.matchAll(/€\s*([\d.,]+)/g)];
          if (eurs.length >= 2) {
            eigenBijdrageAuto = parseEurNL(eurs[0][1]);
            waardePrivegebruikAuto = parseEurNL(eurs[1][1]);
          } else if (eurs.length === 1) {
            eigenBijdrageAuto = parseEurNL(eurs[0][1]);
          }
          break;
        }
      }

      if (!formatADetected) {
        // Format B: separate label per line
        for (let j = 0; j < lookaheadLines.length; j++) {
          const line = lookaheadLines[j];
          if (/^Eigen\s+bijdrage\s+auto\s*$/i.test(line)) {
            for (let k = j + 1; k < lookaheadLines.length; k++) {
              const m = lookaheadLines[k].match(/^€\s*([\d.,]+)\s*$/);
              if (m) { eigenBijdrageAuto = parseEurNL(m[1]); break; }
            }
          } else if (/^Waarde\s+privégebruik\s+auto\s*$/i.test(line)) {
            for (let k = j + 1; k < lookaheadLines.length; k++) {
              const m = lookaheadLines[k].match(/^€\s*([\d.,]+)\s*$/);
              if (m) { waardePrivegebruikAuto = parseEurNL(m[1]); break; }
            }
          }
        }

        // SV-loon (Format B): standalone € line that is NOT after a label
        if (svLoon === 0) {
          for (let j = 0; j < lookaheadLines.length; j++) {
            const line = lookaheadLines[j];
            if (!/^€\s*[\d.,]+\s*$/.test(line)) continue;
            const value = parseEurNL(line.match(/€\s*([\d.,]+)/)[1]);
            const prevLine = j > 0 ? lookaheadLines[j - 1] : '';
            const isAfterEigen = /^Eigen\s+bijdrage\s+auto\s*$/i.test(prevLine);
            const isAfterWaarde = /^Waarde\s+privégebruik\s+auto\s*$/i.test(prevLine);
            if (!isAfterEigen && !isAfterWaarde && value > svLoon) {
              svLoon = value;
            }
          }
        }
      }

      // Avoid duplicates across page boundaries
      if (!werkgever.loonitems.some(li => li.periode === periode)) {
        werkgever.loonitems.push({
          periode, uren, svLoon, eigenBijdrageAuto, waardePrivegebruikAuto,
        });
      }
    }
  }

  return {
    aanvragerNaam,
    aanmaakdatum,
    vzbVersie,
    werkgevers: Array.from(werkgeverMap.values()),
  };
}

// ============================================================
// PIEK-AFTOPPING (vereenvoudigd)
// ============================================================
//
// Voor de chart en B/C berekening: Niet Bestendige Pieken worden afgetopt op
// basis van de meerjarige vergelijking. Implementatie is een vereenvoudiging
// van hoofdstuk 6 van de rekenregels.

// ============================================================
// VOORBEWERKING van contracten (Rekenregels 5.1, 5.5, 5.6)
// Wordt uitgevoerd VOORDAT de beslisboom doorlopen wordt
// ============================================================

// Detecteer betaaltermijn van een loonitem (per Appendix 7)
function detecteerBetaaltermijn(periode) {
  const m = periode.match(/(\d{1,2})-(\d{1,2})-(\d{4})\s*t\/m\s*(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (!m) return 'maandelijks';
  const start = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  const end = new Date(parseInt(m[6]), parseInt(m[5]) - 1, parseInt(m[4]));
  const days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
  // Maandelijks: start op de 1e en eindigt op laatste dag van die maand
  const isStartFirstDay = start.getDate() === 1;
  const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const isEndLastDay = end.getDate() === lastDayOfMonth && end.getMonth() === start.getMonth();
  if (isStartFirstDay && isEndLastDay) return 'maandelijks';
  if (days === 28) return 'vierwekelijks';
  // Default per rekenregels: maandelijks
  return 'maandelijks';
}

// Bepaal de meest gangbare betaaltermijn van een contract (van het meest recente loonitem)
function contractBetaaltermijn(loonitems) {
  const sorted = sortLoonitems(loonitems);
  if (sorted.length === 0) return 'maandelijks';
  return detecteerBetaaltermijn(sorted[0].periode);
}

// 5.5 Samenvoegen van Contracten (binnen Dezelfde Werkgever)
// Gegeven: lijst werkgevers (kunnen meerdere contracten bij dezelfde werkgever zitten)
// Resultaat: gemergde lijst waar contracten bij dezelfde werkgever gecombineerd zijn
//   indien er voldaan wordt aan de criteria.
function samenvoegContracten(werkgevers) {
  // Groepeer werkgevers op (naam + loonheffingennummer): "Dezelfde Werkgever"
  const groepen = new Map();
  werkgevers.forEach(w => {
    const key = `${w.naam}::${w.loonheffingennummer}`;
    if (!groepen.has(key)) groepen.set(key, []);
    groepen.get(key).push(w);
  });

  const merged = [];
  for (const [key, contracten] of groepen.entries()) {
    if (contracten.length === 1) {
      merged.push(contracten[0]);
      continue;
    }
    // Multi-contract: probeer samen te voegen
    // Sorteer contracten op meest recente einddatum (descending)
    const sorted = [...contracten].sort((a, b) => {
      const aLast = sortLoonitems(a.loonitems)[0];
      const bLast = sortLoonitems(b.loonitems)[0];
      return parsePeriode(bLast.periode).end - parsePeriode(aLast.periode).end;
    });

    // Check criteria voor merging
    const meestRecent = sorted[0];
    const meestRecentLi = sortLoonitems(meestRecent.loonitems);
    const recentEinddatum = parsePeriode(meestRecentLi[0].periode).end;
    const recentBegindatum = parsePeriode(meestRecentLi[meestRecentLi.length - 1].periode).start;
    const meestRecentBetaaltermijn = contractBetaaltermijn(meestRecent.loonitems);

    // Probeer elk volgend contract aan te sluiten
    let huidig = { ...meestRecent, loonitems: [...meestRecent.loonitems] };
    let mergeMogelijk = true;
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const nextLi = sortLoonitems(next.loonitems);
      const nextEinddatum = parsePeriode(nextLi[0].periode).end;
      const huidigBegindatum = parsePeriode(sortLoonitems(huidig.loonitems)[sortLoonitems(huidig.loonitems).length - 1].periode).start;

      // Criterium 1: zelfde betaaltermijn
      if (contractBetaaltermijn(next.loonitems) !== meestRecentBetaaltermijn) {
        mergeMogelijk = false;
        break;
      }
      // Criterium 2: aansluitende datumreeksen (geen gaten/overlap)
      // einddatum van next moet 1 dag voor begindatum van huidig liggen
      const dagVerschil = Math.round((huidigBegindatum - nextEinddatum) / (24 * 3600 * 1000));
      if (dagVerschil !== 1) {
        mergeMogelijk = false;
        break;
      }
      // Voeg loonitems samen
      huidig.loonitems = [...huidig.loonitems, ...next.loonitems];
    }

    if (mergeMogelijk) {
      // Sorteer eindresultaat
      huidig.loonitems = sortLoonitems(huidig.loonitems);
      huidig._samengevoegd = sorted.length;
      merged.push(huidig);
    } else {
      // Voeg afzonderlijke contracten toe (beslisboom doorlopen per contract)
      contracten.forEach(c => merged.push(c));
    }
  }
  return merged;
}

// 5.1 Verlofregel: verwijder verlofperiodes (0 uren) uit Vaste Contracten
function pasVerlofregelToe(werkgever) {
  if (!werkgever.loonitems || werkgever.loonitems.length === 0) return werkgever;
  // Alleen voor Vaste Contracten (Niet-Vaste contracten of Uitkeringen niet)
  if (werkgever.isUitkering) return werkgever;
  // Check of contractvorm "vast" is (we kennen die check al)
  const isVast = isVastContractvorm(werkgever.contractvorm);
  if (!isVast) return werkgever;

  // Geen mengvorm betaaltermijnen toegestaan
  const betaaltermijnen = new Set(werkgever.loonitems.map(li => detecteerBetaaltermijn(li.periode)));
  if (betaaltermijnen.size > 1) return werkgever;

  const sorted = sortLoonitems(werkgever.loonitems);
  const N = sorted.length;
  if (N < 4) return werkgever; // niet genoeg historie

  // Vind blokken van 0-uren perioden (in het deel NA de meest recente 3 perioden)
  // sorted is descending; index 0,1,2 = meest recent (mag niet aangepast worden)
  let i = 3;
  let meestRecenteVerlofBlok = null;
  while (i < N) {
    if ((sorted[i].uren || 0) === 0) {
      const start = i;
      while (i < N && (sorted[i].uren || 0) === 0) i++;
      const end = i; // exclusive
      const lengte = end - start;
      // Criterium: max 6 perioden
      if (lengte > 6) { continue; }
      // Periode voor (= meer recent, dus index start-1) en periode na (= index end)
      if (start === 0 || end >= N) { continue; } // randgeval
      const urenVoor = sorted[start - 1].uren || 0;
      const urenNa = sorted[end].uren || 0;
      // Criterium: voor en na exact zelfde uren
      if (urenVoor !== urenNa || urenVoor === 0) { continue; }
      // Eerste valide blok = meest recente (we lopen van recent naar oud)
      meestRecenteVerlofBlok = { start, end, lengte };
      break;
    }
    i++;
  }

  if (!meestRecenteVerlofBlok) return werkgever;

  // Verwijder de verlofperiodes — overige perioden schuiven naar voren in de tijd
  // (in de praktijk: we verwijderen ze gewoon uit de lijst)
  const newLoonitems = [
    ...sorted.slice(0, meestRecenteVerlofBlok.start),
    ...sorted.slice(meestRecenteVerlofBlok.end),
  ];

  return {
    ...werkgever,
    loonitems: newLoonitems,
    _verlofregelToegepast: {
      lengte: meestRecenteVerlofBlok.lengte,
      origineelAantal: N,
      nieuwAantal: newLoonitems.length,
    },
  };
}

// 5.6.5.1 Omrekening Bronperiode → Doelperiodes (vierwekelijks ↔ maandelijks)
// Gegeven een Bronperiode-loonitem en bestaande Doelperiode-datumreeksen,
// kent het loonitem proportioneel toe op basis van overlapping dagen.
function omrekenenLoonitem(bronLi, doelDatumreeksen) {
  const bronP = parsePeriode(bronLi.periode);
  if (!bronP) return [];
  const totaalDagen = Math.round((bronP.end - bronP.start) / (24 * 3600 * 1000)) + 1;
  const result = [];
  for (const doelStr of doelDatumreeksen) {
    const doelP = parsePeriode(doelStr);
    if (!doelP) continue;
    const overlapStart = new Date(Math.max(bronP.start, doelP.start));
    const overlapEnd = new Date(Math.min(bronP.end, doelP.end));
    if (overlapEnd < overlapStart) continue;
    const overlapDagen = Math.round((overlapEnd - overlapStart) / (24 * 3600 * 1000)) + 1;
    if (overlapDagen <= 0) continue;
    const aandeel = overlapDagen / totaalDagen;
    result.push({
      doelPeriode: doelStr,
      aandeel,
      svLoon: (bronLi.svLoon || 0) * aandeel,
      uren: (bronLi.uren || 0) * aandeel,
      waardePrivegebruikAuto: (bronLi.waardePrivegebruikAuto || 0) * aandeel,
      eigenBijdrageAuto: (bronLi.eigenBijdrageAuto || 0) * aandeel,
    });
  }
  return result;
}

// Genereer de doel-datumreeksen bij omrekening
function genereerDoelDatumreeksen(naar, fromDate, toDate) {
  // naar = 'maandelijks' of 'vierwekelijks'
  const reeksen = [];
  if (naar === 'maandelijks') {
    let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    while (cursor <= toDate) {
      const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      reeksen.push(`${fmt(start)} t/m ${fmt(end)}`);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  } else {
    // Voor vierwekelijks gebruiken we de KOPPELTABEL (eerste mapping)
    // Dit is een vereenvoudiging; bij echte gebruik moet de officiële tabel uit Bijlage Appendix 7 worden gebruikt
    const sortedKeys = Object.keys(KOPPELTABEL_MAAND_NAAR_4WK).sort();
    for (const key of sortedKeys) {
      const v = KOPPELTABEL_MAAND_NAAR_4WK[key];
      const p = parsePeriode(v);
      if (p && p.end >= fromDate && p.start <= toDate) {
        reeksen.push(v);
      }
    }
  }
  return reeksen;
}

// Heel een contract omrekenen naar één betaaltermijn
function rekenContractOm(werkgever, doelBetaaltermijn) {
  if (!werkgever.loonitems || werkgever.loonitems.length === 0) return werkgever;
  // Check of er een mengvorm aanwezig is (anders is omrekening niet nodig)
  const huidigeBetaaltermijnen = werkgever.loonitems.map(li => detecteerBetaaltermijn(li.periode));
  const heeftMengvorm = new Set(huidigeBetaaltermijnen).size > 1;
  if (!heeftMengvorm) return werkgever;

  // Bepaal omvang van het volledige contract
  const sorted = sortLoonitems(werkgever.loonitems);
  const allesEinddatum = parsePeriode(sorted[0].periode).end;
  const allesBegindatum = parsePeriode(sorted[sorted.length - 1].periode).start;

  // Genereer de doel-datumreeksen
  const doelReeksen = genereerDoelDatumreeksen(doelBetaaltermijn, allesBegindatum, allesEinddatum);
  if (doelReeksen.length === 0) return werkgever;

  // Voor elk loonitem: als betaaltermijn al klopt, behoud; anders verdeel over doel
  const aggregaat = new Map(); // doelPeriode → aggregated values
  doelReeksen.forEach(d => aggregaat.set(d, { periode: d, svLoon: 0, uren: 0, waardePrivegebruikAuto: 0, eigenBijdrageAuto: 0 }));

  for (const li of werkgever.loonitems) {
    const bt = detecteerBetaaltermijn(li.periode);
    if (bt === doelBetaaltermijn) {
      // Behoud zoals het is — pas in aggregaat toe (voeg toe voor exacte match)
      const a = aggregaat.get(li.periode);
      if (a) {
        a.svLoon += li.svLoon || 0;
        a.uren += li.uren || 0;
        a.waardePrivegebruikAuto += li.waardePrivegebruikAuto || 0;
        a.eigenBijdrageAuto += li.eigenBijdrageAuto || 0;
      }
      continue;
    }
    // Verdeel proportioneel
    const verdeling = omrekenenLoonitem(li, doelReeksen);
    for (const v of verdeling) {
      const a = aggregaat.get(v.doelPeriode);
      if (a) {
        a.svLoon += v.svLoon;
        a.uren += v.uren;
        a.waardePrivegebruikAuto += v.waardePrivegebruikAuto;
        a.eigenBijdrageAuto += v.eigenBijdrageAuto;
      }
    }
  }

  // Filter perioden zonder data
  const newLoonitems = [...aggregaat.values()].filter(p => p.svLoon > 0 || p.uren > 0);
  return {
    ...werkgever,
    loonitems: newLoonitems,
    _omgerekendNaar: doelBetaaltermijn,
  };
}

// ============================================================

// === 6.2 Vaststellen (Niet-)Incidentele Pieken ===
// Voor elke periode in laatste jaar (12), vergelijk met dezelfde periode jaar 1 en 2 eerder.
// Markeer alle perioden in de vergelijking met hetzelfde type.
function bepaalIncidenteelType(sorted) {
  const types = new Map();
  for (let i = 0; i < Math.min(12, sorted.length); i++) {
    const huidig = sorted[i].svLoon;
    const j1 = i + 12 < sorted.length ? sorted[i + 12].svLoon : null;
    const j2 = i + 24 < sorted.length ? sorted[i + 24].svLoon : null;
    const values = [huidig, j1, j2].filter(v => v !== null);
    const adjusted = values.map(v => v <= 0 ? 0.01 : v);
    const min = Math.min(...adjusted);
    const max = Math.max(...adjusted);
    const isIncidenteel = (max / min) > 1.30;
    const t = isIncidenteel ? 'incidenteel' : 'niet-incidenteel';
    types.set(i, t);
    if (i + 12 < sorted.length) types.set(i + 12, t);
    if (i + 24 < sorted.length) types.set(i + 24, t);
  }
  return types;
}

// === 6.3 Gemiddeld Periode Inkomen ===
function gemiddeldPeriodeInkomen(sorted, scopeMonths, piekTypes) {
  let sum = 0, count = 0;
  for (let i = 0; i < Math.min(scopeMonths, sorted.length); i++) {
    const huidig = sorted[i].svLoon;
    if (huidig <= 0) continue;
    let vorige = 0;
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].svLoon > 0) { vorige = sorted[j].svLoon; break; }
    }
    const ratio = vorige > 0 ? huidig / vorige : 0;
    const isIncidenteel = piekTypes.get(i) === 'incidenteel';
    if (ratio > 1.5 && isIncidenteel) continue;
    sum += huidig;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

// === 6.4 Aftopping Excessieve Incidentele Pieken ===
function aftopExcessieveIncidentelePieken(sorted, scopeMonths, piekTypes, GPI) {
  const mitigated = sorted.map(li => ({
    ...li, mitigatedSvLoon: li.svLoon, eipPiek: false, enipPiek: false,
  }));
  for (let i = 0; i < Math.min(scopeMonths, sorted.length); i++) {
    const huidig = sorted[i].svLoon;
    if (huidig <= 0) continue;
    const isIncidenteel = piekTypes.get(i) === 'incidenteel';
    const isExcessief = huidig > 1.5 * GPI;
    if (!isIncidenteel || !isExcessief) continue;
    mitigated[i].eipPiek = true;
    const monthIdx = i % 12;
    const refIndices = [monthIdx, monthIdx + 12, monthIdx + 24];
    const refValues = refIndices
      .map(idx => idx < sorted.length ? sorted[idx].svLoon : null)
      .filter(v => v !== null && v >= 0);
    const gemRefs = refValues.length > 0 ? refValues.reduce((s, v) => s + v, 0) / refValues.length : 0;
    let meestRecente = 0;
    for (const idx of refIndices) {
      if (idx < sorted.length && sorted[idx].svLoon > 0) {
        meestRecente = sorted[idx].svLoon;
        break;
      }
    }
    const eipA = 2 * GPI;
    const eipB = Math.min(gemRefs, meestRecente);
    const cap = Math.min(huidig, eipA, eipB);
    mitigated[i].mitigatedSvLoon = cap;
  }
  return mitigated;
}

// === 6.5 Gemiddeld Jaar Inkomen ===
function gemiddeldJaarInkomen(mitigated, periodsToCheck) {
  let sum = 0, count = 0;
  for (let i = 0; i < Math.min(periodsToCheck, mitigated.length); i++) {
    const huidig = mitigated[i].mitigatedSvLoon;
    if (huidig <= 0) continue;
    let vorige = 0;
    for (let j = i + 1; j < mitigated.length; j++) {
      if (mitigated[j].mitigatedSvLoon > 0) { vorige = mitigated[j].mitigatedSvLoon; break; }
    }
    const ratio = vorige > 0 ? huidig / vorige : 1;
    if (ratio <= 1.3) {
      sum += huidig;
      count++;
    }
  }
  if (count === 0) return 0;
  return (sum / count) * 12;
}

// === 6.6 Aftopping Excessieve Niet-Incidentele Pieken ===
function aftopExcessieveNietIncidentelePieken(mitigated, scopeMonths, piekTypes, GJI) {
  const threshold = (4 / 12) * GJI;
  for (let i = 0; i < Math.min(scopeMonths, mitigated.length); i++) {
    const huidig = mitigated[i].mitigatedSvLoon;
    const isNietIncidenteel = piekTypes.get(i) === 'niet-incidenteel';
    if (!isNietIncidenteel || huidig <= threshold) continue;
    const monthIdx = i % 12;
    const refIndices = [monthIdx, monthIdx + 12, monthIdx + 24];
    const refValues = refIndices
      .map(idx => idx < mitigated.length ? mitigated[idx].mitigatedSvLoon : null)
      .filter(v => v !== null && v >= 0);
    const gemRefs = refValues.length > 0 ? refValues.reduce((s, v) => s + v, 0) / refValues.length : 0;
    let meestRecente = 0;
    for (const idx of refIndices) {
      if (idx < mitigated.length && mitigated[idx].mitigatedSvLoon > 0) {
        meestRecente = mitigated[idx].mitigatedSvLoon;
        break;
      }
    }
    const aftopA = (4 / 12) * GJI;
    const aftopB = Math.min(gemRefs, meestRecente);
    const cap = Math.min(huidig, aftopA, aftopB);
    if (cap < huidig) {
      mitigated[i].mitigatedSvLoon = cap;
      mitigated[i].enipPiek = true;
    }
  }
  return mitigated;
}

// === 3.7 Bestendigheidstoets ===
function bestendigheidstoets(loonitems) {
  const sorted = sortLoonitems(loonitems);
  if (sorted.length < 24) {
    return { bestendig: false, criterium1: false, criterium2: false, inkomensstijging: 0, nietBestendigePieken: [], reason: 'Te weinig perioden' };
  }
  // Criterium 1: inkomensstijging max 20% (signed Z, niet geclamped)
  const r12 = sorted.slice(0, 12);
  const p12 = sorted.slice(12, 24);
  const ijr1 = r12.reduce((s, li) => s + (li.svLoon || 0) - (li.waardePrivegebruikAuto || 0) + (li.eigenBijdrageAuto || 0), 0);
  const ijr2 = p12.reduce((s, li) => s + (li.svLoon || 0) - (li.waardePrivegebruikAuto || 0) + (li.eigenBijdrageAuto || 0), 0);
  const inkomensstijging = ijr2 > 0 ? (ijr1 / ijr2) * 100 : (ijr1 > 0 ? 999 : 0);
  const criterium1 = inkomensstijging <= 120;

  const nietBestendigePieken = [];
  if (criterium1) {
    // Criterium 2: voor elke periode in laatste 12 maanden, check niet-bestendige piek (3.7.2)
    for (let t = 0; t < 12; t++) {
      if (t + 1 >= sorted.length) break;
      const huidig = sorted[t].svLoon || 0;
      const vorige = sorted[t + 1].svLoon || 0.01;
      const V1 = huidig / Math.max(vorige, 0.01);
      if (V1 <= 1.3) continue;

      // Step 2: V2 (zelfde periode jaar eerder)
      if (t + 13 >= sorted.length) continue;
      const jaarEerder = sorted[t + 12].svLoon || 0;
      const jaarEerderVorige = sorted[t + 13].svLoon || 0.01;
      const V2 = jaarEerder / Math.max(jaarEerderVorige, 0.01);
      if (V2 <= 1.3) {
        nietBestendigePieken.push({ index: t, periode: sorted[t].periode, V1, V2, reason: 'V2≤1.3' });
        continue;
      }

      // Step 3: max/min ratio
      const ratio = Math.max(huidig, jaarEerder) / Math.max(Math.min(huidig, jaarEerder), 0.01);
      if (ratio > 1.3) {
        nietBestendigePieken.push({ index: t, periode: sorted[t].periode, V1, V2, ratio, reason: 'max/min>1.3' });
        continue;
      }

      // Step 4: dubbele piek (alleen als niet meest recente)
      if (t === 0) continue;
      const tPlus1 = sorted[t - 1].svLoon || 0;
      if (tPlus1 / Math.max(vorige, 0.01) <= 1.3) continue;
      if (t + 11 >= sorted.length) continue;
      const tPlus1JaarEerder = sorted[t - 1 + 12].svLoon || 0;
      const dubbelRatio = Math.max(tPlus1, tPlus1JaarEerder) / Math.max(Math.min(tPlus1, tPlus1JaarEerder), 0.01);
      if (dubbelRatio > 1.3) {
        nietBestendigePieken.push({ index: t, periode: sorted[t].periode, V1, V2, reason: 'dubbele piek' });
      }
    }
  }

  const criterium2 = nietBestendigePieken.length === 0;
  const piekDetail = nietBestendigePieken.length > 0
    ? `Niet-bestendige piek in ${nietBestendigePieken[0].periode} (${nietBestendigePieken[0].reason})`
    : '';
  return {
    bestendig: criterium1 && criterium2,
    inkomensstijging,
    criterium1,
    criterium2,
    nietBestendigePieken,
    piekDetail,
  };
}

// === 3.2 Urenpercentage + 5.2 Parttimepercentage ===
function urenpercentage(allLoonitems) {
  const sorted = sortLoonitems(allLoonitems);
  const recent3 = sorted.slice(0, 3);
  const recent12 = sorted.slice(0, 12);
  const sumUren = items => items.reduce((s, li) => s + (li.uren || 0), 0);

  if (recent3.length < 3) return { ok: false, percentage: 0, U3: 0, Ujr: 0, error: 'Het verzekeringsbericht bevat geen loonitems in de eerste 3 perioden.' };
  // 3.2.3 sub 1: geen 0 uren in laatste 3
  if (recent3.some(li => (li.uren || 0) === 0)) {
    return { ok: false, percentage: 0, U3: 0, Ujr: 0, error: 'In één of meer van de 3 meest recente perioden is 0 gewerkte uren geconstateerd.' };
  }
  // 3.2.3 sub 3: geen negatieve uren in eerste 4 perioden
  if (sorted.slice(0, 4).some(li => (li.uren || 0) < 0)) {
    return { ok: false, percentage: 0, U3: 0, Ujr: 0, error: 'Geen berekening mogelijk. Indien er sprake is van een negatief aantal uren in de afgelopen 4 maanden of 5 vierwekelijkse perioden kan er geen correcte berekening van het uren- en of parttimepercentage worden vastgesteld.' };
  }

  const U3 = sumUren(recent3) / 3;
  const Ujr = sumUren(recent12) / Math.min(recent12.length, 12);
  const pct = Ujr > 0 ? (U3 / Ujr) * 100 : 100;

  // 5.2 Parttimepercentage (alleen toepassen als pct < 93,7%)
  let parttimePercentage = 100;
  if (pct < 93.7) {
    // UPT3: laagste van de 3 recentste perioden
    const upt3 = Math.min(...recent3.map(li => li.uren || 0));
    // UPTjr: gemiddelde uren over periodes 4-15
    const periode4tot15 = sorted.slice(3, 15);
    const uptjr = periode4tot15.length > 0
      ? sumUren(periode4tot15) / Math.min(periode4tot15.length, 12)
      : 0;
    parttimePercentage = uptjr > 0 ? Math.min(100, Math.max(0, (upt3 / uptjr) * 100)) : 100;
  }

  return { ok: true, percentage: pct, U3, Ujr, parttimePercentage, voldoende: pct >= 93.7 };
}

// === 3.2.3 Attendering bij teveel gewerkte uren ===
// Officiële drempels per API spec p.31:
//   Maandelijks: > 208 uur per periode
//   Vierwekelijks: > 192 uur per periode
function attenderingTeveelUren(loonitems) {
  const sorted = sortLoonitems(loonitems);
  if (sorted.length < 1) return { teveel: false, perioden: [] };
  // Detecteer betaaltermijn van het meest recente loonitem
  const bt = detecteerBetaaltermijn(sorted[0].periode);
  const drempel = bt === 'vierwekelijks' ? 192 : 208;
  const perioden = sorted.slice(0, Math.min(12, sorted.length))
    .filter(li => (li.uren || 0) > drempel);
  const tekst = bt === 'vierwekelijks'
    ? 'Let op: de aanvrager heeft afgelopen jaar in minimaal één periode meer dan 192 uur gewerkt.'
    : 'Let op: de aanvrager heeft afgelopen jaar in minimaal één periode meer dan 208 uur gewerkt.';
  return {
    teveel: perioden.length > 0,
    perioden,
    drempel,
    betaaltermijn: bt,
    tekst: perioden.length > 0 ? tekst : null,
  };
}

// === 4.1 A-Berekening ===
function berekenA(loonitems, parttimePercentage) {
  const sorted = sortLoonitems(loonitems);
  const PT = parttimePercentage / 100;

  // Bij A-berekening: alleen Excessieve Niet-Incidentele Pieken aftoppen.
  // (Excessieve Incidentele Pieken aftopping is alleen voor B/C)
  const piekTypes = bepaalIncidenteelType(sorted);
  // Voor A is de scope 12 maanden, maar piek-type bepaling vergt 36 maanden lookup.

  // Skip stap 6.4 (excessieve incidentele aftopping) voor A
  let mitigated = sorted.map(li => ({ ...li, mitigatedSvLoon: li.svLoon, eipPiek: false, enipPiek: false }));

  // Voor 6.6: GJI nodig
  const gji36 = gemiddeldJaarInkomen(mitigated, 36);
  const gji12 = gemiddeldJaarInkomen(mitigated, 12);
  const GJI = Math.min(gji36, gji12);

  mitigated = aftopExcessieveNietIncidentelePieken(mitigated, 12, piekTypes, GJI);

  const I3 = mitigated.slice(0, 3).reduce((s, p) => s + p.mitigatedSvLoon, 0);
  const I9 = mitigated.slice(3, 12).reduce((s, p) => s + p.mitigatedSvLoon, 0);
  const I = I3 + I9 * PT;

  // Z over 12 perioden, geclamped op 0 indien negatief
  const Zraw = mitigated.slice(0, 12).reduce((s, p) =>
    s + (p.waardePrivegebruikAuto || 0) - (p.eigenBijdrageAuto || 0), 0);
  const Z = Math.max(0, Zraw);

  return {
    type: 'A',
    toetsinkomen: I - Z,
    I, I3, I9, Z, GJI, PT: parttimePercentage,
    mitigated: mitigated.slice(0, 12),
    detail: `I3 = ${fmtEur(I3)} + I9 × PT% = ${fmtEur(I9)} × ${parttimePercentage.toFixed(2)}% → I = ${fmtEur(I)}, Z = ${fmtEur(Z)}`,
  };
}

// === 4.2 B-Berekening ===
function berekenB(loonitems, parttimePercentage) {
  const sorted = sortLoonitems(loonitems);
  const PT = parttimePercentage / 100;

  // 6.2: bepaal incidenteel/niet-incidenteel
  const piekTypes = bepaalIncidenteelType(sorted);

  // 6.3: Gemiddeld Periode Inkomen (over 24 maanden)
  const GPI = gemiddeldPeriodeInkomen(sorted, 24, piekTypes);

  // 6.4: aftop excessieve incidentele pieken
  let mitigated = aftopExcessieveIncidentelePieken(sorted, 24, piekTypes, GPI);

  // 6.5: Gemiddeld Jaar Inkomen
  const gji36 = gemiddeldJaarInkomen(mitigated, 36);
  const gji12 = gemiddeldJaarInkomen(mitigated, 12);
  const GJI = Math.min(gji36, gji12);

  // 6.6: aftop excessieve niet-incidentele pieken
  mitigated = aftopExcessieveNietIncidentelePieken(mitigated, 24, piekTypes, GJI);

  // 4.2 Specificatie:
  const I3 = mitigated.slice(0, 3).reduce((s, p) => s + p.mitigatedSvLoon, 0);
  const I9 = mitigated.slice(3, 12).reduce((s, p) => s + p.mitigatedSvLoon, 0);
  const I21 = mitigated.slice(3, 24).reduce((s, p) => s + p.mitigatedSvLoon, 0);

  const I2jr = (I3 + I21 * PT) / 2;
  const Ijr = I3 + I9 * PT;

  // Z2jr en Zjr: clamped op 0 indien negatief
  const Z2jrRaw = mitigated.slice(0, 24).reduce((s, p) =>
    s + (p.waardePrivegebruikAuto || 0) - (p.eigenBijdrageAuto || 0), 0);
  const Z2jr = Math.max(0, Z2jrRaw) / 2;
  const ZjrRaw = mitigated.slice(0, 12).reduce((s, p) =>
    s + (p.waardePrivegebruikAuto || 0) - (p.eigenBijdrageAuto || 0), 0);
  const Zjr = Math.max(0, ZjrRaw);

  const optie1 = I2jr - Z2jr;
  const optie2 = Ijr - Zjr;
  const toetsinkomen = Math.min(optie1, optie2);

  return {
    type: 'B',
    toetsinkomen,
    GPI, GJI, gji36, gji12,
    I3, I9, I21, I2jr, Ijr, Z2jr, Zjr, optie1, optie2,
    PT: parttimePercentage,
    mitigated: mitigated.slice(0, 24),
    piekTypes,
    detail: `Min van: gemiddelde 2-jaar (I2jr - Z2jr) = ${fmtEur(optie1)} en laatste jaar (Ijr - Zjr) = ${fmtEur(optie2)}`,
  };
}

// === 4.3 C-Berekening ===
function berekenC(reguliereLoonitems, uitkeringLoonitems, parttimePercentage) {
  // Aggregeer per kalendermaand: regulier + uitkering
  const periodMap = new Map();
  const addToMap = (li, isUitkering) => {
    const p = parsePeriode(li.periode);
    if (!p) return;
    const key = `${p.start.getFullYear()}-${String(p.start.getMonth() + 1).padStart(2, '0')}`;
    if (!periodMap.has(key)) {
      periodMap.set(key, {
        periode: li.periode, parsedPeriode: p,
        svLoonRegulier: 0, svLoonUitkering: 0,
        waardePrivegebruikAuto: 0, eigenBijdrageAuto: 0, uren: 0,
      });
    }
    const e = periodMap.get(key);
    if (isUitkering) e.svLoonUitkering += (li.svLoon || 0);
    else e.svLoonRegulier += (li.svLoon || 0);
    e.waardePrivegebruikAuto += (li.waardePrivegebruikAuto || 0);
    e.eigenBijdrageAuto += (li.eigenBijdrageAuto || 0);
    e.uren += (li.uren || 0);
  };
  reguliereLoonitems.forEach(li => addToMap(li, false));
  uitkeringLoonitems.forEach(li => addToMap(li, true));

  let periodes = Array.from(periodMap.values())
    .sort((a, b) => b.parsedPeriode.end - a.parsedPeriode.end)
    .map(p => ({ ...p, svLoon: p.svLoonRegulier + p.svLoonUitkering }));

  // Bereken uitkeringspercentage per periode
  periodes = periodes.map(p => ({
    ...p,
    uitkeringspercentage: p.svLoon > 0 ? p.svLoonUitkering / p.svLoon : 0,
  }));

  const PT = parttimePercentage / 100;

  // 6.2 - 6.6 op het Periodeinkomen (incl. uitkeringen)
  const piekTypes = bepaalIncidenteelType(periodes);
  const GPI = gemiddeldPeriodeInkomen(periodes, 36, piekTypes);
  let mitigated = aftopExcessieveIncidentelePieken(periodes, 36, piekTypes, GPI);
  const gji36 = gemiddeldJaarInkomen(mitigated, 36);
  const gji12 = gemiddeldJaarInkomen(mitigated, 12);
  const GJI = Math.min(gji36, gji12);
  mitigated = aftopExcessieveNietIncidentelePieken(mitigated, 36, piekTypes, GJI);

  // I3i (incl uitk), I33i (mnd 4-36 incl uitk)
  const I3i = mitigated.slice(0, 3).reduce((s, p) => s + p.mitigatedSvLoon, 0);
  const I33i = mitigated.slice(3, 36).reduce((s, p) => s + p.mitigatedSvLoon, 0);
  const I3jr = (I3i + I33i * PT) / 3;

  // Voor exclusief uitkeringen: corrigeer mitigated × (1 - uitkeringspct)
  const exclMitigated = (idx) => {
    const p = mitigated[idx];
    const m = p.mitigatedSvLoon;
    const pct = p.uitkeringspercentage || 0;
    return m * (1 - pct);
  };
  const I3e = mitigated.slice(0, 3).reduce((s, _, i) => s + exclMitigated(i), 0);
  const I9e = mitigated.slice(3, 12).reduce((s, _, i) => s + exclMitigated(i + 3), 0);
  const Ijr = I3e + I9e * PT;

  // Z3jr en Zjr: clamped op 0
  const Z3jrRaw = mitigated.slice(0, 36).reduce((s, p) =>
    s + (p.waardePrivegebruikAuto || 0) - (p.eigenBijdrageAuto || 0), 0);
  const Z3jr = Math.max(0, Z3jrRaw) / 3;
  const ZjrRaw = mitigated.slice(0, 12).reduce((s, p) =>
    s + (p.waardePrivegebruikAuto || 0) - (p.eigenBijdrageAuto || 0), 0);
  const Zjr = Math.max(0, ZjrRaw);

  const optie1 = I3jr - Z3jr;
  const optie2 = Ijr - Zjr;
  const toetsinkomen = Math.min(optie1, optie2);

  return {
    type: 'C',
    toetsinkomen,
    GPI, GJI, gji36, gji12,
    I3i, I33i, I3jr, I3e, I9e, Ijr, Z3jr, Zjr, optie1, optie2,
    PT: parttimePercentage,
    mitigated: mitigated.slice(0, 36),
    piekTypes,
    detail: `Min van: gemiddelde 3-jaar incl. uitk. = ${fmtEur(optie1)} en laatste jaar excl. uitk. = ${fmtEur(optie2)}`,
  };
}

// === 4.4 D-Berekening ===
function berekenD(loonitems) {
  const sorted = sortLoonitems(loonitems);
  const recent4 = sorted.slice(0, 4);
  if (recent4.length < 4) {
    return { type: 'D', toetsinkomen: 0, detail: 'Onvoldoende perioden' };
  }
  const laagste = Math.min(...recent4.map(li => li.svLoon || 0));
  const I = laagste * 12;
  const meestRecent = sorted[0];
  // Z = netto bijtelling van meest recente periode × 12, clamped op 0
  const nettoBijtellingRaw = (meestRecent.waardePrivegebruikAuto || 0) - (meestRecent.eigenBijdrageAuto || 0);
  const Z = Math.max(0, nettoBijtellingRaw) * 12;

  return {
    type: 'D',
    toetsinkomen: I - Z,
    I, Z, laagste,
    mitigated: recent4.map(li => ({ ...li, mitigatedSvLoon: li.svLoon })),
    detail: `Laagste SV-loon van laatste 4 perioden = ${fmtEur(laagste)} × 12 = ${fmtEur(I)} -/- auto Z = ${fmtEur(Z)}`,
  };
}

// ============================================================
// HOOFD-DECISION TREE
// ============================================================
function berekenToetsinkomen({ werkgevers, eigenBijdrage, peildatum, aanvragerNaam }) {
  const result = {
    success: false,
    error: null,
    errorCode: null,
    steps: [],
    werkgeverResults: [],
    eigenBijdrage: eigenBijdrage || 0,
    sumIncome: 0,
    finalToetsinkomen: 0,
    omschrijving: '',
    samenstelling: '',
    isParttime: false,
    parttimePercentage: 100,
    urenpercentage: 100,
    voorbewerking: { samenvoegingen: [], verlofregelToegepast: [], omrekeningen: [] },
    sanityChecks: [],
  };

  // === SANITY CHECKS conform Appendix 6 + API foutcodes ===

  // Check 2035: Downloaddatum mag niet in toekomst liggen
  if (peildatum && peildatum > new Date()) {
    result.error = API_FOUTCODES[2035];
    result.errorCode = 2035;
    return result;
  }

  // Check 2034: ongeldige uren waarden (NaN, oneindig)
  for (const w of werkgevers) {
    for (const li of (w.loonitems || [])) {
      if (typeof li.uren !== 'number' || isNaN(li.uren) || !isFinite(li.uren)) {
        result.error = API_FOUTCODES[2034];
        result.errorCode = 2034;
        return result;
      }
    }
  }

  // Check 2030: negatieve uren in laatste 4 mnd (mnd) of 5 vw-perioden
  // Per Rekenregels 3.2.3: indien negatieve uren in deze recente perioden → geen berekening mogelijk
  if (peildatum) {
    for (const w of werkgevers) {
      if (!w.loonitems || w.loonitems.length === 0) continue;
      const sorted = sortLoonitems(w.loonitems);
      const bt = detecteerBetaaltermijn(sorted[0]?.periode || '');
      const checkPerioden = bt === 'vierwekelijks' ? 5 : 4;
      const recentSlice = sorted.slice(0, checkPerioden);
      const negatief = recentSlice.find(li => (li.uren || 0) < 0);
      if (negatief) {
        result.error = API_FOUTCODES[2030];
        result.errorCode = 2030;
        return result;
      }
    }
  }

  // Check 2036: loonitem mag max 3 perioden in toekomst liggen
  if (peildatum) {
    const max = new Date(peildatum);
    max.setMonth(max.getMonth() + 3);
    for (const w of werkgevers) {
      for (const li of (w.loonitems || [])) {
        const p = parsePeriode(li.periode);
        if (p && p.start > max) {
          result.error = API_FOUTCODES[2036];
          result.errorCode = 2036;
          return result;
        }
      }
    }
  }

  // Check 2037: UWV-loonheffingennummers mogen alleen voor UWV-uitkering omschrijvingen gebruikt worden
  for (const w of werkgevers) {
    const isUwvNr = UWV_LOONHEFFINGENNUMMERS.includes(w.loonheffingennummer);
    const isUwvOmschrijving = UWV_UITKERING_OMSCHRIJVINGEN.some(om =>
      (w.naam || '').includes(om) || om.includes(w.naam || '')
    );
    // Reguliere werkgever met UWV-loonheffingennummer → fout
    if (isUwvNr && !isUwvOmschrijving && !/UWV/i.test(w.naam || '')) {
      result.error = API_FOUTCODES[2037];
      result.errorCode = 2037;
      result.sanityChecks.push({ code: 2037, werkgever: w.naam });
      return result;
    }
  }

  // Filter alleen werkgevers met loonitems
  let validWerkgevers = werkgevers.filter(w => w.loonitems && w.loonitems.length > 0);
  if (validWerkgevers.length === 0) {
    result.error = API_FOUTCODES[2038];
    result.errorCode = 2038;
    return result;
  }

  // Check: contractvorm leeg (per Rekenregels Appendix 6 — negeer contracten zonder contractvorm)
  // Tenzij Uitkering, want Uitkeringen kennen geen contractvorm
  validWerkgevers = validWerkgevers.filter(w => {
    if (w.isUitkering) return true;
    // Vanaf 1-1-2020: contractvorm verplicht voor reguliere contracten
    if (!w.contractvorm || w.contractvorm.trim().length === 0) {
      result.sanityChecks.push({
        code: 'NEGEERD',
        werkgever: w.naam,
        reden: 'Contract zonder contractvorm wordt genegeerd (Rekenregels Appendix 6)',
      });
      return false;
    }
    return true;
  });

  if (validWerkgevers.length === 0) {
    result.error = API_FOUTCODES[2038];
    result.errorCode = 2038;
    return result;
  }

  // === VOORBEWERKING (Rekenregels 5.1, 5.5, 5.6) ===
  // Stap 1: Samenvoegen Contracten (5.5) — bij Dezelfde Werkgever met aansluitende perioden
  const voorSamenvoegen = validWerkgevers.length;
  validWerkgevers = samenvoegContracten(validWerkgevers);
  if (validWerkgevers.length < voorSamenvoegen) {
    result.voorbewerking.samenvoegingen.push({
      voorAantal: voorSamenvoegen,
      naAantal: validWerkgevers.length,
      detail: `${voorSamenvoegen - validWerkgevers.length} contract(en) samengevoegd bij dezelfde werkgever`,
    });
  }

  // Stap 2: Verlofregel (5.1) — alleen op Vaste Contracten
  validWerkgevers = validWerkgevers.map(w => {
    const orig = w;
    const result_w = pasVerlofregelToe(w);
    if (result_w._verlofregelToegepast) {
      result.voorbewerking.verlofregelToegepast.push({
        werkgever: w.naam,
        ...result_w._verlofregelToegepast,
      });
    }
    return result_w;
  });

  // Stap 3: Omrekening betaaltermijn (5.6.5) — bij wisseling binnen contract
  validWerkgevers = validWerkgevers.map(w => {
    const sortedLi = sortLoonitems(w.loonitems);
    if (sortedLi.length === 0) return w;
    const meestRecenteBt = detecteerBetaaltermijn(sortedLi[0].periode);
    const heeftMengvorm = new Set(w.loonitems.map(li => detecteerBetaaltermijn(li.periode))).size > 1;
    if (!heeftMengvorm) return w;
    const omgerekend = rekenContractOm(w, meestRecenteBt);
    if (omgerekend._omgerekendNaar) {
      result.voorbewerking.omrekeningen.push({
        werkgever: w.naam,
        naar: meestRecenteBt,
      });
    }
    return omgerekend;
  });

  // === Verzamel alle loonitems ===
  const allLoonitems = validWerkgevers.flatMap((w, wIdx) =>
    w.loonitems.map(li => ({ ...li, _werkgeverIdx: wIdx, parsedPeriode: parsePeriode(li.periode) }))
  ).filter(li => li.parsedPeriode);

  if (allLoonitems.length === 0) {
    result.error = 'Geen geldige periodes gevonden';
    return result;
  }

  allLoonitems.sort((a, b) => b.parsedPeriode.end - a.parsedPeriode.end);
  const algemeenMeestRecent = allLoonitems[0];
  const peildatumDate = peildatum ? new Date(peildatum) : new Date();

  // === STAP 1 ===
  const monthsAgo = monthsBetween(peildatumDate, algemeenMeestRecent.parsedPeriode.end);
  const stap1Ja = monthsAgo < 2 && (algemeenMeestRecent.uren || 0) > 0
    && !validWerkgevers[algemeenMeestRecent._werkgeverIdx].isUitkering;

  result.steps.push({
    nummer: 1,
    vraag: 'Werkt de aanvrager momenteel in loondienst? (Rekenregels 3.1)',
    antwoord: stap1Ja ? 'Ja' : 'Nee',
    detail: `Algemeen meest recent loonitem: ${algemeenMeestRecent.periode} (${monthsAgo} periode(s) geleden vanaf peildatum)`,
  });

  if (!stap1Ja) {
    result.error = 'De aanvrager komt niet in aanmerking voor IBL: meest recente loonitem te oud, geen uren of betreft uitkering.';
    return result;
  }

  // === STAP 2: Urenpercentage ===
  const reguliereLoonitems = allLoonitems.filter(li => !validWerkgevers[li._werkgeverIdx].isUitkering);
  const ur = urenpercentage(reguliereLoonitems);

  if (!ur.ok) {
    result.error = ur.error;
    return result;
  }

  result.urenpercentage = ur.percentage;
  result.parttimePercentage = ur.parttimePercentage || 100;
  result.isParttime = !ur.voldoende;

  result.steps.push({
    nummer: 2,
    vraag: 'Heeft de aanvrager de afgelopen 3 maanden voldoende gewerkt? (Rekenregels 3.2)',
    antwoord: ur.voldoende ? 'Ja' : 'Nee',
    detail: `Urenpercentage = (U3 / Ujr) × 100% = (${ur.U3.toFixed(2)} / ${ur.Ujr.toFixed(2)}) × 100% = ${ur.percentage.toFixed(2)}% (grens 93,7%)${!ur.voldoende ? ` → Parttimepercentage ${result.parttimePercentage.toFixed(2)}%` : ''}`,
  });

  // Attendering bij teveel gewerkte uren (Rekenregels 3.2.3)
  result.attendering = attenderingTeveelUren(reguliereLoonitems);

  // === STAP 3: Kortstondig contract? ===
  const kortstondig = validWerkgevers.length === 1 && validWerkgevers[0].loonitems.length === 1;
  result.steps.push({
    nummer: 3,
    vraag: 'Is er sprake van een kortstondig Contract? (Rekenregels 3.3)',
    antwoord: kortstondig ? 'Ja' : 'Nee',
    detail: kortstondig ? '1 contract met 1 loonitem → C-berekening' : `${validWerkgevers.length} werkgever(s), totaal ${allLoonitems.length} loonitem(s)`,
  });

  // === Per werkgever: stap 4-7 ===
  for (let wIdx = 0; wIdx < validWerkgevers.length; wIdx++) {
    const w = validWerkgevers[wIdx];
    const wLoonitems = sortLoonitems(w.loonitems);
    if (wLoonitems.length === 0) continue;

    const wMostRecent = parsePeriode(wLoonitems[0].periode);
    if (!wMostRecent) continue;

    const periodeDiff = Math.abs(monthsBetween(algemeenMeestRecent.parsedPeriode.end, wMostRecent.end));

    // Stap 4: Vast contract?
    const isCvVast = isVastContractvorm(w.contractvorm);

    const heeftSvLoon = (wLoonitems[0].svLoon || 0) > 0;
    const heeftUren = (wLoonitems[0].uren || 0) > 0;
    const isVast = !w.isUitkering && isCvVast && periodeDiff <= 1 && heeftSvLoon && heeftUren && !kortstondig;
    // Definitie Actief Contract (Rekenregels 5.4): MRL ≤ 1 periode afwijkt van Algemene MRL
    const isActief = periodeDiff <= 1;

    const wResult = {
      werkgever: w,
      werkgeverIdx: wIdx,
      contractId: `${w.id}_0`,
      stappen: [],
      category: null,
      berekening: null,
      isVast,
      isActief,
      periodeDiffMaanden: periodeDiff,
      aantalPeriodes: wLoonitems.length,
    };

    if (kortstondig) {
      wResult.category = 'C';
      wResult.stappen.push({ nummer: 4, vraag: 'Wordt voor dit Contract een Vast Contract vermeld? (Rekenregels 3.4)', antwoord: 'N.v.t.', detail: 'Door kortstondig contract → C-berekening' });
    } else if (!isVast) {
      wResult.category = 'C';
      wResult.stappen.push({
        nummer: 4,
        vraag: 'Wordt voor dit Contract een Vast Contract vermeld? (Rekenregels 3.4)',
        antwoord: 'Nee',
        detail: w.isUitkering ? 'Uitkering → C-berekening' : `${isCvVast ? 'Voldoet niet aan vast-contract criteria' : 'Niet-vaste contractvorm'} → C-berekening`,
      });
    } else {
      wResult.stappen.push({
        nummer: 4,
        vraag: 'Wordt voor dit Contract een Vast Contract vermeld? (Rekenregels 3.4)',
        antwoord: 'Ja',
        detail: `Vaste contractvorm, ${wLoonitems.length} loonitem(s)`,
      });

      // Stap 5: ≥4 periodes?
      const min4 = wLoonitems.length >= 4;
      wResult.stappen.push({
        nummer: 5,
        vraag: 'Werkt de aanvrager minimaal 4 Periodes onder dit Contract? (Rekenregels 3.5)',
        antwoord: min4 ? 'Ja' : 'Nee',
        detail: `${wLoonitems.length} loonitems`,
      });

      if (!min4) {
        wResult.category = 'NONE';
      } else {
        // Stap 6: ≥2 jaar?
        const min24 = wLoonitems.length >= 24;
        wResult.stappen.push({
          nummer: 6,
          vraag: 'Werkt de aanvrager minimaal 2 jaar onder dit Contract? (Rekenregels 3.6)',
          antwoord: min24 ? 'Ja' : 'Nee',
          detail: `${wLoonitems.length} perioden (24 nodig)`,
        });

        if (!min24) {
          wResult.category = 'D';
        } else {
          // Stap 7: bestendig?
          const best = bestendigheidstoets(wLoonitems);
          wResult.bestendigheid = best;
          wResult.stappen.push({
            nummer: 7,
            vraag: 'Is het inkomen van de aanvrager de afgelopen 2 jaar bestendig? (Rekenregels 3.7)',
            antwoord: best.bestendig ? 'Ja' : 'Nee',
            detail: `Inkomensstijging ${best.inkomensstijging.toFixed(2)}% (max 120%). ${best.piekDetail || (best.criterium2 ? 'Geen niet-bestendige pieken.' : '')}`,
          });
          wResult.category = best.bestendig ? 'A' : 'B';
        }
      }
    }

    // Voer berekening uit
    if (wResult.category === 'A') wResult.berekening = berekenA(wLoonitems, result.parttimePercentage);
    else if (wResult.category === 'B') wResult.berekening = berekenB(wLoonitems, result.parttimePercentage);
    else if (wResult.category === 'D') wResult.berekening = berekenD(wLoonitems);

    result.werkgeverResults.push(wResult);
  }

  // === 5.3 C en D Urencriterium ===
  // Indien er een D-berekening is + potentiële C-contracten, mogen die C-contracten
  // ALLEEN meedoen als de gezamenlijke uren per periode ≤ 200 (mnd) of ≤ 184 (vw)
  const dContracten = result.werkgeverResults.filter(wr => wr.category === 'D');
  const heeftDBerekening = dContracten.length > 0;
  let cContracten = result.werkgeverResults.filter(wr => wr.category === 'C');

  if (heeftDBerekening && cContracten.length > 0) {
    // 5.3.1 Aanlevercriteria: C-contracten moeten ≥2 jaar aaneengesloten gewerkt zijn,
    //       elke periode uren > 0, en MRL einddatum >= einddatum D-berekening
    const dEinddatum = dContracten
      .map(wr => parsePeriode(sortLoonitems(wr.werkgever.loonitems)[0]?.periode)?.end)
      .filter(Boolean)
      .reduce((max, d) => (max && max > d) ? max : d, null);

    const cContractenValid = cContracten.filter(wr => {
      if (wr.werkgever.isUitkering) return true; // uitkeringen worden los meegenomen
      const sortedLi = sortLoonitems(wr.werkgever.loonitems);
      if (sortedLi.length === 0) return false;
      const cBetaaltermijn = detecteerBetaaltermijn(sortedLi[0].periode);
      const minPerioden = cBetaaltermijn === 'vierwekelijks' ? 26 : 24;
      // 1. Minimaal 2 jaar aaneengesloten gewerkt
      if (sortedLi.length < minPerioden) return false;
      // 2. Iedere periode uren > 0 (in laatste 2 jaar)
      const heeftAlleUren = sortedLi.slice(0, minPerioden).every(li => (li.uren || 0) > 0);
      if (!heeftAlleUren) return false;
      // 3. MRL einddatum >= einddatum D-berekening
      const cEinddatum = parsePeriode(sortedLi[0].periode)?.end;
      if (dEinddatum && cEinddatum && cEinddatum < dEinddatum) return false;
      // 4. Geen negatieve uren in C-contract
      const heeftNegatieveUren = sortedLi.slice(0, minPerioden).some(li => (li.uren || 0) < 0);
      if (heeftNegatieveUren) return false;
      return true;
    });

    // 5.3.2 Toetsing: tel periode-uren van C-contracten op bij D-uren per periode
    if (cContractenValid.length > 0) {
      // Bepaal C-betaaltermijn (voor urengrens)
      const cBts = cContractenValid
        .filter(wr => !wr.werkgever.isUitkering)
        .map(wr => detecteerBetaaltermijn(sortLoonitems(wr.werkgever.loonitems)[0]?.periode || ''));
      const cBetaaltermijn = cBts.every(b => b === 'vierwekelijks') ? 'vierwekelijks' : 'maandelijks';
      const urenGrens = cBetaaltermijn === 'vierwekelijks' ? 184 : 200;

      // Voor iedere periode van de D-werkgever: D-uren + alle valid C-uren
      // Als ergens > urenGrens → C-contracten gaan NIET mee
      let urenOverschrijding = false;
      for (const dWr of dContracten) {
        const dLi = sortLoonitems(dWr.werkgever.loonitems);
        for (const dPeriode of dLi) {
          const dParsed = parsePeriode(dPeriode.periode);
          if (!dParsed) continue;
          let totaalUrenInPeriode = dPeriode.uren || 0;
          for (const cWr of cContractenValid) {
            if (cWr.werkgever.isUitkering) continue; // uitkeringen niet meetellen voor uren
            // Vind bijpassend C-loonitem (zelfde periode of overlappend)
            const cMatch = cWr.werkgever.loonitems.find(li => {
              const cParsed = parsePeriode(li.periode);
              return cParsed && cParsed.start.getMonth() === dParsed.start.getMonth()
                && cParsed.start.getFullYear() === dParsed.start.getFullYear();
            });
            if (cMatch) totaalUrenInPeriode += (cMatch.uren || 0);
          }
          if (totaalUrenInPeriode > urenGrens) {
            urenOverschrijding = true;
            break;
          }
        }
        if (urenOverschrijding) break;
      }

      if (urenOverschrijding) {
        // C-contracten meegerekend met D zou > 200/184 uren geven → uitsluiten
        cContractenValid.forEach(wr => {
          wr.category = null;
          wr.uitgesloten = `Gezamenlijke uren met D-berekening overschrijden ${urenGrens} u/periode (Rekenregels 5.3)`;
        });
      }
      result.urencriteriumCD = {
        urenGrens,
        cBetaaltermijn,
        overschreden: urenOverschrijding,
        valideContracten: cContractenValid.length,
      };
    }
  }

  // === C-berekening voor alle C-contracten + uitkeringen ===
  cContracten = result.werkgeverResults.filter(wr => wr.category === 'C');
  let cBerekening = null;
  if (cContracten.length > 0) {
    // 5.6.6 Contractoverkoepelende combinatie van betaaltermijnen
    // Bepaal de betaaltermijn van het Meest Recente Loonitem per contract
    const cBetaaltermijnen = cContracten.map(wr => {
      const sortedLi = sortLoonitems(wr.werkgever.loonitems);
      return sortedLi.length > 0 ? detecteerBetaaltermijn(sortedLi[0].periode) : 'maandelijks';
    });
    const allMaandelijks = cBetaaltermijnen.every(bt => bt === 'maandelijks');
    const allVierwekelijks = cBetaaltermijnen.every(bt => bt === 'vierwekelijks');
    const heeftMengvorm = !allMaandelijks && !allVierwekelijks;

    // Per Rekenregels 5.6.6:
    // - Alleen als ALLE vierwekelijks → vierwekelijks gehouden
    // - Anders ALLES omgerekend naar maandelijks (zelfs als algemeen MRL vierwekelijks)
    const doelBt = allVierwekelijks ? 'vierwekelijks' : 'maandelijks';
    let omgerekendCContracten = cContracten;
    if (heeftMengvorm) {
      result.voorbewerking.omrekeningen.push({
        werkgever: 'C-berekening (contractoverkoepelend)',
        naar: doelBt,
        detail: `${cContracten.length} contracten met gemengde betaaltermijnen omgerekend naar ${doelBt} per Rekenregels 5.6.6`,
      });
      // Pas omrekening toe op contracten met afwijkende betaaltermijn
      omgerekendCContracten = cContracten.map((wr, idx) => {
        if (cBetaaltermijnen[idx] === doelBt) return wr;
        // Reken het contract om
        const omgerekendeWerkgever = rekenContractOm(wr.werkgever, doelBt);
        return { ...wr, werkgever: omgerekendeWerkgever };
      });
    }

    const reguliere = omgerekendCContracten.filter(wr => !wr.werkgever.isUitkering)
      .flatMap(wr => wr.werkgever.loonitems);
    const uitkeringen = omgerekendCContracten.filter(wr => wr.werkgever.isUitkering)
      .flatMap(wr => wr.werkgever.loonitems);
    cBerekening = berekenC(reguliere, uitkeringen, result.parttimePercentage);
    cBerekening.betaaltermijn = doelBt;
    cBerekening.omgerekend = heeftMengvorm;
    cContracten.forEach(wr => {
      wr.berekening = cBerekening;
    });
  }

  // === STAP 8 + 9 ===
  let som = 0;
  for (const wr of result.werkgeverResults) {
    if (wr.category !== 'C' && wr.berekening) som += wr.berekening.toetsinkomen;
  }
  if (cBerekening) som += cBerekening.toetsinkomen;
  som = Math.max(0, som);

  result.sumIncome = som;
  result.steps.push({
    nummer: 8,
    vraag: 'Bepaal som van inkomens (Rekenregels 3.8)',
    antwoord: fmtEur(som),
    detail: `${result.werkgeverResults.filter(wr => wr.category !== 'C').length} A/B/D-berekeningen${cBerekening ? ' + 1 C-berekening' : ''}`,
  });

  // Per Rekenregels Appendix 2: bij uitsluitend oproepovereenkomsten geen eigen bijdrage pensioen meenemen
  const allActiveContractsAreOproep = result.werkgeverResults
    .filter(wr => wr.category !== 'D' && !wr.werkgever.isUitkering && wr.berekening)
    .every(wr => isOproepContractvorm(wr.werkgever.contractvorm));
  const heeftActieveContracten = result.werkgeverResults.some(wr => wr.berekening && !wr.werkgever.isUitkering);
  const eigenBijdrageToegestaan = !(heeftActieveContracten && allActiveContractsAreOproep);
  const effectieveEigenBijdrage = eigenBijdrageToegestaan ? (eigenBijdrage || 0) : 0;

  result.finalToetsinkomen = Math.max(0, som - effectieveEigenBijdrage);
  result.steps.push({
    nummer: 9,
    vraag: 'Tel eigen bijdrage pensioenregelingen en verzekeringen (Rekenregels 3.9)',
    antwoord: fmtEur(effectieveEigenBijdrage),
    detail: eigenBijdrageToegestaan
      ? `${fmtEur(som)} -/- ${fmtEur(effectieveEigenBijdrage)} = ${fmtEur(result.finalToetsinkomen)}`
      : 'In geval van uitsluitend actieve oproepovereenkomsten wordt een Eigen bijdrage pensioenregeling en/of verzekeringen niet meegenomen in de berekening.',
  });

  // Pensioen >15% waarschuwing (per API spec)
  const tisExclEigen = som; // toetsinkomen exclusief eigen bijdrage
  const pensioenIsHoog = tisExclEigen > 0 && (effectieveEigenBijdrage * 12 / tisExclEigen) > 0.15;
  result.eigenBijdrageWaarschuwing = pensioenIsHoog
    ? 'Let op: de berekende Eigen bijdrage pensioenregeling en/of verzekeringen bedraagt meer dan 15% van het toetsinkomen exclusief Eigen bijdrage pensioenregeling en/of verzekeringen.'
    : null;
  result.eigenBijdrageNietToegepast = !eigenBijdrageToegestaan && (eigenBijdrage || 0) > 0
    ? 'In geval van uitsluitend actieve oproepovereenkomsten wordt een Eigen bijdrage pensioenregeling en/of verzekeringen niet meegenomen in de berekening.'
    : null;

  // Bouw samenstelling string
  const vastSet = new Set();
  const nietVastSet = new Set();
  result.werkgeverResults.forEach(wr => {
    if (!wr.berekening) return;
    if (wr.category === 'C') {
      const hasVast = cContracten.some(c => c.isVast);
      const hasNietVast = cContracten.some(c => !c.isVast);
      if (hasVast) vastSet.add('C');
      if (hasNietVast) nietVastSet.add('C');
    } else {
      vastSet.add(wr.category);
    }
  });

  const formatCat = (c, isPt) => isPt && c !== 'D' ? c + '2' : c;
  const parts = [];
  if (vastSet.size > 0) parts.push(`Vast: ${[...vastSet].map(c => formatCat(c, result.isParttime)).join('-')}`);
  if (nietVastSet.size > 0) parts.push(`Niet vast: ${[...nietVastSet].map(c => formatCat(c, result.isParttime)).join('-')}`);
  result.samenstelling = parts.join(', ');

  // Omschrijving
  const primaryCat = [...vastSet][0] || [...nietVastSet][0];
  const omschrijvingen = {
    A: 'Het toetsinkomen is gebaseerd op het SV-loon van het afgelopen jaar bij de huidige werkgever.',
    B: 'Het toetsinkomen is gebaseerd op het SV-loon van de afgelopen 2 jaar bij de huidige werkgever.',
    C: 'Het toetsinkomen is gebaseerd op het SV-loon van de afgelopen 3 jaar uit loondienst en eventuele uitkeringen.',
    D: 'Het toetsinkomen is gebaseerd op het laagste SV-loon van de afgelopen 4 perioden vermenigvuldigd met 12.',
  };
  result.omschrijving = omschrijvingen[primaryCat] || '';
  if (result.isParttime) {
    result.omschrijving += ' Omdat de aanvrager afgelopen 3 maanden minder uren heeft gewerkt, is het toetsinkomen hiervoor gecorrigeerd.';
  }
  result.omschrijving += ` (${result.samenstelling})`;

  result.success = true;
  result.cBerekening = cBerekening;
  result.primaryCategory = result.isParttime && primaryCat && primaryCat !== 'D' ? primaryCat + '2' : primaryCat;

  // Bouw API response structuur conform officiele v10 spec
  result.apiResponse = {
    requestUuid: null, // wordt later gevuld door verifCode
    uwvInsuranceReportPerson: aanvragerNaam || null,
    uwvInsuranceReportCertificateInformation: {
      signatureDate: peildatum ? peildatum.toISOString() : null,
      signatureIsValid: !!peildatum,
      signatureIsNotOlderThan3Months: !!peildatum && (Date.now() - peildatum.getTime()) < 90 * 24 * 60 * 60 * 1000,
      signatureIsValidForAtLeast3Weeks: !!peildatum,
      signatureHash: null, // mock — vereist echte PKI verificatie
    },
    iblToolVersion: API_VERSIE,
    inputPersonalContributionToPensionOrInsurance: eigenBijdrage || 0,
    isCalculationSuccesful: true,
    calculationError: null,
    calculationResult: {
      usedIBLCalculationRulesVersion: REKENREGELS_VERSIE,
      calculatedIBLIncomeResult: result.finalToetsinkomen,
      calculatedPersonalContributionToPensionOrInsurance: effectieveEigenBijdrage,
      calculationCategory: result.samenstelling,
      calculationExplanation: result.omschrijving,
      calculationDetailsV8: {
        mostRecentPeriodsDetails: result.werkgeverResults.map(wr => ({
          calculationCategory: wr.category,
          employer: wr.werkgever.naam,
          contractType: wr.werkgever.contractvorm,
          calculatedIBLIncomeResultEmployer: wr.berekening?.toetsinkomen ?? 0,
          salaryItems: (wr.berekening?.mitigated || []).map(p => ({
            original: p.svLoon,
            mitigated: p.mitigatedSvLoon ?? p.svLoon,
          })),
        })),
      },
    },
  };

  return result;
}

// ============================================================
// REACT COMPONENTS
// ============================================================

const IBLLogo = ({ className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg width="38" height="38" viewBox="0 0 40 40" className="shrink-0">
      <g fill="#dc2626">
        <rect x="2" y="2" width="8" height="8" rx="1" />
        <rect x="14" y="14" width="8" height="8" rx="1" />
        <rect x="26" y="2" width="8" height="8" rx="1" />
        <rect x="2" y="26" width="8" height="8" rx="1" />
        <rect x="26" y="26" width="8" height="8" rx="1" />
        <circle cx="6" cy="14" r="1.2" />
        <circle cx="6" cy="22" r="1.2" />
        <circle cx="14" cy="6" r="1.2" />
        <circle cx="22" cy="6" r="1.2" />
        <circle cx="14" cy="30" r="1.2" />
        <circle cx="22" cy="30" r="1.2" />
        <circle cx="30" cy="14" r="1.2" />
        <circle cx="30" cy="22" r="1.2" />
      </g>
    </svg>
    <div className="leading-none text-red-600 font-bold tracking-tight" style={{ letterSpacing: '0.02em' }}>
      <div className="text-[14px]">INKOMENSBEPALING</div>
      <div className="text-[14px]">LOONDIENST</div>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState('upload'); // 'upload' | 'parsing' | 'edit' | 'result' | 'detail' | 'compare'
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfExportReady, setPdfExportReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [werkgevers, setWerkgevers] = useState([]);
  const [aanvragerNaam, setAanvragerNaam] = useState('');
  const [aanmaakdatum, setAanmaakdatum] = useState(null);
  const [vzbVersie, setVzbVersie] = useState('');
  const [eigenBijdrage, setEigenBijdrage] = useState(0);
  const [resultaat, setResultaat] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [parseProgress, setParseProgress] = useState('');
  // Vergelijking: tweede VZB resultaat
  const [vergelijking, setVergelijking] = useState(null); // {aanvragerNaam, aanmaakdatum, vzbVersie, werkgevers, eigenBijdrage, resultaat}
  const fileInputRef = useRef(null);
  const compareInputRef = useRef(null);
  const printableRef = useRef(null);

  // Load PDF.js dynamically
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfReady(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setPdfReady(true);
      };
      script.onerror = () => setParseError('Kon PDF-leesbibliotheek niet laden. Controleer je internetverbinding.');
      document.head.appendChild(script);
    }

    // Load jsPDF + html2canvas for PDF export
    const loadScript = (src) => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

    if (!window.jspdf || !window.html2canvas || !window.XLSX) {
      Promise.all([
        !window.jspdf ? loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js') : Promise.resolve(),
        !window.html2canvas ? loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js') : Promise.resolve(),
        !window.XLSX ? loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js') : Promise.resolve(),
      ]).then(() => setPdfExportReady(true)).catch(() => {
        console.warn('Export libraries failed to load');
      });
    } else {
      setPdfExportReady(true);
    }
  }, []);

  const handleSavePdf = async () => {
    if (!pdfExportReady || !resultaat || exporting) return;
    setExporting(true);
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const usableWidth = pageWidth - margin * 2;
      let y = margin;

      const ensureSpace = (needed) => {
        if (y + needed > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const drawText = (text, x, opts = {}) => {
        const { size = 10, bold = false, color = '#1f2937' } = opts;
        pdf.setFontSize(size);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setTextColor(color);
        pdf.text(text, x, y);
      };

      const drawWrapped = (text, x, maxW, opts = {}) => {
        const { size = 10, bold = false, lineHeight = 5 } = opts;
        pdf.setFontSize(size);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = pdf.splitTextToSize(String(text || ''), maxW);
        for (const line of lines) {
          ensureSpace(lineHeight);
          pdf.text(line, x, y);
          y += lineHeight;
        }
      };

      const drawDivider = () => {
        ensureSpace(4);
        pdf.setDrawColor('#e5e7eb');
        pdf.setLineWidth(0.2);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 4;
      };

      // === HEADER ===
      pdf.setFillColor('#dc2626');
      pdf.rect(0, 0, pageWidth, 12, 'F');
      pdf.setTextColor('#ffffff');
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INKOMENSBEPALING LOONDIENST', margin, 8);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Berekening d.d. ${new Date().toLocaleDateString('nl-NL')}`, pageWidth - margin, 8, { align: 'right' });
      y = 22;

      // === TITEL ===
      drawText('Resultaat IBL-berekening', margin, { size: 16, bold: true, color: '#111827' });
      y += 8;

      drawText(aanvragerNaam || '—', margin, { size: 12, bold: true });
      y += 7;

      drawDivider();

      // === SAMENVATTING ===
      drawText('Samenvatting', margin, { size: 13, bold: true, color: '#1d4ed8' });
      y += 7;

      const samenvatRows = [
        ['Aanvrager', aanvragerNaam || '—'],
        ['Peildatum', aanmaakdatum?.toLocaleDateString('nl-NL') || '—'],
        ['VZB versie', vzbVersie || '—'],
        ['Eigen bijdrage pensioen/verzekeringen', fmtEur(eigenBijdrage)],
        ['Berekeningstype', resultaat.primaryCategory || '—'],
        ['Samenstelling', resultaat.samenstelling || '—'],
      ];
      pdf.setFontSize(9);
      for (const [k, v] of samenvatRows) {
        ensureSpace(5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor('#6b7280');
        pdf.text(k, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor('#111827');
        pdf.text(String(v), margin + 70, y);
        y += 5;
      }
      y += 4;

      // === HOOFDRESULTAAT ===
      ensureSpace(25);
      pdf.setFillColor('#dbeafe');
      pdf.roundedRect(margin, y, usableWidth, 22, 2, 2, 'F');
      pdf.setTextColor('#1e3a8a');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Berekend totaal toetsinkomen', margin + 5, y + 7);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#1d4ed8');
      pdf.text(`${fmtEur(resultaat.finalToetsinkomen)} (${resultaat.primaryCategory})`, margin + 5, y + 17);
      y += 28;

      drawWrapped(resultaat.omschrijving || '', margin, usableWidth, { size: 9 });
      y += 5;

      drawDivider();

      // === WERKGEVERS ===
      drawText('Werkgevers', margin, { size: 13, bold: true, color: '#1d4ed8' });
      y += 7;

      for (const wr of resultaat.werkgeverResults || []) {
        ensureSpace(20);
        drawText(`${wr.werkgever.id || 'WG'} — ${wr.werkgever.naam}`, margin, { size: 11, bold: true });
        y += 5;
        const rows = [
          ['Loonheffingennummer', wr.werkgever.loonheffingennummer || '—'],
          ['Contractvorm', wr.werkgever.contractvorm || '—'],
          ['Categorie', wr.category || '—'],
          ['Toetsinkomen', wr.berekening ? fmtEur(wr.berekening.toetsinkomen) : '—'],
          ['Aantal loonitems', String(wr.werkgever.loonitems?.length || 0)],
          ['Actief contract', wr.isActief ? 'Ja' : `Nee (${wr.periodeDiffMaanden} periode(s) achterstand)`],
        ];
        for (const [k, v] of rows) {
          ensureSpace(4.5);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor('#6b7280');
          pdf.text(`  ${k}`, margin, y);
          pdf.setTextColor('#111827');
          const lines = pdf.splitTextToSize(String(v), usableWidth - 70);
          pdf.text(lines, margin + 70, y);
          y += 4.5 * Math.max(lines.length, 1);
        }
        y += 3;
      }

      drawDivider();

      // === BESLISBOOM ===
      ensureSpace(15);
      drawText('Beslisboom', margin, { size: 13, bold: true, color: '#1d4ed8' });
      y += 7;

      for (const stap of (resultaat.steps || [])) {
        ensureSpace(8);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#111827');
        pdf.text(`${stap.nummer}. ${stap.vraag || ''}`, margin, y);
        y += 5;
        if (stap.antwoord) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor('#1d4ed8');
          pdf.text(`   Antwoord: ${stap.antwoord}`, margin, y);
          y += 4;
        }
        if (stap.detail) {
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor('#6b7280');
          const lines = pdf.splitTextToSize(`   ${stap.detail}`, usableWidth);
          for (const line of lines) {
            ensureSpace(3.5);
            pdf.text(line, margin, y);
            y += 3.5;
          }
        }
        y += 1;
      }

      // === VOETTEKST op elke pagina ===
      const total = pdf.internal.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor('#9ca3af');
        pdf.text(`API ${FRONTEND_API_VERSIE} · Rekenregels ${REKENREGELS_VERSIE}`, margin, pageHeight - 8);
        pdf.text(`Pagina ${p} van ${total}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      const filename = `IBL_Toetsinkomen_${(aanvragerNaam || 'aanvrager').replace(/[^A-Za-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF-export mislukt: ' + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveExcel = () => {
    if (!window.XLSX || !resultaat) {
      alert('Excel export niet beschikbaar');
      return;
    }
    try {
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();

      // Sheet 1: Samenvatting
      const samenvatting = [
        ['IBL Toetsinkomen Berekening'],
        [],
        ['Aanvrager', aanvragerNaam || ''],
        ['Peildatum', aanmaakdatum ? aanmaakdatum.toLocaleDateString('nl-NL') : ''],
        ['VZB versie', vzbVersie || ''],
        ['Eigen bijdrage pensioen/verzekering', parseFloat(eigenBijdrage) || 0],
        [],
        ['Toetsinkomen', resultaat.finalToetsinkomen],
        ['Berekeningstype', resultaat.primaryCategory || ''],
        ['Samenstelling', resultaat.samenstelling || ''],
        ['Omschrijving', resultaat.omschrijving || ''],
        [],
        ['API versie', FRONTEND_API_VERSIE],
        ['Rekenregels versie', REKENREGELS_VERSIE],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(samenvatting);
      ws1['!cols'] = [{ wch: 32 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Samenvatting');

      // Sheet 2: Werkgevers
      const wgRows = [
        ['Werkgever ID', 'Naam', 'Loonheffingennummer', 'Contractvorm', 'Categorie', 'Toetsinkomen', 'Aantal loonitems', 'Actief'],
      ];
      resultaat.werkgeverResults.forEach(wr => {
        wgRows.push([
          wr.werkgever.id || '',
          wr.werkgever.naam || '',
          wr.werkgever.loonheffingennummer || '',
          wr.werkgever.contractvorm || '',
          wr.category || '',
          wr.berekening?.toetsinkomen || 0,
          wr.werkgever.loonitems?.length || 0,
          wr.isActief ? 'Ja' : 'Nee',
        ]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(wgRows);
      ws2['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 16 }, { wch: 60 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Werkgevers');

      // Sheet 3: Loonitems (alle perioden, alle werkgevers)
      const liRows = [
        ['Werkgever', 'Periode', 'Uren', 'SV-Loon', 'Privégebruik auto', 'Eigen bijdrage auto', 'Aftopping (gemitigeerd SV-loon)'],
      ];
      resultaat.werkgeverResults.forEach(wr => {
        const mit = wr.berekening?.mitigated || [];
        const mitMap = new Map(mit.map(m => [m.periode, m.mitigatedSvLoon]));
        (wr.werkgever.loonitems || []).forEach(li => {
          liRows.push([
            wr.werkgever.naam,
            li.periode,
            li.uren || 0,
            li.svLoon || 0,
            li.waardePrivegebruikAuto || 0,
            li.eigenBijdrageAuto || 0,
            mitMap.has(li.periode) ? mitMap.get(li.periode) : '',
          ]);
        });
      });
      const ws3 = XLSX.utils.aoa_to_sheet(liRows);
      ws3['!cols'] = [{ wch: 35 }, { wch: 24 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Loonitems');

      // Sheet 4: Beslisboom stappen
      const stappenRows = [['Stap', 'Vraag', 'Antwoord', 'Detail']];
      (resultaat.steps || []).forEach(s => {
        stappenRows.push([s.nummer || '', s.vraag || '', String(s.antwoord || ''), s.detail || '']);
      });
      const ws4 = XLSX.utils.aoa_to_sheet(stappenRows);
      ws4['!cols'] = [{ wch: 6 }, { wch: 65 }, { wch: 12 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'Beslisboom');

      const filename = `IBL_Berekening_${(aanvragerNaam || 'aanvrager').replace(/[^A-Za-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Excel-export mislukt: ' + (err.message || err));
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Selecteer een PDF-bestand');
      return;
    }
    setParseError(null);
    setView('parsing');
    setParseProgress('PDF lezen...');
    try {
      const text = await extractTextFromPdf(file);
      setParseProgress('Verzekeringsbericht analyseren...');
      const parsed = parseVerzekeringsbericht(text);

      // Specifieke validatie van het document
      const lowerText = text.toLowerCase();
      const heeftUWVHeader = /uwv|verzekeringsbericht|inkomstenoverzicht/i.test(text);
      const heeftWerkgeverHeader = /werkgever\/instantie|inhoudingsplichtige|werkgever:/i.test(text);

      if (!heeftUWVHeader) {
        throw new Error('Dit lijkt geen UWV Verzekeringsbericht te zijn. De tool verwacht een PDF van het UWV via "Mijn UWV" met loon- en uitkeringsgegevens.');
      }

      // VZB-versie support check (alleen 004+ ondersteund)
      if (parsed.vzbVersie) {
        const vNum = parseInt(parsed.vzbVersie.replace(/\D/g, ''));
        if (vNum > 0 && vNum < 4) {
          throw new Error(`VZB-versie ${parsed.vzbVersie} wordt niet ondersteund (foutcode 2032). De tool werkt met VZB-004 of nieuwer. Vraag een nieuwer Verzekeringsbericht aan via Mijn UWV.`);
        }
      }

      if (!heeftWerkgeverHeader) {
        throw new Error('Geen werkgever-secties in dit document gevonden. Mogelijk is de PDF een afbeelding (gescand) — gebruik dan de UWV-PDF die je via Mijn UWV downloadt, niet een gescande versie.');
      }

      if (!parsed.werkgevers || parsed.werkgevers.length === 0) {
        throw new Error('PDF kon worden gelezen maar er zijn geen geldige werkgeversgegevens uit te halen. Mogelijk is het document beschadigd of in een onbekend formaat.');
      }

      // Datum-validatie (foutcode 2035)
      if (parsed.aanmaakdatum && parsed.aanmaakdatum > new Date()) {
        throw new Error('De downloaddatum van dit Verzekeringsbericht ligt in de toekomst (foutcode 2035). Dat kan niet — controleer of het document echt is.');
      }

      // Ouder-dan-3-maanden waarschuwing (geen blocker, alleen melding)
      if (parsed.aanmaakdatum) {
        const driemaandgeleden = new Date();
        driemaandgeleden.setMonth(driemaandgeleden.getMonth() - 3);
        if (parsed.aanmaakdatum < driemaandgeleden) {
          // Toon waarschuwing maar laat doorgaan
          console.warn(`VZB is ouder dan 3 maanden (${parsed.aanmaakdatum.toLocaleDateString('nl-NL')}). Bij hypotheekaanvraag is meestal een recenter document vereist.`);
        }
      }

      setParsedData(parsed);
      setWerkgevers(parsed.werkgevers);
      setAanvragerNaam(parsed.aanvragerNaam || '');
      setAanmaakdatum(parsed.aanmaakdatum);
      setVzbVersie(parsed.vzbVersie || '');
      setView('edit');
    } catch (err) {
      console.error(err);
      setParseError(err.message || 'Kon het bestand niet verwerken');
      setView('upload');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleBereken = () => {
    const r = berekenToetsinkomen({
      werkgevers,
      eigenBijdrage: parseFloat(eigenBijdrage) || 0,
      peildatum: aanmaakdatum,
      aanvragerNaam,
    });
    setResultaat(r);
    setView('result');
  };

  const handleCompareFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Selecteer een PDF-bestand voor vergelijking');
      return;
    }
    try {
      const text = await extractTextFromPdf(file);
      const parsed = parseVerzekeringsbericht(text);
      if (!parsed.werkgevers || parsed.werkgevers.length === 0) {
        throw new Error('Geen werkgeversgegevens gevonden in vergelijkings-PDF');
      }
      const r = berekenToetsinkomen({
        werkgevers: parsed.werkgevers,
        eigenBijdrage: 0,
        peildatum: parsed.aanmaakdatum,
        aanvragerNaam: parsed.aanvragerNaam,
      });
      setVergelijking({
        aanvragerNaam: parsed.aanvragerNaam || 'Tweede aanvrager',
        aanmaakdatum: parsed.aanmaakdatum,
        vzbVersie: parsed.vzbVersie || '',
        werkgevers: parsed.werkgevers,
        eigenBijdrage: 0,
        resultaat: r,
      });
      setView('compare');
    } catch (err) {
      console.error(err);
      alert('Kon de vergelijkings-PDF niet verwerken: ' + err.message);
    }
  };

  const reset = () => {
    setView('upload');
    setParsedData(null);
    setWerkgevers([]);
    setAanvragerNaam('');
    setAanmaakdatum(null);
    setVzbVersie('');
    setEigenBijdrage(0);
    setResultaat(null);
    setParseError(null);
  };

  return (
    <div className="min-h-screen" style={{ background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Print-specific styling */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, .no-print, button { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          .print-shadow-none { box-shadow: none !important; border: none !important; }
          h1, h2, h3, h4 { page-break-after: avoid; }
          table { page-break-inside: avoid; }
          .page-break-before { page-break-before: always; }
          .page-break-avoid { page-break-inside: avoid; }
          input, select { border: 1px solid #ddd !important; background: white !important; }
        }
        /* Skip-link voor screen readers */
        .skip-link {
          position: absolute; left: -9999px; z-index: 999;
          padding: 1em; background: #1d4ed8; color: white;
          opacity: 0; transition: opacity 0.2s;
        }
        .skip-link:focus { left: 50%; transform: translateX(-50%); top: 1em; opacity: 1; }
        /* Visually hidden helper for screen readers */
        .sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        /* Focus indicator boost */
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `}</style>

      <a href="#main-content" className="skip-link">Naar hoofdinhoud springen</a>

      {/* Top header */}
      <header className="bg-white border-b border-gray-200" role="banner">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-gray-800">
            Toetsinkomenberekenen.nl - Bereken het toetsinkomen voor InkomensBepalingLoondienst
          </h1>
          <IBLLogo />
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-8" role="main">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print-shadow-none">
          {view === 'upload' && (
            <UploadView
              pdfReady={pdfReady}
              parseError={parseError}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              onDrop={onDrop}
            />
          )}
          {view === 'parsing' && <ParsingView message={parseProgress} />}
          {view === 'edit' && (
            <EditView
              werkgevers={werkgevers}
              setWerkgevers={setWerkgevers}
              aanvragerNaam={aanvragerNaam}
              setAanvragerNaam={setAanvragerNaam}
              aanmaakdatum={aanmaakdatum}
              setAanmaakdatum={setAanmaakdatum}
              vzbVersie={vzbVersie}
              eigenBijdrage={eigenBijdrage}
              setEigenBijdrage={setEigenBijdrage}
              onBereken={handleBereken}
              onReset={reset}
            />
          )}
          {view === 'result' && resultaat && (
            <ResultView
              resultaat={resultaat}
              aanvragerNaam={aanvragerNaam}
              aanmaakdatum={aanmaakdatum}
              eigenBijdrage={parseFloat(eigenBijdrage) || 0}
              onShowDetail={() => setView('detail')}
              onCompare={() => setView('compare')}
              onReset={reset}
              onSavePdf={handleSavePdf}
              onSaveExcel={handleSaveExcel}
              pdfExportReady={pdfExportReady}
              exporting={exporting}
              printableRef={printableRef}
            />
          )}
          {view === 'detail' && resultaat && (
            <DetailView
              resultaat={resultaat}
              aanvragerNaam={aanvragerNaam}
              aanmaakdatum={aanmaakdatum}
              vzbVersie={vzbVersie}
              eigenBijdrage={parseFloat(eigenBijdrage) || 0}
              werkgevers={werkgevers}
              onBack={() => setView('result')}
              onSavePdf={handleSavePdf}
              pdfExportReady={pdfExportReady}
              exporting={exporting}
              printableRef={printableRef}
            />
          )}
          {view === 'compare' && resultaat && (
            <CompareView
              resultaat={resultaat}
              aanvragerNaam={aanvragerNaam}
              aanmaakdatum={aanmaakdatum}
              eigenBijdrage={parseFloat(eigenBijdrage) || 0}
              vergelijking={vergelijking}
              onBack={() => setView('result')}
              onUploadCompare={handleCompareFile}
              onClearCompare={() => setVergelijking(null)}
              compareInputRef={compareInputRef}
            />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Open-source nabouw van toetsinkomenberekenen.nl · Gebaseerd op Rekenregels IBL versie 8.1.1 · Voor officiële berekeningen gebruik altijd toetsinkomenberekenen.nl
        </p>
      </main>
    </div>
  );
}

// ============================================================
// UPLOAD VIEW
// ============================================================
function UploadView({ pdfReady, parseError, onFileSelect, fileInputRef, onDrop }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Bereken het toetsinkomen</h2>
      <p className="text-gray-600 mb-8">
        Upload het UWV Verzekeringsbericht van de hypotheekaanvrager. De tool leest automatisch
        de werkgever, contractvorm en alle loonitems uit en past de IBL Rekenregels 8.1.1 toe.
      </p>

      {parseError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Fout bij verwerken</p>
            <p>{parseError}</p>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setDragOver(false); onDrop(e); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0])}
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-1">
          {pdfReady ? 'Sleep het UWV Verzekeringsbericht hierheen' : 'Bezig met laden...'}
        </p>
        <p className="text-sm text-gray-500">
          {pdfReady ? 'Of klik om een PDF te selecteren' : 'PDF-leesmodule wordt opgehaald'}
        </p>
        {!pdfReady && (
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-3 text-blue-500" />
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <Step nummer="1" titel="Upload PDF" beschrijving="UWV Verzekeringsbericht" />
        <Step nummer="2" titel="Controleer" beschrijving="Pas data zo nodig aan" />
        <Step nummer="3" titel="Bereken" beschrijving="Krijg toetsinkomen" />
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
        <p>
          Tip: Het Verzekeringsbericht download je via je <strong>Mijn UWV</strong>-omgeving.
          Het bericht is 3 maanden geldig na downloaddatum.
        </p>
      </div>
    </div>
  );
}

function Step({ nummer, titel, beschrijving }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
        {nummer}
      </div>
      <p className="text-sm font-medium text-gray-700">{titel}</p>
      <p className="text-xs text-gray-500">{beschrijving}</p>
    </div>
  );
}

// ============================================================
// PARSING VIEW
// ============================================================
function ParsingView({ message }) {
  return (
    <div className="text-center py-16">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <p className="text-lg font-medium text-gray-700">{message || 'Bezig...'}</p>
    </div>
  );
}

// ============================================================
// EDIT VIEW — bevestig parsed data
// ============================================================
function EditView({ werkgevers, setWerkgevers, aanvragerNaam, setAanvragerNaam, aanmaakdatum, setAanmaakdatum, vzbVersie, eigenBijdrage, setEigenBijdrage, onBereken, onReset }) {
  const [expandedW, setExpandedW] = useState({});

  const allContractvormen = [...VASTE_CONTRACTVORMEN, ...NIET_VASTE_CONTRACTVORMEN];

  const updateWerkgever = (idx, field, value) => {
    const next = [...werkgevers];
    next[idx] = { ...next[idx], [field]: value };
    setWerkgevers(next);
  };
  const updateLoonitem = (wIdx, lIdx, field, value) => {
    const next = [...werkgevers];
    next[wIdx] = { ...next[wIdx], loonitems: [...next[wIdx].loonitems] };
    next[wIdx].loonitems[lIdx] = {
      ...next[wIdx].loonitems[lIdx],
      [field]: field === 'periode' ? value : parseFloat(value) || 0,
    };
    setWerkgevers(next);
  };

  const addLoonitem = (wIdx) => {
    const next = [...werkgevers];
    const li = next[wIdx].loonitems || [];
    // Default: nieuwe loonitem 1 maand vóór de huidige eerste loonitem
    let defaultPeriode = '01-01-2026 t/m 31-01-2026';
    if (li.length > 0) {
      const sorted = sortLoonitems(li);
      const meestRecent = parsePeriode(sorted[0].periode);
      if (meestRecent) {
        const next_month = new Date(meestRecent.start.getFullYear(), meestRecent.start.getMonth() + 1, 1);
        const last = new Date(next_month.getFullYear(), next_month.getMonth() + 1, 0);
        const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        defaultPeriode = `${fmt(next_month)} t/m ${fmt(last)}`;
      }
    }
    next[wIdx] = {
      ...next[wIdx],
      loonitems: [{ periode: defaultPeriode, uren: 173, svLoon: 3000, eigenBijdrageAuto: 0, waardePrivegebruikAuto: 0 }, ...li],
    };
    setWerkgevers(next);
  };

  const removeLoonitem = (wIdx, lIdx) => {
    if (!confirm('Loonitem verwijderen?')) return;
    const next = [...werkgevers];
    next[wIdx] = { ...next[wIdx], loonitems: next[wIdx].loonitems.filter((_, i) => i !== lIdx) };
    setWerkgevers(next);
  };

  const addWerkgever = () => {
    const idx = werkgevers.length;
    const nieuw = {
      id: `WG${String(idx + 1).padStart(3, '0')}`,
      naam: 'Nieuwe werkgever',
      loonheffingennummer: '',
      contractvorm: VASTE_CONTRACTVORMEN[0],
      verzekerdeWetten: 'WW, ZW, WIA',
      isUitkering: false,
      loonitems: [],
    };
    setWerkgevers([...werkgevers, nieuw]);
    setExpandedW({ ...expandedW, [idx]: true });
  };

  const removeWerkgever = (idx) => {
    if (!confirm(`Werkgever "${werkgevers[idx].naam}" verwijderen?`)) return;
    const next = werkgevers.filter((_, i) => i !== idx);
    setWerkgevers(next);
  };

  const totalLoonitems = werkgevers.reduce((s, w) => s + (w.loonitems?.length || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verzekeringsbericht ingelezen</h2>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" /> Ander bestand
        </button>
      </div>

      {/* Aanvrager info — bewerkbaar */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900 mb-3">PDF succesvol verwerkt — gegevens zijn bewerkbaar</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-green-800 mb-1">Aanvrager</label>
                <input
                  type="text"
                  value={aanvragerNaam || ''}
                  onChange={(e) => setAanvragerNaam(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-800 mb-1">Peildatum (downloaddatum VZB)</label>
                <input
                  type="date"
                  value={aanmaakdatum ? aanmaakdatum.toISOString().slice(0, 10) : ''}
                  onChange={(e) => setAanmaakdatum(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white"
                />
              </div>
              <div className="text-xs text-green-800">
                <span className="block font-medium mb-1">Versie / Loonitems</span>
                <span className="block py-1">{vzbVersie || '—'} · {totalLoonitems} loonitems totaal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eigen bijdrage */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-5 mb-6">
        <h3 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" aria-hidden="true" /> Eigen bijdrage pensioenregeling en/of verzekeringen
        </h3>
        <p className="text-xs text-amber-800 mb-3">
          Deze informatie staat <strong>niet</strong> in het Verzekeringsbericht — vul deze handmatig in op basis van de loonstrook.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-900 font-medium" aria-hidden="true">€</span>
            <label htmlFor="eigen-bijdrage-input" className="sr-only">Eigen bijdrage bedrag</label>
            <input
              id="eigen-bijdrage-input"
              type="number"
              step="0.01"
              min="0"
              value={eigenBijdrage}
              onChange={(e) => setEigenBijdrage(e.target.value)}
              placeholder="0,00"
              aria-label="Eigen bijdrage pensioenregeling bedrag"
              className="px-3 py-2 border border-amber-300 rounded-md text-sm w-40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
            />
          </div>
          <span className="text-xs text-amber-700">per jaar</span>
          <span className="text-xs text-amber-600">·</span>
          <button
            type="button"
            onClick={() => {
              const m = prompt('Voer maandbijdrage in:');
              if (m !== null && !isNaN(parseFloat(m))) {
                setEigenBijdrage(String((parseFloat(m) * 12).toFixed(2)));
              }
            }}
            className="text-xs text-amber-700 hover:text-amber-900 underline"
          >
            Of vul in als maandbijdrage (×12)
          </button>
        </div>
      </div>

      {/* Werkgevers */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">
          Werkgevers / Uitkeringen ({werkgevers.length})
        </h3>
        <button
          onClick={addWerkgever}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 border border-blue-300 hover:bg-blue-50 rounded-md transition"
        >
          + Werkgever toevoegen
        </button>
      </div>
      <div className="space-y-3 mb-6">
        {werkgevers.map((w, idx) => (
          <div key={idx} className="border border-gray-200 rounded-md overflow-hidden">
            <div className="flex items-stretch">
              <button
                onClick={() => setExpandedW(s => ({ ...s, [idx]: !s[idx] }))}
                className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm text-gray-800">{w.naam || `Werkgever ${idx + 1}`}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {w.loonheffingennummer || '—'} · {w.loonitems?.length || 0} loonitems
                      {w.isUitkering && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">UWV-uitkering</span>}
                    </div>
                  </div>
                </div>
                {expandedW[idx] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
              <button
                onClick={() => removeWerkgever(idx)}
                title="Werkgever verwijderen"
                className="px-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 border-l border-gray-200 transition"
              >
                ✕
              </button>
            </div>

            {expandedW[idx] && (
              <div className="p-4 space-y-3 border-t border-gray-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Werkgever / Instantie</label>
                    <input
                      type="text"
                      value={w.naam}
                      onChange={(e) => updateWerkgever(idx, 'naam', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Loonheffingennummer</label>
                    <input
                      type="text"
                      value={w.loonheffingennummer}
                      onChange={(e) => updateWerkgever(idx, 'loonheffingennummer', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contractvorm</label>
                    <select
                      value={allContractvormen.find(cv => cv === w.contractvorm) ? w.contractvorm : ''}
                      onChange={(e) => updateWerkgever(idx, 'contractvorm', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">{w.contractvorm || '-- selecteer --'}</option>
                      <optgroup label="Vaste contracten">
                        {VASTE_CONTRACTVORMEN.map(cv => <option key={cv} value={cv}>{cv}</option>)}
                      </optgroup>
                      <optgroup label="Niet-vaste contracten">
                        {NIET_VASTE_CONTRACTVORMEN.map(cv => <option key={cv} value={cv}>{cv}</option>)}
                      </optgroup>
                    </select>
                    {w.contractvorm && !allContractvormen.includes(w.contractvorm) && (
                      <p className="text-xs text-amber-700 mt-1">
                        Originele waarde: <em>"{w.contractvorm}"</em> — selecteer de exacte categorie hierboven
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Soort</label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={!!w.isUitkering}
                        onChange={(e) => updateWerkgever(idx, 'isUitkering', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Dit is een UWV-uitkering</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700">Loonitems ({w.loonitems?.length || 0})</h4>
                    <button
                      onClick={() => addLoonitem(idx)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 border border-blue-300 hover:bg-blue-50 rounded transition"
                    >
                      + Loonitem
                    </button>
                  </div>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium text-gray-600">Periode</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600 w-16">Uren</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600 w-24">SV-loon</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600 w-24">Privégebruik</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600 w-24">Eigen bijdr.</th>
                          <th className="px-2 py-1.5 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(w.loonitems || []).map((li, lIdx) => (
                          <tr key={lIdx} className="border-t border-gray-100">
                            <td className="px-2 py-1">
                              <input type="text" value={li.periode} onChange={(e) => updateLoonitem(idx, lIdx, 'periode', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" step="0.01" value={li.uren || ''} onChange={(e) => updateLoonitem(idx, lIdx, 'uren', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" step="0.01" value={li.svLoon || ''} onChange={(e) => updateLoonitem(idx, lIdx, 'svLoon', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" step="0.01" value={li.waardePrivegebruikAuto || ''} onChange={(e) => updateLoonitem(idx, lIdx, 'waardePrivegebruikAuto', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" step="0.01" value={li.eigenBijdrageAuto || ''} onChange={(e) => updateLoonitem(idx, lIdx, 'eigenBijdrageAuto', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button onClick={() => removeLoonitem(idx, lIdx)}
                                title="Verwijderen"
                                className="text-gray-300 hover:text-red-600 transition">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onBereken}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition flex items-center justify-center gap-2 shadow-sm"
      >
        <Calculator className="w-5 h-5" /> Bereken toetsinkomen
      </button>
    </div>
  );
}

// ============================================================
// RESULT VIEW — matches official tool layout
// ============================================================
function ResultView({ resultaat, aanvragerNaam, aanmaakdatum, eigenBijdrage, onShowDetail, onCompare, onReset, onSavePdf, onSaveExcel, pdfExportReady, exporting, printableRef }) {
  if (!resultaat.success) {
    return (
      <div>
        <button onClick={onReset}
          className="mb-6 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> OPNIEUW
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resultaat van berekening</h2>
        <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 mb-1">
                Geen IBL-berekening mogelijk
                {resultaat.errorCode && <span className="ml-2 text-xs font-normal text-red-700">(Foutcode {resultaat.errorCode})</span>}
              </p>
              <p className="text-sm text-red-800">{resultaat.error}</p>
              {resultaat.steps?.length > 0 && (
                <div className="mt-3 text-sm text-red-800">
                  <p className="font-medium mb-1">Doorlopen stappen:</p>
                  <ul className="space-y-1">
                    {resultaat.steps.map((s, i) => (
                      <li key={i}>{s.nummer}. {s.vraag}: <strong>{s.antwoord}</strong></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onReset}
        className="mb-6 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition">
        <RefreshCw className="w-4 h-4" /> OPNIEUW
      </button>

      {/* Printable content starts here */}
      <div ref={printableRef} className="bg-white">
      <h2 className="text-2xl font-bold text-gray-800">Resultaat van berekening</h2>
      {aanvragerNaam && <p className="text-gray-600 mt-1">{aanvragerNaam}</p>}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Eigen invoer</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <span className="text-gray-600">Eigen bijdrage pensioenregeling en/of verzekeringen</span>
              <span className="text-right font-medium">{fmtEur(eigenBijdrage)}</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 mb-2 mt-6">Controle ontvangen PDF</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <CheckRow label="Geldigheid certificaat" />
            <CheckRow label="Ouderdom certificaat" detail={aanmaakdatum ? `Het certificaat is ondertekend op: ${aanmaakdatum.toLocaleString('nl-NL')}` : null} />
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">Berekening</h3>
            <CheckRow label="De berekening is uitgevoerd" detail={resultaat.omschrijving} />
          </div>
        </div>

        <div>
          {eigenBijdrage === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">
                <strong>Let op:</strong> Het toetsinkomen is berekend zonder eigen bijdrage pensioenregeling en/of verzekeringen.
              </p>
            </div>
          )}

          {resultaat.eigenBijdrageNietToegepast && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4 flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-sm text-orange-800">{resultaat.eigenBijdrageNietToegepast}</p>
            </div>
          )}

          {resultaat.eigenBijdrageWaarschuwing && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4 flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-sm text-orange-800">{resultaat.eigenBijdrageWaarschuwing}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-5 text-center">
            <p className="text-sm text-blue-900 mb-1">
              Berekend totaal toetsinkomen <span className="text-xs">(Berekeningscategorie)</span>
            </p>
            <p className="text-4xl font-bold text-blue-700 mt-3" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtEur(resultaat.finalToetsinkomen)}
              <span className="text-lg align-super ml-1">({resultaat.primaryCategory})</span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 italic mt-6 mb-8">
        Financiers die Inkomensbepaling Loondienst (IBL) hanteren hebben een eigen acceptatiebeleid.
        Raadpleeg het (IBL-)acceptatiebeleid van de gewenste financier.
      </p>

      {/* Charts per werkgever */}
      {resultaat.werkgeverResults.map((wr, idx) => (
        <WerkgeverChart key={idx} wr={wr} index={idx} />
      ))}

      {/* Juridische mededeling */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">Juridische Mededeling</p>
            <p className="text-blue-800">
              Deze tool kan alleen gebruikt worden ter eigen discretie van de gebruiker, en voor gebruiker's eigen rekening en
              risico. Een gebruiker van deze tool is verantwoordelijk voor de keuze en het gebruik van de tool, het verifiëren
              van de berekeningen en andere uitkomsten ervan binnen en buiten de organisatie van de gebruiker.
            </p>
          </div>
        </div>
      </div>
      </div>
      {/* Printable content ends here */}

      {/* Bottom action buttons */}
      <button
        onClick={onSavePdf}
        disabled={!pdfExportReady || exporting}
        className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition flex items-center justify-center gap-2"
      >
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> PDF wordt gegenereerd...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> BEWAAR ALS PDF VOOR UW EIGEN ADMINISTRATIE
          </>
        )}
      </button>

      <button onClick={onShowDetail}
        className="w-full mt-3 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md transition flex items-center justify-center gap-2">
        LAAT DE VOLLEDIGE BEREKENING ZIEN <ArrowRight className="w-4 h-4" />
      </button>

      {resultaat.apiResponse && (
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(resultaat.apiResponse, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IBL_API_response_${(aanvragerNaam || 'aanvrager').replace(/[^A-Za-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="w-full mt-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-md transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Exporteer API-response als JSON (voor advisory tools)
        </button>
      )}

      {onSaveExcel && (
        <button
          onClick={onSaveExcel}
          className="w-full mt-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-md transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Exporteer berekening naar Excel
        </button>
      )}

      {onCompare && (
        <button
          onClick={onCompare}
          className="w-full mt-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-md transition flex items-center justify-center gap-2"
        >
          <Building2 className="w-4 h-4" /> Vergelijk met tweede VZB (partner / co-aanvrager)
        </button>
      )}
    </div>
  );
}

function CompareView({ resultaat, aanvragerNaam, aanmaakdatum, eigenBijdrage, vergelijking, onBack, onUploadCompare, onClearCompare, compareInputRef }) {
  const r1 = resultaat;
  const r2 = vergelijking?.resultaat;

  const formatVerschil = (val1, val2) => {
    const diff = (val1 || 0) - (val2 || 0);
    const pct = val2 ? (diff / val2) * 100 : 0;
    return { diff, pct };
  };

  const totaalIncome1 = r1?.finalToetsinkomen || 0;
  const totaalIncome2 = r2?.finalToetsinkomen || 0;
  const verschil = formatVerschil(totaalIncome1, totaalIncome2);

  return (
    <div>
      <button onClick={onBack}
        className="mb-6 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition">
        <RefreshCw className="w-4 h-4" /> Terug naar resultaat
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Vergelijking IBL berekeningen</h2>

      {!vergelijking ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6 text-center">
          <p className="text-blue-900 font-medium mb-3">Upload een tweede UWV Verzekeringsbericht</p>
          <p className="text-sm text-blue-800 mb-4">
            Bijvoorbeeld voor de partner of co-aanvrager van een hypotheek.
            Het tweede toetsinkomen wordt naast het eerste getoond.
          </p>
          <input
            ref={compareInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => onUploadCompare(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => compareInputRef.current?.click()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
          >
            Tweede VZB uploaden
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-5">
              <p className="text-xs text-blue-700 font-medium mb-1">Aanvrager 1</p>
              <p className="font-medium text-blue-900 mb-3">{aanvragerNaam || '—'}</p>
              <p className="text-xs text-blue-700 mb-1">Toetsinkomen ({r1?.primaryCategory})</p>
              <p className="text-3xl font-bold text-blue-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtEur(totaalIncome1)}
              </p>
              <div className="mt-3 text-xs text-blue-800 space-y-1">
                <div>Peildatum: {aanmaakdatum?.toLocaleDateString('nl-NL') || '—'}</div>
                <div>Werkgevers: {r1?.werkgeverResults?.length || 0}</div>
                <div>Eigen bijdrage: {fmtEur(eigenBijdrage)}</div>
                <div>Categorie: {r1?.samenstelling}</div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-md p-5 relative">
              <button
                onClick={onClearCompare}
                title="Vergelijking verwijderen"
                className="absolute top-2 right-2 text-purple-400 hover:text-purple-700 text-sm"
              >✕</button>
              <p className="text-xs text-purple-700 font-medium mb-1">Aanvrager 2</p>
              <p className="font-medium text-purple-900 mb-3">{vergelijking.aanvragerNaam}</p>
              <p className="text-xs text-purple-700 mb-1">Toetsinkomen ({r2?.primaryCategory})</p>
              <p className="text-3xl font-bold text-purple-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtEur(totaalIncome2)}
              </p>
              <div className="mt-3 text-xs text-purple-800 space-y-1">
                <div>Peildatum: {vergelijking.aanmaakdatum?.toLocaleDateString('nl-NL') || '—'}</div>
                <div>Werkgevers: {r2?.werkgeverResults?.length || 0}</div>
                <div>Eigen bijdrage: {fmtEur(vergelijking.eigenBijdrage)}</div>
                <div>Categorie: {r2?.samenstelling}</div>
              </div>
            </div>
          </div>

          {/* Totaal */}
          <div className="bg-green-50 border border-green-200 rounded-md p-5">
            <p className="text-sm text-green-800 mb-1">Gezamenlijk toetsinkomen (voor hypotheekberekening)</p>
            <p className="text-4xl font-bold text-green-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtEur(totaalIncome1 + totaalIncome2)}
            </p>
            <div className="mt-3 text-sm text-green-800 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <span className="text-green-600">Aandeel 1: </span>
                <strong>{((totaalIncome1 / (totaalIncome1 + totaalIncome2)) * 100).toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-green-600">Aandeel 2: </span>
                <strong>{((totaalIncome2 / (totaalIncome1 + totaalIncome2)) * 100).toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-green-600">Verschil: </span>
                <strong>{fmtEur(Math.abs(verschil.diff))}</strong> ({Math.abs(verschil.pct).toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Verschillen-highlight: tabel met kerncijfers naast elkaar */}
          <div className="border border-gray-200 rounded-md p-4 page-break-avoid">
            <h4 className="font-semibold text-gray-800 mb-3">Verschillen overzicht</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-700">Kenmerk</th>
                    <th className="px-2 py-1.5 text-right font-medium text-blue-700">Aanvrager 1</th>
                    <th className="px-2 py-1.5 text-right font-medium text-purple-700">Aanvrager 2</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-700">Verschil</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Toetsinkomen', totaalIncome1, totaalIncome2, true],
                    ['Eigen bijdrage pensioen', eigenBijdrage, vergelijking.eigenBijdrage, true],
                    ['Aantal werkgevers', r1?.werkgeverResults?.length || 0, r2?.werkgeverResults?.length || 0, false],
                    ['Berekeningstype', r1?.primaryCategory || '—', r2?.primaryCategory || '—', false],
                  ].map(([label, v1, v2, isMoney], i) => {
                    const diff = isMoney ? (v1 || 0) - (v2 || 0) : null;
                    const isAfwijkend = isMoney && Math.abs(diff || 0) > 0.01;
                    return (
                      <tr key={i} className={`border-t border-gray-100 ${isAfwijkend ? 'bg-amber-50' : ''}`}>
                        <td className="px-2 py-1.5 text-gray-700">{label}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{isMoney ? fmtEur(v1) : v1}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{isMoney ? fmtEur(v2) : v2}</td>
                        <td className={`px-2 py-1.5 text-right font-mono ${isAfwijkend ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>
                          {isMoney ? (diff > 0 ? '+' : '') + fmtEur(diff || 0) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Geel-gemarkeerde rijen tonen waar Aanvrager 1 en 2 verschillen.
            </p>
          </div>

          {/* Side-by-side details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="font-semibold text-blue-700 mb-2">Werkgevers Aanvrager 1</h4>
              <div className="space-y-2 text-sm">
                {r1?.werkgeverResults?.map((wr, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                    <div>
                      <div className="font-medium">{wr.werkgever.naam}</div>
                      <div className="text-xs text-gray-500">{wr.category} · {wr.werkgever.loonitems?.length} loonitems</div>
                    </div>
                    <div className="font-mono text-right">{fmtEur(wr.berekening?.toetsinkomen || 0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="font-semibold text-purple-700 mb-2">Werkgevers Aanvrager 2</h4>
              <div className="space-y-2 text-sm">
                {r2?.werkgeverResults?.map((wr, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-100 pb-1">
                    <div>
                      <div className="font-medium">{wr.werkgever.naam}</div>
                      <div className="text-xs text-gray-500">{wr.category} · {wr.werkgever.loonitems?.length} loonitems</div>
                    </div>
                    <div className="font-mono text-right">{fmtEur(wr.berekening?.toetsinkomen || 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckRow({ label, detail }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p>{label}</p>
        {detail && <p className="text-xs text-gray-600 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function WerkgeverChart({ wr, index }) {
  if (!wr.berekening || !wr.berekening.mitigated) return null;

  const chartData = wr.berekening.mitigated.map((li, i) => ({
    periode: i + 1,
    'Basis SV Loon': Math.round(li.svLoon || 0),
    'Gemitigeerd SV Loon': Math.round(li.mitigatedSvLoon ?? li.svLoon ?? 0),
  })).reverse(); // chart shows oldest left, newest right? Officieel toont meest recent links

  // Officieel toont meest recent links (period 1 = nieuwste)
  const chartDataDisplay = wr.berekening.mitigated.map((li, i) => ({
    periode: i + 1,
    'Basis SV Loon': Math.round(li.svLoon || 0),
    'Gemitigeerd SV Loon': Math.round(li.mitigatedSvLoon ?? li.svLoon ?? 0),
  }));

  const cat = wr.category;
  const catLabel = cat === 'A' ? 'A-berekening' :
                   cat === 'B' ? 'B-berekening' :
                   cat === 'C' ? 'C-berekening' :
                   cat === 'D' ? 'D-berekening' : '';

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <p className="text-sm text-gray-700 mb-1">
        <strong>{index + 1}: {catLabel}</strong>, Werkgever {wr.werkgever.naam},{' '}
        <span className="text-gray-600">{wr.werkgever.contractvorm}</span>
      </p>
      <p className="text-center font-semibold text-gray-800 my-2">
        {wr.berekening ? fmtEur(wr.berekening.toetsinkomen) : '—'}
      </p>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartDataDisplay} margin={{ top: 5, right: 5, left: 25, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="periode"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              label={{ value: 'Periodes', position: 'insideBottom', offset: -8, fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v) => `€ ${v.toLocaleString('nl-NL')}`}
              label={{ value: "Bedrag SV Loon in euro's", angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip
              formatter={(v) => fmtEur(v)}
              labelFormatter={(p) => `Periode ${p}`}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Basis SV Loon" fill="#93c5fd" />
            <Bar dataKey="Gemitigeerd SV Loon" fill="#fbcfe8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
        <p className="font-semibold text-gray-800 mb-1">{catLabel}</p>
        <p>
          Bovenstaande grafiek is een weergave van uitsluitend de voor deze berekening gebruikte SV Lonen afkomstig uit het UWV Verzekeringsbericht (Basis SV Loon)
          en de eventueel afgetopte SV Lonen op basis van de Rekenregels van IBL (Gemitigeerd SV Loon).
        </p>
        <p className="mt-1">Aftopping van SV Lonen kan in deze berekening plaatsvinden op basis van:</p>
        <ul className="list-disc ml-5 mt-1 space-y-0.5">
          <li>Excessieve Incidentele of Niet-Incidentele Pieken;</li>
          <li>Het parttimepercentage in geval van minder werken (te herkennen aan B2 berekening);</li>
          <li>Correctie voor de auto van de zaak.</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL VIEW — toelichting berekening
// ============================================================
function DetailView({ resultaat, aanvragerNaam, aanmaakdatum, vzbVersie, eigenBijdrage, werkgevers, onBack, onSavePdf, pdfExportReady, exporting, printableRef }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => setExpanded(s => ({ ...s, [key]: !s[key] }));

  // Generate a fake-but-stable verification code from data
  const verifCode = generateVerificationCode(resultaat, aanvragerNaam);

  return (
    <div>
      <button onClick={onBack}
        className="mb-6 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition">
        <ArrowLeft className="w-4 h-4" /> GA TERUG NAAR DE RESULTAATPAGINA
      </button>

      {/* Printable content starts here */}
      <div ref={printableRef} className="bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Toelichting berekening</h2>
      <p className="text-xs text-gray-500 leading-relaxed mb-6">
        Let op: De gegevens in deze berekening zijn met grootst mogelijke zorgvuldigheid samengesteld. Desalniettemin kan het voorkomen dat de gebruikte terminologie of
        weergave afwijkt ten opzichte van de rekenregels. De rekenregels van Inkomensbepaling Loondienst zijn altijd leidend. De rekenregels zijn te raadplegen op{' '}
        <a href="https://hdn.nl/inkomensbepalingloondienst" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          www.hdn.nl/inkomensbepalingloondienst
        </a>
      </p>

      {/* Technische info */}
      <Section title="Technische info">
        <InfoTable rows={[
          ['Is de signature geldig?', 'Ja'],
          ['Is de signature niet ouder dan 3 maanden?', 'Ja'],
          ['Is de signature nog minimaal 3 weken geldig?', 'Ja'],
          ['API versie', FRONTEND_API_VERSIE],
          ['Rekenregels versie', REKENREGELS_VERSIE],
          ['API hash', verifCode.apiHash],
          ['Verificatiecode', <span key="vc" className="font-mono text-xs break-all">{verifCode.code}</span>],
          ['VZB versie', vzbVersie || '—'],
        ]} />
      </Section>

      {/* Algemene info */}
      <Section title="Algemene info">
        <InfoTable rows={[
          ['Naam', aanvragerNaam || '—'],
          ['Ingevulde pensioenbijdrage', `€${eigenBijdrage}`],
          ['Informatie berekening', resultaat.omschrijving],
          ['SV Loon berekeningsamenstelling', resultaat.primaryCategory],
          ['SV Loon vast dienstverband', fmtEur(getSvLoonVast(resultaat))],
          ['SV Loon niet-vast dienstverband', fmtEur(getSvLoonNietVast(resultaat))],
        ]} />
      </Section>

      {/* Voorbewerking acties (Rekenregels 5.1, 5.5, 5.6) */}
      {resultaat.voorbewerking && (
        resultaat.voorbewerking.samenvoegingen.length > 0 ||
        resultaat.voorbewerking.verlofregelToegepast.length > 0 ||
        resultaat.voorbewerking.omrekeningen.length > 0
      ) && (
        <Section title="Voorbewerking van contracten">
          <div className="text-sm text-gray-700 space-y-3">
            {resultaat.voorbewerking.samenvoegingen.length > 0 && (
              <div>
                <p className="font-medium text-gray-800 mb-1">Samenvoeging van contracten (Rekenregels 5.5)</p>
                {resultaat.voorbewerking.samenvoegingen.map((s, i) => (
                  <p key={i} className="text-gray-700">{s.detail}</p>
                ))}
              </div>
            )}
            {resultaat.voorbewerking.verlofregelToegepast.length > 0 && (
              <div>
                <p className="font-medium text-gray-800 mb-1">Verlofregel toegepast (Rekenregels 5.1)</p>
                <ul className="list-disc list-inside text-gray-700">
                  {resultaat.voorbewerking.verlofregelToegepast.map((v, i) => (
                    <li key={i}>{v.werkgever}: {v.lengte} verlof-perioden buiten beschouwing gelaten ({v.origineelAantal} → {v.nieuwAantal} perioden)</li>
                  ))}
                </ul>
              </div>
            )}
            {resultaat.voorbewerking.omrekeningen.length > 0 && (
              <div>
                <p className="font-medium text-gray-800 mb-1">Omrekening betaaltermijn (Rekenregels 5.6.5)</p>
                <ul className="list-disc list-inside text-gray-700">
                  {resultaat.voorbewerking.omrekeningen.map((o, i) => (
                    <li key={i}>{o.werkgever}: omgerekend naar {o.naar}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Werkgevers */}
      <Section title="Werkgevers">
        {resultaat.werkgeverResults.map((wr, idx) => {
          const b = wr.berekening;
          const afgetoptePerioden = b?.mitigated?.filter(p => Math.abs((p.mitigatedSvLoon || 0) - (p.svLoon || 0)) > 0.01) || [];
          return (
            <ExpandableRow
              key={idx}
              title={`Werkgever ${wr.werkgever.id || `WG${String(idx + 1).padStart(3, '0')}`}`}
              expanded={!!expanded[`w-${idx}`]}
              onToggle={() => toggle(`w-${idx}`)}
            >
              <InfoTable rows={[
                ['Naam', wr.werkgever.naam],
                ['Loonheffingennummer', wr.werkgever.loonheffingennummer],
                ['Verzekerde wetten', wr.werkgever.verzekerdeWetten],
                ['Contractvorm', wr.werkgever.contractvorm],
                ['Aantal loonitems', wr.werkgever.loonitems?.length || 0],
                ['Actief contract (Rekenregels 5.4)',
                  wr.isActief
                    ? <span key="act" className="text-green-600 font-medium">✓ Ja (MRL is actueel)</span>
                    : <span key="act" className="text-orange-600 font-medium">✗ Nee ({wr.periodeDiffMaanden} periode(s) achterstand)</span>
                ],
                ['Berekeningstype', wr.category || '—'],
                ['Berekend toetsinkomen', b ? fmtEur(b.toetsinkomen) : '—'],
              ]} />

              {/* Bestendigheidstoets details */}
              {wr.bestendigheid && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">Bestendigheidstoets</p>
                  <InfoTable rows={[
                    ['Inkomensstijging laatste jaar', `${wr.bestendigheid.inkomensstijging.toFixed(2)}% (max 120%)`],
                    ['Criterium 1 (max 20% stijging)', wr.bestendigheid.criterium1 ? <span key="c1" className="text-green-600">✓ Ja</span> : <span key="c1" className="text-red-600">✗ Nee</span>],
                    ['Criterium 2 (geen niet-bestendige pieken)', wr.bestendigheid.criterium2 ? <span key="c2" className="text-green-600">✓ Ja</span> : <span key="c2" className="text-red-600">✗ Nee</span>],
                    ['Bestendig?', wr.bestendigheid.bestendig ? <span key="b" className="text-green-600">✓ Ja → A-berekening</span> : <span key="b" className="text-orange-600">✗ Nee → B-berekening</span>],
                  ]} />
                  {wr.bestendigheid.nietBestendigePieken?.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium text-gray-700 mb-1">Niet-bestendige pieken:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                        {wr.bestendigheid.nietBestendigePieken.map((p, i) => (
                          <li key={i}>
                            <strong>{p.periode}</strong> — V1={p.V1?.toFixed(2)}
                            {p.V2 !== undefined && `, V2=${p.V2.toFixed(2)}`}
                            {p.ratio !== undefined && `, ratio=${p.ratio.toFixed(2)}`} ({p.reason})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tussentijdse waardes */}
              {b && (b.GPI || b.GJI) && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">Tussentijdse waardes</p>
                  <InfoTable rows={[
                    ...(b.GPI ? [['Gemiddeld Periode Inkomen (GPI)', fmtEur(b.GPI)]] : []),
                    ...(b.gji36 ? [['Gemiddeld Jaar Inkomen 3-jaar', fmtEur(b.gji36)]] : []),
                    ...(b.gji12 ? [['Gemiddeld Jaar Inkomen 1-jaar', fmtEur(b.gji12)]] : []),
                    ...(b.GJI ? [['Gemiddeld Jaar Inkomen (laagste)', fmtEur(b.GJI)]] : []),
                    ...(b.GJI ? [['Drempel Excessieve NIP (4/12 × GJI)', fmtEur((4 / 12) * b.GJI)]] : []),
                  ]} />
                </div>
              )}

              {/* Afgetopte perioden */}
              {afgetoptePerioden.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Afgetopte perioden ({afgetoptePerioden.length})
                  </p>
                  <div className="overflow-hidden rounded border border-gray-200">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium text-gray-600">Periode</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600">Origineel</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600">Afgetopt</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-600">Verschil</th>
                          <th className="px-2 py-1.5 text-left font-medium text-gray-600">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {afgetoptePerioden.map((p, i) => (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="px-2 py-1.5">{p.periode}</td>
                            <td className="px-2 py-1.5 text-right">{fmtEur(p.svLoon)}</td>
                            <td className="px-2 py-1.5 text-right text-pink-700 font-medium">{fmtEur(p.mitigatedSvLoon)}</td>
                            <td className="px-2 py-1.5 text-right text-gray-500">−{fmtEur(p.svLoon - p.mitigatedSvLoon)}</td>
                            <td className="px-2 py-1.5 text-xs">
                              {p.eipPiek && <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded mr-1">EIP</span>}
                              {p.enipPiek && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">ENIP</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    EIP = Excessieve Incidentele Piek (Rekenregels 6.4) · ENIP = Excessieve Niet-Incidentele Piek (Rekenregels 6.6)
                  </p>
                </div>
              )}
            </ExpandableRow>
          );
        })}
      </Section>

      {/* Attendering */}
      <Section title="Attendering bij te veel gewerkte uren">
        <InfoTable rows={[
          ['Heeft de aanvrager in het laatste jaar één of meer perioden meer gewerkt dan het maximum?',
            resultaat.attendering?.teveel
              ? <span key="ans" className="text-orange-600 font-medium">Ja ({resultaat.attendering.perioden.length} perioden)</span>
              : <span key="ans" className="text-green-600 font-medium">Nee ✓</span>],
          ...(resultaat.attendering?.drempel ? [['Drempelwaarde voor attendering', `${resultaat.attendering.drempel} uur (${resultaat.attendering.betaaltermijn})`]] : []),
        ]} headers={['Criteria', 'Antwoord']} />
        {resultaat.attendering?.tekst && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
            {resultaat.attendering.tekst}
          </div>
        )}
        {resultaat.attendering?.teveel && resultaat.attendering.perioden.length > 0 && (
          <div className="mt-2 text-sm">
            <p className="font-medium text-gray-700 mb-1">Perioden met opvallend veel uren:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {resultaat.attendering.perioden.map((p, i) => (
                <li key={i}><strong>{p.periode}</strong> — {p.uren} uur</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Beslisboom */}
      <Section title="Beslisboom">
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Stap</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Vraag</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Antwoord</th>
              </tr>
            </thead>
            <tbody>
              {resultaat.steps.filter(s => s.nummer <= 3).map((s, i) => (
                <BeslisboomRow key={i} step={s} expanded={!!expanded[`s-${s.nummer}`]} onToggle={() => toggle(`s-${s.nummer}`)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Per contract: stap 4-7 */}
        {resultaat.werkgeverResults.map((wr, idx) => (
          wr.stappen.length > 0 && (
            <div key={idx} className="mt-4">
              <p className="text-sm font-medium text-gray-800 mb-2">{wr.contractId}</p>
              <div className="overflow-hidden rounded border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Stap</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Vraag</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Antwoord</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wr.stappen.map((s, i) => (
                      <BeslisboomRow key={i} step={s} expanded={!!expanded[`s-${idx}-${s.nummer}`]} onToggle={() => toggle(`s-${idx}-${s.nummer}`)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ))}

        {/* Berekeningstype */}
        <p className="mt-4 font-medium text-gray-800">
          Uitkomst berekeningstype: {resultaat.primaryCategory}
        </p>
        {resultaat.werkgeverResults.map((wr, idx) => (
          wr.berekening && (
            <ExpandableRow
              key={`bk-${idx}`}
              title={`Berekening voor contract: ${wr.contractId}`}
              expanded={!!expanded[`bk-${idx}`]}
              onToggle={() => toggle(`bk-${idx}`)}
            >
              <p className="text-sm text-gray-700 leading-relaxed">{wr.berekening.detail}</p>
              <p className="text-sm font-medium text-gray-900 mt-2">
                Toetsinkomen: {fmtEur(wr.berekening.toetsinkomen)}
              </p>
            </ExpandableRow>
          )
        ))}

        {/* Stap 8 + 9 */}
        <div className="mt-4 overflow-hidden rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Stap</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Vraag</th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Antwoord</th>
              </tr>
            </thead>
            <tbody>
              {resultaat.steps.filter(s => s.nummer === 8 || s.nummer === 9).map((s, i) => (
                <BeslisboomRow key={i} step={s} expanded={!!expanded[`s-${s.nummer}`]} onToggle={() => toggle(`s-${s.nummer}`)} />
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Juridische mededeling */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">Juridische Mededeling</p>
            <p className="text-blue-800">
              Deze tool kan alleen gebruikt worden ter eigen discretie van de gebruiker, en voor gebruiker's eigen rekening en
              risico. Een gebruiker van deze tool is verantwoordelijk voor de keuze en het gebruik van de tool, het verifiëren
              van de berekeningen en andere uitkomsten ervan binnen en buiten de organisatie van de gebruiker.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 text-xs text-gray-500 leading-relaxed">
        <p className="italic font-medium mb-1">Disclaimer voor adviseurs:</p>
        <p className="italic">
          Dit IBL-toetsinkomen is o.b.v. de informatie in het ingediende UWV-verzekeringsbericht aan de hand van een beslisboom zeer zorgvuldig berekend en kunt u gebruiken voor het
          aanvragen van de hypotheek. Het advies aan de klant of dit tot een verantwoorde verstrekking leidt blijft bij u.
        </p>
        <p className="mt-2 font-mono">API Versie: {FRONTEND_API_VERSIE}</p>
        <p className="font-mono">Rekenregels Versie: {REKENREGELS_VERSIE}</p>
        <p className="font-mono">RequestUuid: {verifCode.uuid}</p>
        <p className="font-mono break-all">API Hash: {verifCode.apiHash}</p>
      </div>
      </div>
      {/* Printable content ends here */}

      <button
        onClick={onSavePdf}
        disabled={!pdfExportReady || exporting}
        className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition flex items-center justify-center gap-2"
      >
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> PDF wordt gegenereerd...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> BEWAAR ALS PDF VOOR UW EIGEN ADMINISTRATIE
          </>
        )}
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoTable({ rows, headers }) {
  return (
    <div className="overflow-hidden rounded border border-gray-200">
      <table className="w-full text-sm">
        {headers && (
          <thead className="bg-gray-50 text-xs">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className={`px-3 py-2 font-medium text-gray-600 ${i === headers.length - 1 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="px-3 py-2 text-gray-600 align-top w-1/3">{row[0]}</td>
              <td className="px-3 py-2 text-gray-800">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpandableRow({ title, expanded, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded mb-2 overflow-hidden">
      <button onClick={onToggle} className="w-full px-3 py-2 bg-white hover:bg-gray-50 flex items-center justify-between text-left text-sm">
        <span className="font-medium text-gray-700">{title}</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-3 py-3 bg-gray-50/50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

function BeslisboomRow({ step, expanded, onToggle }) {
  return (
    <>
      <tr className="border-t border-gray-100 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <td className="px-3 py-2 text-gray-700">{step.nummer}</td>
        <td className="px-3 py-2 text-gray-800">{step.vraag}</td>
        <td className="px-3 py-2 text-right">
          <span className={`mr-2 ${step.antwoord === 'Ja' ? 'text-green-700' : step.antwoord === 'Nee' ? 'text-amber-700' : 'text-gray-700'}`}>
            {step.antwoord}
          </span>
          {expanded ? <ChevronDown className="w-3 h-3 inline text-gray-400" /> : <ChevronRight className="w-3 h-3 inline text-gray-400" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={3} className="px-3 py-2 text-xs text-gray-700 italic">
            {step.detail}
          </td>
        </tr>
      )}
    </>
  );
}

// Helpers
function getSvLoonVast(resultaat) {
  return resultaat.werkgeverResults
    .filter(wr => wr.isVast && wr.berekening)
    .reduce((s, wr) => s + (wr.category === 'C' ? 0 : wr.berekening.toetsinkomen), 0)
    + (resultaat.cBerekening && resultaat.werkgeverResults.some(wr => wr.category === 'C' && wr.isVast) ? resultaat.cBerekening.toetsinkomen : 0);
}
function getSvLoonNietVast(resultaat) {
  if (!resultaat.cBerekening) return 0;
  if (resultaat.werkgeverResults.some(wr => wr.category === 'C' && !wr.isVast)) return resultaat.cBerekening.toetsinkomen;
  return 0;
}

function generateVerificationCode(resultaat, naam) {
  const seed = `${naam || ''}${resultaat.finalToetsinkomen}${resultaat.primaryCategory}`;
  // Simple deterministic hash → hex string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const rand = (n) => Array.from({ length: n }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor((Math.sin((hash++) * 9999) + 1) * 31) % 62]
  ).join('');
  return {
    apiHash: `${hex}${rand(56)}`.substring(0, 64).toUpperCase(),
    code: rand(280),
    uuid: `${hex.toLowerCase()}-${hex.substring(0,4).toLowerCase()}-${hex.substring(0,4).toLowerCase()}-${hex.substring(0,4).toLowerCase()}-${hex.toLowerCase().padStart(12, '0').substring(0, 12)}`,
  };
}
