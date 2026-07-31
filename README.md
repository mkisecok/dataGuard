# DataGuard

Pseudonymisiert personenbezogene Daten im Browser, bevor sie an ein KI-Modell gehen — und schreibt die Platzhalter in der Antwort wieder zurück.

Svelte 5 · TypeScript · Vite. Kein Backend, kein Server, keine Laufzeit-Abhängigkeit.

```bash
pnpm install
pnpm dev      # Entwicklung
pnpm build    # → dist/index.html, eine einzige Datei
```

`pnpm build` erzeugt **eine** in sich geschlossene `dist/index.html` (~123 kB). Die lässt sich weitergeben und per Doppelklick direkt aus `file://` öffnen — kein Server, keine Installation. Das ist Absicht: ein Werkzeug, dessen Versprechen „nichts verlässt den Browser“ lautet, sollte als eine prüfbare Datei vorliegen.

> **Prototyp.** Die Erkennung ist regelbasiert und best-effort. Vor dem Senden immer selbst prüfen — siehe [Grenzen](#grenzen).

---

## Was es tut

```
Akte eingeben  ─▶  Erkennung (lokal)  ─▶  «NAME_1» an das Modell  ─▶  Antwort zurückgeschrieben
                        │
                        └─ Mapping bleibt im Browser. Wird nie gesendet.
```

Ein Textfeld. Erkannte Daten werden direkt im Text unterstrichen, während man schreibt. Ein Klick auf *Senden* überträgt ausschließlich die pseudonymisierte Fassung; die Antwort erscheint mit echten Werten zurückgeschrieben.

## Funktionen

- **Live-Erkennung** — 15 Regeln, Treffer werden im Text markiert, ohne einen Extra-Schritt auszulösen.
- **Art. 9 DSGVO getrennt ausgewiesen** — Gesundheit, Religion, politische Meinung und sexuelle Orientierung erhalten eine eigene Farbe und stehen in der Seitenspalte oben.
- **Prüfbare Zuordnung** — jede Ersetzung ist als `Platzhalter → Originalwert` einsehbar; Hover hebt die Stelle im Text hervor.
- **Falsch-Positive verwerfen** — Erkennung anklicken, `Erkennung verwerfen` oder `Kategorie ändern`.
- **Eigene Platzhalter** — Text markieren, Kategorie wählen. Nötig für Namen ohne Kontext, die keine Regel findet.
- **Rückschreiben mit Toleranz** — `«NAME_1»`, `[NAME 1]` und `«name 1»` werden alle erkannt; erfundene oder verstümmelte Platzhalter werden gemeldet statt still ignoriert.
- **Konsistente Tokens** — derselbe Wert erhält im ganzen Dokument denselben Platzhalter, damit das Modell zwei Nennungen derselben Person zuordnen kann.
- **Beispielakten** — acht Generatoren (Patientenakte, Bankprotokoll, Personalakte, Gerichtsakte …) mit synthetischen Daten zum Testen.
- Hell/Dunkel, druckbar, funktioniert offline.

## Anbieter

| Anbieter | Modelle | Hinweis |
|---|---|---|
| Mistral | `mistral-large`, `mistral-medium`, `mistral-small` | EU-gehostet |
| OpenAI | `gpt-4o`, `gpt-4o-mini` | US — Art. 44 DSGVO prüfen |
| Anthropic | Claude Opus / Sonnet / Haiku | US — Art. 44 DSGVO prüfen |
| Google | `gemini-2.5-pro`, `gemini-2.5-flash` | US — Art. 44 DSGVO prüfen |
| Ollama | lokal | keine Übermittlung |

Anbieter, Modell und Key werden einmal eingerichtet und danach als Kopfzeilen-Pille angezeigt. Der Key liegt ausschließlich im `localStorage` dieses Browsers und geht direkt an den Anbieter.

Für Ollama von einer `file://`-Seite aus:

```bash
OLLAMA_ORIGINS=* ollama serve
```

## Erkennungsregeln

| Direkte Identifikatoren | Kenn- & Finanznummern | Art. 9 DSGVO |
|---|---|---|
| Voller Name | IBAN | Gesundheitsdaten |
| E-Mail | Kreditkarte | Religion |
| Telefon | Steuer-ID | Politische Meinung |
| Adresse | Versicherungs-Nr. | Sexuelle Orientierung |
| Geburtsdatum | | |
| Ausweis / Pass | | |
| IP-Adresse | | |

Jede Regel ist einzeln abschaltbar.

## Grenzen

- **Pseudonymisierung, nicht Anonymisierung** (Art. 4 Nr. 5 DSGVO). Solange das Mapping existiert, ist die Ausgabe rechtlich weiterhin personenbezogen.
- **Regeln, kein Modell.** Erkennung ist Regex plus Wortlisten. Namen werden nur mit Kontext gefunden — Anrede, Personen-Label oder bekannter Vorname. Ein unbekannter Name mitten im Freitext wird übersehen und muss manuell markiert werden.
- **Keine Checksummen.** IBAN-Prüfziffer und Luhn werden absichtlich *nicht* geprüft: Ein echter, aber vertippter Wert würde sonst durchgelassen. Recall vor Precision.
- **Quasi-Identifikatoren bleiben.** Seltene Diagnose + Ort + Arbeitgeber können eine Person identifizierbar machen, auch wenn jeder Einzelwert ersetzt ist.
- **Das Anweisungsfeld wird ungefiltert übertragen.** Es ist deshalb sichtbar getrennt und rot als `ungefiltert` markiert. Dort keine personenbezogenen Daten eintragen.
- Kein Ersatz für eine Rechtsgrundlage, ein Verarbeitungsverzeichnis oder eine DSFA.

## Technik

```
src/
├─ lib/          reines TypeScript, kein Svelte-Import — der prüfbare Kern
├─ state/        reaktive Klassen (Svelte-5-Runen)
├─ components/   ein Anliegen pro Datei
└─ styles/       tokens · base · primitives
```

`lib/` importiert bewusst nichts aus `state/` oder `svelte`. Die Erkennung ist eine reine Funktion von `(text, activeRules, manualMarks, mutedValues)` — genau das macht sie überprüfbar.

Sie liefert **Zeichen-Offsets**, keinen umgeschriebenen String. Das macht die Live-Hervorhebung möglich und die Ersetzung exakt: Ein globales `split`/`join` hätte jedes Vorkommen einer Teilzeichenfolge ersetzt und aus dem erkannten Namen `Jan` heraus das Wort `Januar` beschädigt.

```
detect(text, …)   → Spans {start, end, value, type}, Überlappung nach Priorität aufgelöst
buildRun(text, …) → pseudonymisierter Text + Mapping, ein Durchlauf über die Spans
restoreFrom(text) → Platzhalter zurück, längster Token zuerst, Reste werden gemeldet
```

Die Erkennung ist eine `$derived`-Kette, kein „jetzt pseudonymisieren“-Schritt. Der ausgehende Text ist dadurch immer aktuell, und Senden ist nur noch eine Übertragung — nichts, was man auslösen muss.

Die Hervorhebung ist ein `<div>`-Spiegel hinter einem transparenten `<textarea>`; beide teilen exakt dieselben Textmetriken. Kein `contenteditable`, damit Undo, IME und Rechtschreibprüfung nativ bleiben.

Der einzige Ort, an dem eine Netzwerkanfrage entsteht, ist `callModel` in [`src/lib/providers.ts`](src/lib/providers.ts). Die Funktion bekommt den pseudonymisierten Text als `string` und hat keinen Zugriff auf das Mapping — damit kann keine spätere Änderung dort eines durchlassen.

## Mitmachen

Siehe [CONTRIBUTING.md](CONTRIBUTING.md). Gesucht sind vor allem **Unit-Tests für `lib/`** — `detect`, `buildRun` und `restoreFrom` sind reine Funktionen und noch ungetestet.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
