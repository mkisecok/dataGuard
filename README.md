# DataGuard

Pseudonymisiert personenbezogene Daten im Browser, bevor sie an ein KI-Modell gehen — und schreibt die Platzhalter in der Antwort wieder zurück.

Eine einzelne HTML-Datei. Kein Backend, keine Abhängigkeiten, kein Build. Öffnet direkt per Doppelklick.

```
dataguard_mahmut_kisecok.html
```

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

Eine Datei, Vanilla JS, keine Abhängigkeiten.

Die Erkennung liefert **Zeichen-Offsets**, keinen umgeschriebenen String. Das macht die Live-Hervorhebung möglich und die Ersetzung exakt: Ein globales `split`/`join` hätte jedes Vorkommen einer Teilzeichenfolge ersetzt und aus dem erkannten Namen `Jan` heraus das Wort `Januar` beschädigt.

```
detect(text)      → Spans {start, end, value, type}, Überlappung nach Priorität aufgelöst
buildRun(text)    → pseudonymisierter Text + Mapping, ein Durchlauf über die Spans
restoreFrom(text) → Platzhalter zurück, längster Token zuerst, Reste werden gemeldet
```

Die Hervorhebung ist ein `<div>`-Spiegel unter einem transparenten `<textarea>` — beide teilen exakt dieselben Textmetriken. Kein `contenteditable`, damit Undo, IME und Textauswahl nativ bleiben.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
