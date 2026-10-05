"""La mappa di «Dove siamo»: strade e verde di OpenStreetMap, disegnati nello stile del sito.

Si rigenera solo se serve (`pnpm mappa`): scarica i dati una volta da Overpass e
scrive due SVG in src/assets, uno largo per lo schermo grande e uno per il
telefono, dove i nomi devono restare leggibili. Nessun servizio di mappe nel
browser: niente cookie di terzi né richieste esterne, come dichiarano le note legali.
Dati © OpenStreetMap contributors (ODbL): l'attribuzione sta sotto la mappa.

Il punto di forza da far vedere è Via Veneto in fondo a Via Boncompagni: l'inquadratura
è spostata a ovest per tenerla dentro, con Villa Borghese; le fermate della metro,
fuori quadro, sono segnate sul bordo nella loro direzione.
"""

import json
import math
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

# il segnaposto della scheda Google «Enea Roma», Via Boncompagni 83/85
ENEA = (41.9091979, 12.496061)
ASSETS = Path(__file__).resolve().parents[1] / "src/assets"
SERVER_OVERPASS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)
# i dati scaricati restano qui: i ritocchi al disegno non riscaricano (--aggiorna per rifarlo)
CACHE = Path(__file__).resolve().parents[1] / "node_modules/.cache/mappa-dove-osm.json"


@dataclass(frozen=True)
class Quadro:
    """Un'inquadratura: dimensioni in unità SVG, scala e centro rispetto a ENEA (metri)."""

    file: str
    W: int
    H: int
    m_per_px: float
    est: float
    sud: float
    variante: str
    vie: tuple[tuple[str, str], ...]  # nome in OpenStreetMap, testo sulla mappa
    luoghi: tuple[str, ...]


QUADRI = (
    # striscia 5:2 di circa 1,6 km: da Villa Borghese a Porta Pia
    Quadro(
        "mappa-dove.svg",
        1600,
        640,
        1.0,
        -150,
        60,
        "larga",
        (
            ("Via Boncompagni", "Via Boncompagni"),
            # a piedi da ENEA, verificato su Google Maps il 05/10/2026
            ("Via Vittorio Veneto", "Via Veneto · 10 min"),
            ("Corso d'Italia", "Corso d’Italia"),
        ),
        ("Villa Borghese", "Piazza Fiume", "Porta Pia"),
    ),
    # 9:7 per il telefono: meno strade, nomi grandi
    Quadro(
        "mappa-dove-telefono.svg",
        900,
        700,
        1.1,
        -260,
        80,
        "telefono",
        (("Via Boncompagni", "Via Boncompagni"), ("Via Vittorio Veneto", "Via Veneto")),
        ("Piazza Fiume",),
    ),
)

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
# le vie di cui servono il tracciato (nomi ed evidenze)
VIE_CON_NOME = {nome for q in QUADRI for nome, _ in q.vie}
# punti di riferimento: un punto dentro il luogo, dove scriverne il nome
LUOGHI = {
    "Villa Borghese": (41.910645, 12.486166),
    "Piazza Fiume": (41.910742, 12.498153),
    "Porta Pia": (41.909316, 12.501321),
}
# metro: stazione (OpenStreetMap) e minuti a piedi da ENEA (Google Maps, 05/10/2026)
METRO = (
    ("Barberini", "A", (41.90381, 12.488617), 12),
    ("Repubblica", "A", (41.902828, 12.496054), 14),
)


def metri(lat: float, lon: float) -> tuple[float, float]:
    """Posizione rispetto a ENEA in metri: x verso est, y verso sud."""
    x = (lon - ENEA[1]) * math.cos(math.radians(ENEA[0])) * 111320
    y = (ENEA[0] - lat) * 110540
    return x, y


def proiettore(q: Quadro):
    def p(lat: float, lon: float) -> tuple[float, float]:
        x, y = metri(lat, lon)
        return q.W / 2 + (x - q.est) / q.m_per_px, q.H / 2 + (y - q.sud) / q.m_per_px

    return p


def scarica() -> dict:
    m = 700  # margine attorno alle inquadrature, in metri: le linee escono pulite dai bordi
    ovest = min(q.est - q.W / 2 * q.m_per_px for q in QUADRI) - m
    est = max(q.est + q.W / 2 * q.m_per_px for q in QUADRI) + m
    nord = min(q.sud - q.H / 2 * q.m_per_px for q in QUADRI) - m
    sud = max(q.sud + q.H / 2 * q.m_per_px for q in QUADRI) + m
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


def semplifica(
    punti: list[tuple[float, float]], tolleranza: float = 0.6
) -> list[tuple[float, float]]:
    """Douglas-Peucker: toglie i vertici che non cambiano il disegno di oltre mezzo pixel."""
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


def visibile(q: Quadro, punti: list[tuple[float, float]], margine: float = 40) -> bool:
    return any(
        -margine <= x <= q.W + margine and -margine <= y <= q.H + margine
        for x, y in punti
    )


def d(punti: list[tuple[float, float]], chiuso: bool = False) -> str:
    s = "M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in punti)
    return s + ("Z" if chiuso else "")


def catena(tratti: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
    """Unisce i tratti che si toccano agli estremi (una via divisa agli incroci, l'anello di un parco)."""
    tratti = [list(t) for t in tratti]
    uniti = True
    while uniti:
        uniti = False
        for i, a in enumerate(tratti):
            for j, b in enumerate(tratti):
                if i == j:
                    continue
                vicino = lambda p, q: math.dist(p, q) < 0.5  # noqa: E731
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


def lunghezza(punti: list[tuple[float, float]]) -> float:
    return sum(math.dist(a, b) for a, b in zip(punti, punti[1:]))


def dritti(
    punti: list[tuple[float, float]], max_gradi: float = 22
) -> list[list[tuple[float, float]]]:
    """Spezza la via dove gira: un nome scritto su una curva stretta si legge male."""
    tratti, corrente = [], [punti[0]]
    for a, b, c in zip(punti, punti[1:], punti[2:]):
        corrente.append(b)
        svolta = math.degrees(
            math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(b[1] - a[1], b[0] - a[0])
        )
        if abs((svolta + 180) % 360 - 180) > max_gradi:
            tratti.append(corrente)
            corrente = [b]
    corrente.append(punti[-1])
    return tratti + [corrente]


def lontano_da(
    punti: list[tuple[float, float]], centro: tuple[float, float], raggio: float
) -> list[list[tuple[float, float]]]:
    """Toglie il pezzo di via sotto il segnaposto e la scritta ENEA."""
    fitti = [punti[0]]
    for a, b in zip(punti, punti[1:]):
        n = max(1, int(math.dist(a, b) // 8))
        fitti += [
            (a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)
            for k in range(1, n + 1)
        ]
    parti, corrente = [], []
    for p in fitti:
        if math.dist(p, centro) < raggio:
            if len(corrente) > 1:
                parti.append(corrente)
            corrente = []
        else:
            corrente.append(p)
    return parti + ([corrente] if len(corrente) > 1 else [])


def posto_per_il_nome(
    q: Quadro,
    tratti: list[list[tuple[float, float]]],
    serve: float,
    segnaposto: tuple[float, float],
) -> list[tuple[float, float]] | None:
    """Il tratto dritto più lungo della via, lontano dal segnaposto e dai bordi."""
    raggio = 110 if q.variante == "larga" else 140
    candidati = [
        parte
        for via in catena(tratti)
        for dritto in dritti(semplifica(via, 1))
        for parte in lontano_da(dritto, segnaposto, raggio)
        if lunghezza(parte) >= serve + 30
    ]
    margine = 30 if q.variante == "larga" else 24
    dentro = [
        c
        for c in candidati
        if all(
            margine <= x <= q.W - margine and margine <= y <= q.H - margine
            for x, y in c
        )
    ]
    if not dentro:
        return None
    via = semplifica(max(dentro, key=lunghezza), 1)
    # il testo si legge da sinistra a destra, o dal basso in alto se la via è verticale
    if abs(via[-1][0] - via[0][0]) > abs(via[-1][1] - via[0][1]) * 0.3:
        return via[::-1] if via[-1][0] < via[0][0] else via
    return via[::-1] if via[-1][1] > via[0][1] else via


def nome_dritto(
    q: Quadro,
    tratti: list[list[tuple[float, float]]],
    serve: float,
    segnaposto: tuple[float, float],
) -> tuple[float, float, float] | None:
    """Quando la via non ha un tratto dritto abbastanza lungo (sul telefono): il nome dritto,
    centrato sul tratto rettilineo più lungo e inclinato come lui, anche se ne sborda un po'."""
    parti = [
        [pt for pt in parte if 0 <= pt[0] <= q.W and 0 <= pt[1] <= q.H]
        for via in catena(tratti)
        for dritto in dritti(semplifica(via, 1))
        for parte in lontano_da(dritto, segnaposto, 120)
    ]
    parti = [pp for pp in parti if len(pp) > 1 and lunghezza(pp) >= 120]
    if not parti:
        return None
    parte = max(parti, key=lunghezza)
    a, b = sorted((parte[0], parte[-1]))
    # a e b ordinati per x: il testo si legge sempre da sinistra a destra
    angolo = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    # se il tratto arriva al segnaposto, il nome gli sta accanto: lontano dall'altro capo,
    # dove di solito c'è un incrocio con un altro nome
    vicino, lontano = sorted((a, b), key=lambda pt: math.dist(pt, segnaposto))
    lung = math.dist(a, b)
    if math.dist(vicino, segnaposto) < 200:
        # il nome comincia poco dopo l'incrocio e corre verso il segnaposto
        ux, uy = (vicino[0] - lontano[0]) / lung, (vicino[1] - lontano[1]) / lung
        mx = lontano[0] + ux * (serve / 2 + 40)
        my = lontano[1] + uy * (serve / 2 + 40)
    mezzo_x = abs(math.cos(math.radians(angolo))) * serve / 2 + 20
    mezzo_y = abs(math.sin(math.radians(angolo))) * serve / 2 + 20
    mx = min(max(mx, mezzo_x), q.W - mezzo_x)
    my = min(max(my, mezzo_y), q.H - mezzo_y)
    return mx, my, angolo


def segnale_metro(
    q: Quadro, da: tuple[float, float], a: tuple[float, float]
) -> tuple[float, float]:
    """Dove mettere il segnale della stazione: sulla stazione, o sul bordo nella sua direzione."""
    m = 34 if q.variante == "larga" else 46
    if m <= a[0] <= q.W - m and m <= a[1] <= q.H - m:
        return a
    dx, dy = a[0] - da[0], a[1] - da[1]
    passi = [
        t
        for t in (
            (m - da[0]) / dx
            if dx < 0
            else (q.W - m - da[0]) / dx
            if dx > 0
            else math.inf,
            (m - da[1]) / dy
            if dy < 0
            else (q.H - m - da[1]) / dy
            if dy > 0
            else math.inf,
        )
        if t > 0
    ]
    t = min(passi)
    return da[0] + dx * t, da[1] + dy * t


def genera(q: Quadro, dati: dict) -> str:
    p = proiettore(q)
    strade: dict[str, list[str]] = {c: [] for c in set(CLASSI.values())}
    per_nome: dict[str, list[list[tuple[float, float]]]] = {}
    verde, mura = [], []
    for el in dati["elements"]:
        t = el.get("tags", {})
        if el["type"] == "way" and "geometry" in el:
            punti = [p(g["lat"], g["lon"]) for g in el["geometry"]]
            if not visibile(q, punti):
                continue
            if t.get("highway") in CLASSI:
                strade[CLASSI[t["highway"]]].append(d(semplifica(punti)))
                if t.get("name") in VIE_CON_NOME:
                    per_nome.setdefault(t["name"], []).append(punti)
            elif t.get("leisure") == "park" and punti[0] == punti[-1]:
                verde.append(d(semplifica(punti), chiuso=True))
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

    cx, cy = p(*ENEA)
    k = 1 if q.variante == "larga" else 1.7  # il segnaposto, in proporzione al riquadro
    corpo_nome = 15 if q.variante == "larga" else 30
    definizioni, testi = [], []
    for nome, testo in q.vie:
        forte = nome == "Via Vittorio Veneto"
        serve = len(testo) * corpo_nome * (1.05 if forte else 0.9)
        via = posto_per_il_nome(q, per_nome.get(nome, []), serve, (cx, cy))
        classe = "nome forte" if forte else "nome"
        if via is None:
            dritto = nome_dritto(q, per_nome.get(nome, []), serve, (cx, cy))
            if dritto is None:
                print(f"  {q.file}: nessun posto per «{testo}»")
                continue
            x, y, angolo = dritto
            testi.append(
                f'<text class="{classe}" transform="translate({x:.0f} {y:.0f}) rotate({angolo:.1f})" '
                f'dy="-{corpo_nome * 0.6:.0f}" text-anchor="middle">{testo}</text>'
            )
            continue
        ident = f"{q.variante}-" + nome.split()[-1].lower().replace("'", "")
        definizioni.append(f'<path id="{ident}" d="{d(via)}"/>')
        testi.append(
            f'<text class="{classe}" dy="-{corpo_nome * 0.6:.0f}"><textPath href="#{ident}" '
            f'startOffset="50%" text-anchor="middle">{testo}</textPath></text>'
        )

    luoghi = []
    for nome in q.luoghi:
        x, y = p(*LUOGHI[nome])
        if not (0 <= x <= q.W and 0 <= y <= q.H):
            continue
        # il nome resta dentro il riquadro anche se il luogo è vicino al bordo
        largo = len(nome) * corpo_nome * 0.95
        x = min(max(x, largo / 2 + 16), q.W - largo / 2 - 16)
        luoghi.append(
            f'<text class="luogo" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">{nome}</text>'
        )

    metro = []
    for nome, linea, posto, minuti in METRO:
        sx, sy = segnale_metro(q, (cx, cy), p(*posto))
        lato = 26 if q.variante == "larga" else 44
        if q.variante == "larga":
            a_destra = sx < q.W * 0.62
            tx, ty, ancora = sx + (lato * 0.75 if a_destra else -lato * 0.75), sy, "start" if a_destra else "end"
            scritta = f"{nome} · {linea} · {minuti} min"
        else:  # sopra il segnale: due stazioni vicine sul bordo non si sovrappongono
            tx, ty, ancora = sx, sy - lato * 1.05, "middle"
            scritta = f"{nome} · {minuti} min"
        metro.append(
            f'<g class="metro"><rect x="{sx - lato / 2:.0f}" y="{sy - lato / 2:.0f}" width="{lato}" height="{lato}" rx="{lato * 0.18:.0f}"/>'
            f'<text class="metro-m" x="{sx:.0f}" y="{sy:.0f}" text-anchor="middle" dominant-baseline="central">M</text>'
            f'<text class="metro-nome" x="{tx:.0f}" y="{ty:.0f}" text-anchor="{ancora}" '
            f'dominant-baseline="central">{scritta}</text></g>'
        )

    corpo = [
        f"<defs>{''.join(definizioni)}</defs>",
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
        *luoghi,
        *testi,
        *metro,
        f'<g class="segnaposto"><circle class="alone" cx="{cx:.0f}" cy="{cy:.0f}" r="{30 * k:.0f}"/>'
        f'<circle class="anello" cx="{cx:.0f}" cy="{cy:.0f}" r="{15 * k:.0f}"/><circle class="punto" cx="{cx:.0f}" cy="{cy:.0f}" r="{6 * k:.0f}"/>'
        f'<text class="insegna" x="{cx:.0f}" y="{cy - 38 * k:.0f}" text-anchor="middle">ENEA</text></g>',
    ]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" class="carta carta--{q.variante}" viewBox="0 0 {q.W} {q.H}" '
        f'preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">{"".join(corpo)}</svg>\n'
    )


if __name__ == "__main__":
    import sys

    if "--aggiorna" in sys.argv or not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(scarica()))
    dati = json.loads(CACHE.read_text())
    for q in QUADRI:
        svg = genera(q, dati)
        uscita = ASSETS / q.file
        uscita.write_text(svg)
        print(f"{uscita.relative_to(ASSETS.parents[1])}: {len(svg) / 1024:.1f} KB")
