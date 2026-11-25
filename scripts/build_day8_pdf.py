"""Build Sendhamil_Selvan_Phase1_Day8.pdf submission document using Pillow."""
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

A4_W, A4_H = 1240, 1754  # 150 DPI A4
MARGIN = 76


def load_font(size, bold=False, mono=False):
    if mono:
        candidates = ["C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/cour.ttf"]
    elif bold:
        candidates = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
    else:
        candidates = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


F_TITLE = load_font(34, bold=True)
F_SUB = load_font(18)
F_H1 = load_font(22, bold=True)
F_H2 = load_font(17, bold=True)
F_BODY = load_font(15)
F_BODY_B = load_font(15, bold=True)
F_MONO = load_font(13, mono=True)
F_SMALL = load_font(13)


class PdfBuilder:
    def __init__(self):
        self.pages = []
        self.new_page()

    def new_page(self):
        self.img = Image.new("RGB", (A4_W, A4_H), "#FFFFFF")
        self.draw = ImageDraw.Draw(self.img)
        self.pages.append(self.img)
        self.y = MARGIN
        # Subtle top accent bar
        self.draw.rectangle([0, 0, A4_W, 14], fill="#065F46")
        self.y = 58

    def ensure_space(self, height_needed):
        if self.y + height_needed > A4_H - MARGIN - 40:
            self.new_page()

    def h1(self, text):
        self.ensure_space(60)
        self.y += 10
        self.draw.text((MARGIN, self.y), text, font=F_H1, fill="#064E3B")
        self.y += 32
        self.draw.line([MARGIN, self.y, A4_W - MARGIN, self.y], fill="#D1FAE5", width=2)
        self.y += 16

    def h2(self, text):
        self.ensure_space(40)
        self.y += 6
        self.draw.text((MARGIN, self.y), text, font=F_H2, fill="#0F172A")
        self.y += 28

    def para(self, text, bold=False, color="#1E293B", indent=0):
        font = F_BODY_B if bold else F_BODY
        max_chars = int((A4_W - 2 * MARGIN - indent) / 8.2)
        lines = textwrap.wrap(text, width=max_chars)
        for line in lines:
            self.ensure_space(26)
            self.draw.text((MARGIN + indent, self.y), line, font=font, fill=color)
            self.y += 24
        self.y += 6

    def bullet(self, title, text):
        self.ensure_space(30)
        self.draw.text((MARGIN + 10, self.y), "•", font=F_BODY_B, fill="#059669")
        full = f"{title}: {text}" if title else text
        max_chars = int((A4_W - 2 * MARGIN - 30) / 8.2)
        lines = textwrap.wrap(full, width=max_chars)
        for idx, line in enumerate(lines):
            self.ensure_space(24)
            self.draw.text((MARGIN + 28, self.y), line, font=F_BODY, fill="#1E293B")
            self.y += 23
        self.y += 4

    def code_block(self, lines):
        block_h = len(lines) * 20 + 24
        self.ensure_space(block_h + 12)
        self.draw.rounded_rectangle(
            [MARGIN, self.y, A4_W - MARGIN, self.y + block_h],
            radius=8,
            fill="#F8FAFC",
            outline="#CBD5E1",
            width=1,
        )
        cy = self.y + 12
        for ln in lines:
            self.draw.text((MARGIN + 16, cy), ln[:96], font=F_MONO, fill="#0F172A")
            cy += 20
        self.y += block_h + 14

    def image_with_caption(self, img_path, caption):
        if not os.path.exists(img_path):
            self.para(f"[Missing image: {img_path}]", color="#DC2626")
            return
        im = Image.open(img_path).convert("RGB")
        target_w = A4_W - 2 * MARGIN
        scale = target_w / im.width
        target_h = int(im.height * scale)
        self.ensure_space(target_h + 50)
        im_resized = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
        self.img.paste(im_resized, (MARGIN, self.y))
        self.draw.rectangle([MARGIN, self.y, MARGIN + target_w, self.y + target_h], outline="#CBD5E1", width=1)
        self.y += target_h + 10
        self.draw.text((MARGIN, self.y), caption, font=F_SMALL, fill="#475569")
        self.y += 30

    def finalize_footers(self):
        total = len(self.pages)
        for i, page in enumerate(self.pages, start=1):
            d = ImageDraw.Draw(page)
            d.line([MARGIN, A4_H - 58, A4_W - MARGIN, A4_H - 58], fill="#E2E8F0", width=1)
            d.text(
                (MARGIN, A4_H - 44),
                "MessMeter | UNAI TECH Virtual Internship Program 2026 - Phase 1 Day 8",
                font=F_SMALL,
                fill="#64748B",
            )
            d.text(
                (A4_W - MARGIN - 90, A4_H - 44),
                f"Page {i} of {total}",
                font=F_SMALL,
                fill="#64748B",
            )

    def save(self, out_path):
        self.finalize_footers()
        self.pages[0].save(
            out_path,
            "PDF",
            resolution=150.0,
            save_all=True,
            append_images=self.pages[1:],
        )
        print(f"Generated {out_path} ({len(self.pages)} pages)")


def build():
    pdf = PdfBuilder()

    # Cover Header Banner
    pdf.draw.rounded_rectangle([MARGIN, pdf.y, A4_W - MARGIN, pdf.y + 150], radius=12, fill="#064E3B")
    pdf.draw.text((MARGIN + 28, pdf.y + 24), "PHASE 1 | DAY 8 - ADVANCED FUNCTIONALITY", font=F_SMALL, fill="#A7F3D0")
    pdf.draw.text((MARGIN + 28, pdf.y + 48), "MessMeter: Headcount Forecasting & Portion Planner", font=F_TITLE, fill="#FFFFFF")
    pdf.draw.text(
        (MARGIN + 28, pdf.y + 98),
        "UNAI TECH Virtual Internship Program 2026   |   Intern: Sendhamil Selvan",
        font=F_SUB,
        fill="#D1FAE5",
    )
    pdf.y += 176

    # 1. Repository & Project Details
    pdf.h1("1. Repository & Submission Metadata")
    pdf.bullet("Project Title", "MessMeter - Smart Hostel Mess Turnout Prediction & Kitchen Waste Reduction System")
    pdf.bullet("GitHub Repository URL", "https://github.com/ssenthamil078-create/Messmeter.git")
    pdf.bullet("Database", "Supabase Cloud PostgreSQL 17 (with SQLite fallback for local/offline test execution)")
    pdf.bullet("Tech Stack", "FastAPI, SQLAlchemy, Pydantic, React 18, Vite, Tailwind CSS, Pillow")

    # 2. Week 1 Review & Bug Fixes
    pdf.h1("2. Review & Refinement of Week 1 Implementation")
    pdf.para(
        "Before implementing Day 8's advanced features, all Day 5 and Day 6 modules (M2 Authentication & Roles, "
        "M3 Meals & Menu Management, and M4 Student Check-In) were reviewed and verified:"
    )
    pdf.bullet(
        "UI Cleanup (Status Card Duplication Fix)",
        "Resolved an issue where StatusCard.jsx rendered hardcoded 'Backend status: Connected: MessMeter API (development)' "
        "messages repeatedly across pages. Refactored StatusCard to accept dynamic title, value, subtitle, and badge props.",
    )
    pdf.bullet(
        "API & Database Verification",
        "Confirmed JWT authentication, role-based access control, meal scheduling with portion sizes, and cut-off time "
        "enforcement continue to work without regression.",
    )

    # 3. New Feature Explanation
    pdf.h1("3. Newly Developed Features (Modules M7 & M8)")
    pdf.h2("Module M7: Headcount Forecasting Engine")
    pdf.para(
        "Instead of waiting until cut-off or guessing how many pending students will arrive, the forecasting engine "
        "combines live confirmed student check-ins with historical turnout estimation for non-responders:"
    )
    pdf.bullet("Inputs", "Total active students (N), confirmed eating (E), confirmed skipping (S), and non-responders U = N - (E + S).")
    pdf.bullet(
        "Blended Prior Turnout",
        "Applies weekday/weekend meal priors (e.g., 75% weekday lunch, 50% weekend lunch) blended with 70% historical "
        "attendance from up to the last 14 past meals of the same meal type.",
    )
    pdf.bullet(
        "Confidence & Bounds",
        "Outputs predicted headcount H = E + round(U * P_attend), expected [low, high] interval, and a confidence score "
        "that scales from 50% up to 100% as student response rate approaches 100%.",
    )

    pdf.h2("Module M8: Automated Portion Planner")
    pdf.para(
        "Connects directly to Module M3 (Meal portion_sizes) and Module M7 (Predicted Headcount). It parses per-person "
        "portion strings such as '0.35 kg', '0.15 L', or '2 pcs' and calculates Recommended, Minimum, and Maximum batch "
        "cooking quantities for every dish on the menu."
    )

    pdf.h2("Frontend Integration (Kitchen Operations Dashboard)")
    pdf.para(
        "Updated frontend/src/pages/KitchenPage.jsx to fetch GET /api/forecast/{meal_id} alongside live check-in summaries, "
        "rendering a dedicated Headcount Forecast & Smart Portion Plan card with a one-click 'Recalculate Forecast' button "
        "(POST /api/forecast/{meal_id}/recalculate)."
    )

    # 4. Source Code Highlights
    pdf.h1("4. Source Code of Newly Developed Feature")
    pdf.para("Key files added or updated for Day 8:")
    pdf.code_block([
        "backend/app/models/forecast.py          # SQLAlchemy Forecast table (predicted, low, high, confidence)",
        "backend/app/schemas/forecast.py         # ForecastOut & PortionTarget Pydantic schemas",
        "backend/app/services/forecast.py        # Non-responder estimation & historical blending logic",
        "backend/app/services/portion_planner.py # Regex unit parser & batch cooking target calculator",
        "backend/app/api/forecast.py             # GET /api/forecast/{meal_id} & POST .../recalculate",
        "backend/app/main.py                     # Registered forecast.router under /api",
        "frontend/src/pages/KitchenPage.jsx      # Forecast KPI cards, Portion Targets table, Recalculate UI",
        "backend/tests/test_forecast.py          # Unit & integration tests for M7 and M8",
    ])

    # 5. Screenshots
    pdf.h1("5. Implementation Screenshots")
    pdf.image_with_caption(
        os.path.join("docs", "images", "day8", "01-kitchen-forecast-panel.png"),
        "Figure 1: Kitchen Operations Dashboard displaying live turnout metrics, Headcount Forecast (89% confidence), and Smart Portion Targets.",
    )
    pdf.image_with_caption(
        os.path.join("docs", "images", "day8", "02-forecast-recalculate-interaction.png"),
        "Figure 2: Live forecast recalculation after late check-ins arrive, updating confidence to 96% and tightening batch cooking bounds.",
    )

    # 6. Testing Results & Challenges
    pdf.h1("6. Testing Results & Challenges Encountered")
    pdf.h2("Automated Test Results")
    pdf.code_block([
        "$ python backend/run_tests.py",
        "==================================================",
        "MESSMETER BACKEND TEST SUITE - PHASE 1 DAY 8",
        "==================================================",
        "TEST RESULTS: 41 PASSED, 0 FAILED",
        "",
        "$ cd frontend && npm run build",
        "vite v8.3.8 building client environment for production... built in 528ms",
    ])

    pdf.h2("Challenges & Resolutions")
    pdf.bullet(
        "Challenge 1 - Repeated Status Card Messages",
        "StatusCard.jsx previously rendered a hardcoded backend connection string in 4 grid boxes on the Kitchen Dashboard. "
        "Resolved by parameterizing StatusCard props and verifying zero remaining occurrences across frontend/src.",
    )
    pdf.bullet(
        "Challenge 2 - Kitchen Display Authentication",
        "Kitchen monitor screens often load without an interactive login session. Aligned GET/POST /api/forecast/{meal_id} "
        "with /api/checkins/summary/{meal_id} so kitchen staff displays fetch forecasts without 401 errors.",
    )
    pdf.bullet(
        "Challenge 3 - Portion Parser Signature & Test State",
        "Initial test run caught a missing 'dishes' parameter in calculate_portion_plan and a deactivated test user affecting "
        "non-responder counts. Corrected test assertions and reactivated test student fixtures to reach 41/41 passing tests.",
    )

    pdf.save("Sendhamil_Selvan_Phase1_Day8.pdf")


if __name__ == "__main__":
    build()
