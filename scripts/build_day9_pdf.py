"""Build Sendhamil_Selvan_Phase1_Day9.pdf submission document using Pillow."""
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
        for i, line in enumerate(lines):
            self.ensure_space(26)
            if i == 0 and title and line.startswith(title + ":"):
                self.draw.text((MARGIN + 28, self.y), title + ":", font=F_BODY_B, fill="#0F172A")
                tw = self.draw.textlength(title + ":", font=F_BODY_B)
                rest = line[len(title) + 1:]
                self.draw.text((MARGIN + 28 + tw, self.y), rest, font=F_BODY, fill="#1E293B")
            else:
                self.draw.text((MARGIN + 28, self.y), line, font=F_BODY, fill="#1E293B")
            self.y += 24
        self.y += 4

    def add_image(self, path, caption):
        if not os.path.exists(path):
            self.para(f"[Missing image: {path}]", color="#DC2626")
            return
        im = Image.open(path).convert("RGB")
        max_w = A4_W - 2 * MARGIN
        scale = min(max_w / im.width, 620 / im.height)
        nw, nh = int(im.width * scale), int(im.height * scale)
        im_resized = im.resize((nw, nh), Image.Resampling.LANCZOS)

        self.ensure_space(nh + 56)
        x = MARGIN + (max_w - nw) // 2
        self.draw.rectangle([x - 2, self.y - 2, x + nw + 2, self.y + nh + 2], outline="#CBD5E1", width=2)
        self.img.paste(im_resized, (x, self.y))
        self.y += nh + 10
        self.draw.text((x, self.y), caption, font=F_SMALL, fill="#475569")
        self.y += 32

    def save(self, out_path):
        for idx, page in enumerate(self.pages, start=1):
            d = ImageDraw.Draw(page)
            footer = f"UNAI TECH Virtual Internship Program 2026  •  MessMeter Phase 1 Day 9  •  Page {idx}/{len(self.pages)}"
            d.line([MARGIN, A4_H - 56, A4_W - MARGIN, A4_H - 56], fill="#E2E8F0", width=1)
            d.text((MARGIN, A4_H - 42), footer, font=F_SMALL, fill="#64748B")
        self.pages[0].save(out_path, save_all=True, append_images=self.pages[1:])
        print(f"Generated {out_path} ({len(self.pages)} pages)")


def build():
    pdf = PdfBuilder()

    # Header Banner
    pdf.draw.rounded_rectangle([MARGIN, pdf.y, A4_W - MARGIN, pdf.y + 150], radius=14, fill="#ECFDF5", outline="#A7F3D0", width=2)
    pdf.draw.text((MARGIN + 26, pdf.y + 22), "MessMeter — Phase 1, Day 9 Submission", font=F_TITLE, fill="#064E3B")
    pdf.draw.text((MARGIN + 26, pdf.y + 70), "Database Design and Integration (PostgreSQL / Supabase & SQLite)", font=F_SUB, fill="#047857")
    pdf.draw.text((MARGIN + 26, pdf.y + 104), "Intern: Sendhamil Selvan   |   Domain: Web Development   |   Commit: 9e956eb (main)", font=F_BODY, fill="#334155")
    pdf.y += 174

    pdf.para("Updated GitHub Repository URL: https://github.com/ssenthamil078-create/Messmeter.git", bold=True, color="#0F172A")

    # 1. Database Fundamentals & Technology Choice
    pdf.h1("1. Database Fundamentals & Technology Stack")
    pdf.para(
        "MessMeter manages relational hostel mess data where referential integrity between students, "
        "scheduled meals, attendance check-ins, headcount forecasts, and kitchen leftovers is critical."
    )
    pdf.bullet("Primary / Cloud Database", "PostgreSQL (hosted on Supabase) for production multi-user persistence.")
    pdf.bullet("Local / Test Database", "SQLite (messmeter.db locally; in-memory sqlite:// for automated tests).")
    pdf.bullet("ORM & Driver", "SQLAlchemy 2.0 (DeclarativeBase, typed Mapped columns) with psycopg2-binary.")

    # 2. Entities, Fields & Relationships
    pdf.h1("2. Database Structure, Entities & Relationships")
    pdf.bullet("users (backend/app/models/user.py)", "id (PK), name, email (UNIQUE, INDEX), password_hash, role (student|staff|admin), is_active, created_at.")
    pdf.bullet("meals (backend/app/models/meal.py)", "id (PK), date (INDEX), meal_type (breakfast|lunch|dinner), menu_items (JSON), portion_sizes (JSON), cutoff_time, created_at.")
    pdf.bullet("checkins (backend/app/models/checkin.py)", "id (PK), user_id (FK -> users.id CASCADE), meal_id (FK -> meals.id CASCADE), status (eating|skipping), UniqueConstraint(user_id, meal_id).")
    pdf.bullet("forecasts (backend/app/models/forecast.py)", "id (PK), meal_id (FK -> meals.id CASCADE), predicted, low, high, confidence_score, actual_headcount, model_version, portion_plan (JSON).")
    pdf.bullet("leftovers (backend/app/models/leftover.py)", "id (PK), meal_id (FK -> meals.id CASCADE), dish, qty_cooked, qty_left, unit, recorded_by (FK -> users.id SET NULL), notes, timestamps.")

    pdf.add_image("docs/images/day9/01-database-schema-tables.png", "Figure 1: MessMeter 5-table relational database schema showing PKs, FKs, and unique constraints.")

    # 3. Database Connection & CRUD Operations
    pdf.h1("3. Database Connectivity & CRUD Operations Implemented")
    pdf.para(
        "backend/app/database.py reads DATABASE_URL from .env (excluded from Git via .gitignore), normalizes "
        "postgresql:// to postgresql+psycopg2://, enables pool_pre_ping=True, and provides per-request get_db() sessions. "
        "GET /api/health executes SELECT 1 to verify live database connectivity without exposing credentials."
    )
    pdf.bullet("Create", "POST /api/users, POST /api/meals, POST /api/leftovers (validates payloads and inserts rows).")
    pdf.bullet("Read", "GET /api/users, GET /api/meals, GET /api/meals/today, GET /api/checkins/me, GET /api/forecast/{meal_id}, GET /api/leftovers, GET /api/health.")
    pdf.bullet("Update", "PATCH /api/users/{id}, PATCH /api/meals/{id}, POST /api/checkins (upsert), PATCH /api/leftovers/{id}.")
    pdf.bullet("Delete", "DELETE /api/meals/{id} (cascades child records), DELETE /api/leftovers/{id}.")

    pdf.add_image("docs/images/day9/02-database-connectivity-crud.png", "Figure 2: Live /api/health SELECT 1 connectivity check, 5 registered tables, and 49/49 passing CRUD tests.")

    # 4. Challenges Encountered & Solutions
    pdf.h1("4. Challenges Encountered & Solutions")
    pdf.bullet("Multi-Dialect Compatibility (PostgreSQL vs SQLite)", "Used Enum(..., native_enum=False), JSON-serialized Text columns with @property helpers, and explicit tzinfo normalization for cutoff comparisons.")
    pdf.bullet("Driver URL Normalization", "Normalized postgresql:// to postgresql+psycopg2:// in database.py so Supabase connection strings work reliably.")
    pdf.bullet("Duplicate Prevention", "Enforced UniqueConstraint(user_id, meal_id) on checkins and 409 Conflict checks on (date, meal_type) in meals.")
    pdf.bullet("Offline / Network Resilience", "Handled OperationalError gracefully in main.py lifespan and GET /api/health so credentials are never leaked.")

    pdf.save("Sendhamil_Selvan_Phase1_Day9.pdf")


if __name__ == "__main__":
    build()
