"""La mappa di «Dove siamo»: strade e verde di OpenStreetMap, disegnati nello stile del sito.

Si rigenera solo se serve (`pnpm mappa`): scarica i dati una volta da Overpass e
scrive src/assets/mappa-dove.svg. Nessun servizio di mappe nel browser: niente
cookie di terzi né richieste esterne, come dichiarano le note legali.
Dati © OpenStreetMap contributors (ODbL): l'attribuzione sta sotto la mappa.
"""

import json
import math
import urllib.parse
import urllib.request
from pathlib import Path

# il segnaposto della scheda Google «Enea Roma», Via Boncompagni 83/85
CENTRO = (41.9091979, 12.496061)
W, H = 1600, 640  # striscia 5:2; sul telefono il riquadro è più alto e taglia i lati
M_PER_PX = 0.95  # circa 1,5 km di larghezza
USCITA = Path(__file__).resolve().parents[1] / "src/assets/mappa-dove.svg"
SERVER_OVERPASS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)
# i dati scaricati restano qui: i ritocchi al disegno non riscaricano (--aggiorna per rifarlo)
CACHE = Path(__file__).resolve().parents[1] / "node_modules/.cache/mappa-dove-osm.json"

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
# etichette: nome in OpenStreetMap → testo sulla mappa
ETICHETTE = {
    "Via Boncompagni": "Via Boncompagni",
    "Via Vittorio Veneto": "Via Veneto",
    "Corso d'Italia": "Corso d’Italia",
}


def scarica() -> dict:
    m = 700  # margine attorno all'inquadratura, in metri: le linee escono pulite dai bordi
    dlat = (H / 2 * M_PER_PX + m) / 110540
    dlon = (W / 2 * M_PER_PX + m) / (111320 * math.cos(math.radians(CENTRO[0])))
    bbox = (
        f"{CENTRO[0] - dlat},{CENTRO[1] - dlon},{CENTRO[0] + dlat},{CENTRO[1] + dlon}"
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


def proietta(lat: float, lon: float) -> tuple[float, float]:
    x = (lon - CENTRO[1]) * math.cos(math.radians(CENTRO[0])) * 111320
    y = (CENTRO[0] - lat) * 110540
    return W / 2 + x / M_PER_PX, H / 2 + y / M_PER_PX


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


def visibile(punti: list[tuple[float, float]], margine: float = 40) -> bool:
    return any(
        -margine <= x <= W + margine and -margine <= y <= H + margine for x, y in punti
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


def lontano_dal_segnaposto(
    punti: list[tuple[float, float]], raggio: float = 90
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
        if math.dist(p, (W / 2, H / 2)) < raggio:
            if len(corrente) > 1:
                parti.append(corrente)
            corrente = []
        else:
            corrente.append(p)
    return parti + ([corrente] if len(corrente) > 1 else [])


def posto_per_il_nome(
    tratti: list[list[tuple[float, float]]], serve: float
) -> list[tuple[float, float]] | None:
    """Il tratto dritto più lungo della via, lontano dal segnaposto e dai bordi; al centro se c'è posto,
    perché sul telefono il riquadro taglia i lati."""
    candidati = [
        parte
        for via in catena(tratti)
        for dritto in dritti(semplifica(via, 1))
        for parte in lontano_dal_segnaposto(dritto)
        if lunghezza(parte) >= serve + 30
    ]
    dentro = [
        c
        for c in candidati
        if all(60 <= x <= W - 60 and 40 <= y <= H - 40 for x, y in c)
    ]
    if not dentro:
        return None
    centrali = [c for c in dentro if abs(c[len(c) // 2][0] - W / 2) < 380]
    via = max(centrali or dentro, key=lunghezza)
    via = semplifica(via, 1)
    return (
        via[::-1] if via[-1][0] < via[0][0] else via
    )  # il testo si legge da sinistra a destra


def genera(dati: dict) -> str:
    strade: dict[str, list[str]] = {c: [] for c in set(CLASSI.values())}
    per_nome: dict[str, list[list[tuple[float, float]]]] = {}
    verde, mura = [], []
    for el in dati["elements"]:
        t = el.get("tags", {})
        if el["type"] == "way" and "geometry" in el:
            punti = [proietta(p["lat"], p["lon"]) for p in el["geometry"]]
            if not visibile(punti):
                continue
            if t.get("highway") in CLASSI:
                strade[CLASSI[t["highway"]]].append(d(semplifica(punti)))
                if t.get("name") in ETICHETTE:
                    per_nome.setdefault(t["name"], []).append(punti)
            elif t.get("leisure") == "park" and punti[0] == punti[-1]:
                verde.append(d(semplifica(punti), chiuso=True))
            elif t.get("historic") == "citywalls" or t.get("barrier") == "city_wall":
                mura.append(d(semplifica(punti)))
        elif el["type"] == "relation" and t.get("leisure") == "park":
            esterni = [
                [proietta(p["lat"], p["lon"]) for p in m["geometry"]]
                for m in el.get("members", [])
                if m.get("role") == "outer" and "geometry" in m
            ]
            for anello in catena(esterni):
                if visibile(anello):
                    verde.append(d(semplifica(anello), chiuso=True))

    definizioni, testi = [], []
    for nome, testo in ETICHETTE.items():
        via = posto_per_il_nome(per_nome.get(nome, []), len(testo) * 13.5)
        if via is None:
            continue
        ident = "e-" + nome.split()[-1].lower().replace("'", "")
        definizioni.append(f'<path id="{ident}" d="{d(via)}"/>')
        testi.append(
            f'<text class="nome" dy="-9"><textPath href="#{ident}" startOffset="50%" '
            f'text-anchor="middle">{testo}</textPath></text>'
        )

    cx, cy = W / 2, H / 2
    corpo = [
        f"<defs>{''.join(definizioni)}</defs>",
        f'<rect class="fondo" width="{W}" height="{H}"/>',
        f'<path class="verde" d="{"".join(verde)}"/>',
        *(
            f'<path class="strada {c}" d="{"".join(p)}"/>'
            for c, p in sorted(strade.items(), reverse=True)
            if p
        ),
        f'<path class="mura" d="{"".join(mura)}"/>' if mura else "",
        f'<path class="strada evidenza" d="{"".join(d(semplifica(t)) for t in per_nome.get("Via Boncompagni", []))}"/>',
        *testi,
        f'<g class="segnaposto"><circle class="alone" cx="{cx}" cy="{cy}" r="30"/>'
        f'<circle class="anello" cx="{cx}" cy="{cy}" r="15"/><circle class="punto" cx="{cx}" cy="{cy}" r="6"/>'
        f'<text class="insegna" x="{cx}" y="{cy - 38}" text-anchor="middle">ENEA</text></g>',
    ]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" '
        f'aria-hidden="true" focusable="false">{"".join(corpo)}</svg>\n'
    )


if __name__ == "__main__":
    import sys

    if "--aggiorna" in sys.argv or not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(scarica()))
    svg = genera(json.loads(CACHE.read_text()))
    USCITA.write_text(svg)
    print(f"{USCITA.relative_to(USCITA.parents[2])}: {len(svg) / 1024:.1f} KB")
