import type { Rule, RuleKey, TokenType } from './types';

/**
 * Detection rules.
 *
 * NOTE: no IBAN mod-97 and no Luhn check. This is a PII stripper, so recall
 * beats precision — rejecting a value because it fails a checksum would let a
 * real but mistyped IBAN or card number leak to the model, which is the exact
 * failure this tool exists to prevent.
 */

/** Capitalised bigrams that look like names but are not. */
const NAME_DENY = new Set([
  'deutsche', 'bank', 'sparkasse', 'commerzbank', 'ing', 'dkb', 'klinikum', 'universität', 'freie',
  'goethe', 'amtsgericht', 'landgericht', 'verwaltungsgericht', 'innere', 'medizin', 'techcorp',
  'datasystems', 'digital', 'solutions', 'innovateco', 'berliner', 'hauptstraße', 'kastanienweg',
  'rosenplatz', 'lindenstraße', 'gartenweg', 'fichtenring', 'bachgasse', 'schillerstraße', 'marktplatz',
  'die', 'der', 'das', 'islamische', 'evangelische', 'jüdische', 'römisch', 'katholische', 'zen',
  'kreisverband', 'ortsverband', 'pfarrgemeinde',
]);

function nameValidate(match: string): boolean {
  const words = match
    .trim()
    .replace(/^(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Herr|Frau)\s+/i, '')
    .split(/\s+/);
  return !words.some((w) => NAME_DENY.has(w.toLowerCase()));
}

/**
 * Name detection fires on context, never on shape alone.
 *
 * German capitalises every noun, so a blind "two capitalised words" rule tags
 * "Nächster Termin" as a person. We require a real signal: a title, a
 * person-label followed by a colon, or a known first name.
 *
 * Consequence worth stating in the UI: an unknown name sitting in free text is
 * missed, and has to be marked by hand.
 */
const NAME_DICT = [
  'Max', 'Lena', 'Jonas', 'Fatima', 'Mehmet', 'Sarah', 'David', 'Ayşe', 'Tobias', 'Mia', 'Kemal', 'Nina',
  'Felix', 'Hana', 'Lucas', 'Selin', 'Emma', 'Noah', 'Zeynep', 'Julia', 'Anna', 'Laura', 'Marie', 'Sophie',
  'Sophia', 'Hannah', 'Lea', 'Leon', 'Paul', 'Ben', 'Luis', 'Luca', 'Finn', 'Elias', 'Jan', 'Tim', 'Tom',
  'Niklas', 'Simon', 'Moritz', 'Philipp', 'Alexander', 'Daniel', 'Michael', 'Thomas', 'Andreas', 'Stefan',
  'Markus', 'Martin', 'Peter', 'Klaus', 'Wolfgang', 'Sabine', 'Petra', 'Claudia', 'Andrea', 'Katharina',
  'Christina', 'Melanie', 'Nicole', 'Johanna', 'Charlotte', 'Amelie', 'Clara', 'Greta', 'Ida', 'Frieda',
  'Maria', 'Sofia', 'Emre', 'Yusuf', 'Elif', 'Deniz', 'Cem', 'Burak', 'Ali', 'Ayla', 'Leyla', 'Murat',
  'Hakan', 'Ece', 'Kerem', 'Berkay', 'Aylin', 'Merve', 'Can', 'Ahmet', 'Mustafa', 'Hüseyin', 'Zeyn',
  'John', 'James', 'Robert', 'Mary', 'Linda', 'Anna-Lena', 'Marc', 'Marco', 'Matteo', 'Nico',
  'Vincent', 'Oskar', 'Emil', 'Theo', 'Mila', 'Lina', 'Ella', 'Nele', 'Pia', 'Jana', 'Katrin', 'Ursula',
  'Helga', 'Ingrid', 'Renate', 'Monika', 'Brigitte', 'Karl', 'Hans', 'Werner', 'Günter', 'Dieter', 'Horst',
];

const UC = 'A-ZÄÖÜÇŞİĞ';
const LC = 'a-zäöüßçşğı';
const NAMECORE = `[${UC}][${LC}]{2,}(?:\\s+[${UC}][${LC}]{2,}){0,1}`;
const TITLES = 'Herr|Frau|Herrn|Dr\\.|Prof\\.|Rechtsanwalt|Rechtsanwältin|Mr\\.|Mrs\\.|Ms\\.';
const PLABELS =
  'Name|Vorname|Nachname|Kunde|Kundin|Patient|Patientin|Mitarbeiter|Mitarbeiterin|' +
  'Mandant|Mandantin|Kläger|Beklagte[r]?|Beschuldigte[r]?|Studierender|Mitglied|Person|Berater|' +
  'Beraterin|Prüfer|Prüferin|Arzt|Ärztin|Ansprechpartner|Sachbearbeiter|Ratsuchende Person|' +
  'Behandelnder Arzt|Direkte Führungskraft|Führungskraft';

const NAME_RE = new RegExp(
  `(?<=\\b(?:${TITLES})[ \\t]{1,2})${NAMECORE}` +
    `|(?<=\\b(?:${PLABELS})[ \\t]*:[ \\t]*(?:(?:Dr|Prof|Herr|Frau|Rechtsanwalt|Rechtsanwältin)\\.?[ \\t]+)?)${NAMECORE}` +
    `|\\b(?:${NAME_DICT.join('|')})\\s+[${UC}][${LC}]{2,}(?:\\s+[${UC}][${LC}]{2,})?`,
  'g',
);

export const RULES: Record<RuleKey, Rule> = {
  name: {
    label: 'Voller Name',
    re: NAME_RE,
    validate: nameValidate,
  },
  email: {
    label: 'E-Mail',
    re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },
  phone: {
    label: 'Telefon',
    re: /\+?[\d \-()]{9,20}/g,
    // Deliberately loose pattern, so gate on digit count instead.
    validate: (m) => {
      const digits = m.replace(/\D/g, '').length;
      return digits >= 7 && digits <= 15;
    },
  },
  address: {
    label: 'Adresse',
    re: /\b\w[\w\s\-]{2,30}(?:str(?:aße|\.)?|straße|gasse|allee|weg|platz|ring|damm|chaussee)\s+\d+[a-z]?\b/gi,
  },
  date: {
    label: 'Geburtsdatum',
    // Lookbehind keeps the label out of the match, so the placeholder replaces
    // only the date itself and "geb." survives as context for the model.
    re: /(?<=\b(?:born|DOB|geb\.?|Geburtsdatum|birthdate|birth date|date of birth)[:\s]{1,4})\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/gi,
  },
  passport: {
    label: 'Ausweis / Pass',
    re: /\b[A-Z]{1,2}[\s]?\d{6,9}\b/g,
  },
  ip: {
    label: 'IP-Adresse',
    re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    validate: (m) => m.split('.').every((o) => +o >= 0 && +o <= 255),
  },
  iban: {
    label: 'IBAN',
    re: /[A-Z]{2}\d{2}(?:[\s]?\d{2,4}){3,8}/g,
  },
  creditcard: {
    label: 'Kreditkarte',
    re: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g,
  },
  taxid: {
    label: 'Steuer-ID',
    re: /\b\d{11}\b/g,
    validate: (m) => /^[1-9]/.test(m),
  },
  insurance: {
    label: 'Versicherungs-Nr.',
    re: /(?<=\b(?:Versicherten(?:-Nr\.?|nummer)|KV-Nr\.?|Insurance\s+(?:No\.?|Nr\.?|Number))[:\s]{1,4})[A-Z0-9]{6,15}\b/gi,
  },
  health: {
    label: 'Gesundheitsdaten',
    art9: true,
    // Two alternatives: a keyword-prefixed clinical value (label kept out via
    // lookbehind), or a standalone condition name.
    re: /(?<=\b(?:Diagnose|Medikation|Therapie(?:plan)?|Erkrankung|Befund|Symptome?|Behandlung|Operation|Krankheit|Allergie|Impfstatus|Blutgruppe|Blutzucker|Blutdruck|Cholesterin)[:\s]{1,4})[^\n]{3,80}|\b(?:HIV|AIDS|Diabetes(?:\s+mellitus(?:\s+Typ\s+\d)?)?|Hypertonie|Migräne|Depression|depressive\s+Episode|Hypothyreose|Asthma|Krebs|Karzinom|Tumor|Schizophrenie|Epilepsie|Demenz|Alzheimer|Multiple\s+Sklerose|Parkinson)\b/gi,
  },
  religion: {
    label: 'Religion',
    art9: true,
    re: /(?<=\b(?:Religionszugehörigkeit|Religion|Konfession|Kirchensteuer|Glaube|faith|religious\s+affiliation|denomination)[:\s]{1,4})[^\n]{2,60}|\b(?:evangelisch|katholisch|römisch-katholisch|muslimisch|islamisch|jüdisch|buddhistisch|hinduistisch|orthodox|protestantisch)\b/gi,
  },
  political: {
    label: 'Politische Meinung',
    art9: true,
    re: /(?<=\b(?:Partei(?:mitglied(?:schaft)?)?|Politische\s+(?:Überzeugung|Ansicht|Zugehörigkeit)|Ortsverband|Kreisverband|political\s+(?:party|affiliation|view))[:\s]{1,4})[^\n]{2,80}/gi,
  },
  sexual: {
    label: 'Sexuelle Orientierung',
    art9: true,
    re: /\b(?:sexuelle(?:r)?\s+(?:Orientierung|Identität)|Geschlechtsidentität|sexual\s+(?:orientation|identity)|gender\s+identity|homosexuell|bisexuell|pansexuell|nicht-binär|queer|lesbisch|schwul|trans(?:gender)?)[:\s]*[^\n]{0,60}/gi,
  },
};

/** Detector → placeholder type. */
export const RULE_TYPE: Record<RuleKey, TokenType> = {
  name: 'NAME',
  email: 'EMAIL',
  phone: 'PHONE',
  address: 'ADDRESS',
  date: 'DATE',
  iban: 'NUMBER',
  creditcard: 'NUMBER',
  taxid: 'NUMBER',
  passport: 'NUMBER',
  insurance: 'NUMBER',
  ip: 'NUMBER',
  health: 'HEALTH_DATA',
  religion: 'RELIGION',
  political: 'POLITICAL',
  sexual: 'SEXUAL_ORIENT',
};

/**
 * Detector precedence. Most specific and longest structured matches run first;
 * free-text names run last, because they are the loosest pattern and would
 * otherwise swallow parts of an address or a labelled field.
 *
 * The index in this array *is* the priority used to resolve overlaps.
 */
export const DETECT_ORDER: RuleKey[] = [
  'iban',
  'creditcard',
  'taxid',
  'passport',
  'insurance',
  'ip',
  'email',
  'phone',
  'date',
  'address',
  'health',
  'religion',
  'political',
  'sexual',
  'name',
];

/** Rule groups as presented in the rail. */
export const RULE_GROUPS = [
  {
    id: 'standard',
    title: 'Direkte Identifikatoren',
    art9: false,
    keys: ['name', 'email', 'phone', 'address', 'date', 'passport', 'ip'] satisfies RuleKey[],
  },
  {
    id: 'financial',
    title: 'Kenn- & Finanznummern',
    art9: false,
    keys: ['iban', 'creditcard', 'taxid', 'insurance'] satisfies RuleKey[],
  },
  {
    id: 'art9',
    title: 'Art. 9 DSGVO',
    art9: true,
    keys: ['health', 'religion', 'political', 'sexual'] satisfies RuleKey[],
  },
] as const;

export const RULE_KEYS = Object.keys(RULES) as RuleKey[];

/** Example values shown as rule tooltips. */
export const RULE_HINT: Record<RuleKey, string> = {
  name: 'z. B. „Frau Weber“, „Patient: Max Mustermann“',
  email: 'z. B. max@example.de',
  phone: 'z. B. +49 151 23456789',
  address: 'z. B. „Hauptstraße 12“',
  date: 'z. B. „geb. 12.03.1985“',
  passport: 'z. B. DE1234567',
  ip: 'z. B. 192.168.1.42',
  iban: 'z. B. DE89 3704 0044 …',
  creditcard: 'z. B. 4123 4567 8901 2345',
  taxid: '11-stellige Steuer-ID (§ 139b AO)',
  insurance: 'z. B. „Versicherten-Nr. …“',
  health: 'z. B. „Diagnose: …“, „Diabetes“',
  religion: 'z. B. „Konfession: …“, „katholisch“',
  political: 'z. B. „Partei: …“',
  sexual: 'z. B. „sexuelle Orientierung: …“',
};
