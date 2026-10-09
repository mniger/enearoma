/**
 * I menu di ENEA: à la carte (pranzo e cena), business lunch, aperitivo, cocktail.
 *
 * Fonti, conservate in brand/menu/: «MENU DECISIVO» (à la carte, 28/09/2026) e
 * «ENEA_Menu_Cocktail_Tapas_Aperitivo» (28/09/2026), i PDF definitivi del
 * titolare; il business lunch dal suo messaggio del 24/09. Regole:
 * - si pubblica solo il menu: il ricettario resta interno
 * - si pubblica solo il prezzo di vendita, mai il food cost
 * - allergeni: quelli del titolare (numerazione Reg. UE 1169/2011); quelli
 *   aggiunti nella revisione del 28/09 li ha confermati il 29/09. Il glutine
 *   sulle birre resta anche se lui non lo voleva: sono d'orzo e va indicato per legge
 * - inglese: le righe del titolare, corretti solo i refusi evidenti
 * - i segni sui prodotti congelati come sul menu stampato (obbligo di legge),
 *   con la stessa nota in fondo; il trattino davanti al nome diventa «°»
 * - niente «coperto», vietato nel Lazio (L.R. 22/2019, art. 75): il pane è un
 *   prodotto a listino col suo prezzo, come chiede il titolare (29/09)
 */

export interface Piatto {
  readonly nome: { readonly it: string; readonly en: string };
  /** Seconda riga, come sul menu stampato. In inglese il titolare scrive una riga sola. */
  readonly descrizione?: { readonly it: string; readonly en?: string };
  /** Numeri degli allergeni dichiarati dalla cucina (vuoto = nessuno dichiarato). */
  readonly allergeni: readonly number[];
  /** Voce che cambia ogni volta (l'aperitivo dello chef, i classici del bar): al
   *  posto dei numeri, «chiedere al personale». */
  readonly allergeniVariabili?: boolean;
  /** Prezzo in euro, anche con decimali (2.5). Assente = non comunicato dal
   *  titolare: il piatto resta nei dati ma NON si pubblica finché non arriva. */
  readonly prezzo?: number;
  /** «da € 4»: prezzo di partenza (gli amari). */
  readonly prezzoDa?: boolean;
  /** Sottogruppo dentro la sezione (le bevande: acqua, birre, caffetteria…). */
  readonly gruppo?: { readonly it: string; readonly en: string };
  /** Prodotto congelato, come lo segna il menu stampato: vedi `segni`. */
  readonly segno?: Segno;
}

export interface SezioneMenu {
  readonly id: string;
  readonly titolo: { readonly it: string; readonly en: string };
  readonly piatti: readonly Piatto[];
}

export interface Menu {
  readonly servizio: { readonly it: string; readonly en: string };
  /** Nome della carta, se il menu lo dichiara («La Dolce Vita»). */
  readonly stagione?: { readonly it: string; readonly en: string };
  readonly sezioni: readonly SezioneMenu[];
  /** Righe in coda al menu (cosa comprende il prezzo, richieste particolari). */
  readonly note?: { readonly it: readonly string[]; readonly en: readonly string[] };
}

export type Segno = 'casa' | 'surgelato' | 'crudo';

/** I segni dei prodotti congelati e la nota di legge, parola per parola dal menu stampato;
 *  `breve` è quello che il lettore di schermo dice accanto al piatto. */
export const segni: Readonly<Record<Segno, {
  readonly simbolo: string; readonly it: string; readonly en: string;
  readonly breve: { readonly it: string; readonly en: string };
}>> = {
  casa: {
    simbolo: '°',
    breve: { it: 'congelato da noi', en: 'frozen in house' },
    it: 'Prodotto preparato nella nostra cucina e congelato da noi per garantirne la corretta conservazione.',
    en: 'Product prepared in our kitchen and frozen by us to ensure proper preservation.',
  },
  surgelato: {
    simbolo: '*',
    breve: { it: 'può essere congelato o surgelato', en: 'may be frozen or deep-frozen' },
    it: 'Prodotto che potrebbe essere congelato o surgelato a seconda della disponibilità.',
    en: 'Product may be frozen or deep-frozen depending on availability.',
  },
  crudo: {
    simbolo: '**',
    breve: { it: 'pesce crudo bonificato col congelamento', en: 'raw fish, frozen beforehand for safety' },
    it: 'I prodotti della pesca destinati al consumo crudo o praticamente crudo sono sottoposti a trattamento di bonifica preventiva mediante congelamento, conformemente al Reg. (CE) n. 853/2004 e successive modifiche.',
    en: 'Fishery products intended to be consumed raw or practically raw are subject to preventive freezing treatment in accordance with Regulation (EC) No. 853/2004 and subsequent amendments.',
  },
};

const p = (it: string, desc: string, en: string, allergeni: number[], prezzo: number, segno?: Segno): Piatto => ({
  nome: { it, en },
  descrizione: { it: desc },
  allergeni,
  prezzo,
  ...(segno ? { segno } : {}),
});

const bevanda = (
  gruppo: Piatto['gruppo'], it: string, en: string, prezzo: number,
  { allergeni = [], prezzoDa = false }: { allergeni?: number[]; prezzoDa?: boolean } = {},
): Piatto => ({
  nome: { it, en },
  allergeni,
  prezzo,
  ...(prezzoDa ? { prezzoDa } : {}),
  ...(gruppo ? { gruppo } : {}),
});

const ACQUA = { it: 'Acqua e soft drink', en: 'Water & soft drinks' };
const BIRRE = { it: 'Birre', en: 'Beer' };
const CAFFE = { it: 'Caffetteria', en: 'Coffee' };
const DOPO = { it: 'Dopo pasto', en: 'Digestives' };

/** Il menu à la carte, a pranzo e a cena: «MENU DECISIVO» del 28/09/2026. */
export const menuCarta = {
  servizio: { it: 'À la carte', en: 'À la carte' },
  sezioni: [
    {
      id: 'antipasti',
      titolo: { it: 'Antipasti', en: 'Starters' },
      piatti: [
        p('Tartare di manzo all’uso toscano', 'Uovo marinato', 'Tuscan-style beef tartare with cured egg', [3, 4, 6, 10], 14, 'casa'),
        // «sedano rapa» è il celeriac: l'inglese del titolare diceva «celery»
        p('Polpetta di coda alla vaccinara', 'Vellutata di sedano rapa', 'Oxtail croquette with celeriac velouté', [1, 3, 6, 7, 9, 10], 14, 'casa'),
        p('Uovo poché', 'Spuma di patate, cipolla bruciata e tartufo', 'Poached egg, potato foam, burnt onion and truffle', [3, 7], 18),
        p('Polpo rosticciato', 'Galletti e frutti di bosco', 'Roasted octopus, chanterelles and wild berries', [9, 14], 19, 'surgelato'),
        p('Tartare di ombrina', 'Mandorle, mela compressa e polvere di ’nduja', 'Croaker fish tartare, almonds, compressed apple and ’nduja powder', [4, 6, 8, 10], 16, 'crudo'),
      ],
    },
    {
      id: 'primi',
      titolo: { it: 'Primi', en: 'First courses' },
      piatti: [
        p('Bottoncini di pollo e manzo', 'Fondo d’arrosto', 'Chicken and beef filled pasta, roast jus', [1, 3, 6, 7, 9, 12], 20, 'casa'),
        p('Fettuccine al ragù bianco di cortile', 'Aglio nero ed erbe spontanee', 'Fettuccine, white poultry ragù, black garlic and wild herbs', [1, 3, 6, 7, 9, 12], 16, 'casa'),
        p('Risotto alla zucca', 'Erborinato di capra, amaretti e nocciole', 'Pumpkin risotto, blue goat cheese, amaretti and hazelnuts', [1, 3, 7, 8, 12], 18, 'casa'),
        p('Tagliolino burro e alici', 'Burro e alici', 'Tagliolini, whipped butter and anchovies', [1, 3, 4, 7], 18, 'casa'),
        p('Minestra di mare tiepida', 'Pasta mista e frutti di mare', 'Warm seafood soup with mixed pasta', [1, 2, 4, 9, 12, 14], 22, 'casa'),
        p('I primi classici romani', 'Chiedere al personale la proposta del giorno', 'Ask our team for today’s Roman pasta', [1, 3, 7, 9, 12], 14),
      ],
    },
    {
      id: 'secondi',
      titolo: { it: 'Secondi', en: 'Main courses' },
      piatti: [
        p('Coniglio porchettato', 'Parmentier e olio al prezzemolo', 'Porchetta-style rabbit, parmentier and parsley oil', [7, 9, 12], 24, 'casa'),
        p('Faraona', 'Cime di rapa e melograno', 'Guineafowl, turnip greens and pomegranate', [7, 9, 12], 26, 'casa'),
        p('Assoluto di melanzana alla parmigiana', 'Pomodoro, basilico e Parmigiano Reggiano', 'A contemporary take on aubergine parmigiana', [1, 3, 7, 9], 20, 'casa'),
        p('Ombrina laccata al BBQ', 'Carciofo alla romana', 'BBQ-glazed croaker fish, Roman-style artichoke', [4, 6, 7, 9, 10, 12, 14], 26, 'casa'),
        p('Trancio di pescato del giorno alla piastra', 'Contorno di insalata mista', 'Grilled catch of the day with mixed salad', [4], 23, 'casa'),
      ],
    },
    {
      id: 'dolci',
      titolo: { it: 'Dolci', en: 'Desserts' },
      piatti: [
        p('Tartelletta noccioline e cioccolato', 'Popcorn, caramello salato e gelato alla crema', 'Peanut and chocolate tart, popcorn, salted caramel and vanilla ice cream', [1, 3, 5, 7], 10),
        p('Lemon pie', 'Gelato al limone', 'Lemon pie with lemon sorbet', [1, 3, 5, 7], 10),
        p('Caffè, latte e biscotti', 'Gelato al cioccolato', 'Coffee, milk and biscuits with chocolate ice cream', [1, 3, 5, 7, 8], 10),
        p('Mont Blanc', 'Gelato ai lamponi', 'Mont Blanc with raspberry ice cream', [1, 3, 5, 7], 10, 'casa'),
        p('Tiramisù classico', 'Mascarpone, caffè e cacao', 'Classic tiramisù with mascarpone, coffee and cocoa', [1, 3, 5, 7], 8),
      ],
    },
    {
      id: 'bevande',
      titolo: { it: 'Bevande', en: 'Drinks' },
      piatti: [
        bevanda(ACQUA, 'Acqua naturale o frizzante 75 cl', 'Still or sparkling water 75 cl', 3.5),
        bevanda(ACQUA, 'Coca-Cola', 'Coke', 4),
        bevanda(ACQUA, 'Coca-Cola Zero', 'Coke Zero', 4),
        bevanda(ACQUA, 'Limonata', 'Sparkling lemonade', 4),
        bevanda(ACQUA, 'Aranciata', 'Sparkling orange juice', 4),
        bevanda(ACQUA, 'Succhi di frutta', 'Fruit juices', 4),
        bevanda(ACQUA, 'Ginger beer', 'Ginger beer', 5),
        bevanda(ACQUA, 'Spremuta d’arancia', 'Fresh orange juice', 5),
        // glutine: malto d'orzo, va indicato
        bevanda(BIRRE, 'Peroni 33 cl', 'Peroni 33 cl', 4, { allergeni: [1] }),
        bevanda(BIRRE, 'Menabrea 33 cl', 'Menabrea 33 cl', 4, { allergeni: [1] }),
        bevanda(BIRRE, 'Menabrea Ambrata 33 cl', 'Menabrea Ambrata (amber) 33 cl', 5, { allergeni: [1] }),
        bevanda(BIRRE, 'Peroni analcolica', 'Peroni alcohol-free', 5, { allergeni: [1] }),
        bevanda(CAFFE, 'Caffè espresso', 'Espresso', 2.5),
        bevanda(CAFFE, 'Cappuccino', 'Cappuccino', 4, { allergeni: [7] }),
        bevanda(CAFFE, 'Caffè corretto', 'Caffè corretto, espresso with a dash of liqueur', 5),
        bevanda(CAFFE, 'Tè e tisane', 'Teas & infusions', 4),
        bevanda(DOPO, 'Amari', 'Amari, Italian herbal digestives', 4, { prezzoDa: true }),
        bevanda(DOPO, 'Limoncello', 'Limoncello', 4),
        bevanda(DOPO, 'Grappa bianca', 'White grappa', 4, { prezzoDa: true }),
        bevanda(DOPO, 'Grappa barricata', 'Barrique grappa', 5, { prezzoDa: true }),
        bevanda(DOPO, 'Amaretto Disaronno', 'Amaretto Disaronno', 5),
      ],
    },
    {
      id: 'pane',
      titolo: { it: 'Pane', en: 'Bread' },
      piatti: [
        p('Pane fatto in casa', 'Tre tipi, a persona', 'Homemade bread, three kinds, per person', [1], 2.5),
        p('Refill del pane', '', 'Bread refill', [1], 4),
      ],
    },
  ],
} as const satisfies Menu;

/** L'aperitivo: «ENEA_Menu_Cocktail_Tapas_Aperitivo», pagina 2, del 28/09/2026. */
export const menuAperitivo = {
  servizio: { it: 'Aperitivo', en: 'Aperitivo' },
  sezioni: [
    {
      id: 'aperitivo-enea',
      titolo: { it: 'Aperitivo ENEA', en: 'Aperitivo ENEA' },
      piatti: [
        {
          nome: { it: 'Aperitivo ENEA', en: 'Aperitivo ENEA' },
          descrizione: {
            it: 'Una consumazione e una selezione di tre aperitivi dello chef',
            en: 'One drink and a selection of three of the chef’s appetizers',
          },
          allergeni: [],
          allergeniVariabili: true,
          prezzo: 15,
        },
      ],
    },
    {
      id: 'sfizi',
      titolo: { it: 'I nostri sfizi', en: 'Small plates' },
      piatti: [
        {
          nome: {
            it: 'Avocado toast con salmone marinato artigianalmente, rucola e panna acida',
            en: 'Avocado toast with house-marinated salmon, rocket and sour cream',
          },
          allergeni: [1, 3, 4, 6, 7],
          prezzo: 16,
        },
        {
          nome: { it: 'Pan brioche, stracciata e alici del Canale di Sicilia', en: 'Toasted pan brioche, stracciata, Sicilian anchovies' },
          allergeni: [1, 3, 4, 6, 7],
          prezzo: 12,
        },
        {
          nome: {
            it: 'Pan brioche, stracciata, pomodoro confit e crema di basilico',
            en: 'Toasted pan brioche with stracciata, confit tomato and basil cream',
          },
          allergeni: [1, 3, 6, 7],
          prezzo: 10,
        },
        {
          nome: { it: 'Alici fritte e maionese al mojito', en: 'Deep-fried anchovies with mojito mayonnaise' },
          allergeni: [1, 3, 4, 6],
          prezzo: 10,
          segno: 'casa',
        },
        {
          nome: { it: 'Straccetti di pollo panati con salsa ENEA', en: 'Deep-fried chicken strips with ENEA sauce' },
          allergeni: [1, 3, 6, 7, 10],
          prezzo: 9,
          segno: 'casa',
        },
        { nome: { it: 'Tartare di manzo', en: 'Beef tartare' }, allergeni: [6], prezzo: 10, segno: 'casa' },
        { nome: { it: 'Tartare di salmone', en: 'Salmon tartare' }, allergeni: [4, 8], prezzo: 11, segno: 'crudo' },
      ],
    },
    {
      id: 'taglieri',
      titolo: { it: 'Taglieri', en: 'Boards' },
      piatti: [
        { nome: { it: 'Selezione di salumi e formaggi', en: 'Selection of local cured meats and cheeses' }, allergeni: [7], prezzo: 18 },
        { nome: { it: 'Selezione di salumi', en: 'Selection of thinly sliced local cured meats' }, allergeni: [], prezzo: 15 },
        { nome: { it: 'Selezione di formaggi', en: 'Selection of local cheeses' }, allergeni: [7], prezzo: 15 },
      ],
    },
  ],
} as const satisfies Menu;

/**
 * La carta dei cocktail «La Dolce Vita»: stesso PDF, pagina 1. Gli ingredienti
 * il titolare li scrive in inglese anche sul menu italiano: in inglese restano
 * i suoi (corretti i refusi evidenti, come «pinapple» e «Gin0%»), in italiano
 * sono tradotti parola per parola. Solfiti (12) dove c'è vino: prosecco, vermouth.
 */
const c = (nome: string, it: string, en: string, prezzo: number, allergeni: number[] = []): Piatto => ({
  nome: { it: nome, en: nome },
  descrizione: { it, en },
  allergeni,
  prezzo,
});

export const menuCocktail = {
  servizio: { it: 'Cocktail', en: 'Cocktails' },
  stagione: { it: 'La Dolce Vita', en: 'La Dolce Vita' },
  sezioni: [
    {
      id: 'signature',
      titolo: { it: 'Signature', en: 'Signature' },
      piatti: [
        c('Enea Spritz', 'Prosecco, bergamotto, cordiale mediterraneo fatto in casa', 'Prosecco, bergamot, homemade Mediterranean cordial', 14, [12]),
        c('Dolce Vita', 'Gin, Aperol, frutto della passione, succo d’ananas, ibisco, succo di limone', 'Gin, Aperol, passion fruit, pineapple juice, hibiscus, lemon juice', 13),
        c('Negroni di Bosco', 'Gin, Campari, vermouth, chiarificato con yogurt ai frutti di bosco di stagione, sale', 'Gin, Campari, vermouth, clarified with seasonal mixed-berry yogurt, salt', 13, [7, 12]),
        c('Cubita', 'Rum, Campari, frutto della passione, succo di lime', 'Rum, Campari, passion fruit, lime juice', 13),
        c('Ambasciatore', 'Campari, vermouth, amaro alle arance di Sicilia', 'Campari, vermouth, Sicilian orange amaro', 14, [12]),
        c('Spicy A-Roma', 'Tequila, liquore ai fiori di sambuco, agave, mango piccante, soda al mandarino e bergamotto, succo di lime', 'Tequila, elderflower liqueur, agave, spicy mango, mandarin-bergamot soda, lime juice', 13),
        c('Espresso Martini', 'Vodka, Frangelico, Baileys, Kahlúa, espresso', 'Vodka, Frangelico, Baileys, Kahlúa, espresso', 13, [5, 7, 8]),
        c('Smoked Old Fashioned Bourbon', 'Bourbon, agave aromatizzata, Angostura', 'Bourbon, infused agave, Angostura', 13),
        c('Smoked Old Fashioned Mezcal', 'Mezcal, agave aromatizzata, Angostura', 'Mezcal, infused agave, Angostura', 14),
        c('Martini al Parmigiano', 'Gin o vodka, vermouth, Parmigiano 24 mesi, cordiale fatto in casa', 'Gin or vodka, vermouth, 24-month Parmigiano, homemade cordial', 14, [7, 12]),
      ],
    },
    {
      id: 'classici',
      titolo: { it: 'I grandi classici', en: 'The great classics' },
      piatti: [
        {
          nome: { it: 'I grandi classici della miscelazione', en: 'All the great classic cocktails' },
          allergeni: [],
          allergeniVariabili: true,
          prezzo: 12,
          prezzoDa: true,
        },
      ],
    },
    {
      id: 'zero-alcol',
      titolo: { it: 'Zero alcol', en: 'Zero alcohol' },
      piatti: [
        c('Giardino degli aranci', 'Gin 0%, cordiale di agrumi, soda al pompelmo', 'Gin 0%, citrus cordial, grapefruit soda', 10),
        c('Il Borghese', 'Gin 0%, bitter 0%, bitter fatto in casa, cordiale', 'Gin 0%, bitter 0%, homemade bitter, cordial', 11),
      ],
    },
  ],
  note: {
    it: ['Per preferenze o richieste particolari, il nostro staff sarà lieto di creare il drink più adatto a voi.'],
    en: ['For any preferences or special requests, our staff will be happy to create the perfect drink for you.'],
  },
} as const satisfies Menu;

/**
 * La carta dei vini — «Carta dei vini ENEA», PDF del titolare del 09/10/2026 (brand/menu/).
 * Prezzi a bottiglia. Sezioni e regioni come sulla carta; nella descrizione produttore, uve e
 * gradazione. Corretti solo i refusi evidenti (spazi mancanti, «Cuvèe», «Rosè»). Due etichette
 * non hanno il prezzo nella carta: restano nei dati senza prezzo e quindi non si pubblicano.
 * Il Bellavista ha la gradazione «da verificare»: esce senza. Il vino contiene sempre solfiti:
 * una nota sola in fondo invece del 12 ripetuto su 92 righe.
 */
const R = (it: string, en: string) => ({ it, en });
const vino = (gruppo: Piatto['gruppo'], nome: string, it: string, en: string, prezzo: number | undefined): Piatto => ({
  nome: { it: nome, en: nome },
  descrizione: { it, en },
  allergeni: [],
  ...(prezzo === undefined ? {} : { prezzo }),
  ...(gruppo ? { gruppo } : {}),
});

export const menuVini = {
  servizio: { it: 'Vini', en: 'Wines' },
  sezioni: [
    {
      id: 'bollicine',
      titolo: { it: 'Bollicine', en: 'Sparkling' },
      piatti: [
        vino(R('Lombardia', 'Lombardy'), 'Franciacorta Essence Rosé Millesimato', 'Antica Fratta · Chardonnay, Pinot Nero · 12,5%', 'Antica Fratta · Chardonnay, Pinot Nero · 12.5%', 60),
        vino(R('Lombardia', 'Lombardy'), 'Franciacorta Cuvée Real Brut', 'Antica Fratta · Chardonnay, Pinot Nero · 12%', 'Antica Fratta · Chardonnay, Pinot Nero · 12%', 58),
        vino(R('Lombardia', 'Lombardy'), 'Franciacorta Extra Brut Alma Assemblage', 'Bellavista · Chardonnay, Pinot Nero', 'Bellavista · Chardonnay, Pinot Nero', 85),
        vino(R('Trentino', 'Trentino'), 'Trento DOC Millesimato Brut 2022', 'Altemasi · Chardonnay · 12,5%', 'Altemasi · Chardonnay · 12.5%', 42),
        vino(R('Champagne', 'Champagne'), 'Brut R.018', 'Lallier · Pinot Nero, Pinot Meunier · 12,5%', 'Lallier · Pinot Nero, Pinot Meunier · 12.5%', 75),
        vino(R('Champagne', 'Champagne'), 'Extra Brut Grand Cru Blanc de Noir S.A.', 'Georges Vesselle · Pinot Nero · 12%', 'Georges Vesselle · Pinot Nero · 12%', 125),
        vino(R('Champagne', 'Champagne'), 'Extra Brut Grand Cru Blanc de Blanc S.A.', 'Georges Vesselle · Chardonnay · 12%', 'Georges Vesselle · Chardonnay · 12%', 136),
        vino(R('Veneto', 'Veneto'), 'Valdobbiadene Prosecco Superiore DOCG Extra Dry S.A.', 'Gemin · Glera · 11%', 'Gemin · Glera · 11%', 28),
      ],
    },
    {
      id: 'bianchi',
      titolo: { it: 'Vini bianchi', en: 'White wines' },
      piatti: [
        vino(R('Lazio', 'Lazio'), 'Tellenae 2025', 'Manfredi Stramacci · Malvasia Puntinata · 13%', 'Manfredi Stramacci · Malvasia Puntinata · 13%', 29),
        vino(R('Lazio', 'Lazio'), 'Tellenae 2023', 'Manfredi Stramacci · Malvasia Puntinata · 13%', 'Manfredi Stramacci · Malvasia Puntinata · 13%', 36),
        vino(R('Lazio', 'Lazio'), 'Tellenae 2021', 'Manfredi Stramacci · Malvasia Puntinata · 13%', 'Manfredi Stramacci · Malvasia Puntinata · 13%', 45),
        vino(R('Lazio', 'Lazio'), 'Breza Marina Vivace', 'Casa Divina Provvidenza · Trebbiano Giallo, Chardonnay · 12,5%', 'Casa Divina Provvidenza · Trebbiano Giallo, Chardonnay · 12.5%', 25),
        vino(R('Lazio', 'Lazio'), 'Donnaluce', 'Poggio le Volpi · Chardonnay, Greco, Malvasia del Lazio · 13%', 'Poggio le Volpi · Chardonnay, Greco, Malvasia del Lazio · 13%', 45),
        vino(R('Lazio', 'Lazio'), 'Neroniano', 'Casa Divina Provvidenza · Cacchione · 14%', 'Casa Divina Provvidenza · Cacchione · 14%', 29),
        vino(R('Lazio', 'Lazio'), 'Poggio della Costa 2024', 'Sergio Mottura · Grechetto · 14%', 'Sergio Mottura · Grechetto · 14%', 34),
        vino(R('Lazio', 'Lazio'), 'La Torre a Civitella 2023', 'Sergio Mottura · Grechetto · 13,5%', 'Sergio Mottura · Grechetto · 13.5%', 48),
        vino(R('Lazio', 'Lazio'), 'Frascati Superiore', 'Ferri · Malvasia del Lazio, Bombino · 13,5%', 'Ferri · Malvasia del Lazio, Bombino · 13.5%', 25),
        vino(R('Valle d’Aosta', 'Aosta Valley'), 'Chambave Muscat 2016', 'Le Vrille · Moscato bianco (Muscat petit grain) · 13,5%', 'Le Vrille · Moscato bianco (Muscat petit grain) · 13.5%', 38),
        vino(R('Valle d’Aosta', 'Aosta Valley'), 'Petit Arvine 2016', 'Le Vrille · Petite Arvine · 13,5%', 'Le Vrille · Petite Arvine · 13.5%', 38),
        vino(R('Piemonte', 'Piedmont'), 'Gavi di Gavi', 'Marrone · Cortese · 13%', 'Marrone · Cortese · 13%', 40),
        vino(R('Piemonte', 'Piedmont'), 'Arneis «Tre Fie»', 'Marrone · Arneis · 13%', 'Marrone · Arneis · 13%', 36),
        vino(R('Piemonte', 'Piedmont'), 'Derthona Timorasso', 'Cantina di Tortona · Timorasso · 14%', 'Cantina di Tortona · Timorasso · 14%', 38),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Gewürztraminer', 'Elena Walch · Gewürztraminer · 14%', 'Elena Walch · Gewürztraminer · 14%', 52),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Müller-Thurgau', 'Ritterhof · Müller-Thurgau · 12%', 'Ritterhof · Müller-Thurgau · 12%', 29),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Pinot Grigio Trentino DOC', 'Cantina D’Isera · Pinot Grigio · 12,5%', 'Cantina D’Isera · Pinot Grigio · 12.5%', 35),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Chardonnay Selezione Cadalora 2023', 'La Cadalora · Chardonnay · 13,5%', 'La Cadalora · Chardonnay · 13.5%', 39),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Sauvignon 2024', 'La Cadalora · Sauvignon · 13,5%', 'La Cadalora · Sauvignon · 13.5%', 31),
        vino(R('Liguria', 'Liguria'), 'Pigato Riviera Ligure di Ponente 2025', 'Maixei · Pigato · 12,5%', 'Maixei · Pigato · 12.5%', 32),
        vino(R('Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'), 'Sauvignon', 'Tiare · Sauvignon · 13,5%', 'Tiare · Sauvignon · 13.5%', 49),
        vino(R('Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'), 'Ribolla Gialla', 'Tiare · Ribolla Gialla · 13%', 'Tiare · Ribolla Gialla · 13%', 45),
        vino(R('Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'), 'Pinot Grigio Masseré Ramato', 'Tiare · Pinot Grigio · 13%', 'Tiare · Pinot Grigio · 13%', 45),
        vino(R('Toscana', 'Tuscany'), 'Ansonica Costa Argentario DOC', 'Poggio Maestrino · Ansonica · 12%', 'Poggio Maestrino · Ansonica · 12%', 28),
        vino(R('Toscana', 'Tuscany'), 'Chardonnay Molino delle Balze', 'Rocca di Castagnoli · Chardonnay · 13%', 'Rocca di Castagnoli · Chardonnay · 13%', 40),
        vino(R('Umbria', 'Umbria'), 'Malafemmena Bianco Frizzante Ancestrale', 'Di Filippo · Grechetto · 12,5%', 'Di Filippo · Grechetto · 12.5%', 29),
        vino(R('Umbria', 'Umbria'), 'Farandola Trebbiano Spoletino', 'Di Filippo · Trebbiano Spoletino · 13,5%', 'Di Filippo · Trebbiano Spoletino · 13.5%', 34),
        vino(R('Marche', 'Marche'), 'Verdicchio di Matelica Vigneto Fogliano 2022', 'Bisci · Verdicchio · 13,5%', 'Bisci · Verdicchio · 13.5%', 45),
        vino(R('Marche', 'Marche'), 'Campodarchi Argento, Bianchello del Metauro DOC Superiore', 'Terracruda · Bianchello del Metauro · 14%', 'Terracruda · Bianchello del Metauro · 14%', 29),
        vino(R('Abruzzo', 'Abruzzo'), 'Pecorino d\'Abruzzo Bianchi Grilli 2023', 'Torre dei Beati · Pecorino · 14%', 'Torre dei Beati · Pecorino · 14%', 35),
        vino(R('Abruzzo', 'Abruzzo'), 'Trebbiano d\'Abruzzo Bianchi Grilli 2023', 'Torre dei Beati · Trebbiano Abruzzese · 13%', 'Torre dei Beati · Trebbiano Abruzzese · 13%', 36),
        vino(R('Campania', 'Campania'), 'Velluto Bianco Irpinia Falanghina DOC', 'Nativ · Falanghina · 13%', 'Nativ · Falanghina · 13%', 28),
        vino(R('Campania', 'Campania'), 'Fiano di Avellino Sequenzha 2024', 'Benito Ferrara · Fiano · 13,5%', 'Benito Ferrara · Fiano · 13.5%', 35),
        vino(R('Campania', 'Campania'), 'Greco di Tufo Vigna Cicogna 2024', 'Benito Ferrara · Greco · 14%', 'Benito Ferrara · Greco · 14%', 45),
        vino(R('Sicilia', 'Sicily'), 'Etna Bianco DOC Terre dei Miti', 'Tenute Nicosia · Carricante, Catarratto · 12,5%', 'Tenute Nicosia · Carricante, Catarratto · 12.5%', 35),
        vino(R('Sicilia', 'Sicily'), 'Grillo DOP HYBLA', 'Tenute Nicosia · Grillo · 13,5%', 'Tenute Nicosia · Grillo · 13.5%', 26),
        vino(R('Sicilia', 'Sicily'), 'Zibibbo Secco Bio DOC Sicilia', 'Tenute Mokarta · Zibibbo · 12,5%', 'Tenute Mokarta · Zibibbo · 12.5%', 28),
        vino(R('Sardegna', 'Sardinia'), 'Vermentino di Sardegna Cala Silente 2024', 'Santadi · Vermentino · 13,5%', 'Santadi · Vermentino · 13.5%', 27),
        vino(R('Sardegna', 'Sardinia'), 'Villa di Chiesa 2024', 'Santadi · Vermentino, Chardonnay · 14%', 'Santadi · Vermentino, Chardonnay · 14%', 47),
        vino(R('Francia', 'France'), 'Chablis', 'Thierry Mothe · Chardonnay · 12,5%', 'Thierry Mothe · Chardonnay · 12.5%', 70),
        vino(R('Germania', 'Germany'), 'Riesling Gutswein', 'Georg Fußer · Riesling · 12%', 'Georg Fußer · Riesling · 12%', 48),
      ],
    },
    {
      id: 'rosati',
      titolo: { it: 'Vini rosati', en: 'Rosé wines' },
      piatti: [
        vino(R('Lazio', 'Lazio'), 'Divina Aeris', 'Divina Provvidenza · Pinot Nero · 13%', 'Divina Provvidenza · Pinot Nero · 13%', 32),
        vino(R('Piemonte', 'Piedmont'), 'Dolcevita Rosato', 'Marrone · Nebbiolo, Barbera · 14,5%', 'Marrone · Nebbiolo, Barbera · 14.5%', 32),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Pinot Nero Rosé Buontempo', 'La Cadalora · Pinot Nero · 13%', 'La Cadalora · Pinot Nero · 13%', 28),
        vino(R('Abruzzo', 'Abruzzo'), 'Cerasuolo Rosa-ae 2022', 'Torre dei Beati · Pecorino · 12,5%', 'Torre dei Beati · Pecorino · 12.5%', 27),
        vino(R('Sicilia', 'Sicily'), 'Vinudilice 2024', 'I Vigneti Salvo Foti · Grenache, Minnella Nera, Grecanico, Minnella Bianca e altre uve · 12%', 'I Vigneti Salvo Foti · Grenache, Minnella Nera, Grecanico, Minnella Bianca e altre uve · 12%', 70),
      ],
    },
    {
      id: 'rossi',
      titolo: { it: 'Vini rossi', en: 'Red wines' },
      piatti: [
        vino(R('Lazio', 'Lazio'), 'Baccarossa 2019', 'Poggio Le Volpi · Nero Buono · 13,5%', 'Poggio Le Volpi · Nero Buono · 13.5%', 58),
        vino(R('Lazio', 'Lazio'), 'Roma Rosso', 'La Rasenna · Montepulciano, Sangiovese · 14%', 'La Rasenna · Montepulciano, Sangiovese · 14%', 29),
        vino(R('Lazio', 'Lazio'), 'Cesanese', 'Casa Divina Provvidenza · Cesanese · 13,5%', 'Casa Divina Provvidenza · Cesanese · 13.5%', 29),
        vino(R('Lazio', 'Lazio'), 'Cesanese del Piglio Superiore Riserva Lepanto 2021', 'Alberto Giacobbe · Cesanese · 14,5%', 'Alberto Giacobbe · Cesanese · 14.5%', 45),
        vino(R('Lazio', 'Lazio'), 'Magone 2019', 'Sergio Mottura · Pinot Nero · 13%', 'Sergio Mottura · Pinot Nero · 13%', 60),
        vino(R('Piemonte', 'Piedmont'), 'Vessillo Barbera', 'Cantina di Tortona · Barbera · 14,5%', 'Cantina di Tortona · Barbera · 14.5%', 75),
        vino(R('Piemonte', 'Piedmont'), 'Barbera d’Asti Superiore «Ad Libitvm» DOCG', 'Carlin de Paolo · Barbera · 14,5%', 'Carlin de Paolo · Barbera · 14.5%', 27),
        vino(R('Piemonte', 'Piedmont'), 'Barolo 2021', 'Diego Conterno · Nebbiolo · 14,5%', 'Diego Conterno · Nebbiolo · 14.5%', 70),
        vino(R('Piemonte', 'Piedmont'), 'Barolo Le Coste di Monforte 2020', 'Diego Conterno · Nebbiolo · 14,5%', 'Diego Conterno · Nebbiolo · 14.5%', 110),
        vino(R('Piemonte', 'Piedmont'), 'Nebbiolo Langhe IL 2024', 'Virna Borgogno · Nebbiolo · 14,5%', 'Virna Borgogno · Nebbiolo · 14.5%', 34),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Lagrein', 'Tramin · Lagrein · 12,5%', 'Tramin · Lagrein · 12.5%', 29),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Pinot Nero Jansen', 'Ritterhof · Pinot Nero · 13,5%', 'Ritterhof · Pinot Nero · 13.5%', 36),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'Teroldego Rotaliano 2024', 'Zeni · Teroldego · 13,5%', 'Zeni · Teroldego · 13.5%', 32),
        vino(R('Trentino-Alto Adige', 'Trentino-Alto Adige'), 'St. Magdalener Classico Isarcus 2022', 'Griesbauerhof · Schiava · 13,5%', 'Griesbauerhof · Schiava · 13.5%', 42),
        vino(R('Lombardia', 'Lombardy'), 'Valtellina Superiore Grumello Tell 2021', 'Luca Faccinelli · Nebbiolo (Chiavennasca), Rossola, Pignola · 13%', 'Luca Faccinelli · Nebbiolo (Chiavennasca), Rossola, Pignola · 13%', 45),
        vino(R('Veneto', 'Veneto'), 'Valpolicella Classico Superiore Figari 2022', 'Villa Spinosa · Corvina, Corvinone, Rondinella · 13,5%', 'Villa Spinosa · Corvina, Corvinone, Rondinella · 13.5%', 34),
        vino(R('Veneto', 'Veneto'), 'Amarone della Valpolicella 2017', 'Masi · Corvina, Molinara, Rondinella · 16%', 'Masi · Corvina, Molinara, Rondinella · 16%', 105),
        vino(R('Veneto', 'Veneto'), 'Valpolicella Ripasso Campotorbian', 'Provolo · Corvina, Corvinone, Rondinella, Oseleta · 14,5%', 'Provolo · Corvina, Corvinone, Rondinella, Oseleta · 14.5%', 48),
        vino(R('Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'), 'Cabernet Sauvignon', 'Tiare · Cabernet Sauvignon · 13%', 'Tiare · Cabernet Sauvignon · 13%', 40),
        vino(R('Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'), 'Pinot Nero', 'Tiare · Pinot Nero · 13,5%', 'Tiare · Pinot Nero · 13.5%', 38),
        vino(R('Friuli-Venezia Giulia', 'Friuli-Venezia Giulia'), 'Cabernet', 'Tenuta del Morer · Cabernet · 13%', 'Tenuta del Morer · Cabernet · 13%', 25),
        vino(R('Toscana', 'Tuscany'), 'Nobile di Montepulciano «Signore del Greppo» 2023', 'Vannutelli · Sangiovese (Prugnolo Gentile) · 13,5%', 'Vannutelli · Sangiovese (Prugnolo Gentile) · 13.5%', 55),
        vino(R('Toscana', 'Tuscany'), 'Nobile di Montepulciano «Signore del Greppo» 2022', 'Vannutelli · Sangiovese (Prugnolo Gentile) · 13,5%', 'Vannutelli · Sangiovese (Prugnolo Gentile) · 13.5%', 65),
        vino(R('Toscana', 'Tuscany'), 'Nobile di Montepulciano «Signore del Greppo» 2021', 'Vannutelli · Sangiovese (Prugnolo Gentile) · 13,5%', 'Vannutelli · Sangiovese (Prugnolo Gentile) · 13.5%', 75),
        vino(R('Toscana', 'Tuscany'), 'Chianti Classico Riserva Poggio a\' Frati', 'Rocca di Castagnoli · Sangiovese, Canaiolo · 14%', 'Rocca di Castagnoli · Sangiovese, Canaiolo · 14%', 56),
        vino(R('Toscana', 'Tuscany'), 'Chianti Classico 2022', 'Le Masse di Lamole · Sangiovese · 13,5%', 'Le Masse di Lamole · Sangiovese · 13.5%', 36),
        vino(R('Toscana', 'Tuscany'), 'Rosso di Montalcino 2021', 'Terre Nere · Sangiovese · 14%', 'Terre Nere · Sangiovese · 14%', 33),
        vino(R('Umbria', 'Umbria'), 'Montefalco Rosso Riserva 2018', 'Adanti · Merlot, Sagrantino, Sangiovese · 13%', 'Adanti · Merlot, Sagrantino, Sangiovese · 13%', 35),
        vino(R('Umbria', 'Umbria'), 'Montefalco Sagrantino Arquata 2016', 'Adanti · Sagrantino · 15%', 'Adanti · Sagrantino · 15%', 40),
        vino(R('Abruzzo', 'Abruzzo'), 'Montepulciano d’Abruzzo «Notàri»', 'Nicodemi · Montepulciano · 13%', 'Nicodemi · Montepulciano · 13%', 45),
        vino(R('Campania', 'Campania'), 'Taurasi Vigna Quattro Confini 2021', 'Benito Ferrara · Aglianico · 13,5%', 'Benito Ferrara · Aglianico · 13.5%', 60),
        vino(R('Puglia', 'Apulia'), 'Cacc\'e Mmitte di Lucera Agramante 2019', 'Paolo Petrilli · Nero di Troia, Montepulciano, Sangiovese, Bombino · 12,5%', 'Paolo Petrilli · Nero di Troia, Montepulciano, Sangiovese, Bombino · 12.5%', 28),
        vino(R('Puglia', 'Apulia'), 'Negroamaro Salento 125 2023', 'Feudi Salentini · Negroamaro · 12,5%', 'Feudi Salentini · Negroamaro · 12.5%', undefined),  // senza prezzo nel PDF del 09/10: non si pubblica
        vino(R('Puglia', 'Apulia'), 'Primitivo di Manduria Felline DOP', 'Felline · Primitivo · 14%', 'Felline · Primitivo · 14%', 32),
        vino(R('Sicilia', 'Sicily'), 'Cerasuolo di Vittoria DOCG', 'Tenute Nicosia · Nero D’Avola, Frappato · 14%', 'Tenute Nicosia · Nero D’Avola, Frappato · 14%', 32),
        vino(R('Sicilia', 'Sicily'), 'Etna Rosso Terre dei Miti', 'Tenute Nicosia · Nerello Mascalese, Nerello Cappuccio · 13%', 'Tenute Nicosia · Nerello Mascalese, Nerello Cappuccio · 13%', 36),
        vino(R('Sicilia', 'Sicily'), 'Etna Rosso Riserva Saeculare 2024', 'I Custodi delle vigne dell’Etna · Nerello Mascalese, Nerello Cappuccio, Alicante · 14%', 'I Custodi delle vigne dell’Etna · Nerello Mascalese, Nerello Cappuccio, Alicante · 14%', 120),
        vino(R('Sardegna', 'Sardinia'), 'Carignano del Sulcis Riserva Rocca Rubra', 'Santadi · Carignano · 15%', 'Santadi · Carignano · 15%', 36),
        vino(R('Sardegna', 'Sardinia'), 'Carignano del Sulcis Riserva Terre Brune', 'Santadi · Carignano, Bovaleddu · 15%', 'Santadi · Carignano, Bovaleddu · 15%', 95),
        vino(R('Francia', 'France'), 'Bourgogne Pinot Noir', 'Chanson · Pinot Noir', 'Chanson · Pinot Noir', undefined),  // senza prezzo nel PDF del 09/10: non si pubblica
      ],
    },
  ],
  note: {
    it: ['Prezzi a bottiglia. Per un consiglio sull’abbinamento, chiedete al personale di sala.', 'Tutti i vini contengono anidride solforosa e solfiti (allergene 12, Regolamento UE 1169/2011).'],
    en: ['Prices per bottle. Ask our staff for a pairing suggestion.', 'All wines contain sulphites (allergen 12, EU Regulation 1169/2011).'],
  },
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
  '@id': `${url}#menu`,
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
  { n: 12, it: 'Anidride solforosa e solfiti', en: 'Sulphites' },
  { n: 13, it: 'Lupini', en: 'Lupin' },
  { n: 14, it: 'Molluschi', en: 'Molluscs' },
];
