"""
One graphic per company, each drawn from what the company actually does.
No stock, no labels, no placeholder text. Same palette as the site, so a
company page never looks like it borrowed its imagery from somewhere else.
Run: python3 scripts/art/companies.py
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'media', 'companies')
W, H = 2000, 1125
INK = (10, 11, 14)
BONE = (237, 238, 240)
STEEL = (154, 162, 172)
SS = 2


def base():
    img = Image.new('RGB', (W * SS, H * SS), INK)
    return img, ImageDraw.Draw(img, 'RGBA')


def finish(img, tint, at=(0.5, 0.45), strength=0.45):
    g = Image.new('RGB', (W * SS, H * SS), INK)
    gd = ImageDraw.Draw(g)
    cx, cy = at[0] * W * SS, at[1] * H * SS
    r = 0.95 * W * SS
    for i in range(34, 0, -1):
        t = i / 34
        rr = r * t
        a = (1 - t) ** 1.9
        gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                   fill=tuple(int(INK[k] + (tint[k] - INK[k]) * a) for k in range(3)))
    g = g.filter(ImageFilter.GaussianBlur(W * SS // 20))
    img = Image.blend(img, g, strength * 0.45)

    img = img.resize((W, H), Image.LANCZOS)
    noise = Image.effect_noise((W, H), 16).convert('L')
    lit = Image.blend(img, Image.new('RGB', (W, H), (255, 255, 255)), 0.045)
    img = Image.composite(img, lit, noise.point(lambda v: 255 if v > 152 else 0))
    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse([-W * 0.42, -H * 0.42, W * 1.42, H * 1.42], fill=255)
    return Image.composite(img, Image.new('RGB', (W, H), INK), vig.filter(ImageFilter.GaussianBlur(W // 10)))


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, name), 'JPEG', quality=90, optimize=True, progressive=True)
    print('wrote', name)


# ---- Civitas Europe: scattered evidence resolving into linked clusters ----
def civitas():
    img, d = base()
    rnd = random.Random(3)
    ACC = (86, 132, 255)

    clusters = [(0.30, 0.38, 7), (0.55, 0.62, 9), (0.74, 0.32, 6), (0.44, 0.20, 4)]
    nodes = []
    for cx, cy, n in clusters:
        grp = []
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            r = rnd.uniform(0.02, 0.10) * W
            grp.append((cx * W + math.cos(a) * r, cy * H + math.sin(a) * r * 1.4))
        nodes.append(grp)

    # loose, unlinked material
    for _ in range(70):
        x, y = rnd.uniform(0.03, 0.97) * W, rnd.uniform(0.06, 0.94) * H
        rr = rnd.uniform(1.6, 3.0) * SS
        d.ellipse([(x - rr) * SS, (y - rr) * SS, (x + rr) * SS, (y + rr) * SS], fill=(*BONE, 55))

    # within clusters: dense links
    for grp in nodes:
        for i, p in enumerate(grp):
            for q in grp[i + 1:]:
                d.line([(p[0] * SS, p[1] * SS), (q[0] * SS, q[1] * SS)], fill=(*ACC, 70), width=int(1.6 * SS))
    # between clusters: the one connection that matters
    a1, a2 = nodes[0][0], nodes[1][0]
    b1, b2 = nodes[1][2], nodes[2][1]
    for p, q in [(a1, a2), (b1, b2)]:
        d.line([(p[0] * SS, p[1] * SS), (q[0] * SS, q[1] * SS)], fill=(*ACC, 190), width=int(3 * SS))

    for gi, grp in enumerate(nodes):
        for p in grp:
            rr = 6 * SS
            d.ellipse([p[0] * SS - rr, p[1] * SS - rr, p[0] * SS + rr, p[1] * SS + rr], fill=(*ACC, 235))
            rr2 = 15 * SS
            d.ellipse([p[0] * SS - rr2, p[1] * SS - rr2, p[0] * SS + rr2, p[1] * SS + rr2],
                      outline=(*ACC, 90), width=int(1.6 * SS))
    return finish(img, (24, 40, 84), (0.48, 0.46))


# ---- Orcrist: a plan position indicator, one contact resolved ----
def orcrist():
    img, d = base()
    ACC = (150, 168, 190)
    cx, cy = 0.5 * W * SS, 0.52 * H * SS

    for k in range(1, 7):
        r = k * 0.084 * H * SS * 1.9
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*STEEL, 70 - k * 6), width=int(2 * SS))
    for a in range(0, 360, 15):
        rad = math.radians(a)
        r0, r1 = 0.06 * H * SS, 0.96 * H * SS
        w = 2.2 if a % 45 == 0 else 1.2
        al = 60 if a % 45 == 0 else 26
        d.line([(cx + math.cos(rad) * r0, cy + math.sin(rad) * r0),
                (cx + math.cos(rad) * r1, cy + math.sin(rad) * r1)],
               fill=(*STEEL, al), width=int(w * SS))

    # the sweep
    for i in range(46):
        a0 = -58 + i * 1.15
        al = int(90 * (i / 46) ** 2.4)
        r = 0.96 * H * SS
        d.pieslice([cx - r, cy - r, cx + r, cy + r], a0, a0 + 1.3, fill=(*ACC, al))

    rnd = random.Random(11)
    for _ in range(9):
        a = math.radians(rnd.uniform(-70, 40))
        r = rnd.uniform(0.18, 0.9) * H * SS
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        rr = 4 * SS
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*BONE, 110))

    # the resolved contact
    a = math.radians(-24)
    r = 0.62 * H * SS
    x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
    s = 26 * SS
    d.rectangle([x - s, y - s, x + s, y + s], outline=(*BONE, 240), width=int(3 * SS))
    d.line([(x - s * 1.9, y), (x - s * 1.15, y)], fill=(*BONE, 240), width=int(2.4 * SS))
    d.line([(x + s * 1.15, y), (x + s * 1.9, y)], fill=(*BONE, 240), width=int(2.4 * SS))
    rr = 7 * SS
    d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*BONE, 255))
    return finish(img, (22, 30, 44), (0.5, 0.5), 0.4)


# ---- Innoshare: one centre, the companies in orbit ----
def innoshare():
    img, d = base()
    ACC = (196, 186, 168)
    cx, cy = 0.42 * W * SS, 0.5 * H * SS

    orbits = [(0.17, 3, 0.4), (0.30, 4, 1.9), (0.43, 5, 3.3), (0.56, 3, 5.0)]
    for rf, n, phase in orbits:
        r = rf * W * SS
        d.ellipse([cx - r, cy - r * 0.78, cx + r, cy + r * 0.78], outline=(*STEEL, 52), width=int(1.8 * SS))
        for i in range(n):
            a = phase + i * math.tau / n
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.78
            rr = (9 - rf * 6) * SS
            d.line([(cx, cy), (x, y)], fill=(*ACC, 42), width=int(1.4 * SS))
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*ACC, 210))
            rr2 = rr * 2.6
            d.ellipse([x - rr2, y - rr2, x + rr2, y + rr2], outline=(*ACC, 70), width=int(1.5 * SS))

    for i in range(6, 0, -1):
        rr = i * 7 * SS
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*BONE, 26 * (7 - i)))
    return finish(img, (46, 42, 34), (0.42, 0.5), 0.42)


# ---- Fastic: the fasting window, closing ----
def fastic():
    img, d = base()
    ACC = (108, 196, 150)
    rnd = random.Random(5)

    cols, rows = 7, 4
    for r in range(rows):
        for c in range(cols):
            cx = (0.12 + c * 0.127) * W * SS
            cy = (0.20 + r * 0.205) * H * SS
            rad = 0.055 * W * SS
            pct = min(1.0, (r * cols + c) / (cols * rows - 1) + rnd.uniform(-0.06, 0.06))
            pct = max(0.06, pct)
            d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(*STEEL, 60), width=int(3 * SS))
            d.arc([cx - rad, cy - rad, cx + rad, cy + rad], -90, -90 + 360 * pct,
                  fill=(*ACC, int(120 + 130 * pct)), width=int(7 * SS))
            if pct > 0.94:
                rr = 6 * SS
                d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*ACC, 235))
    return finish(img, (18, 44, 34), (0.72, 0.68), 0.4)


# ---- LOVOO: a crowd, and the one match ----
def lovoo():
    img, d = base()
    ACC = (226, 104, 138)
    rnd = random.Random(13)

    pts = []
    for _ in range(190):
        x, y = rnd.uniform(0.03, 0.97) * W * SS, rnd.uniform(0.06, 0.94) * H * SS
        rr = rnd.uniform(2.2, 4.6) * SS
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*BONE, rnd.randint(35, 95)))
        pts.append((x, y))

    a = (0.34 * W * SS, 0.40 * H * SS)
    b = (0.63 * W * SS, 0.60 * H * SS)
    d.line([a, b], fill=(*ACC, 200), width=int(3 * SS))
    for p in (a, b):
        for i in range(5, 0, -1):
            rr = i * 6 * SS
            d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=(*ACC, 26 * (6 - i)))
        rr = 9 * SS
        d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=(*ACC, 245))
        rr2 = 24 * SS
        d.ellipse([p[0] - rr2, p[1] - rr2, p[0] + rr2, p[1] + rr2], outline=(*ACC, 110), width=int(2 * SS))
    return finish(img, (54, 22, 34), (0.48, 0.5), 0.38)


# ---- Appic: a portfolio, some of it acquired ----
def appic():
    img, d = base()
    ACC = (150, 168, 190)
    rnd = random.Random(29)
    cols, rows = 9, 5
    for r in range(rows):
        for c in range(cols):
            x = (0.075 + c * 0.098) * W * SS
            y = (0.14 + r * 0.18) * H * SS
            s = 0.036 * W * SS
            owned = rnd.random() < 0.28
            col = ACC if owned else BONE
            a = 190 if owned else 55
            d.rounded_rectangle([x - s, y - s, x + s, y + s], radius=int(s * 0.30),
                                outline=(*col, a), width=int(2.4 * SS))
            if owned:
                d.rounded_rectangle([x - s, y - s, x + s, y + s], radius=int(s * 0.30), fill=(*col, 34))
                rr = 5 * SS
                d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*col, 220))
    return finish(img, (26, 32, 44), (0.5, 0.5), 0.34)


# ---- Admiral Studio: an on-chain lattice, a few cells lit ----
def admiral():
    img, d = base()
    ACC = (150, 122, 226)
    rnd = random.Random(37)
    s = 0.052 * W * SS
    for row in range(9):
        for col in range(15):
            cx = 0.06 * W * SS + col * s * 1.5
            cy = 0.10 * H * SS + row * s * 1.732 + (col % 2) * s * 0.866
            pts = [(cx + s * math.cos(math.radians(60 * i)), cy + s * math.sin(math.radians(60 * i)))
                   for i in range(6)]
            lit = rnd.random() < 0.09
            d.polygon(pts, outline=(*(ACC if lit else BONE), 190 if lit else 34))
            if lit:
                d.polygon(pts, fill=(*ACC, 60))
    return finish(img, (38, 28, 62), (0.35, 0.42), 0.4)


save(civitas(), 'civitas-europe.jpg')
save(orcrist(), 'orcrist.jpg')
save(innoshare(), 'innoshare.jpg')
save(fastic(), 'fastic.jpg')
save(lovoo(), 'lovoo.jpg')
save(appic(), 'appic.jpg')
save(admiral(), 'admiral-studio.jpg')
