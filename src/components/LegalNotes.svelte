<!--
  @component
  The caveats, stated in the interface rather than only in the README.

  These used to be a banner across the top of every page load, which meant they
  were dismissed unread. As a numbered disclosure in the rail they stay
  one click away from the findings they qualify — which is where someone actually
  asks "how much can I trust this?".
-->
<script lang="ts">
  let open = $state(false);
</script>

<div class="rail-foot">
  <div class="seal-line">Mapping bleibt lokal · nie gesendet</div>

  <button class="disc" aria-expanded={open} aria-controls="legal-body" onclick={() => (open = !open)}>
    Rechtliche Hinweise
    <span class="marker" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <div class="legal-body" id="legal-body">
      <ol>
        <li>
          Dieses Werkzeug <strong>pseudonymisiert</strong> (Art. 4 Nr. 5 DSGVO) — es anonymisiert
          nicht. Die Ausgabe bleibt rechtlich personenbezogen, solange das Mapping existiert.
        </li>
        <li>
          Die Erkennung ist <strong>best-effort</strong> (Regex + Wortlisten). Besonders
          Freitext-Namen und Art.-9-Daten können übersehen werden — Vorschau vor dem Senden selbst
          prüfen.
        </li>
        <li>
          Platzhalter entfernen keine Quasi-Identifikatoren: seltene Diagnose + Ort + Arbeitgeber
          können eine Person weiterhin identifizierbar machen (Restrisiko).
        </li>
        <li>
          API-Keys und Mapping bleiben lokal; das Anweisungsfeld wird <strong>ungefiltert</strong>
          gesendet — dort keine personenbezogenen Daten eintragen.
        </li>
        <li>
          Namen werden nur mit Kontext erkannt (Anrede/Titel, Personen-Label oder bekannter
          Vorname). <strong>Unbekannte Namen im Freitext</strong> markieren und per
          Auswahl-Schaltfläche ersetzen.
        </li>
      </ol>
    </div>
  {/if}
</div>

<style>
  .rail-foot {
    border-top: 1px solid var(--rule);
    padding: 12px 18px 14px;
  }

  .seal-line {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.6px;
    color: var(--seal);
    margin-bottom: 4px;
  }

  .legal-body {
    padding: 2px 0 8px;
  }

  /* Numbered as § marks — these are legal statements, not a feature list. */
  ol {
    list-style: none;
    counter-reset: legal;
  }

  li {
    counter-increment: legal;
    position: relative;
    padding-left: 20px;
    margin-bottom: 9px;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--ink2);
  }
  li::before {
    content: '§' counter(legal);
    position: absolute;
    left: 0;
    top: 0;
    font-family: var(--mono);
    font-size: 9.5px;
    color: var(--ink3);
  }

  strong {
    color: var(--wax);
    font-weight: 600;
  }
</style>
