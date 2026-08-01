"""
The three newsroom cover graphics.
Each is an argument rather than decoration: the stack and the layer somebody
else controls, sensor arcs resolving into one track, and an audit trail with a
single reconstructable path.

They have to read twice: as a 400px card and as a full width header. That is
why the shapes are few and the contrast is high.
Run: python3 scripts/art/covers.py
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'media', 'articles')
W, H = 2000, 1125
INK = (10, 11, 14)
BONE = (237, 238, 240)
STEEL = (154, 162, 172)
SIGNAL = (86, 132, 255)
SS = 2


def base(bg=INK):
    img = Image.new('RGB', (W * SS, H * SS), bg)
    return img, ImageDraw.Draw(img, 'RGBA')


def finish(img, tint=None, tint_at=(0.5, 0.5), strength=0.35):
    """Downsample, add a soft directional tint, a little grain, a light vignette."""
    if tint:
        g = Image.new('RGB', (W * SS, H * SS), INK)
        gd = ImageDraw.Draw(g)
        cx, cy = tint_at[0] * W * SS, tint_at[1] * H * SS
        r = 0.9 * W * SS
        for i in range(34, 0, -1):
            t = i / 34
            rr = r * t
            a = (1 - t) ** 1.9
            gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                       fill=tuple(int(INK[k] + (tint[k] - INK[k]) * a) for k in range(3)))
        g = g.filter(ImageFilter.GaussianBlur(W * SS // 20))
        img = Image.blend(img, Image.blend(img, g, 1.0), 0.0)  # keep the drawing
        img = Image.blend(g, img, 1 - strength * 0.0)          # tint sits underneath
        # composite the tint behind by screening it in gently
        img = Image.blend(img, g, strength * 0.45)

    img = img.resize((W, H), Image.LANCZOS)

    noise = Image.effect_noise((W, H), 16).convert('L')
    lit = Image.blend(img, Image.new('RGB', (W, H), (255, 255, 255)), 0.05)
    img = Image.composite(img, lit, noise.point(lambda v: 255 if v > 152 else 0))

    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse([-W * 0.42, -H * 0.42, W * 1.42, H * 1.42], fill=255)
    img = Image.composite(img, Image.new('RGB', (W, H), INK), vig.filter(ImageFilter.GaussianBlur(W // 10)))
    return img


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    img.save(p, 'JPEG', quality=90, optimize=True, progressive=True)
    print('wrote', name)


# ----------------------------------------------------------------------
# 1. Sovereign European AI: six layers of a stack, one of them not yours
# ----------------------------------------------------------------------
def stack():
    img, d = base()
    rnd = random.Random(7)

    # (top, height, hatch count, tone, is_the_dependency)
    layers = [
        (0.055, 0.115, 16, 30, False),
        (0.190, 0.115, 22, 46, False),
        (0.325, 0.140, 13, 96, True),
        (0.485, 0.115, 28, 62, False),
        (0.620, 0.115, 34, 44, False),
        (0.755, 0.150, 19, 78, False),
    ]

    for y0, hh, count, tone, dep in layers:
        top, bot = y0 * H * SS, (y0 + hh) * H * SS
        col = SIGNAL if dep else BONE
        fill_a = int(tone * (0.42 if dep else 0.20))
        d.rectangle([0, top, W * SS, bot], fill=(*col, fill_a))

        gap = (W * SS) / count
        for i in range(count + 1):
            x = i * gap
            inside = 0.30 < i / count < 0.66
            if dep and inside:
                shift = 40 * SS
                d.line([(x + shift, top + 18 * SS), (x + shift, bot - 18 * SS)],
                       fill=(*SIGNAL, 235), width=int(5 * SS))
            else:
                d.line([(x, top + 6 * SS), (x, bot - 6 * SS)],
                       fill=(*col, int(tone * 1.9)), width=int(2.6 * SS))

        for e in (top, bot):
            d.line([(0, e), (W * SS, e)], fill=(*col, int(tone * 2.6)), width=int(2.2 * SS))

    # where control changes hands
    sx = 0.485 * W * SS
    for y in range(0, H * SS, 26 * SS):
        d.line([(sx, y), (sx, y + 13 * SS)], fill=(*SIGNAL, 130), width=int(2 * SS))

    return finish(img, tint=(26, 40, 78), tint_at=(0.5, 0.40), strength=0.5)


# ----------------------------------------------------------------------
# 2. Defence: many sensors, one resolved track
# ----------------------------------------------------------------------
def fusion():
    img, d = base()
    rnd = random.Random(23)

    for ox, oy, rings in [(0.06, 1.05, 9), (0.35, 1.10, 8), (0.68, 1.04, 9), (0.97, 1.12, 7)]:
        cx, cy = ox * W * SS, oy * H * SS
        for k in range(1, rings + 1):
            r = (0.16 + k * 0.125) * H * SS * 1.7
            a = int(120 * (1 - k / (rings + 2)))
            d.arc([cx - r, cy - r, cx + r, cy + r], 188, 352,
                  fill=(*STEEL, a), width=int(2.4 * SS))
        for _ in range(3):
            ang = math.radians(rnd.uniform(202, 338))
            L = rnd.uniform(0.8, 1.3) * H * SS
            d.line([(cx, cy), (cx + math.cos(ang) * L, cy + math.sin(ang) * L)],
                   fill=(*STEEL, 52), width=int(1.8 * SS))

    # unresolved contacts, faint
    for t in range(6):
        x = rnd.uniform(0.05, 0.9) * W * SS
        y = rnd.uniform(0.12, 0.72) * H * SS
        for s in range(7):
            rr = 3.4 * SS
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*BONE, 60))
            x += rnd.uniform(0.012, 0.03) * W * SS
            y += rnd.uniform(-0.02, 0.02) * H * SS

    # the one track that fuses
    pts = []
    x, y = 0.08 * W * SS, 0.62 * H * SS
    for s in range(16):
        pts.append((x, y))
        x += 0.038 * W * SS
        y -= 0.021 * H * SS + math.sin(s * 0.5) * 0.004 * H * SS
    d.line(pts, fill=(*SIGNAL, 210), width=int(3 * SS))
    for i, (px, py) in enumerate(pts):
        rr = (2.4 + 4.4 * (i / len(pts))) * SS
        d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(*SIGNAL, int(90 + 165 * i / len(pts))))

    lx, ly = pts[-1]
    s = 30 * SS
    d.rectangle([lx - s, ly - s, lx + s, ly + s], outline=(*BONE, 235), width=int(3 * SS))
    for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
        d.line([(lx + dx * s, ly + dy * s), (lx + dx * s * 0.55, ly + dy * s)], fill=(*BONE, 245), width=int(3.4 * SS))
    rr = 7 * SS
    d.ellipse([lx - rr, ly - rr, lx + rr, ly + rr], fill=(*BONE, 255))

    return finish(img, tint=(20, 34, 60), tint_at=(0.66, 0.34), strength=0.45)


# ----------------------------------------------------------------------
# 3. Public trust: a log, and the one entry you can trace back
# ----------------------------------------------------------------------
def audit():
    img, d = base()
    rnd = random.Random(41)

    rows = 15
    left, right = 0.085 * W * SS, 0.915 * W * SS
    top = 0.11 * H * SS
    row_h = (0.78 * H * SS) / rows
    marked = 9

    for i in range(rows):
        y = top + i * row_h
        lit = i == marked
        depth = 0.45 + 0.55 * (i / rows)
        a = int(150 * depth)
        col = SIGNAL if lit else BONE

        d.rectangle([left - 78 * SS, y + row_h * 0.34, left - 24 * SS, y + row_h * 0.34 + 6 * SS],
                    fill=(*STEEL, int(a * 0.9)))

        x = left
        rnd.seed(200 + i)
        while x < right - 60 * SS:
            wdt = rnd.choice([40, 62, 84, 118, 150]) * SS
            if x + wdt > right:
                wdt = right - x
            d.rectangle([x, y + row_h * 0.34, x + wdt, y + row_h * 0.34 + 6 * SS],
                        fill=(*col, int(a * (1.7 if lit else 1.0))))
            x += wdt + rnd.choice([16, 24, 34]) * SS

        d.line([(left - 92 * SS, y + row_h * 0.92), (right, y + row_h * 0.92)],
               fill=(*BONE, int(a * 0.28)), width=int(1.6 * SS))

    ym = top + marked * row_h
    d.rectangle([left - 100 * SS, ym - row_h * 0.06, right + 26 * SS, ym + row_h * 0.82],
                outline=(*SIGNAL, 210), width=int(2.6 * SS))

    # the path back to the source
    ox = right - 180 * SS
    oy = top + 1.4 * row_h
    d.line([(ox, ym + row_h * 0.4), (ox, oy)], fill=(*SIGNAL, 190), width=int(2.6 * SS))
    d.line([(ox, oy), (left + 70 * SS, oy)], fill=(*SIGNAL, 190), width=int(2.6 * SS))
    for px, py in [(ox, ym + row_h * 0.4), (ox, oy), (left + 70 * SS, oy)]:
        rr = 9 * SS
        d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(*SIGNAL, 255))
        rr2 = 17 * SS
        d.ellipse([px - rr2, py - rr2, px + rr2, py + rr2], outline=(*SIGNAL, 120), width=int(2 * SS))

    return finish(img, tint=(24, 30, 52), tint_at=(0.42, 0.55), strength=0.4)


save(stack(), 'sovereign-european-ai.jpg')
save(fusion(), 'defence-technology-engineers.jpg')
save(audit(), 'public-trust-ai.jpg')
