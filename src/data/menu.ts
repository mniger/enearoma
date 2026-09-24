/**
 * Menu della cena — Autunno 2026.
 *
 * Fonte: il menu stampato del titolare su Canva («ENEA_Menu_Cena_Autunno_2026»,
 * 6 pagine, condiviso il 24/09/2026), che aggiorna il PDF del 22/09 conservato
 * in brand/menu/. Regole:
 * - si pubblica solo il menu: il ricettario del PDF resta interno
 * - si pubblica solo il prezzo di vendita, mai il food cost
 * - allergeni come DICHIARATI dal titolare (numerazione Reg. UE 1169/2011)
 * - inglese: le righe del titolare, non traduzioni nostre (sua richiesta);
 *   corretti solo i refusi evidenti («Taditional») e la riga del trancio,
 *   che nel suo file dice ancora «salmon» mentre il piatto è il pescato del giorno
 */

export interface Piatto {
  readonly nome: { readonly it: string; readonly en: string };
  /** Seconda riga, come sul menu stampato. In inglese il titolare scrive una riga sola. */
  readonly descrizione?: { readonly it: string; readonly en?: string };
  /** Numeri degli allergeni dichiarati dalla cucina (vuoto = nessuno dichiarato). */
  readonly allergeni: readonly number[];
  /** Prezzo in euro, anche con decimali (2.5). Assente = non comunicato dal
   *  titolare: il piatto resta nei dati ma NON si pubblica finché non arriva. */
  readonly prezzo?: number;
  /** «da € 4»: prezzo di partenza (gli amari). */
  readonly prezzoDa?: boolean;
  /** Sottogruppo dentro la sezione (le bevande: acqua, birre, caffetteria…). */
  readonly gruppo?: { readonly it: string; readonly en: string };
}

export interface SezioneMenu {
  readonly id: string;
  readonly titolo: { readonly it: string; readonly en: string };
  readonly piatti: readonly Piatto[];
}

export interface Menu {
  readonly servizio: { readonly it: string; readonly en: string };
  /** Stagione, se il menu la dichiara. */
  readonly stagione?: { readonly it: string; readonly en: string };
  readonly sezioni: readonly SezioneMenu[];
  /** Righe in coda al menu (coperto, pane). */
  readonly note?: { readonly it: readonly string[]; readonly en: readonly string[] };
}

const p = (it: string, desc: string, en: string, allergeni: number[], prezzo: number): Piatto => ({
  nome: { it, en },
  descrizione: { it: desc },
  allergeni,
  prezzo,
});

const bevanda = (gruppo: Piatto['gruppo'], it: string, en: string, prezzo: number, prezzoDa = false): Piatto => ({
  nome: { it, en },
  allergeni: [],
  prezzo,
  ...(prezzoDa ? { prezzoDa } : {}),
  ...(gruppo ? { gruppo } : {}),
});

const ACQUA = { it: 'Acqua e soft drinks', en: 'Water & soft drinks' };
const BIRRE = { it: 'Birre', en: 'Beer' };
const CAFFE = { it: 'Caffetteria', en: 'Coffee' };
const DOPO = { it: 'Dopo pasto', en: 'After dinner' };

export const menuCena = {
  servizio: { it: 'Cena', en: 'Dinner' },
  stagione: { it: 'Autunno 2026', en: 'Autumn 2026' },
  sezioni: [
    {
      id: 'antipasti',
      titolo: { it: 'Antipasti', en: 'Starters' },
      piatti: [
        p('Tartare di manzo all’uso toscano', 'Uovo marinato', 'Tuscan-style beef tartare with cured egg', [3, 4, 6, 10], 14),
        p('Polpetta di coda alla vaccinara', 'Vellutata di sedano', 'Traditional Roman stewed oxtail croquette with celery velouté', [1, 3, 6, 7, 9, 10], 14),
        p('Uovo poché', 'Spuma di patate, cipolla bruciata e tartufo', 'Poached egg, potato foam, burnt onion and truffle', [3, 7], 18),
        p('Polpo rosticciato', 'Galletti e frutti di bosco', 'Roasted octopus, chanterelles and wild berries', [14], 19),
        p('Tartare di ombrina', 'Mandorle, mela compressa e ’nduja', 'Croaker fish tartare, almonds, compressed apple and ’nduja', [4, 6, 8, 10], 16),
      ],
    },
    {
      id: 'primi',
      titolo: { it: 'Primi', en: 'First courses' },
      piatti: [
        p('Bottoncini di pollo e manzo', 'Fondo d’arrosto', 'Chicken and beef filled pasta, roast jus', [1, 3, 6, 7, 9, 12], 20),
        p('Fettuccine al ragù bianco di cortile', 'Aglio nero ed erbe spontanee', 'Fettuccine, white poultry ragù, black garlic and wild herbs', [1, 3, 6, 7, 9, 12], 16),
        p('Risotto alla zucca', 'Erborinato di capra, amaretti e nocciole', 'Pumpkin risotto, blue goat cheese, amaretti and hazelnuts', [1, 7, 8, 12], 18),
        p('Tagliolino burro e alici', 'Burro montato, alici e limone', 'Tagliolini, whipped butter, anchovies and lemon', [1, 3, 4, 7], 18),
        p('Minestra di mare tiepida', 'Pasta mista e frutti di mare', 'Warm seafood soup with mixed pasta', [1, 9, 12, 14], 22),
        p('I primi classici romani', 'Chiedere al personale la proposta del giorno', 'Ask our team for today’s Roman pasta', [1, 9, 12], 14),
      ],
    },
    {
      id: 'secondi',
      titolo: { it: 'Secondi', en: 'Main courses' },
      piatti: [
        p('Coniglio porchettato', 'Parmentier e olio al prezzemolo', 'Porchetta-style rabbit, parmentier and parsley oil', [7, 9, 12], 24),
        p('Faraona', 'Cime di rapa e melograno', 'Guineafowl, turnip greens and pomegranate', [9, 12], 26),
        p('Assoluto di melanzana alla parmigiana', 'Pomodoro, basilico e Parmigiano Reggiano', 'A contemporary take on eggplant parmigiana', [1, 3, 7], 20),
        p('Ombrina laccata al BBQ', 'Carciofo alla romana', 'BBQ-glazed croaker fish, Roman-style artichoke', [4, 7, 9, 12, 14], 26),
        p('Trancio di pescato del giorno alla piastra', 'Contorno di insalata mista', 'Grilled catch of the day with mixed salad', [4], 23),
      ],
    },
    {
      id: 'dolci',
      titolo: { it: 'Dolci', en: 'Desserts' },
      piatti: [
        p('Tartelletta noccioline e cioccolato', 'Popcorn, caramello salato e gelato alla crema', 'Peanut and chocolate tart, popcorn, salted caramel and vanilla gelato', [1, 3, 5, 7], 10),
        p('Lemon pie', 'Gelato al limone', 'Lemon pie with lemon sorbet', [1, 3, 5, 7], 10),
        p('Caffè, latte e biscotti', 'Gelato al cioccolato', 'Coffee, milk and biscuits with chocolate ice cream', [1, 3, 5, 7, 8], 10),
        p('Mont Blanc', 'Gelato ai lamponi', 'Mont Blanc with raspberry ice cream', [1, 3, 5, 7], 10),
        p('Tiramisù classico', 'Mascarpone, caffè e cacao', 'Classic tiramisù with mascarpone, coffee and cocoa', [1, 3, 5, 7], 8),
      ],
    },
    {
      id: 'bevande',
      titolo: { it: 'Bevande', en: 'Drinks' },
      piatti: [
        bevanda(ACQUA, 'Acqua naturale o frizzante 75 cl', 'Still or sparkling water 75 cl', 3),
        bevanda(ACQUA, 'Soft drinks', 'Soft drinks', 4),
        bevanda(BIRRE, 'Peroni 33 cl', 'Peroni 33 cl', 4),
        bevanda(BIRRE, 'Peroni 66 cl', 'Peroni 66 cl', 6),
        bevanda(BIRRE, 'Menabrea 33 cl', 'Menabrea 33 cl', 5),
        bevanda(BIRRE, 'Menabrea 66 cl', 'Menabrea 66 cl', 7),
        bevanda(CAFFE, 'Caffè espresso', 'Espresso', 2.5),
        bevanda(CAFFE, 'Cappuccino', 'Cappuccino', 4),
        bevanda(CAFFE, 'Caffè corretto', 'Caffè corretto, espresso with a dash of liqueur', 5),
        bevanda(DOPO, 'Amari', 'Amari, Italian herbal liqueurs', 4, true),
        bevanda(DOPO, 'Limoncello', 'Limoncello', 4),
      ],
    },
  ],
  note: {
    it: ['Coperto 2,50 € a persona: comprende tre tipi di pane fatto in casa.', 'Refill del pane 4 €.'],
    en: ['Cover charge €2.50 per person, including three types of homemade bread.', 'Bread refill €4.'],
  },
} as const satisfies Menu;

/**
 * Menu dell'aperitivo — trascritto dal testo inviato dal titolare il 22/09/2026,
 * prezzi dei taglieri arrivati il 23/09/2026 (stesse regole del menu della
 * cena: solo prezzo di vendita, mai il food cost che il titolare scrive
 * accanto; allergeni come dichiarati).
 */
export const menuAperitivo = {
  servizio: { it: 'Aperitivo', en: 'Aperitivo' },
  sezioni: [
    {
      id: 'aperitivo',
      titolo: { it: 'Aperitivo', en: 'Aperitivo' },
      piatti: [
        {
          nome: {
            it: 'Avocado toast con salmone marinato artigianalmente, rucola e panna acida',
            en: 'Avocado toast, house-cured salmon, rocket and sour cream',
          },
          allergeni: [1, 3, 4, 6, 7],
          prezzo: 16,
        },
        {
          nome: {
            it: 'Pan brioche con stracciata e alici del Canale di Sicilia',
            en: 'Brioche bun, stracciatella and anchovies from the Strait of Sicily',
          },
          allergeni: [1, 3, 4, 6, 7],
          prezzo: 12,
        },
        {
          nome: {
            it: 'Pan brioche con stracciata, pomodoro confit e crema di basilico',
            en: 'Brioche bun, stracciatella, confit tomato and basil cream',
          },
          allergeni: [1, 3, 6, 7],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Alici fritte e maionese al mojito',
            en: 'Fried anchovies, mojito mayonnaise',
          },
          allergeni: [1, 3, 4, 6],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Straccetti di pollo panati con salsa ENEA',
            en: 'Breaded chicken strips, ENEA sauce',
          },
          allergeni: [1, 3, 6],
          prezzo: 9,
        },
        {
          nome: { it: 'Tagliere di salumi e formaggi', en: 'Cured meats and cheese board' },
          allergeni: [7],
          prezzo: 18,
        },
        {
          nome: { it: 'Tagliere di salumi', en: 'Cured meats board' },
          allergeni: [],
          prezzo: 15,
        },
        {
          nome: { it: 'Tagliere di formaggi', en: 'Cheese board' },
          allergeni: [7],
          prezzo: 15,
        },
        {
          nome: { it: 'Tartare di salmone marinato', en: 'Cured salmon tartare' },
          allergeni: [4, 6],
          prezzo: 11,
        },
        {
          nome: { it: 'Tartare di manzo', en: 'Beef tartare' },
          allergeni: [6],
          prezzo: 10,
        },
      ],
    },
  ],
} as const satisfies Menu;

/**
 * Business lunch — dal titolare, 24/09/2026 (WhatsApp). I piatti cambiano a
 * periodi, quindi sul sito niente nomi: solo le tre scelte col loro prezzo.
 * Acqua, pane e caffè sono compresi; dolci ed extra restano fuori dal sito
 * (li gestisce la sala). Allergeni: dipendono dal piatto del giorno, li dice
 * il personale (nota in fondo alla pagina).
 */
export const menuPranzo = {
  servizio: { it: 'Business lunch', en: 'Business lunch' },
  sezioni: [
    {
      id: 'business-lunch',
      titolo: { it: 'Business lunch', en: 'Business lunch' },
      piatti: [
        { nome: { it: 'Antipasto del giorno', en: 'Starter of the day' }, allergeni: [], prezzo: 8 },
        { nome: { it: 'Primo del giorno', en: 'First course of the day' }, allergeni: [], prezzo: 12 },
        { nome: { it: 'Secondo del giorno', en: 'Main course of the day' }, allergeni: [], prezzo: 15 },
      ],
    },
  ],
  note: {
    it: ['Il prezzo di ogni piatto comprende acqua, pane e caffè.'],
    en: ['Each price includes water, bread and coffee.'],
  },
} as const satisfies Menu;

/** Solo i piatti pubblicabili: quelli con un prezzo comunicato dal titolare. */
export const pubblicabili = (s: SezioneMenu): ReadonlyArray<Piatto & { readonly prezzo: number }> =>
  s.piatti.filter((p): p is Piatto & { readonly prezzo: number } => typeof p.prezzo === 'number');

/** Dati strutturati schema.org/Menu: sezioni, piatti e prezzi come li legge Google. */
export const datiStrutturatiMenu = (menu: Menu, locale: 'it' | 'en', url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: [menu.servizio[locale], menu.stagione?.[locale]].filter(Boolean).join(' — '),
  inLanguage: locale,
  url,
  hasMenuSection: menu.sezioni.map((s) => ({
    '@type': 'MenuSection',
    name: s.titolo[locale],
    hasMenuItem: pubblicabili(s).map((p) => {
      const descrizione = locale === 'it' ? p.descrizione?.it : p.descrizione?.en;
      const prezzo = Number.isInteger(p.prezzo) ? String(p.prezzo) : p.prezzo.toFixed(2);
      return {
        '@type': 'MenuItem',
        name: p.nome[locale],
        ...(descrizione ? { description: descrizione } : {}),
        offers: p.prezzoDa
          ? { '@type': 'Offer', priceSpecification: { '@type': 'PriceSpecification', minPrice: prezzo, priceCurrency: 'EUR' } }
          : { '@type': 'Offer', price: prezzo, priceCurrency: 'EUR' },
      };
    }),
  })),
});

/** I 14 allergeni del Reg. UE 1169/2011, nella numerazione usata dalla cucina. */
export const allergeni: ReadonlyArray<{ n: number; it: string; en: string }> = [
  { n: 1, it: 'Glutine', en: 'Gluten' },
  { n: 2, it: 'Crostacei', en: 'Crustaceans' },
  { n: 3, it: 'Uova', en: 'Eggs' },
  { n: 4, it: 'Pesce', en: 'Fish' },
  { n: 5, it: 'Arachidi', en: 'Peanuts' },
  { n: 6, it: 'Soia', en: 'Soy' },
  { n: 7, it: 'Latte', en: 'Milk' },
  { n: 8, it: 'Frutta a guscio', en: 'Tree nuts' },
  { n: 9, it: 'Sedano', en: 'Celery' },
  { n: 10, it: 'Senape', en: 'Mustard' },
  { n: 11, it: 'Sesamo', en: 'Sesame' },
  { n: 12, it: 'Solfiti', en: 'Sulphites' },
  { n: 13, it: 'Lupini', en: 'Lupin' },
  { n: 14, it: 'Molluschi', en: 'Molluscs' },
];
