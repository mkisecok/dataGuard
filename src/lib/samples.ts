import type { Tier } from './types';

/**
 * Synthetic sample documents.
 *
 * Every value is randomly generated — there is no real person in here. Their
 * job is to let someone evaluate the detection honestly, including the cases it
 * gets wrong, without pasting a real case file into a tool they have not
 * audited yet.
 */

const rnd = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const rndInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const FIRST_NAMES = ['Lena', 'Jonas', 'Fatima', 'Mehmet', 'Sarah', 'David', 'Ayşe', 'Tobias', 'Mia', 'Kemal', 'Nina', 'Felix', 'Hana', 'Lucas', 'Selin', 'Emma', 'Noah', 'Zeynep', 'Max', 'Julia'] as const;
const LAST_NAMES = ['Müller', 'Schmidt', 'Yilmaz', 'Weber', 'Wagner', 'Özdemir', 'Fischer', 'Becker', 'Çelik', 'Hoffmann', 'Koch', 'Schulz', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Braun', 'Kaya', 'Zimmermann'] as const;
const CITIES = ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover'] as const;
const STREETS = ['Hauptstraße', 'Berliner Allee', 'Kastanienweg', 'Rosenplatz', 'Lindenstraße', 'Gartenweg', 'Fichtenring', 'Bachgasse', 'Schillerstraße', 'Marktplatz'] as const;
const DOMAINS = ['gmail.com', 'web.de', 'outlook.de', 'gmx.de', 'yahoo.de', 't-online.de'] as const;

const randName = () => `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`;

function randEmail(name: string): string {
  const parts = name.toLowerCase().split(' ');
  return rnd([
    `${parts[0]}.${parts[1]}@${rnd(DOMAINS)}`,
    `${parts[0]![0]}${parts[1]}@${rnd(DOMAINS)}`,
    `${parts[0]}${rndInt(10, 99)}@${rnd(DOMAINS)}`,
  ]);
}

const randPhone = () =>
  `${rnd(['+49 151', '+49 152', '+49 160', '+49 170', '+49 176', '+49 30', '+49 89'])} ${rndInt(10000000, 99999999)}`;

const randIBAN = () =>
  `DE${rndInt(10, 99)} ${pad(rndInt(1000, 9999), 4)} ${pad(rndInt(1000, 9999), 4)} ${pad(rndInt(1000, 9999), 4)} ${pad(rndInt(1000, 9999), 4)} ${pad(rndInt(10, 99), 2)}`;

const randDate = () => `${pad(rndInt(1, 28))}.${pad(rndInt(1, 12))}.${rndInt(1955, 2002)}`;
const randAddress = () => `${rnd(STREETS)} ${rndInt(1, 120)}, ${rndInt(10000, 99999)} ${rnd(CITIES)}`;
const randCard = () =>
  `4${pad(rndInt(100, 999), 3)} ${pad(rndInt(1000, 9999), 4)} ${pad(rndInt(1000, 9999), 4)} ${pad(rndInt(1000, 9999), 4)}`;
const randPassport = () => `DE${rndInt(1000000, 9999999)}`;
const randDoctor = () => `Dr. ${randName()}`;

export type SampleId =
  | 'health'
  | 'banking'
  | 'university'
  | 'political'
  | 'religious'
  | 'sexual'
  | 'hr'
  | 'legal';

export const GENERATORS: Record<SampleId, () => string> = {
  health: () => {
    const patient = randName();
    const doctor = randDoctor();
    const [diag, med, plan] = rnd([
      ['Diabetes mellitus Typ 2', 'Metformin 500mg täglich', 'Blutzucker-Selbstkontrolle'],
      ['Arterielle Hypertonie', 'Ramipril 10mg morgens', 'Blutdruckmessung wöchentlich'],
      ['Depressive Episode', 'Sertralin 50mg täglich', 'Psychotherapie alle 2 Wochen'],
      ['Hypothyreose', 'Levothyroxin 75μg nüchtern', 'TSH-Kontrolle nach 6 Wochen'],
      ['Migräne mit Aura', 'Sumatriptan bei Bedarf', 'Migränetagebuch führen'],
    ]);
    return `Patientenakte — Klinikum ${rnd(CITIES)}
Erstellt: ${randDate()}  |  Fallnummer: KH-${rndInt(10000, 99999)}

Patient:
  Name:           ${patient}
  Geburtsdatum:   ${randDate()}
  Adresse:        ${randAddress()}
  Telefon:        ${randPhone()}
  E-Mail:         ${randEmail(patient)}
  Krankenversicherung: TK — Versicherten-Nr. ${rndInt(100000000, 999999999)}

Behandelnder Arzt: ${doctor}
Station / Ambulanz: Innere Medizin, Zimmer ${rndInt(100, 450)}

Diagnose:
  ${diag}

Medikation:
  ${med}

Therapieplan:
  ${plan}

Notizen: ${doctor} empfiehlt Kontrolltermin in ${rndInt(4, 12)} Wochen.
Für Rückfragen: ${randEmail(doctor.replace('Dr. ', ''))}`;
  },

  banking: () => {
    const client = randName();
    const advisor = randName();
    const [prod, detail, note] = rnd([
      ['Tagesgeldkonto', '2,40 % p.a.', 'flexibel verfügbar'],
      ['ETF-Sparplan', 'MSCI World', 'monatlich 150 €'],
      ['Baufinanzierung', '2,85 % Sollzins', 'Laufzeit 25 Jahre'],
      ['Businesskonto', 'Kreditlinie 15.000 €', 'Kontoführungsgebühr 9,90 €/Monat'],
    ]);
    return `Beratungsprotokoll — ${rnd(['Sparkasse', 'Commerzbank', 'Deutsche Bank', 'ING', 'DKB'])} ${rnd(CITIES)}
Datum: ${randDate()}  |  Beratungs-ID: BER-${rndInt(100000, 999999)}

Kunde:
  Name:          ${client}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  Telefon:       ${randPhone()}
  E-Mail:        ${randEmail(client)}
  IBAN:          ${randIBAN()}
  Kreditkarte:   ${randCard()}
  Reisepass-Nr.: ${randPassport()}

Berater: ${advisor}
Thema:   ${prod}

Produktdetails:
  ${detail} — ${note}

Risikoklasse: ${rnd(['1 – sicherheitsorientiert', '2 – konservativ', '3 – ertragsorientiert', '4 – wachstumsorientiert'])}
Nettogehalt p.M.: ${rndInt(2200, 7500)} €

Nächster Termin: ${randDate()}
Kontakt Berater: ${randEmail(advisor)}  |  ${randPhone()}`;
  },

  university: () => {
    const student = randName();
    const prof = `Prof. Dr. ${randName()}`;
    const [studiengang, modul, sem] = rnd([
      ['Informatik (B.Sc.)', 'Algorithmen & Datenstrukturen', '4. Semester'],
      ['Rechtswissenschaften (Staatsexamen)', 'Bürgerliches Recht II', '6. Semester'],
      ['Psychologie (M.Sc.)', 'Klinische Psychologie', '2. Mastersemester'],
      ['Wirtschaftsinformatik (B.Sc.)', 'Datenbanksysteme', '3. Semester'],
      ['Medizin (Staatsexamen)', 'Anatomie Praktikum', '2. Semester'],
    ]);
    const parts = student.toLowerCase().split(' ');
    return `Immatrikulationsbescheinigung / Studierendendaten
Universität: ${rnd(['Freie Universität Berlin', 'LMU München', 'Universität Hamburg', 'TU Dresden', 'Goethe-Universität Frankfurt'])}
Ausgestellt: ${randDate()}  |  Matrikel-Nr.: ${rndInt(1000000, 9999999)}

Studierender:
  Name:          ${student}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  E-Mail (uni):  ${parts[0]}.${parts[1]}@uni-${rnd(CITIES).toLowerCase()}.de
  Telefon:       ${randPhone()}

Studiengang:  ${studiengang}
Semester:     ${sem}
Aktuelles Modul: ${modul}
Note letzte Prüfung: ${rnd(['1,3', '1,7', '2,0', '2,3', '2,7', '3,0'])}

Prüfer: ${prof}
Kontakt: ${randEmail(prof.replace('Prof. Dr. ', ''))}
Sprechstunde: ${rnd(['Montag 10–12 Uhr', 'Dienstag 14–16 Uhr', 'Donnerstag 11–13 Uhr'])}
Raum: ${rndInt(100, 520)}

IBAN (BAföG-Konto): ${randIBAN()}
BAföG-Bescheid: ${rndInt(300, 850)} €/Monat`;
  },

  political: () => {
    const person = randName();
    const party = rnd(['SPD', 'CDU', 'Die Grünen', 'FDP', 'Die Linke', 'AfD', 'BSW', 'Volt']);
    return `Mitgliederdatenbank — ${party} Kreisverband ${rnd(CITIES)}
Datenexport: ${randDate()}  |  Datensatz-ID: POL-${rndInt(10000, 99999)}

Mitglied:
  Name:          ${person}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  Telefon:       ${randPhone()}
  E-Mail:        ${randEmail(person)}
  Eintrittsdatum: ${randDate()}
  Mitglieds-Nr.: ${rndInt(100000, 999999)}

Funktion:     ${rnd(['einfaches Mitglied', 'Ortsverbandsvorsitzender', 'Delegierter', 'Schatzmeister', 'Pressesprecher'])}
Partei:       ${party}
Ortsverband:  ${party} ${rnd(CITIES)}-${rnd(['Mitte', 'Nord', 'Süd', 'Ost', 'West'])}

Letzte Aktivität: ${rnd(['Wahlkampfstand', 'Mitgliederversammlung', 'Online-Abstimmung', 'Infostand', 'Podiumsdiskussion'])} am ${randDate()}
Spendenhistorie (letztes Jahr): ${rndInt(0, 1200)} €
IBAN Lastschrift: ${randIBAN()}

Hinweis: Gemäß Art. 9 DSGVO handelt es sich um besondere Kategorien personenbezogener Daten.`;
  },

  religious: () => {
    const person = randName();
    const faith = rnd([
      { name: 'Evangelische Kirche', org: 'Evangelische Kirchengemeinde', role: 'Kirchenvorstandsmitglied', fee: 'Kirchensteuer: 9 % der Einkommensteuer' },
      { name: 'Römisch-Katholische Kirche', org: 'Pfarrgemeinde St. Maria', role: 'Ehrenamtlicher Messdiener-Leiter', fee: 'Kirchensteuer: 8 % der Einkommensteuer' },
      { name: 'Islam (Sunnit.)', org: 'Islamische Gemeinde', role: 'Freitagsgebet-Organisator', fee: 'Gemeindebeitrag: 10 €/Monat' },
      { name: 'Jüdische Gemeinde', org: 'Jüdische Gemeinde', role: 'Vorstandsmitglied', fee: 'Mitgliedsbeitrag: gestaffelt nach Einkommen' },
      { name: 'Buddhismus', org: 'Zen-Zentrum', role: 'Meditationsgruppen-Leiter', fee: 'Freiwillige Spende' },
    ]);
    return `Religionsgemeinschaft — Mitgliedsdaten
Organisation: ${faith.org} ${rnd(CITIES)}
Erstellt: ${randDate()}  |  Akte-Nr.: REL-${rndInt(1000, 9999)}

Person:
  Name:          ${person}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  Telefon:       ${randPhone()}
  E-Mail:        ${randEmail(person)}

Religionszugehörigkeit: ${faith.name}
Funktion:        ${faith.role}
Eintrittsdatum:  ${randDate()}
${faith.fee}
IBAN (Lastschrift): ${randIBAN()}

Taufe / Aufnahme: ${randDate()}
Letzter Gottesdienst / Treffen: ${randDate()}

Hinweis: Religionszugehörigkeit ist gem. Art. 9 Abs. 1 DSGVO eine besondere Kategorie personenbezogener Daten und unterliegt erhöhtem Schutz.`;
  },

  sexual: () => {
    const person = randName();
    const advisor = randName();
    return `Beratungsprotokoll — ${rnd(['Beratungsstelle Regenbogen', 'Antidiskriminierungsstelle', 'Queer Hilfe e.V.', 'LGBTQ+ Beratung', 'Coming-Out-Beratung'])} ${rnd(CITIES)}
Datum: ${randDate()}  |  Fall-Nr.: QBR-${rndInt(10000, 99999)}

Ratsuchende Person:
  Name:          ${person}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  Telefon:       ${randPhone()}
  E-Mail:        ${randEmail(person)}

Anlass:        ${rnd([
      'Arbeitsrechtliche Beratung wegen Diskriminierung am Arbeitsplatz',
      'Psychosoziale Beratung — Coming-Out-Prozess',
      'Rechtliche Beratung Partnerschaftsrecht / Adoption',
      'Beratung wegen diskriminierender Behandlung im Gesundheitswesen',
    ])}
Selbstangabe sexuelle Orientierung / Geschlechtsidentität: ${rnd(['homosexuell', 'bisexuell', 'pansexuell', 'queer', 'nicht-binär'])}

Beraterin: ${advisor}
Kontakt:   ${randEmail(advisor)}  |  ${randPhone()}

Dokumentierte Vorfälle: ${rndInt(1, 4)}
Nächster Termin: ${randDate()}

Vertraulich — Art. 9 DSGVO (besondere Kategorien): Daten zur sexuellen Orientierung dürfen nur mit ausdrücklicher Einwilligung verarbeitet werden.`;
  },

  hr: () => {
    const emp = randName();
    const manager = randName();
    return `Personalakte — Vertraulich
Unternehmen: ${rnd(['TechCorp GmbH', 'DataSystems AG', 'Digital Solutions GmbH', 'InnovateCo SE'])} ${rnd(CITIES)}
Erstellt: ${randDate()}  |  Personal-Nr.: HR-${rndInt(10000, 99999)}

Mitarbeiter:
  Name:          ${emp}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  Telefon:       ${randPhone()}
  E-Mail:        ${randEmail(emp)}
  IBAN (Gehalt): ${randIBAN()}
  Steuer-ID:     ${rndInt(10000000000, 99999999999)}
  Ausweis-Nr.:   ${randPassport()}

Abteilung:     ${rnd(['Engineering', 'Marketing', 'Finance', 'Legal', 'Operations', 'Product', 'HR', 'Sales'])}
Position:      ${rnd(['Junior', 'Mid-Level', 'Senior', 'Lead', 'Principal'])} ${rnd(['Developer', 'Analyst', 'Manager', 'Consultant', 'Engineer'])}
Eintrittsdatum: ${randDate()}
Bruttogehalt:  ${rndInt(38000, 110000)} €/Jahr
Urlaubstage:   ${rndInt(24, 30)} Tage

Direkte Führungskraft: ${manager}
E-Mail Führungskraft:  ${randEmail(manager)}

Letzte Beurteilung: ${rnd(['Hervorragend', 'Übertrifft Erwartungen', 'Erfüllt Erwartungen', 'Entwicklungsbedarf'])} (${randDate()})
Krankheitstage letztes Jahr: ${rndInt(0, 22)}`;
  },

  legal: () => {
    const defendant = randName();
    const plaintiff = randName();
    const lawyer = `Rechtsanwalt ${randName()}`;
    const c = rnd([
      { type: 'Zivilsache', matter: 'Mietstreitigkeiten — fristlose Kündigung', az: `${rndInt(1, 9)} C ${rndInt(100, 999)}/${rndInt(20, 25)}` },
      { type: 'Strafsache', matter: 'Körperverletzung gem. § 223 StGB', az: `${rndInt(1, 9)} Ds ${rndInt(100, 999)}/${rndInt(20, 25)}` },
      { type: 'Verwaltungssache', matter: 'Widerspruch gegen Bußgeldbescheid', az: `${rndInt(1, 9)} K ${rndInt(100, 999)}/${rndInt(20, 25)}` },
      { type: 'Arbeitssache', matter: 'Kündigungsschutzklage § 4 KSchG', az: `${rndInt(1, 9)} Ca ${rndInt(100, 999)}/${rndInt(20, 25)}` },
    ]);
    return `Aktennotiz — ${c.type}
Gericht: ${rnd(['Amtsgericht', 'Landgericht', 'Verwaltungsgericht'])} ${rnd(CITIES)}
Aktenzeichen: ${c.az}  |  Datum: ${randDate()}

Beklagte / Beschuldigte Person:
  Name:          ${defendant}
  Geburtsdatum:  ${randDate()}
  Adresse:       ${randAddress()}
  Telefon:       ${randPhone()}
  E-Mail:        ${randEmail(defendant)}
  Ausweis-Nr.:   ${randPassport()}

Kläger / Geschädigte Person:
  Name:          ${plaintiff}
  Adresse:       ${randAddress()}
  E-Mail:        ${randEmail(plaintiff)}

Rechtsanwalt:  ${lawyer}
Kontakt:       ${randEmail(lawyer.replace('Rechtsanwalt ', ''))}  |  ${randPhone()}

Sachverhalt: ${c.matter}
Verhandlungstermin: ${randDate()}
Aktenstand: ${rnd(['Klageschrift eingereicht', 'Ladung zugestellt', 'Beweisaufnahme', 'Urteil ausstehend', 'Vergleich angestrebt'])}

Streitwert / Bußgeld: ${rndInt(500, 25000)} €`;
  },
};

/** Menu entries: label, category code, and the tier that colours the swatch. */
export const SAMPLES: { id: SampleId; label: string; code: string; tier: Tier }[] = [
  { id: 'health', label: 'Patientenakte', code: 'GESUNDHEIT', tier: 3 },
  { id: 'banking', label: 'Beratungsprotokoll Bank', code: 'FINANZEN', tier: 2 },
  { id: 'university', label: 'Studierendendaten', code: 'BILDUNG', tier: 1 },
  { id: 'political', label: 'Parteimitgliedschaft', code: 'ART. 9', tier: 3 },
  { id: 'religious', label: 'Religionszugehörigkeit', code: 'ART. 9', tier: 3 },
  { id: 'sexual', label: 'Beratung — Orientierung', code: 'ART. 9', tier: 3 },
  { id: 'hr', label: 'Personalakte', code: 'PERSONAL', tier: 1 },
  { id: 'legal', label: 'Gerichtsakte', code: 'JUSTIZ', tier: 1 },
];
