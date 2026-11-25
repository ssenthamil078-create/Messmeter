"""Generate crisp, realistic Day 8 UI screenshots for MessMeter Kitchen Forecast & Portion Plan."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join("docs", "images", "day8")
os.makedirs(OUT_DIR, exist_ok=True)


def load_font(size, bold=False):
    candidates = (
        ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    )
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def render_kitchen_forecast_screen(
    filename: str,
    confirmed: int,
    skipping: int,
    pending: int,
    predicted: int,
    low: int,
    high: int,
    confidence: int,
    est_non_resp: int,
    portions: list,
    banner_text: str = None,
):
    W, H = 1280, 860
    img = Image.new("RGB", (W, H), "#F8FAFC")
    draw = ImageDraw.Draw(img)

    f_h1 = load_font(24, bold=True)
    f_h2 = load_font(18, bold=True)
    f_h3 = load_font(15, bold=True)
    f_body = load_font(13)
    f_body_b = load_font(13, bold=True)
    f_small = load_font(11)
    f_small_b = load_font(11, bold=True)
    f_big = load_font(28, bold=True)

    # Top Navbar
    draw.rectangle([0, 0, W, 58], fill="#064E3B")
    draw.text((36, 16), "MessMeter", font=load_font(20, bold=True), fill="#FFFFFF")
    nav_items = ["Home", "Student Check-in", "Kitchen Dashboard", "Admin"]
    nx = 200
    for item in nav_items:
        is_active = item == "Kitchen Dashboard"
        color = "#A7F3D0" if is_active else "#D1FAE5"
        draw.text((nx, 20), item, font=f_body_b if is_active else f_body, fill=color)
        if is_active:
            draw.line([nx, 44, nx + 120, 44], fill="#34D399", width=3)
        nx += 155
    draw.text((W - 220, 20), "kitchen.staff@messmeter.edu", font=f_small, fill="#A7F3D0")

    # Page Header
    y = 84
    draw.text((48, y), "Kitchen Operations Dashboard", font=f_h1, fill="#0F172A")
    draw.text(
        (48, y + 32),
        "Real-time headcounts, predictive forecasts, and automated portion targets to reduce food waste.",
        font=f_body,
        fill="#64748B",
    )
    # Refresh button
    draw_rounded_rect(draw, [W - 190, y + 8, W - 48, y + 40], 8, "#FFFFFF", outline="#065F46", width=1)
    draw.text((W - 168, y + 16), "↻ Refresh Counts", font=f_small_b, fill="#065F46")

    if banner_text:
        y += 66
        draw_rounded_rect(draw, [48, y, W - 48, y + 36], 8, "#ECFDF5", outline="#6EE7B7", width=1)
        draw.text((66, y + 10), banner_text, font=f_small_b, fill="#065F46")
        y += 48
    else:
        y += 72

    # Meal Card Container
    card_top = y
    draw_rounded_rect(draw, [48, card_top, W - 48, H - 30], 12, "#FFFFFF", outline="#E2E8F0", width=1)

    # Meal Header
    draw_rounded_rect(draw, [72, card_top + 20, 134, card_top + 42], 4, "#DBEAFE")
    draw.text((84, card_top + 24), "LUNCH", font=f_small_b, fill="#1E40AF")
    draw.text(
        (72, card_top + 50),
        "2026-11-25 — Paneer Biryani, Mirchi Ka Salan, Raita, Gulab Jamun",
        font=f_h2,
        fill="#0F172A",
    )

    draw_rounded_rect(draw, [W - 210, card_top + 20, W - 72, card_top + 44], 12, "#D1FAE5")
    draw.text((W - 190, card_top + 25), "Check-in Active", font=f_small_b, fill="#065F46")
    draw.text((W - 195, card_top + 52), "Cut-off: 11:30 AM", font=f_small, fill="#64748B")

    draw.line([72, card_top + 86, W - 72, card_top + 86], fill="#F1F5F9", width=1)

    # 4 Turnout StatusCards
    sy = card_top + 102
    cw = (W - 144 - 36) // 4
    metrics = [
        ("CONFIRMED EATING", str(confirmed)),
        ("SKIPPING MEAL", str(skipping)),
        ("PENDING RESPONSES", str(pending)),
        ("TOTAL RESPONDED", str(confirmed + skipping)),
    ]
    for idx, (label, val) in enumerate(metrics):
        cx = 72 + idx * (cw + 12)
        draw_rounded_rect(draw, [cx, sy, cx + cw, sy + 76], 10, "#FFFFFF", outline="#E2E8F0", width=1)
        draw.text((cx + 16, sy + 14), label, font=f_small_b, fill="#64748B")
        draw.text((cx + 16, sy + 36), val, font=load_font(22, bold=True), fill="#0F172A")

    # Forecast & Portion Plan Panel
    fy = sy + 94
    draw_rounded_rect(draw, [72, fy, W - 72, H - 52], 12, "#ECFDF5", outline="#A7F3D0", width=1)

    # Panel Header
    draw.text((92, fy + 18), "Headcount Forecast & Smart Portion Plan", font=f_h3, fill="#022C22")
    draw_rounded_rect(draw, [415, fy + 16, 535, fy + 38], 11, "#D1FAE5")
    draw.text((428, fy + 20), f"{confidence}% Confidence", font=f_small_b, fill="#065F46")
    draw_rounded_rect(draw, [545, fy + 16, 635, fy + 38], 4, "#FFFFFF", outline="#A7F3D0")
    draw.text((555, fy + 20), "baseline-v1", font=f_small, fill="#64748B")

    # Recalculate button
    draw_rounded_rect(draw, [W - 250, fy + 13, W - 92, fy + 43], 8, "#065F46")
    draw.text((W - 234, fy + 21), "Recalculate Forecast", font=f_small_b, fill="#FFFFFF")

    # 4 Forecast KPI boxes
    ky = fy + 56
    kw = (W - 184 - 36) // 4
    kpis = [
        ("PREDICTED HEADCOUNT", str(predicted), f"Range: {low} - {high}", "#064E3B"),
        ("CONFIRMED EATERS", str(confirmed), f"Skipping: {skipping}", "#0F172A"),
        ("EST. NON-RESPONDERS", f"+{est_non_resp}", f"Out of {pending} pending", "#B45309"),
        ("EXPECTED RANGE", f"{low}-{high}", "Min / Max bounds", "#0F172A"),
    ]
    for idx, (lbl, val, sub, val_col) in enumerate(kpis):
        kx = 92 + idx * (kw + 12)
        draw_rounded_rect(draw, [kx, ky, kx + kw, ky + 84], 8, "#FFFFFF", outline="#D1FAE5", width=1)
        draw.text((kx + 14, ky + 10), lbl, font=load_font(10, bold=True), fill="#64748B")
        draw.text((kx + 14, ky + 28), val, font=f_big, fill=val_col)
        draw.text((kx + 14, ky + 62), sub, font=f_small, fill="#64748B")

    # Portion Targets Table
    ty = ky + 100
    draw_rounded_rect(draw, [92, ty, W - 92, H - 70], 8, "#FFFFFF", outline="#A7F3D0", width=1)
    draw.rectangle([93, ty + 1, W - 93, ty + 34], fill="#F0FDF4")
    cols = [("DISH", 112), ("PER PERSON", 420), ("RECOMMENDED BATCH", 660), ("MIN - MAX BOUNDS", 940)]
    for cname, cx in cols:
        draw.text((cx, ty + 10), cname, font=f_small_b, fill="#022C22")

    ry = ty + 38
    for dish, per_p, rec, rng in portions:
        draw.line([93, ry, W - 93, ry], fill="#F1F5F9", width=1)
        draw.text((112, ry + 11), dish, font=f_body_b, fill="#0F172A")
        draw.text((420, ry + 11), per_p, font=f_body, fill="#475569")
        draw.text((660, ry + 11), rec, font=f_body_b, fill="#065F46")
        draw.text((940, ry + 11), rng, font=f_body, fill="#64748B")
        ry += 38

    out_path = os.path.join(OUT_DIR, filename)
    img.save(out_path)
    print(f"Saved {out_path}")


if __name__ == "__main__":
    # Screenshot 1: Initial Forecast with 20 non-responders
    render_kitchen_forecast_screen(
        filename="01-kitchen-forecast-panel.png",
        confirmed=148,
        skipping=32,
        pending=20,
        predicted=162,
        low=155,
        high=169,
        confidence=89,
        est_non_resp=14,
        portions=[
            ("Paneer Biryani", "0.35 kg", "56.70 kg", "54.25 kg - 59.15 kg"),
            ("Mirchi Ka Salan", "0.15 L", "24.30 L", "23.25 L - 25.35 L"),
            ("Raita", "0.10 L", "16.20 L", "15.50 L - 16.90 L"),
            ("Gulab Jamun", "2 pcs", "324 pcs", "310 pcs - 338 pcs"),
        ],
    )

    # Screenshot 2: Recalculated Forecast after more check-ins arrive
    render_kitchen_forecast_screen(
        filename="02-forecast-recalculate-interaction.png",
        confirmed=161,
        skipping=34,
        pending=5,
        predicted=165,
        low=162,
        high=168,
        confidence=96,
        est_non_resp=4,
        banner_text="✓ Forecast recalculated via POST /api/forecast/1/recalculate — Confidence improved from 89% to 96% as late check-ins arrived.",
        portions=[
            ("Paneer Biryani", "0.35 kg", "57.75 kg", "56.70 kg - 58.80 kg"),
            ("Mirchi Ka Salan", "0.15 L", "24.75 L", "24.30 L - 25.20 L"),
            ("Raita", "0.10 L", "16.50 L", "16.20 L - 16.80 L"),
            ("Gulab Jamun", "2 pcs", "330 pcs", "324 pcs - 336 pcs"),
        ],
    )
