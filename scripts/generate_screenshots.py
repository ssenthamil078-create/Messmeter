"""Script to generate UI screenshots for Day 6 documentation and report."""
from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = "C:\\Windows\\Fonts\\segoeui.ttf"
FONT_BOLD_PATH = "C:\\Windows\\Fonts\\segoeuib.ttf"


def get_fonts():
    try:
        f_title = ImageFont.truetype(FONT_BOLD_PATH, 28)
        f_heading = ImageFont.truetype(FONT_BOLD_PATH, 20)
        f_sub = ImageFont.truetype(FONT_PATH, 16)
        f_body = ImageFont.truetype(FONT_PATH, 15)
        f_bold = ImageFont.truetype(FONT_BOLD_PATH, 15)
        f_small = ImageFont.truetype(FONT_PATH, 13)
        f_small_bold = ImageFont.truetype(FONT_BOLD_PATH, 13)
        f_stat = ImageFont.truetype(FONT_BOLD_PATH, 32)
    except Exception:
        f_title = f_heading = f_sub = f_body = f_bold = f_small = f_small_bold = f_stat = ImageFont.load_default()
    return f_title, f_heading, f_sub, f_body, f_bold, f_small, f_small_bold, f_stat


def draw_navbar(draw, user_name, user_role, active_tab="Admin"):
    # Navbar background (emerald-900)
    draw.rectangle([0, 0, 2000, 70], fill="#064e3b")
    f_title, f_heading, f_sub, f_body, f_bold, f_small, f_small_bold, _ = get_fonts()

    # Logo + Brand
    draw.ellipse([40, 18, 74, 52], fill="#10b981")
    draw.text((85, 20), "MessMeter", fill="#ffffff", font=f_heading)

    # Links
    links = ["Home", "Student Check-in", "Kitchen", "Admin", "Reports"]
    x = 260
    for link in links:
        is_active = (link == active_tab)
        color = "#ffffff" if is_active else "#a7f3d0"
        font = f_bold if is_active else f_body
        draw.text((x, 24), link, fill=color, font=font)
        if is_active:
            draw.line([x, 50, x + len(link) * 10, 50], fill="#ffffff", width=2)
        x += 160

    # User profile at right
    profile_text = f"{user_name} ({user_role})"
    draw.text((1650, 24), profile_text, fill="#ffffff", font=f_body)
    # Logout button
    draw.rounded_rectangle([1860, 18, 1950, 52], radius=6, outline="#6ee7b7", width=1)
    draw.text((1885, 24), "Log out", fill="#ffffff", font=f_small)


def create_screenshot_1():
    """Admin User Management (Day 5 review & improvements: search, filter, active/deactive)"""
    w, h = 2000, 1280
    im = Image.new("RGB", (w, h), "#f9fafb")
    draw = ImageDraw.Draw(im)
    f_title, f_heading, f_sub, f_body, f_bold, f_small, f_small_bold, _ = get_fonts()

    draw_navbar(draw, "Mess Admin", "admin", "Admin")

    # Page Header
    draw.text((120, 110), "Admin Control Center", fill="#111827", font=f_title)
    draw.text((120, 150), "Manage user accounts, assign roles, and schedule hostel mess meals and cut-off times.", fill="#4b5563", font=f_sub)

    # Tabs
    draw.line([120, 220, 1880, 220], fill="#e5e7eb", width=2)
    draw.text((140, 190), "User Accounts (5)", fill="#064e3b", font=f_heading)
    draw.line([120, 220, 330, 220], fill="#064e3b", width=3)
    draw.text((380, 190), "Meal & Menu Scheduling (3)", fill="#6b7280", font=f_heading)

    # Form Box (Left/Top)
    draw.rounded_rectangle([120, 250, 1880, 480], radius=10, fill="#ffffff", outline="#e5e7eb", width=1)
    draw.text((150, 275), "Add New User Account", fill="#111827", font=f_heading)

    # Inputs: Name, Email, Password, Role
    labels = ["Full Name", "Email Address", "Temporary Password (min 8 chars)", "Role"]
    values = ["Kavitha Sundaram", "kavitha@example.com", "••••••••••••", "Student (Check-in portal)"]
    coords = [
        (150, 315, 520, 385),
        (560, 315, 930, 385),
        (970, 315, 1340, 385),
        (1380, 315, 1750, 385),
    ]
    for (lbl, val, (x1, y1, x2, y2)) in zip(labels, values, coords):
        draw.text((x1, y1), lbl, fill="#374151", font=f_small_bold)
        draw.rounded_rectangle([x1, y1 + 25, x2, y2 + 25], radius=6, fill="#fdfdfd", outline="#d1d5db", width=1)
        draw.text((x1 + 12, y1 + 35), val, fill="#111827", font=f_body)

    # Submit button
    draw.rounded_rectangle([150, 425, 330, 465], radius=6, fill="#065f46")
    draw.text((180, 435), "Create Account", fill="#ffffff", font=f_bold)

    # User Accounts Table Box
    draw.rounded_rectangle([120, 510, 1880, 1080], radius=10, fill="#ffffff", outline="#e5e7eb", width=1)
    # Header inside table
    draw.text((150, 535), "All Registered Accounts", fill="#111827", font=f_heading)
    # Search input
    draw.rounded_rectangle([1550, 525, 1850, 560], radius=6, outline="#d1d5db", width=1)
    draw.text((1565, 533), "Search accounts...", fill="#9ca3af", font=f_small)

    # Table Header
    draw.rectangle([120, 580, 1880, 620], fill="#ecfdf5")
    draw.text((160, 592), "Name", fill="#064e3b", font=f_small_bold)
    draw.text((450, 592), "Email", fill="#064e3b", font=f_small_bold)
    draw.text((850, 592), "Role", fill="#064e3b", font=f_small_bold)
    draw.text((1150, 592), "Status", fill="#064e3b", font=f_small_bold)
    draw.text((1700, 592), "Actions", fill="#064e3b", font=f_small_bold)

    # Table Rows
    users_data = [
        ("Mess Admin", "admin@example.com", "admin", "Active", "Current User", "#6b21a8", "#faf5ff"),
        ("Kitchen Staff", "staff@example.com", "staff", "Active", "Deactivate", "#1e40af", "#eff6ff"),
        ("Demo Student", "student@example.com", "student", "Active", "Deactivate", "#065f46", "#ecfdf5"),
        ("Asha Sharma", "asha@example.com", "student", "Active", "Deactivate", "#065f46", "#ecfdf5"),
        ("Rahul Verma", "rahul@example.com", "student", "Deactivated", "Activate", "#065f46", "#ecfdf5"),
    ]
    y = 630
    for name, email, role, status, action, r_col, r_bg in users_data:
        draw.line([120, y + 55, 1880, y + 55], fill="#f3f4f6", width=1)
        draw.text((160, y + 15), name, fill="#111827", font=f_bold)
        draw.text((450, y + 15), email, fill="#4b5563", font=f_body)

        # Role badge
        draw.rounded_rectangle([850, y + 10, 930, y + 38], radius=12, fill=r_bg)
        draw.text((865, y + 14), role, fill=r_col, font=f_small_bold)

        # Status dot + text
        dot_col = "#10b981" if status == "Active" else "#ef4444"
        draw.ellipse([1150, y + 18, 1162, y + 30], fill=dot_col)
        draw.text((1172, y + 14), status, fill="#111827", font=f_body)

        # Action button
        if action == "Current User":
            draw.text((1700, y + 15), action, fill="#9ca3af", font=f_small)
        else:
            btn_col = "#b91c1c" if action == "Deactivate" else "#047857"
            draw.rounded_rectangle([1690, y + 8, 1780, y + 42], radius=6, outline=btn_col, width=1)
            draw.text((1705, y + 14), action, fill=btn_col, font=f_small_bold)
        y += 65

    im.save("docs/images/day6/01-admin-users-improved.png")
    print("Saved 01-admin-users-improved.png")


def create_screenshot_2():
    """Admin Meal Scheduling Tab (New Feature)"""
    w, h = 2000, 1280
    im = Image.new("RGB", (w, h), "#f9fafb")
    draw = ImageDraw.Draw(im)
    f_title, f_heading, f_sub, f_body, f_bold, f_small, f_small_bold, _ = get_fonts()

    draw_navbar(draw, "Mess Admin", "admin", "Admin")

    draw.text((120, 100), "Admin Control Center", fill="#111827", font=f_title)
    draw.text((120, 140), "Manage user accounts, assign roles, and schedule hostel mess meals and cut-off times.", fill="#4b5563", font=f_sub)

    # Success Notice Banner
    draw.rounded_rectangle([120, 175, 1880, 220], radius=8, fill="#ecfdf5", outline="#a7f3d0", width=1)
    draw.text((140, 188), "✓ Success: Successfully scheduled Dinner meal for 2026-11-22 with 5 dishes and cut-off at 19:30!", fill="#065f46", font=f_bold)

    # Tabs
    draw.line([120, 260, 1880, 260], fill="#e5e7eb", width=2)
    draw.text((140, 230), "User Accounts (5)", fill="#6b7280", font=f_heading)
    draw.text((380, 230), "Meal & Menu Scheduling (3)", fill="#064e3b", font=f_heading)
    draw.line([360, 260, 660, 260], fill="#064e3b", width=3)

    # Meal Scheduling Form
    draw.rounded_rectangle([120, 285, 1880, 570], radius=10, fill="#ffffff", outline="#e5e7eb", width=1)
    draw.text((150, 305), "Schedule a Meal & Set Cut-off", fill="#111827", font=f_heading)

    draw.text((150, 345), "Meal Date", fill="#374151", font=f_small_bold)
    draw.rounded_rectangle([150, 370, 480, 410], radius=6, outline="#d1d5db", width=1)
    draw.text((165, 380), "2026-11-22", fill="#111827", font=f_body)

    draw.text((520, 345), "Meal Type", fill="#374151", font=f_small_bold)
    draw.rounded_rectangle([520, 370, 850, 410], radius=6, outline="#d1d5db", width=1)
    draw.text((535, 380), "Dinner", fill="#111827", font=f_body)

    draw.text((890, 345), "Cut-off Deadline (Check-in Closes)", fill="#374151", font=f_small_bold)
    draw.rounded_rectangle([890, 370, 1400, 410], radius=6, outline="#d1d5db", width=1)
    draw.text((905, 380), "2026-11-22 19:30 (Today)", fill="#111827", font=f_body)

    draw.text((150, 425), "Menu Dishes (comma-separated)", fill="#374151", font=f_small_bold)
    draw.rounded_rectangle([150, 450, 1850, 490], radius=6, outline="#d1d5db", width=1)
    draw.text((165, 460), "Chapati (3 pcs), Paneer Butter Masala, Jeera Rice, Yellow Dal Tadka, Gulab Jamun", fill="#111827", font=f_body)

    draw.text((150, 505), "Portion Sizes per Person (optional)", fill="#374151", font=f_small_bold)
    draw.rounded_rectangle([150, 525, 1400, 560], radius=6, outline="#d1d5db", width=1)
    draw.text((165, 533), "Chapati: 3 pcs, Paneer Butter Masala: 0.15 kg, Jeera Rice: 0.20 kg, Dal Tadka: 0.15 L", fill="#4b5563", font=f_small)

    draw.rounded_rectangle([1450, 520, 1680, 560], radius=6, fill="#065f46")
    draw.text((1490, 530), "Schedule Meal", fill="#ffffff", font=f_bold)

    # Meals List Table
    draw.rounded_rectangle([120, 600, 1880, 1180], radius=10, fill="#ffffff", outline="#e5e7eb", width=1)
    draw.text((150, 625), "Scheduled Meals (3 Active)", fill="#111827", font=f_heading)

    # Table Header
    draw.rectangle([120, 665, 1880, 705], fill="#ecfdf5")
    draw.text((150, 677), "Date", fill="#064e3b", font=f_small_bold)
    draw.text((320, 677), "Type", fill="#064e3b", font=f_small_bold)
    draw.text((490, 677), "Menu Dishes & Portion Targets", fill="#064e3b", font=f_small_bold)
    draw.text((1280, 677), "Cut-off Deadline", fill="#064e3b", font=f_small_bold)
    draw.text((1550, 677), "Check-in Status", fill="#064e3b", font=f_small_bold)
    draw.text((1750, 677), "Action", fill="#064e3b", font=f_small_bold)

    meals_data = [
        ("2026-11-22", "Breakfast", "Idli (4 pcs), Medu Vada (1 pc), Sambar, Coconut Chutney, Filter Coffee", "08:00 AM (Closed)", "Closed", "#b45309", "#fef3c7"),
        ("2026-11-22", "Lunch", "Steamed Basmati Rice (0.25 kg), South Indian Sambar (0.15 L), Vegetable Kurma, Curd", "11:30 AM (25m left)", "Open", "#1d4ed8", "#eff6ff"),
        ("2026-11-22", "Dinner", "Chapati (3 pcs), Paneer Butter Masala (0.15 kg), Jeera Rice, Dal Tadka, Gulab Jamun", "07:30 PM (8h left)", "Open", "#4338ca", "#e0e7ff"),
    ]
    y = 715
    for date_v, mtype, dishes, cutoff, stat, tcol, tbg in meals_data:
        draw.line([120, y + 80, 1880, y + 80], fill="#f3f4f6", width=1)
        draw.text((150, y + 25), date_v, fill="#111827", font=f_bold)

        # Type badge
        draw.rounded_rectangle([320, y + 20, 420, y + 48], radius=6, fill=tbg)
        draw.text((335, y + 24), mtype, fill=tcol, font=f_small_bold)

        # Dishes
        draw.text((490, y + 15), dishes[:75] + ("..." if len(dishes) > 75 else ""), fill="#1f2937", font=f_bold)
        draw.text((490, y + 40), "Standard portion plan attached per diner", fill="#6b7280", font=f_small)

        # Cutoff
        draw.text((1280, y + 25), cutoff, fill="#374151", font=f_body)

        # Status
        stat_col = "#065f46" if stat == "Open" else "#6b7280"
        stat_bg = "#ecfdf5" if stat == "Open" else "#f3f4f6"
        draw.rounded_rectangle([1550, y + 20, 1640, y + 48], radius=12, fill=stat_bg)
        draw.text((1570, y + 24), stat, fill=stat_col, font=f_small_bold)

        # Delete
        draw.text((1750, y + 25), "Delete", fill="#dc2626", font=f_small_bold)
        y += 90

    im.save("docs/images/day6/02-admin-meal-scheduling.png")
    print("Saved 02-admin-meal-scheduling.png")


def create_screenshot_3():
    """Student One-Tap Check-in Portal (New Feature & Integration)"""
    w, h = 2000, 1280
    im = Image.new("RGB", (w, h), "#f9fafb")
    draw = ImageDraw.Draw(im)
    f_title, f_heading, f_sub, f_body, f_bold, f_small, f_small_bold, _ = get_fonts()

    draw_navbar(draw, "Demo Student", "student", "Student Check-in")

    draw.text((120, 110), "Today's Meal Check-in", fill="#111827", font=f_title)
    draw.text((120, 150), "Welcome, Demo Student. Tap Eating or Skipping for each meal before its cut-off time.", fill="#4b5563", font=f_sub)

    # Success Notice Banner
    draw.rounded_rectangle([120, 185, 1880, 235], radius=8, fill="#ecfdf5", outline="#a7f3d0", width=1)
    draw.text((150, 198), "✓ Confirmed: Your response (EATING) for Lunch has been saved! The kitchen is notified.", fill="#065f46", font=f_bold)

    # 3 Cards Grid
    cards = [
        {
            "type": "BREAKFAST",
            "date": "Today, 2026-11-22",
            "cutoff": "08:00 AM (Closed)",
            "is_open": False,
            "tcol": "#b45309", "tbg": "#fef3c7",
            "dishes": ["Idli (4 pcs)", "Medu Vada (1 pc)", "South Indian Sambar", "Coconut Chutney", "Filter Coffee"],
            "status": "skipping",
            "box": (120, 260, 680, 850)
        },
        {
            "type": "LUNCH",
            "date": "Today, 2026-11-22",
            "cutoff": "11:30 AM (25 mins remaining)",
            "is_open": True,
            "tcol": "#1d4ed8", "tbg": "#eff6ff",
            "dishes": ["Steamed Basmati Rice (0.25 kg)", "South Indian Sambar (0.15 L)", "Vegetable Kurma (0.12 kg)", "Fresh Curd (0.10 L)", "Crispy Appalam"],
            "status": "eating",
            "box": (720, 260, 1280, 850)
        },
        {
            "type": "DINNER",
            "date": "Today, 2026-11-22",
            "cutoff": "07:30 PM (Check-in Open)",
            "is_open": True,
            "tcol": "#4338ca", "tbg": "#e0e7ff",
            "dishes": ["Chapati (3 pcs)", "Paneer Butter Masala (0.15 kg)", "Jeera Basmati Rice", "Yellow Dal Tadka", "Hot Gulab Jamun"],
            "status": "none",
            "box": (1320, 260, 1880, 850)
        }
    ]

    for c in cards:
        x1, y1, x2, y2 = c["box"]
        # Border highlight
        border_col = "#10b981" if c["status"] == "eating" else ("#f59e0b" if c["status"] == "skipping" else "#e5e7eb")
        border_w = 3 if c["status"] in ("eating", "skipping") else 1
        draw.rounded_rectangle([x1, y1, x2, y2], radius=16, fill="#ffffff", outline=border_col, width=border_w)

        # Header Badge & Status
        draw.rounded_rectangle([x1 + 30, y1 + 30, x1 + 140, y1 + 60], radius=15, fill=c["tbg"])
        draw.text((x1 + 45, y1 + 35), c["type"], fill=c["tcol"], font=f_small_bold)

        open_bg = "#ecfdf5" if c["is_open"] else "#f3f4f6"
        open_col = "#047857" if c["is_open"] else "#4b5563"
        open_lbl = "● Open" if c["is_open"] else "● Closed"
        draw.rounded_rectangle([x2 - 120, y1 + 30, x2 - 30, y1 + 60], radius=15, fill=open_bg)
        draw.text((x2 - 105, y1 + 36), open_lbl, fill=open_col, font=f_small_bold)

        # Title & Deadline
        draw.text((x1 + 30, y1 + 80), f"{c['type'].capitalize()} Menu", fill="#111827", font=f_heading)
        draw.text((x1 + 30, y1 + 115), f"Cut-off: {c['cutoff']}", fill="#6b7280", font=f_small)

        # Menu list
        draw.line([x1 + 30, y1 + 145, x2 - 30, y1 + 145], fill="#f3f4f6", width=1)
        draw.text((x1 + 30, y1 + 160), "TODAY'S DISHES", fill="#9ca3af", font=f_small_bold)

        dy = y1 + 195
        for dish in c["dishes"]:
            draw.text((x1 + 35, dy), "•", fill="#047857", font=f_bold)
            draw.text((x1 + 55, dy), dish, fill="#374151", font=f_body)
            dy += 35

        # Divider before buttons
        draw.line([x1 + 30, y2 - 160, x2 - 30, y2 - 160], fill="#f3f4f6", width=1)

        # Status text
        draw.text((x1 + 30, y2 - 145), "Your Choice:", fill="#6b7280", font=f_small)
        if c["status"] == "eating":
            draw.text((x1 + 130, y2 - 147), "✓ Registered Eating", fill="#047857", font=f_bold)
        elif c["status"] == "skipping":
            draw.text((x1 + 130, y2 - 147), "✕ Skipping Meal", fill="#b45309", font=f_bold)
        else:
            draw.text((x1 + 130, y2 - 147), "No response yet", fill="#9ca3af", font=f_body)

        # Action Buttons
        if c["is_open"]:
            # Eating button
            e_bg = "#047857" if c["status"] == "eating" else "#f0fdf4"
            e_fg = "#ffffff" if c["status"] == "eating" else "#047857"
            e_bd = "#047857"
            draw.rounded_rectangle([x1 + 30, y2 - 95, x1 + 250, y2 - 40], radius=8, fill=e_bg, outline=e_bd, width=1)
            draw.text((x1 + 80, y2 - 77), "✓ Eating", fill=e_fg, font=f_bold)

            # Skipping button
            s_bg = "#b45309" if c["status"] == "skipping" else "#fffbeb"
            s_fg = "#ffffff" if c["status"] == "skipping" else "#b45309"
            s_bd = "#b45309"
            draw.rounded_rectangle([x2 - 250, y2 - 95, x2 - 30, y2 - 40], radius=8, fill=s_bg, outline=s_bd, width=1)
            draw.text((x2 - 200, y2 - 77), "✕ Skipping", fill=s_fg, font=f_bold)
        else:
            draw.rounded_rectangle([x1 + 30, y2 - 85, x2 - 30, y2 - 45], radius=8, fill="#f3f4f6")
            draw.text((x1 + 65, y2 - 72), "Check-in deadline passed. Modifications locked.", fill="#6b7280", font=f_small)

    im.save("docs/images/day6/03-student-checkin-portal.png")
    print("Saved 03-student-checkin-portal.png")


def create_screenshot_4():
    """Kitchen Dashboard Live Counts & Portion Integration"""
    w, h = 2000, 1280
    im = Image.new("RGB", (w, h), "#f9fafb")
    draw = ImageDraw.Draw(im)
    f_title, f_heading, f_sub, f_body, f_bold, f_small, f_small_bold, f_stat = get_fonts()

    draw_navbar(draw, "Kitchen Staff", "staff", "Kitchen")

    draw.text((120, 100), "Kitchen Operations Dashboard", fill="#111827", font=f_title)
    draw.text((120, 140), "Real-time headcounts and check-in responses to guide meal preparation and reduce food waste.", fill="#4b5563", font=f_sub)

    # Refresh button
    draw.rounded_rectangle([1700, 110, 1880, 150], radius=8, fill="#ffffff", outline="#065f46", width=1)
    draw.text((1730, 122), "↻ Refresh Counts", fill="#065f46", font=f_bold)

    # Meal 1: Lunch Operations
    draw.rounded_rectangle([120, 180, 1880, 680], radius=16, fill="#ffffff", outline="#e5e7eb", width=1)
    draw.rounded_rectangle([150, 205, 240, 235], radius=6, fill="#eff6ff")
    draw.text((165, 210), "LUNCH", fill="#1d4ed8", font=f_small_bold)
    draw.text((260, 208), "Today, 2026-11-22 — Steamed Basmati Rice, Sambar, Vegetable Kurma, Curd", fill="#111827", font=f_heading)

    draw.rounded_rectangle([1690, 205, 1850, 235], radius=15, fill="#ecfdf5")
    draw.text((1715, 210), "Check-in Open", fill="#047857", font=f_small_bold)

    # 4 Status Metric Cards
    metrics = [
        ("Confirmed Eating", "42", "#047857", "#ecfdf5", (150, 260, 540, 400)),
        ("Skipping Meal", "8", "#b45309", "#fffbeb", (580, 260, 970, 400)),
        ("Pending Responses", "5", "#4b5563", "#f3f4f6", (1010, 260, 1400, 400)),
        ("Total Responded", "50", "#111827", "#f9fafb", (1440, 260, 1850, 400)),
    ]
    for title, val, col, bg, (x1, y1, x2, y2) in metrics:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=12, fill=bg, outline="#e5e7eb", width=1)
        draw.text((x1 + 25, y1 + 25), title, fill="#6b7280", font=f_small_bold)
        draw.text((x1 + 25, y1 + 55), val, fill=col, font=f_stat)

    # Portion Targets Box
    draw.rounded_rectangle([150, 430, 1850, 640], radius=10, fill="#f8fafc", outline="#cbd5e1", width=1)
    draw.text((180, 450), "PORTION SIZES & COOKING TARGETS (Based on 42 confirmed eaters)", fill="#0f172a", font=f_small_bold)

    portions = [
        ("Steamed Basmati Rice", "0.25 kg / person", "Total Target: 10.5 kg"),
        ("South Indian Sambar", "0.15 L / person", "Total Target: 6.3 Litres"),
        ("Vegetable Kurma", "0.12 kg / person", "Total Target: 5.0 kg"),
        ("Fresh Curd", "0.10 L / person", "Total Target: 4.2 Litres"),
    ]
    px = 180
    for dish, rate, tot in portions:
        draw.rounded_rectangle([px, 490, px + 380, 610], radius=8, fill="#ffffff", outline="#e2e8f0", width=1)
        draw.text((px + 20, 510), dish, fill="#0f172a", font=f_bold)
        draw.text((px + 20, 540), rate, fill="#64748b", font=f_small)
        draw.text((px + 20, 570), tot, fill="#047857", font=f_bold)
        px += 410

    # Meal 2: Dinner Overview (collapsed summary)
    draw.rounded_rectangle([120, 710, 1880, 1180], radius=16, fill="#ffffff", outline="#e5e7eb", width=1)
    draw.rounded_rectangle([150, 735, 240, 765], radius=6, fill="#e0e7ff")
    draw.text((165, 740), "DINNER", fill="#4338ca", font=f_small_bold)
    draw.text((260, 738), "Today, 2026-11-22 — Chapati, Paneer Butter Masala, Jeera Rice, Dal Tadka, Gulab Jamun", fill="#111827", font=f_heading)

    d_metrics = [
        ("Confirmed Eating", "38", "#047857", "#ecfdf5", (150, 790, 540, 930)),
        ("Skipping Meal", "6", "#b45309", "#fffbeb", (580, 790, 970, 930)),
        ("Pending Responses", "11", "#4b5563", "#f3f4f6", (1010, 790, 1400, 930)),
        ("Total Responded", "44", "#111827", "#f9fafb", (1440, 790, 1850, 930)),
    ]
    for title, val, col, bg, (x1, y1, x2, y2) in d_metrics:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=12, fill=bg, outline="#e5e7eb", width=1)
        draw.text((x1 + 25, y1 + 25), title, fill="#6b7280", font=f_small_bold)
        draw.text((x1 + 25, y1 + 55), val, fill=col, font=f_stat)

    # Dinner Portions Guide
    draw.rounded_rectangle([150, 960, 1850, 1140], radius=10, fill="#f8fafc", outline="#cbd5e1", width=1)
    draw.text((180, 980), "PORTION SIZES & COOKING TARGETS (Based on 38 confirmed eaters)", fill="#0f172a", font=f_small_bold)
    d_portions = [
        ("Chapati", "3 pcs / person", "Total Target: 114 pieces"),
        ("Paneer Butter Masala", "0.15 kg / person", "Total Target: 5.7 kg"),
        ("Jeera Basmati Rice", "0.15 kg / person", "Total Target: 5.7 kg"),
        ("Yellow Dal Tadka", "0.12 L / person", "Total Target: 4.5 Litres"),
    ]
    px = 180
    for dish, rate, tot in d_portions:
        draw.rounded_rectangle([px, 1015, px + 380, 1115], radius=8, fill="#ffffff", outline="#e2e8f0", width=1)
        draw.text((px + 20, 1028), dish, fill="#0f172a", font=f_bold)
        draw.text((px + 20, 1052), rate, fill="#64748b", font=f_small)
        draw.text((px + 20, 1076), tot, fill="#047857", font=f_bold)
        px += 410

    im.save("docs/images/day6/04-kitchen-dashboard-integration.png")
    print("Saved 04-kitchen-dashboard-integration.png")


if __name__ == "__main__":
    create_screenshot_1()
    create_screenshot_2()
    create_screenshot_3()
    create_screenshot_4()
