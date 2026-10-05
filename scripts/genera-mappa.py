"""La mappa di «Dove siamo»: strade e verde di OpenStreetMap nello stile del sito, con le
stazioni della metro e la fermata del bus dove sono davvero.

Si rigenera solo se serve (`pnpm mappa`): scarica i dati una volta da Overpass (restano in
cache) e scrive due SVG in src/assets, uno 3:2 per tablet e computer e uno quadrato per il
telefono. Il disegno scala col riquadro; nomi e segni no: stanno in un livello sopra, in
pixel, ancorati agli stessi punti in percentuale, così si leggono a ogni larghezza. Lo script
li piazza misurando i testi col Cinzel del sito alla larghezza più stretta a cui ogni disegno
si vede, dove lo spazio è minimo: nessun nome ne copre un altro né esce dal riquadro. Ciò che
lì non sta (la fermata del bus, i nomi secondari) compare solo da una larghezza in su, come
nelle mappe vere quando si ingrandisce.

Niente servizi di mappe nel browser: niente cookie di terzi né richieste esterne, come
dichiarano le note legali. Dati © OpenStreetMap contributors (ODbL): l'attribuzione sta sotto.

Fonti, verificate il 05/10/2026: tempi a piedi da Google Maps (gli stessi della legenda in
MappaDove.astro), linee del bus dal GTFS di Roma Servizi per la Mobilità.
"""

import json
import math
import sys
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, replace
from functools import cache
from itertools import pairwise
from pathlib import Path

from fontTools.ttLib import TTFont

type Punto = tuple[float, float]
type Poligono = list[Punto]

# il segnaposto della scheda Google «Enea Roma», Via Boncompagni 83/85
ENEA = (41.9091979, 12.496061)
SITO = Path(__file__).resolve().parents[1]
ASSETS = SITO / "src/assets"
CINZEL = SITO / "node_modules/@fontsource/cinzel/files/cinzel-latin-400-normal.woff2"
SERVER_OVERPASS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)
# i dati scaricati restano qui: i ritocchi al disegno non riscaricano (--aggiorna per rifarlo)
CACHE = SITO / "node_modules/.cache/mappa-dove-osm.json"

# metro A: la stazione in OpenStreetMap e i minuti a piedi da ENEA (Google Maps)
METRO = (
    ("Barberini", (41.90381, 12.488617), 13),
    ("Repubblica", (41.902828, 12.496054), 14),
)
# la fermata Boncompagni/Piemonte (ATAC 73619) e le sue linee di giorno, dal GTFS
BUS = ((41.90841, 12.494052), "63 · 83")
# le vie con un nome sulla mappa: nome in OpenStreetMap, testo, dove lo si preferisce
VIE = {
    "Via Vittorio Veneto": ("Via Veneto", (41.9083, 12.4893)),
    "Via Boncompagni": ("Via Boncompagni", (41.9083, 12.4925)),
    "Via Venti Settembre": ("Via XX Settembre", (41.9070, 12.4985)),
    "Corso d'Italia": ("Corso d’Italia", (41.9108, 12.4935)),
}
# luoghi: il punto del nome; Villa Borghese va dentro il parco, il più vicino possibile a lì
LUOGHI = {
    "Villa Borghese": (41.9106, 12.4878),
    "Porta Pia": (41.9093, 12.5013),
    "Piazza Fiume": (41.9107, 12.4982),
}

CLASSI = {
    "trunk": "s1",
    "primary": "s1",
    "secondary": "s1",
    "tertiary": "s2",
    "residential": "s3",
    "unclassified": "s3",
    "living_street": "s3",
    "pedestrian": "s4",
    "service": "s5",
}
# spessore delle evidenze in unità del disegno: come in MappaDove.astro (.evidenza, .evidenza-veneto)
EVIDENZE = {"Via Boncompagni": 7.0, "Via Vittorio Veneto": 8.0}

# i segni, in pixel sullo schermo
ALONE = 22  # raggio dell'alone del segnaposto
LATO_M = 18  # il quadrato della metro
LATO_BUS = 16
ARIA = 4  # margine libero fra due segni e dentro il bordo
SPESSORE_ALONE = 3.5  # il contorno scuro dei nomi (CSS: stroke-width)


@dataclass(frozen=True)
class Quadro:
    """Un'inquadratura. Il disegno è W×H unità; dentro deve stare tutto `limiti` (ovest, nord,
    est, sud, in metri da ENEA); `px_min` e `px_max` sono le larghezze fra cui il sito lo mostra."""

    file: str
    variante: str
    W: int
    H: int
    limiti: tuple[float, float, float, float]
    px_min: float
    px_max: float
    corpo: float  # px dei nomi delle vie: gli altri testi in proporzione (STILI)
    vie: tuple[
        str, ...
    ]  # in ordine di importanza: le prime due ci sono a ogni larghezza
    luoghi: tuple[str, ...]
    con_bus: bool

    @property
    def m_per_unita(self) -> float:
        o, n, e, s = self.limiti
        return max((e - o) / self.W, (s - n) / self.H)

    @property
    def centro(self) -> Punto:
        o, n, e, s = self.limiti
        return (o + e) / 2, (n + s) / 2

    def soglie(self) -> list[float]:
        """Le larghezze a cui un segno può comparire: la minima, poi a passi."""
        passo = (self.px_max - self.px_min) / 6
        return [round(self.px_min + passo * i) for i in range(7)]


QUADRI = (
    # 3:2 da 576 px (tablet) a 921 (tablet largo); sul computer sta accanto alla legenda (556-758):
    # le larghezze minime tengono conto del bordo di 1 px
    Quadro(
        "mappa-dove.svg",
        "larga",
        1500,
        1000,
        (-1010, -250, 625, 840),
        px_min=550,
        px_max=921,
        corpo=10.5,
        vie=(
            "Via Vittorio Veneto",
            "Via Boncompagni",
            "Via Venti Settembre",
            "Corso d'Italia",
        ),
        luoghi=("Villa Borghese", "Porta Pia", "Piazza Fiume"),
        con_bus=True,
    ),
    # 4:5 da 277 px (telefono da 320) a 575: in verticale come la zona, da ENEA alle stazioni
    Quadro(
        "mappa-dove-telefono.svg",
        "telefono",
        800,
        1000,
        (-690, -150, 94, 830),
        px_min=275,
        px_max=575,
        corpo=10.5,
        vie=("Via Vittorio Veneto", "Via Boncompagni"),
        luoghi=("Villa Borghese",),
        con_bus=True,
    ),
)

# classe: (corpo rispetto a quello delle vie, spaziatura in em) — il colore sta nel CSS
STILI = {
    "nome": (1.0, 0.14),
    "nome forte": (1.18, 0.14),
    "luogo": (1.0, 0.2),
    "metro-nome": (1.0, 0.08),
    "bus-linee": (1.0, 0.04),
    "insegna": (1.45, 0.3),
}


# ── dati ────────────────────────────────────────────────────────────────────────────────


def metri(lat: float, lon: float) -> Punto:
    """Posizione rispetto a ENEA in metri: x verso est, y verso sud."""
    x = (lon - ENEA[1]) * math.cos(math.radians(ENEA[0])) * 111320
    y = (ENEA[0] - lat) * 110540
    return x, y


def proiettore(q: Quadro) -> Callable[[float, float], Punto]:
    cx, cy = q.centro

    def p(lat: float, lon: float) -> Punto:
        x, y = metri(lat, lon)
        return q.W / 2 + (x - cx) / q.m_per_unita, q.H / 2 + (y - cy) / q.m_per_unita

    return p


def scarica() -> dict:
    m = 700  # margine attorno alle inquadrature, in metri: le linee escono pulite dai bordi
    ovest = min(q.limiti[0] for q in QUADRI) - m
    nord = min(q.limiti[1] for q in QUADRI) - m
    est = max(q.limiti[2] for q in QUADRI) + m
    sud = max(q.limiti[3] for q in QUADRI) + m
    gradi_lon = 111320 * math.cos(math.radians(ENEA[0]))
    bbox = (
        f"{ENEA[0] - sud / 110540},{ENEA[1] + ovest / gradi_lon},"
        f"{ENEA[0] - nord / 110540},{ENEA[1] + est / gradi_lon}"
    )
    q = f"""[out:json][timeout:90];
(
  way["highway"~"^({"|".join(CLASSI)})$"]({bbox});
  way["leisure"="park"]({bbox});
  relation["leisure"="park"]({bbox});
  way["historic"="citywalls"]({bbox});
  way["barrier"="city_wall"]({bbox});
);
out geom;"""
    # il server principale è spesso pieno (504): si prova il successivo
    ultimo = None
    for server in SERVER_OVERPASS:
        req = urllib.request.Request(
            server,
            data=urllib.parse.urlencode({"data": q}).encode(),
            headers={"User-Agent": "ENEA-Roma-sito/1.0 (enearoma.it)"},
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r)
        except OSError as e:
            ultimo = e
            print(f"{server}: {e}")
    raise RuntimeError("nessun server Overpass disponibile") from ultimo


# ── geometria ───────────────────────────────────────────────────────────────────────────


def semplifica(punti: list[Punto], tolleranza: float = 0.6) -> list[Punto]:
    """Douglas-Peucker: toglie i vertici che non cambiano il disegno di oltre mezza unità."""
    if len(punti) < 3:
        return punti
    (x1, y1), (x2, y2) = punti[0], punti[-1]
    dx, dy = x2 - x1, y2 - y1
    lung = math.hypot(dx, dy) or 1e-9
    distanze = [abs(dy * x - dx * y + x2 * y1 - y2 * x1) / lung for x, y in punti[1:-1]]
    i = max(range(len(distanze)), key=distanze.__getitem__)
    if distanze[i] <= tolleranza:
        return [punti[0], punti[-1]]
    return semplifica(punti[: i + 2], tolleranza)[:-1] + semplifica(
        punti[i + 1 :], tolleranza
    )


def visibile(q: Quadro, punti: list[Punto], margine: float = 40) -> bool:
    return any(
        -margine <= x <= q.W + margine and -margine <= y <= q.H + margine
        for x, y in punti
    )


def d(punti: list[Punto], chiuso: bool = False) -> str:
    s = "M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in punti)
    return s + ("Z" if chiuso else "")


def catena(tratti: list[list[Punto]]) -> list[list[Punto]]:
    """Unisce i tratti che si toccano agli estremi (una via divisa agli incroci, l'anello di un parco)."""
    tratti = [list(t) for t in tratti]

    def vicino(a: Punto, b: Punto) -> bool:
        return math.dist(a, b) < 0.5

    uniti = True
    while uniti:
        uniti = False
        for i, a in enumerate(tratti):
            for j, b in enumerate(tratti):
                if i == j:
                    continue
                if vicino(a[-1], b[0]):
                    nuovo = a + b[1:]
                elif vicino(a[-1], b[-1]):
                    nuovo = a + b[::-1][1:]
                elif vicino(a[0], b[-1]):
                    nuovo = b + a[1:]
                elif vicino(a[0], b[0]):
                    nuovo = b[::-1] + a[1:]
                else:
                    continue
                tratti = [t for k, t in enumerate(tratti) if k not in (i, j)] + [nuovo]
                uniti = True
                break
            if uniti:
                break
    return tratti


def rettangolo(
    x0: float, y0: float, x1: float, y1: float, gradi: float = 0
) -> Poligono:
    """I quattro angoli di un rettangolo, ruotato attorno all'origine."""
    c, s = math.cos(math.radians(gradi)), math.sin(math.radians(gradi))
    return [
        (x * c - y * s, x * s + y * c)
        for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))
    ]


def si_toccano(a: Poligono, b: Poligono) -> bool:
    """Separating axis theorem su due poligoni convessi."""
    for poli in (a, b):
        for (x1, y1), (x2, y2) in zip(poli, poli[1:] + poli[:1]):
            nx, ny = y1 - y2, x2 - x1
            pa = [nx * x + ny * y for x, y in a]
            pb = [nx * x + ny * y for x, y in b]
            if max(pa) <= min(pb) or max(pb) <= min(pa):
                return False
    return True


def tratto_spesso(a: Punto, b: Punto, spessore: float) -> tuple[Punto, ...]:
    """Il rettangolo che copre un tratto di linea spessa."""
    (x1, y1), (x2, y2) = a, b
    lung = math.dist(a, b) or 1e-9
    ox, oy = -(y2 - y1) / lung * spessore / 2, (x2 - x1) / lung * spessore / 2
    return (
        (x1 + ox, y1 + oy),
        (x2 + ox, y2 + oy),
        (x2 - ox, y2 - oy),
        (x1 - ox, y1 - oy),
    )


def dentro_poligono(p: Punto, anello: list[Punto]) -> bool:
    x, y = p
    esito = False
    for (x1, y1), (x2, y2) in zip(anello, anello[1:] + anello[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            esito = not esito
    return esito


def lungo(pl: list[Punto]) -> list[float]:
    """Le distanze progressive lungo una polilinea."""
    cum = [0.0]
    for a, b in pairwise(pl):
        cum.append(cum[-1] + math.dist(a, b))
    return cum


def punto_a(pl: list[Punto], cum: list[float], s: float) -> tuple[Punto, int]:
    """Il punto a distanza s lungo la polilinea, e l'indice del tratto in cui cade."""
    for i in range(1, len(cum)):
        if cum[i] >= s:
            t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) or 1e-9)
            (x1, y1), (x2, y2) = pl[i - 1], pl[i]
            return (x1 + (x2 - x1) * t, y1 + (y2 - y1) * t), i
    return pl[-1], len(pl) - 1


# ── testi ───────────────────────────────────────────────────────────────────────────────


@cache
def avanzamenti() -> dict[int, float]:
    """La larghezza di ogni carattere del Cinzel, in em."""
    font = TTFont(CINZEL)
    upm = font["head"].unitsPerEm
    metriche = font["hmtx"].metrics
    return {cp: metriche[g][0] / upm for cp, g in font.getBestCmap().items()}


def misura(testo: str, classe: str, q: Quadro) -> tuple[float, float, float]:
    """Corpo, larghezza e altezza in px del testo in maiuscolo, alone compreso."""
    rel, spaziatura = STILI[classe]
    corpo = q.corpo * rel
    t = testo.upper()
    largo = sum(
        avanzamenti().get(ord(c), 0.6) for c in t
    ) * corpo + spaziatura * corpo * (len(t) - 1)
    return corpo, largo + SPESSORE_ALONE, 0.7 * corpo + SPESSORE_ALONE


def testo_svg(
    classe: str,
    testo: str,
    q: Quadro,
    ancora: str = "middle",
    x: float = 0,
    y: float = 0,
    ruota: float = 0,
) -> str:
    rel, spaziatura = STILI[classe]
    corpo = q.corpo * rel
    attr = f' transform="rotate({ruota:.1f})"' if ruota else ""
    attr += f' x="{x:g}"' if x else ""
    attr += f' y="{y:g}"' if y else ""
    # dy di .35em: le maiuscole (alte .7em) restano centrate sull'ancora
    return (
        f'<text class="{classe}" font-size="{corpo:g}" letter-spacing="{spaziatura * corpo:.2f}" '
        f'text-anchor="{ancora}" dy=".35em"{attr}>{testo}</text>'
    )


# ── il livello dei segni ────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Segno:
    """Un elemento sopra il disegno: ancorato a un punto del disegno, misurato in px."""

    x: float
    y: float
    sagoma: tuple[Punto, ...]  # il suo ingombro in px, attorno all'ancora
    svg: str
    da_px: float = 0  # la larghezza del riquadro da cui si vede
    via: str = ""  # la via che nomina: la sua evidenza non lo blocca
    sul_posto: bool = False  # un segno sul suo punto (segnaposto, stazioni): le evidenze non lo spostano

    def poligono(self, q: Quadro, px: float) -> Poligono:
        f = q.W / px
        return [(self.x + a * f, self.y + b * f) for a, b in self.sagoma]


@dataclass(frozen=True)
class Ostacolo:
    """Un pezzo del disegno che i nomi non devono coprire: scala col disegno."""

    poligono: tuple[Punto, ...]
    via: str


class Livello:
    def __init__(self, q: Quadro, ostacoli: list[Ostacolo]) -> None:
        self.q = q
        self.segni: list[Segno] = []
        self.ostacoli = ostacoli

    def intralcio(self, s: Segno) -> str | None:
        """Che cosa impedisce il segno lì (None se niente)."""
        q = self.q
        poli = s.poligono(q, s.da_px)
        m = ARIA * q.W / s.da_px
        if not all(m <= x <= q.W - m and m <= y <= q.H - m for x, y in poli):
            return "bordo"
        for o in self.ostacoli:
            if (
                not s.sul_posto
                and o.via != s.via
                and si_toccano(poli, list(o.poligono))
            ):
                return f"evidenza di {o.via}"
        # due segni convivono dalla più grande delle loro soglie: lì si guarda
        for a in self.segni:
            px = max(s.da_px, a.da_px)
            if si_toccano(s.poligono(q, px), a.poligono(q, px)):
                return a.svg.split(">", 2)[1][:60] if "<text" in a.svg else a.svg[:40]
        return None

    def libero(self, s: Segno) -> bool:
        return self.intralcio(s) is None

    def piazza(
        self,
        nome: str,
        candidati: Callable[[float], list[Segno]],
        obbligatorio: bool = False,
        da: float = 0,
    ) -> Segno | None:
        """Il primo candidato libero alla larghezza minima (o da `da` in su); se nessuno lo è,
        alla prima soglia a cui uno lo diventa. Un segno obbligatorio deve starci da subito."""
        soglie = [px for px in self.q.soglie() if px >= da]
        for px in soglie[:1] if obbligatorio else soglie:
            for c in candidati(px):
                c = replace(c, da_px=px)
                if self.libero(c):
                    self.segni.append(c)
                    if px > soglie[0]:
                        print(f"  {self.q.file}: «{nome}» da {px} px")
                    return c
        print(f"  {self.q.file}: nessun posto per «{nome}»")
        if "--perche" in sys.argv:
            motivi: dict[str, int] = {}
            for c in candidati(soglie[0]):
                m = self.intralcio(replace(c, da_px=soglie[0])) or "?"
                motivi[m] = motivi.get(m, 0) + 1
            print("   ", motivi)
        if obbligatorio:
            raise SystemExit(1)
        return None


def con_aria(poli: Poligono) -> tuple[Punto, ...]:
    """L'ingombro allargato del margine libero: due segni non si sfiorano."""
    cx = sum(x for x, _ in poli) / len(poli)
    cy = sum(y for _, y in poli) / len(poli)
    out = []
    for x, y in poli:
        dx, dy = x - cx, y - cy
        n = math.hypot(dx, dy) or 1
        out.append((x + dx / n * ARIA / 2, y + dy / n * ARIA / 2))
    return tuple(out)


def scritta(
    x: float,
    y: float,
    classe: str,
    testo: str,
    q: Quadro,
    ancora: str = "middle",
    dx: float = 0,
    dy: float = 0,
    ruota: float = 0,
    via: str = "",
) -> Segno:
    """Un nome ancorato in (x, y) del disegno, spostato di (dx, dy) px e ruotato."""
    _, largo, alto = misura(testo, classe, q)
    x0 = {"start": dx, "middle": dx - largo / 2, "end": dx - largo}[ancora]
    sagoma = rettangolo(x0, dy - alto / 2, x0 + largo, dy + alto / 2)
    if ruota:
        c, s = math.cos(math.radians(ruota)), math.sin(math.radians(ruota))
        sagoma = [(a * c - b * s, a * s + b * c) for a, b in sagoma]
    return Segno(
        x,
        y,
        con_aria(sagoma),
        testo_svg(classe, testo, q, ancora, dx, dy, ruota),
        via=via,
    )


def attorno(
    x: float,
    y: float,
    raggio: float,
    classe: str,
    testo: str,
    q: Quadro,
    giu: float = 0,
) -> list[Segno]:
    """Un nome accanto a un segno di raggio dato (spostato in giù di `giu` px): a destra, a
    sinistra, sotto, sopra."""
    _, _, alto = misura(testo, classe, q)
    g = raggio + ARIA + 1
    return [
        scritta(x, y, classe, testo, q, "start", dx=g, dy=giu),
        scritta(x, y, classe, testo, q, "end", dx=-g, dy=giu),
        scritta(x, y, classe, testo, q, "middle", dy=giu + g + alto / 2 - 1),
        scritta(x, y, classe, testo, q, "middle", dy=giu - g - alto / 2 + 1),
    ]


def lungo_la_via(
    q: Quadro,
    vie: list[list[Punto]],
    classe: str,
    testo: str,
    preferito: Punto,
    px: float,
    via: str,
) -> list[Segno]:
    """Il nome lungo la via, appena sopra la linea (l'evidenza resta intera), dove la via corre
    dritta per tutta la sua lunghezza; prima i posti più vicini a quello preferito, poi sotto la
    linea. Si legge da sinistra a destra, o dal basso se la via è verticale."""
    _, largo, alto = misura(testo, classe, q)
    f = q.W / px
    # dove la via curva un poco il nome resta dritto: prima i tratti dritti, poi quelli che
    # si scostano dal nome al massimo di poco meno di mezza altezza
    L, dritta, curva, passo = largo * f, alto * f * 0.18, alto * f * 0.45, 4 * f
    posti = []
    for pl in vie:
        cum = lungo(pl)
        s = L / 2
        while s <= cum[-1] - L / 2:
            (a, ia), (b, ib) = punto_a(pl, cum, s - L / 2), punto_a(pl, cum, s + L / 2)
            corda = math.dist(a, b) or 1e-9
            scarto = max(
                (
                    abs(
                        (b[1] - a[1]) * x
                        - (b[0] - a[0]) * y
                        + b[0] * a[1]
                        - b[1] * a[0]
                    )
                    / corda
                    for x, y in pl[ia:ib]
                ),
                default=0,
            )
            if scarto <= curva:
                gradi = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
                gradi = (gradi + 90) % 180 - 90  # in [-90, 90): mai a testa in giù
                mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
                posti.append(
                    (scarto > dritta, math.dist((mx, my), preferito), mx, my, gradi)
                )
            s += passo
    posti.sort()
    scosta = alto / 2 + 1.5
    return [
        scritta(mx, my, classe, testo, q, dy=lato * scosta, ruota=gradi, via=via)
        for lato in (-1, 1)
        for _, _, mx, my, gradi in posti
    ]


def nel_verde(
    q: Quadro,
    anelli: list[list[Punto]],
    classe: str,
    testo: str,
    preferito: Punto,
    px: float,
) -> list[Segno]:
    """Il nome di un parco tutto dentro il suo verde, il più vicino possibile al punto preferito."""
    _, largo, alto = misura(testo, classe, q)
    f = q.W / px
    passo = 6 * f
    posti = []
    for i in range(int(q.W / passo)):
        for j in range(int(q.H / passo)):
            x, y = i * passo, j * passo
            angoli = [
                (x + a * f, y + b * f)
                for a, b in rettangolo(-largo / 2, -alto / 2, largo / 2, alto / 2)
            ]
            if any(
                all(dentro_poligono(p, anello) for p in angoli) for anello in anelli
            ):
                posti.append((math.dist((x, y), preferito), x, y))
    posti.sort()
    return [scritta(x, y, classe, testo, q) for _, x, y in posti[:400]]


def vicino_a(
    x: float, y: float, classe: str, testo: str, q: Quadro, px: float
) -> list[Segno]:
    """Un nome sul suo punto, o spostato di poco se lì c'è altro."""
    _, _, alto = misura(testo, classe, q)
    spostamenti = [(0, 0)] + [
        (dx, dy)
        for r in (1, 2, 3)
        for dx, dy in (
            (0, -r * alto),
            (0, r * alto),
            (-r * 2 * alto, 0),
            (r * 2 * alto, 0),
        )
    ]
    f = q.W / px
    return [scritta(x + dx * f, y + dy * f, classe, testo, q) for dx, dy in spostamenti]


# ── il disegno ──────────────────────────────────────────────────────────────────────────


def genera(q: Quadro, dati: dict) -> str:
    p = proiettore(q)
    strade: dict[str, list[str]] = {c: [] for c in set(CLASSI.values())}
    per_nome: dict[str, list[list[Punto]]] = {}
    verde: list[str] = []
    anelli: list[list[Punto]] = []  # i parchi, per scriverci dentro
    mura: list[str] = []
    for el in dati["elements"]:
        t = el.get("tags", {})
        if el["type"] == "way" and "geometry" in el:
            punti = [p(g["lat"], g["lon"]) for g in el["geometry"]]
            if not visibile(q, punti):
                continue
            if t.get("highway") in CLASSI:
                strade[CLASSI[t["highway"]]].append(d(semplifica(punti)))
                if t.get("name") in VIE:
                    per_nome.setdefault(t["name"], []).append(punti)
            elif t.get("leisure") == "park" and punti[0] == punti[-1]:
                verde.append(d(semplifica(punti), chiuso=True))
                anelli.append(punti)
            elif t.get("historic") == "citywalls" or t.get("barrier") == "city_wall":
                mura.append(d(semplifica(punti)))
        elif el["type"] == "relation" and t.get("leisure") == "park":
            esterni = [
                [p(g["lat"], g["lon"]) for g in m["geometry"]]
                for m in el.get("members", [])
                if m.get("role") == "outer" and "geometry" in m
            ]
            for anello in catena(esterni):
                if visibile(q, anello):
                    verde.append(d(semplifica(anello), chiuso=True))
                    if t.get("name") == "Villa Borghese":
                        anelli.append(anello)

    # le evidenze sono ostacoli per i nomi delle altre vie e per tutti gli altri segni
    ostacoli = [
        Ostacolo(tratto_spesso(a, b, spessore), nome)
        for nome, spessore in EVIDENZE.items()
        for tratto in per_nome.get(nome, [])
        for a, b in pairwise(semplifica(tratto, 1))
    ]
    livello = Livello(q, ostacoli)

    # 1. il segnaposto e il nome: sempre
    cx, cy = p(*ENEA)
    ottagono = tuple(
        (ALONE * math.cos(k * math.pi / 4), ALONE * math.sin(k * math.pi / 4))
        for k in range(8)
    )
    segnaposto = Segno(
        cx,
        cy,
        ottagono,
        f'<circle class="alone" r="{ALONE}"/><circle class="anello" r="11"/><circle class="punto" r="4.5"/>',
        sul_posto=True,
    )
    livello.piazza("segnaposto", lambda px: [segnaposto], obbligatorio=True)
    livello.piazza(
        "ENEA",
        lambda px: attorno(cx, cy, ALONE, "insegna", "ENEA", q)[::-1],
        obbligatorio=True,
    )

    # 2. le stazioni della metro, dove sono, e i loro nomi coi minuti
    mezzo = LATO_M / 2
    for nome, posto, minuti in METRO:
        sx, sy = p(*posto)
        quadrato = Segno(
            sx,
            sy,
            con_aria(rettangolo(-mezzo, -mezzo, mezzo, mezzo)),
            f'<g class="metro"><rect x="{-mezzo:g}" y="{-mezzo:g}" width="{LATO_M}" height="{LATO_M}" rx="3.5"/>'
            f'<text class="metro-m" font-size="12" text-anchor="middle" dy=".35em">M</text></g>',
            sul_posto=True,
        )
        livello.piazza(f"metro {nome}", lambda px, s=quadrato: [s], obbligatorio=True)
    for nome, posto, minuti in METRO:
        sx, sy = p(*posto)
        livello.piazza(
            nome,
            lambda px, sx=sx, sy=sy, t=f"{nome} · {minuti} min": attorno(
                sx, sy, mezzo, "metro-nome", t, q
            ),
            obbligatorio=True,
        )

    # 3. le vie: Via Veneto e Via Boncompagni sempre, le altre quando c'è posto
    for i, nome in enumerate(q.vie):
        testo, preferito = VIE[nome]
        vie = [semplifica(v, 0.8) for v in catena(per_nome.get(nome, []))]
        classe = "nome forte" if nome == "Via Vittorio Veneto" else "nome"
        pref = p(*preferito)
        livello.piazza(
            testo,
            lambda px, vie=vie, classe=classe, testo=testo, pref=pref, nome=nome: (
                lungo_la_via(q, vie, classe, testo, pref, px, nome)
            ),
            obbligatorio=i < 2,
        )

    # 4. la fermata del bus e le sue linee, poi i luoghi: quando c'è posto
    if q.con_bus:
        # il segno sta sul marciapiede, appena sotto la fermata: sopra la via c'è il suo nome
        bx, by = p(*BUS[0])
        mezzo_b, giu = LATO_BUS / 2, LATO_BUS / 2 + 3
        fermata = Segno(
            bx,
            by,
            con_aria(rettangolo(-mezzo_b, giu - mezzo_b, mezzo_b, giu + mezzo_b)),
            f'<g class="bus" transform="translate(0 {giu:g})"><rect x="{-mezzo_b:g}" y="{-mezzo_b:g}" width="{LATO_BUS}" height="{LATO_BUS}" rx="3.5"/>'
            '<path d="M-4.5 -5.2h9a.8 .8 0 0 1 .8 .8v7.4h-10.6v-7.4a.8 .8 0 0 1 .8-.8zM-3.6 -3.9v3.2h7.2v-3.2zM-4.6 3.4h2.4v1.8h-2.4zM2.2 3.4h2.4v1.8h-2.4z"/></g>',
            sul_posto=True,
        )
        if segno := livello.piazza("fermata del bus", lambda px: [fermata]):
            # le linee compaiono col loro segno, non prima
            livello.piazza(
                "linee del bus",
                lambda px: attorno(bx, by, mezzo_b, "bus-linee", BUS[1], q, giu),
                da=segno.da_px,
            )
    for nome in q.luoghi:
        lx, ly = p(*LUOGHI[nome])
        if nome == "Villa Borghese":
            livello.piazza(
                nome,
                lambda px, lx=lx, ly=ly, nome=nome: nel_verde(
                    q, anelli, "luogo", nome, (lx, ly), px
                ),
            )
        else:
            livello.piazza(
                nome,
                lambda px, lx=lx, ly=ly, nome=nome: vicino_a(
                    lx, ly, "luogo", nome, q, px
                ),
            )

    # le soglie diventano regole sul riquadro (container query «mappa» in MappaDove.astro)
    soglie = sorted({s.da_px for s in livello.segni if s.da_px > q.px_min})
    regole = "".join(
        f"@container mappa (width < {px:g}px) {{ .carta--{q.variante} .da-{px:g} {{ display: none }} }}"
        for px in soglie
    )
    segni = "".join(
        f'<svg x="{100 * s.x / q.W:.3f}%" y="{100 * s.y / q.H:.3f}%" overflow="visible"'
        + (f' class="da-{s.da_px:g}"' if s.da_px > q.px_min else "")
        + f">{s.svg}</svg>"
        for s in livello.segni
    )
    disegno = [
        f'<rect class="fondo" width="{q.W}" height="{q.H}"/>',
        f'<path class="verde" d="{"".join(verde)}"/>',
        *(
            f'<path class="strada {c}" d="{"".join(s)}"/>'
            for c, s in sorted(strade.items(), reverse=True)
            if s
        ),
        f'<path class="mura" d="{"".join(mura)}"/>' if mura else "",
        f'<path class="strada evidenza-veneto" d="{"".join(d(semplifica(t)) for t in per_nome.get("Via Vittorio Veneto", []))}"/>',
        f'<path class="strada evidenza" d="{"".join(d(semplifica(t)) for t in per_nome.get("Via Boncompagni", []))}"/>',
    ]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" class="carta carta--{q.variante}" aria-hidden="true" focusable="false">'
        + (f"<style>{regole}</style>" if regole else "")
        + f'<svg class="carta__disegno" viewBox="0 0 {q.W} {q.H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">'
        + "".join(disegno)
        + f'</svg><g class="carta__segni">{segni}</g></svg>\n'
    )


if __name__ == "__main__":
    if "--aggiorna" in sys.argv or not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(scarica()))
    dati = json.loads(CACHE.read_text())
    for q in QUADRI:
        svg = genera(q, dati)
        uscita = ASSETS / q.file
        uscita.write_text(svg)
        print(
            f"{uscita.relative_to(SITO)}: {len(svg) / 1024:.1f} KB, {q.m_per_unita:.2f} m per unità"
        )
