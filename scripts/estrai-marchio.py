#!/usr/bin/env python3
"""
Rigenera src/assets/marchio/marchio-rilievo.png dal manuale del brand.

Il marchio è un rilievo d'ottone su pietra fotografato con luce radente: la sua
materia È il valore, e un tracciato vettoriale la perde. Qui si conserva la
fotografia, si riporta il fondo bruno al pece del sito e si spegne l'immagine
ai bordi, così sulla pagina non ha contorno e sembra incisa nel nero.

Sorgente: pagina 12 del manuale (img-005), il render con la luce più uniforme.
Le versioni vettoriali (Marchio/Wordmark/Pino .astro) restano per gli usi
piccoli e a colore variabile: testata, piede, fregi, favicon.

    uv run --with pillow --with numpy python scripts/estrai-marchio.py
"""
import subprocess, tempfile
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
PDF = RADICE.parent / "brand/manuale-brand.pdf"
USCITA = RADICE / "src/assets/marchio/marchio-rilievo.png"
RITAGLIO = (92, 0, 868, 566)     # il lockup dentro img-005, con aria attorno
PECE = (10, 8, 6)


def main() -> None:
    import numpy as np
    from PIL import Image

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdfimages", "-png", "-f", "12", "-l", "12", str(PDF), f"{tmp}/p"], check=True)
        sorgenti = sorted(Path(tmp).glob("p-*.png"))
        if not sorgenti:
            raise SystemExit("nessuna immagine estratta da pagina 12")
        im = Image.open(sorgenti[0]).convert("RGB").crop(RITAGLIO)

    pece = np.array(PECE, float)

    # Tela estesa: il ritaglio del render occupa quasi tutta la sua superficie,
    # e una vignettatura calcolata su quel rettangolo non fa in tempo a
    # spegnersi prima del bordo — si vedrebbe il riquadro. Si aggiunge margine
    # di pece attorno e la sfumatura corre lì dentro.
    ow, oh = im.size
    w, h = int(ow * 1.30), int(oh * 1.38)
    tela = Image.new("RGB", (w, h), PECE)
    tela.paste(im, ((w - ow) // 2, (h - oh) // 2))
    A = np.asarray(tela, float)

    # il fondo scende al pece; l'ottone, molto più chiaro, resta intatto
    lum = A.mean(axis=2)
    soglia = np.percentile(lum[lum > 12], 52)
    peso = np.clip((soglia - lum) / max(soglia, 1.0), 0, 1)[..., None]
    A = A * (1 - peso) + pece * peso

    # Guadagno sul segnale che sta sopra il fondo: la foto è esposta per un
    # muro, non per un logo, e le lettere esterne restano in penombra.
    # La luce del set arriva da destra, quindi il guadagno cresce verso
    # sinistra e riporta le due metà del wordmark alla stessa resa.
    rampa = 1.42 + 0.34 * (1 - np.arange(w) / w)
    A = pece + (A - pece) * rampa[None, :, None]

    # vignettatura ellittica che comincia dentro il ritaglio e finisce nel margine
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (ow * 0.62)) ** 2 + ((yy - h / 2) / (oh * 0.56)) ** 2)
    s = np.clip((d - 0.54) / 0.46, 0, 1)
    s = (s * s * (3 - 2 * s)) ** 0.85
    A = A * (1 - s[..., None]) + pece * s[..., None]

    USCITA.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(A, 0, 255).astype("uint8")).save(USCITA)
    B = np.asarray(Image.open(USCITA), float)
    bordi = np.concatenate([B[:4].reshape(-1, 3), B[-4:].reshape(-1, 3),
                            B[:, :4].reshape(-1, 3), B[:, -4:].reshape(-1, 3)])
    print(f"scritto {USCITA.relative_to(RADICE)} ({w}×{h}) — "
          f"scarto dei bordi dal pece: {np.abs(bordi.mean(0) - pece).max():.2f}")


if __name__ == "__main__":
    main()
