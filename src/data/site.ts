/**
 * ENEA ROMA — Modello dati del sito (fonte unica di verità)
 *
 * REGOLA: qui dentro non si inventa nulla.
 * - I testi marcati `// [MANUALE]` sono citati dal manuale ufficiale del brand.
 * - I campi con `ATTESA` sono segnaposto in attesa di dati reali dal cliente:
 *   vanno sostituiti prima della pubblicazione e sono elencati nel messaggio al titolare.
 */

/** Segnaposto tipizzato: rende impossibile pubblicare per sbaglio un dato non confermato. */
export const ATTESA = '⟨da confermare⟩' as const;

export const brand = {
  nome: 'ENEA',
  // CONFERMATO: marchio ufficiale = pino domestico + "ROMA". Sull’insegna fisica
  // compare una variante "RISTORANTE" con simbolo a ramo: non si usa sul web.
  // Il lockup vero è in Marchio.astro, vettorializzato dal render del manuale.
  sottotitolo: 'ROMA',
  /** Come si scrive il nome in prosa: nei metadati e per gli assistenti vocali
   *  la capitalizzazione naturale è preferibile al maiuscolo del marchio. */
  nomeEsteso: 'ENEA Roma',
} as const;

/**
 * Recapiti. Via e civico provengono dalle schede online della gestione
 * precedente (stesso indirizzo, stesso locale) e sono coerenti con le foto
 * della facciata nel manuale: si pubblicano in attesa di conferma scritta.
 * Telefono ed email restano ATTESA: quelli in rete sono della vecchia gestione
 * e pubblicarli manderebbe i clienti a un numero che non risponde.
 */
export const contatti = {
  via: 'Via Boncompagni', // [MANUALE] footer e foto della facciata
  civico: '83', // dalle schede online preesistenti — da confermare
  cap: '00187', // CAP del rione Ludovisi
  citta: 'Roma',
  telefono: ATTESA,
  whatsapp: ATTESA,
  email: ATTESA,
  mapsUrl: ATTESA,
} as const;

/** Orari — ATTESA. */
export const orari = {
  cucina: ATTESA,
  bar: ATTESA,
  chiusura: ATTESA,
} as const;

/**
 * Apertura: il titolare indica metà settembre 2026, data esatta ancora da
 * fissare. Si comunica il periodo, mai una data precisa non confermata:
 * una data sbagliata in rete produce clienti davanti a una porta chiusa.
 */
export const apertura = {
  periodo: { it: 'Apertura a metà settembre', en: 'Opening mid-September' },
  dettaglio: {
    it: 'La data esatta sarà annunciata qui a breve.',
    en: 'The exact date will be announced here shortly.',
  },
} as const;

/**
 * Dati legali — CONFERMATI (anagrafica Aruba dell’account aziendale,
 * verificati da Marco col titolare il 06/09/2026).
 */
export const legale = {
  ragioneSociale: 'ENEA S.R.L.S.',
  partitaIva: '17292571001',
  sedeLegale: 'Via Dario Niccodemi 94, 00137 Roma',
} as const;

/**
 * Testi del brand — VERIFICATI, citati dal manuale ufficiale (12 pp).
 * Non modificare senza confronto col titolare: sono la voce ufficiale di ENEA.
 */
export const testi = {
  it: {
    // [MOODBOARD] claim di lancio, usato sulle tavole ufficiali del brand
    claimLancio: 'La Dolce Vita sta per ricominciare.',
    // [MANUALE] sottotitolo di copertina
    claimApertura:
      "Un’esperienza di ospitalità romana contemporanea, ispirata all’eleganza, all’energia e al fascino senza tempo della Dolce Vita.",
    // [MANUALE] "Il concept ENEA"
    concept:
      "ENEA è un ristorante mediterraneo raffinato nel cuore di Roma, a pochi passi da Via Veneto. Il concept unisce identità italiana e visione cosmopolita: abbastanza sofisticato per un’occasione speciale, ma al tempo stesso accogliente ed energico per diventare un punto di riferimento abituale.",
    // [MANUALE] "Benvenuto in ENEA"
    origine:
      "ENEA nasce per essere inequivocabilmente romano, senza risultare nostalgico o teatrale. Il concept trae ispirazione dalla sicurezza e dall’eleganza della Roma degli anni '60 e '70, dallo stile di vita mediterraneo e dall’energia sociale senza tempo della zona di Via Veneto.",
    // [MANUALE] "Il nome"
    nome: "ENEA richiama l’eredità classica, romana e mediterranea mantenendo un’identità pulita, forte e contemporanea. Il nome lega il ristorante a Roma senza ricorrere a cliché.",
    // [MANUALE] chiusura
    triade: [
      'Eleganza. Calore. Precisione.',
      'Carattere romano. Spirito mediterraneo.',
      'Connessione umana autentica.',
    ],
    // [MANUALE] "Benvenuto in ENEA" — l’obiettivo dichiarato
    obiettivo:
      'Il nostro obiettivo è creare un ristorante in cui cucina raffinata, servizio caloroso, musica, design e connessione umana convivano in modo naturale.',
    // [MANUALE] "03 | Filosofia food & beverage — La cucina"
    cucina:
      "L’identità gastronomica è mediterranea e italiana nel suo nucleo. Ingredienti, stagionalità e chiarezza dei sapori sono i protagonisti. La presentazione è raffinata, ma la cucina conserva generosità, riconoscibilità e piacere.",
    // [MANUALE] "03 | Filosofia food & beverage — Il bar"
    bar: "Il bar è parte integrante dell’esperienza ENEA: la cultura italiana dell’aperitivo, i grandi classici, cocktail eseguiti con precisione e una selezione di vini intelligente, che accompagnano la cucina e il ritmo della sala.",
    // [MANUALE] "02 | Il nostro ospite"
    ospiti:
      "ENEA accoglie una clientela italiana e internazionale: romani, ospiti degli hotel, viaggiatori d’affari, turisti, creativi e persone che scelgono il ristorante per celebrare momenti importanti.",
    // [MANUALE] "02 | Il nostro ospite" — la frase in evidenza
    ricordo:
      'Un ospite deve ricordare più di un piatto. Deve ricordare come ENEA lo ha fatto sentire.',
    // [MANUALE] "02 | Come vogliamo far sentire l’ospite"
    accoglienza: [
      'Riconosciuto e accolto fin dal suo arrivo.',
      'A proprio agio, mai intimidito.',
      'Seguito con attenzione, senza sentirsi osservato.',
      "Parte dell’energia della sala.",
    ],
    // [MANUALE] "L’atmosfera"
    atmosfera: [
      'Elegante, ma mai pretenziosa.',
      'Mediterranea, calda e materica.',
      "Richiami alla Roma degli anni '60 e '70 reinterpretati in chiave contemporanea.",
      "Sociale ed energica, con un autentico senso dell’occasione.",
      'Standard internazionali, carattere profondamente romano.',
    ],
  },
  en: {
    // [MOODBOARD] claim di lancio nella versione inglese, dalle tavole ufficiali
    claimLancio: 'La Dolce Vita, reimagined.',
    claimApertura:
      'A contemporary Roman hospitality experience, inspired by the elegance, energy and timeless charm of La Dolce Vita.',
    concept:
      'ENEA is a refined Mediterranean restaurant in the heart of Rome, steps from Via Veneto. The concept blends Italian identity with a cosmopolitan vision: sophisticated enough for a special occasion, yet warm and lively enough to become a regular haunt.',
    origine:
      'ENEA was created to be unmistakably Roman, without nostalgia or theatrics. The concept draws on the confidence and elegance of 1960s and 1970s Rome, the Mediterranean way of life and the timeless social energy of the Via Veneto district.',
    nome: 'ENEA evokes a classical, Roman and Mediterranean heritage while keeping a clean, strong and contemporary identity. The name ties the restaurant to Rome without resorting to cliché.',
    obiettivo:
      'Our aim is a restaurant where refined cooking, warm service, music, design and genuine human connection sit together naturally.',
    cucina:
      'The cooking is Mediterranean and Italian at its core. Ingredients, seasonality and clarity of flavour come first. The plating is refined, but the food keeps its generosity, its familiarity and its pleasure.',
    bar: 'The bar is an integral part of ENEA: the Italian aperitivo, the great classics, cocktails made with precision and an intelligent wine list, chosen to follow the kitchen and the rhythm of the room.',
    ospiti:
      'ENEA welcomes Italian and international guests alike: Romans, hotel guests, business travellers, tourists, creatives, and people choosing the restaurant to mark an occasion.',
    ricordo:
      'A guest should remember more than a dish. They should remember how ENEA made them feel.',
    accoglienza: [
      'Recognised and welcomed from the moment they arrive.',
      'At ease, never intimidated.',
      'Looked after closely, without feeling watched.',
      'Part of the energy of the room.',
    ],
    triade: [
      'Elegance. Warmth. Precision.',
      'Roman character. Mediterranean spirit.',
      'Genuine human connection.',
    ],
    atmosfera: [
      'Elegant, never pretentious.',
      'Mediterranean, warm and tactile.',
      'Echoes of 1960s and 1970s Rome, reimagined for today.',
      'Sociable and lively, with a true sense of occasion.',
      'International standards, a deeply Roman character.',
    ],
  },
} as const;

/** Navigazione — le ancore esistono; le pagine si popolano man mano che arrivano i contenuti. */
export const nav = {
  it: [
    { href: '#locale', label: 'Il ristorante' },
    { href: '#menu', label: 'La cucina' },
    { href: '#galleria', label: 'Immagini' },
    { href: '#dove', label: 'Dove siamo' },
  ],
  en: [
    { href: '#locale', label: 'The restaurant' },
    { href: '#menu', label: 'The kitchen' },
    { href: '#galleria', label: 'Pictures' },
    { href: '#dove', label: 'Visit us' },
  ],
} as const;

export type Locale = 'it' | 'en';
