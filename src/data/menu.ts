/**
 * Menu della cena — Autunno 2026.
 *
 * Trascritto dal documento del titolare («Menu ENEA Cena AUTUNNO 26», 22/09/2026,
 * conservato in brand/menu/). Regole:
 * - si pubblica SOLO la pagina del menu: il ricettario (pp. 2-8) è interno
 * - si pubblica SOLO il prezzo di vendita: il documento riporta anche il food
 *   cost accanto a ogni piatto, che non va mai in rete
 * - gli allergeni sono quelli DICHIARATI dal titolare (numerazione Reg. UE
 *   1169/2011), riportati tali e quali: le incongruenze sospette sono state
 *   segnalate al titolare, non corrette d'ufficio
 * - ortografia normalizzata (poché, 'nduja, Mont Blanc), ingredienti invariati
 */

export interface Piatto {
  readonly nome: { readonly it: string; readonly en: string };
  /** Numeri degli allergeni dichiarati dalla cucina (vuoto = nessuno dichiarato). */
  readonly allergeni: readonly number[];
  /** Prezzo in euro, intero. Assente = non comunicato dal titolare: il piatto
   *  resta nei dati ma NON si pubblica finché il prezzo non arriva. */
  readonly prezzo?: number;
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
}

export const menuCena = {
  servizio: { it: 'Cena', en: 'Dinner' },
  stagione: { it: 'Autunno 2026', en: 'Autumn 2026' },
  sezioni: [
    {
      id: 'antipasti',
      titolo: { it: 'Antipasti', en: 'Starters' },
      piatti: [
        {
          nome: {
            it: 'Tartare di manzo all’uso toscano con uovo marinato',
            en: 'Tuscan-style beef tartare with marinated egg',
          },
          allergeni: [3, 4, 6, 10],
          prezzo: 14,
        },
        {
          nome: {
            it: 'Polpetta di coda alla vaccinara con vellutata di sedano',
            en: 'Oxtail “alla vaccinara” croquette with celery velouté',
          },
          allergeni: [1, 3, 6, 7, 9, 10],
          prezzo: 14,
        },
        {
          nome: {
            it: 'Uovo poché, spuma di patata, cipolla bruciata e tartufo',
            en: 'Poached egg, potato foam, burnt onion and truffle',
          },
          allergeni: [3, 7],
          prezzo: 18,
        },
        {
          nome: {
            it: 'Polpo rosticciato, galletti, frutti di bosco',
            en: 'Roasted octopus, chanterelles, wild berries',
          },
          allergeni: [14],
          prezzo: 19,
        },
        {
          nome: {
            it: 'Tartare di ombrina, mandorle, mela compressa e ’nduja',
            en: 'Ombrina (meagre) tartare, almonds, compressed apple and ’nduja',
          },
          allergeni: [4, 6, 8, 10],
          prezzo: 16,
        },
      ],
    },
    {
      id: 'primi',
      titolo: { it: 'Primi', en: 'First courses' },
      piatti: [
        {
          nome: {
            it: 'Bottoncini di pollo e manzo al fondo d’arrosto',
            en: 'Chicken and beef “bottoncini” pasta parcels in roasting jus',
          },
          allergeni: [1, 3, 6, 7, 9, 12],
          prezzo: 20,
        },
        {
          nome: {
            it: 'Fettuccine al ragù bianco di cortile, aglio nero ed erbe spontanee',
            en: 'Fettuccine with white farmyard ragù, black garlic and wild herbs',
          },
          allergeni: [1, 3, 6, 7, 9, 12],
          prezzo: 16,
        },
        {
          nome: {
            it: 'Risotto alla zucca, erborinato di capra, amaretti, nocciole',
            en: 'Pumpkin risotto, goat’s blue cheese, amaretti, hazelnuts',
          },
          allergeni: [1, 7, 8, 12],
          prezzo: 18,
        },
        {
          nome: {
            it: 'Tagliolino burro e alici',
            en: 'Tagliolini with butter and anchovies',
          },
          allergeni: [1, 3, 4, 7],
          prezzo: 18,
        },
        {
          nome: {
            it: 'Minestra di mare tiepida',
            en: 'Warm seafood “minestra” with mixed pasta',
          },
          allergeni: [1, 9, 12, 14],
          prezzo: 22,
        },
        {
          nome: {
            it: 'I primi classici romani',
            en: 'The classic Roman pastas',
          },
          allergeni: [1, 9, 12],
          prezzo: 14,
        },
      ],
    },
    {
      id: 'secondi',
      titolo: { it: 'Secondi', en: 'Main courses' },
      piatti: [
        {
          nome: {
            it: 'Coniglio porchettato, parmentier e olio al prezzemolo',
            en: 'Porchetta-style rabbit, potato parmentier and parsley oil',
          },
          allergeni: [7, 9, 12],
          prezzo: 24,
        },
        {
          nome: {
            it: 'Faraona, cime di rapa e melograno',
            en: 'Guinea fowl, turnip tops and pomegranate',
          },
          allergeni: [9, 12],
          prezzo: 26,
        },
        {
          nome: {
            it: 'Assoluto di melanzana alla parmigiana',
            en: 'Aubergine parmigiana “assoluto”',
          },
          allergeni: [],
          prezzo: 20,
        },
        {
          nome: {
            it: 'Ombrina laccata al bbq, carciofo alla romana',
            en: 'BBQ-lacquered ombrina (meagre), Roman-style artichoke',
          },
          allergeni: [4, 7, 9, 12, 14],
          prezzo: 26,
        },
        {
          nome: {
            it: 'Salmone alla piastra con contorno di insalata mista',
            en: 'Grilled salmon with mixed salad',
          },
          allergeni: [4],
          prezzo: 19,
        },
      ],
    },
    {
      id: 'dolci',
      titolo: { it: 'Dolci', en: 'Desserts' },
      piatti: [
        {
          nome: {
            it: 'Tartelletta noccioline, cioccolato, popcorn e caramello salato con gelato alla crema',
            en: 'Peanut, chocolate, popcorn and salted caramel tartlet with vanilla ice cream',
          },
          allergeni: [1, 3, 5, 7],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Lemon pie con gelato al limone',
            en: 'Lemon pie with lemon ice cream',
          },
          allergeni: [1, 3, 5, 7],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Caffè, latte e biscotti con gelato al cioccolato',
            en: 'Coffee, milk and biscuits with chocolate ice cream',
          },
          allergeni: [1, 3, 5, 7],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Mont Blanc con gelato ai lamponi',
            en: 'Mont Blanc with raspberry ice cream',
          },
          allergeni: [1, 3, 5, 7],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Tiramisù classico',
            en: 'Classic tiramisù',
          },
          allergeni: [1, 3, 5, 7],
          prezzo: 8,
        },
      ],
    },
  ],
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
            en: 'Avocado toast with house-cured salmon, rocket and sour cream',
          },
          allergeni: [1, 3, 4, 6, 7],
          prezzo: 16,
        },
        {
          nome: {
            it: 'Pan brioche con stracciata e alici del Canale di Sicilia',
            en: 'Brioche bun with stracciatella and Sicilian Channel anchovies',
          },
          allergeni: [1, 3, 4, 6, 7],
          prezzo: 12,
        },
        {
          nome: {
            it: 'Pan brioche con stracciata, pomodoro confit e crema di basilico',
            en: 'Brioche bun with stracciatella, confit tomato and basil cream',
          },
          allergeni: [1, 3, 6, 7],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Alici fritte e maionese al mojito',
            en: 'Fried anchovies with mojito mayonnaise',
          },
          allergeni: [1, 3, 4, 6],
          prezzo: 10,
        },
        {
          nome: {
            it: 'Straccetti di pollo panati con salsa ENEA',
            en: 'Breaded chicken strips with ENEA sauce',
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
    hasMenuItem: pubblicabili(s).map((p) => ({
      '@type': 'MenuItem',
      name: p.nome[locale],
      offers: { '@type': 'Offer', price: String(p.prezzo), priceCurrency: 'EUR' },
    })),
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
