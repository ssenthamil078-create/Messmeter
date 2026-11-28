from datetime import datetime, timedelta, timezone

from app.models.user import Role


def test_admin_analytics_weekly_and_inventory_crud(client, make_user, auth_header):
    admin = make_user(email="admin_rep@example.com", role=Role.admin)
    staff = make_user(email="staff_rep@example.com", role=Role.staff)
    student = make_user(email="student_rep@example.com", role=Role.student)

    admin_headers = auth_header(admin)
    staff_headers = auth_header(staff)
    student_headers = auth_header(student)

    # Non-admins (student & staff) are blocked from admin analytics
    assert client.get("/api/reports/weekly", headers=student_headers).status_code == 403
    assert client.get("/api/reports/inventory", headers=staff_headers).status_code == 403

    # Create a meal + checkin + leftover to populate weekly report
    cutoff = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    meal_res = client.post(
        "/api/meals",
        json={
            "date": datetime.now(timezone.utc).date().isoformat(),
            "meal_type": "lunch",
            "dishes": ["Rice", "Sambar"],
            "portion_sizes": {"Rice": "0.25 kg", "Sambar": "0.15 L"},
            "cutoff_time": cutoff,
        },
        headers=admin_headers,
    )
    assert meal_res.status_code == 201
    meal_id = meal_res.json()["id"]

    assert (
        client.post("/api/checkins", json={"meal_id": meal_id, "status": "eating"}, headers=student_headers).status_code
        == 200
    )
    assert (
        client.post(
            "/api/leftovers",
            json={"meal_id": meal_id, "dish": "Rice", "qty_cooked": 25.0, "qty_left": 2.5, "unit": "kg"},
            headers=admin_headers,
        ).status_code
        == 201
    )

    weekly_res = client.get("/api/reports/weekly?days=7", headers=admin_headers)
    assert weekly_res.status_code == 200
    w = weekly_res.json()
    assert w["total_meals"] >= 1
    assert w["total_eating"] >= 1
    assert w["total_cooked"] == 25.0
    assert w["total_leftover"] == 2.5
    assert w["waste_pct"] == 10.0

    # Inventory CRUD
    inv_create = client.post(
        "/api/reports/inventory",
        json={"name": "Basmati Rice", "category": "Grains", "quantity": 8.0, "unit": "kg", "reorder_level": 10.0},
        headers=admin_headers,
    )
    assert inv_create.status_code == 201
    item_id = inv_create.json()["id"]
    assert inv_create.json()["is_low_stock"] is True

    inv_list = client.get("/api/reports/inventory", headers=admin_headers)
    assert inv_list.status_code == 200
    assert inv_list.json()["total_items"] == 1
    assert inv_list.json()["low_stock_count"] == 1

    inv_patch = client.patch(f"/api/reports/inventory/{item_id}", json={"quantity": 25.0}, headers=admin_headers)
    assert inv_patch.status_code == 200
    assert inv_patch.json()["is_low_stock"] is False

    inv_del = client.delete(f"/api/reports/inventory/{item_id}", headers=admin_headers)
    assert inv_del.status_code == 204
