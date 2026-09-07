#!/usr/bin/env python3
"""
Rigenera public/og-enea.jpg (anteprima social 1200x630).

La sorgente è scripts/og.astro: viene montata in src/pages solo per il tempo
dello scatto, così il sito pubblicato non contiene pagine di servizio.
Usa i componenti veri (Logo, Pino) e i font self-hosted: l'anteprima non può
divergere dal marchio del sito.

    uv run --with playwright python scripts/genera-og.py
"""
import shutil, socket, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
SORGENTE = RADICE / "scripts/og.astro"
MONTATA = RADICE / "src/pages/og.astro"
USCITA = RADICE / "public/og-enea.jpg"


def porta_libera() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> int:
    from playwright.sync_api import sync_playwright

    porta = porta_libera()
    shutil.copy(SORGENTE, MONTATA)
    server = subprocess.Popen(
        ["pnpm", "dev", "--port", str(porta)],
        cwd=RADICE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    try:
        url = f"http://localhost:{porta}/og"
        # attesa attiva sull'HTTP, non sul socket: Astro fa il bind su "localhost",
        # che su macOS risolve prima ::1 e non risponde su 127.0.0.1
        for _ in range(60):
            try:
                urllib.request.urlopen(url, timeout=1)
                break
            except urllib.error.HTTPError:
                break
            except OSError:
                time.sleep(0.5)
        else:
            server.terminate()
            print("dev server non partito:", (server.stdout.read() if server.stdout else "")[-1500:],
                  file=sys.stderr)
            return 1

        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
            pg.goto(url, wait_until="networkidle")
            pg.add_style_tag(content="astro-dev-toolbar{display:none!important}")
            pg.wait_for_timeout(1200)
            pg.screenshot(path=str(USCITA), type="jpeg", quality=90)
            b.close()
    finally:
        server.terminate()
        server.wait(timeout=10)
        MONTATA.unlink(missing_ok=True)

    print(f"scritto {USCITA.relative_to(RADICE)} ({USCITA.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
