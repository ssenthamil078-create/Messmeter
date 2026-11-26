from datetime import datetime, timedelta, timezone

from app.models.user import Role


def test_leftovers_full_crud_and_meal_update(client, make_user, auth_header):
    admin = make_user(email="admin_lo@example.com", role=Role.admin)
    student = make_user(email="student_lo@example.com", role=Role.student)
    admin_headers = auth_header(admin)
    student_headers = auth_header(student)

    # Create a meal first
    cutoff = (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    meal_res = client.post(
        "/api/meals",
        json={
            "date": datetime.now(timezone.utc).date().isoformat(),
            "meal_type": "dinner",
            "dishes": ["Chapati", "Dal Tadka"],
            "portion_sizes": {"Chapati": "3 pcs", "Dal Tadka": "0.15 L"},
            "cutoff_time": cutoff,
        },
        headers=admin_headers,
    )
    assert meal_res.status_code == 201
    meal_id = meal_res.json()["id"]

    # Update meal (PATCH)
    patch_meal = client.patch(
        f"/api/meals/{meal_id}",
        json={"dishes": ["Chapati", "Dal Tadka", "Jeera Rice"]},
        headers=admin_headers,
    )
    assert patch_meal.status_code == 200
    assert len(patch_meal.json()["dishes"]) == 3

    # Student cannot create leftover
    forbidden = client.post(
        "/api/leftovers",
        json={"meal_id": meal_id, "dish": "Dal Tadka", "qty_cooked": 20.0, "qty_left": 2.5, "unit": "L"},
        headers=student_headers,
    )
    assert forbidden.status_code == 403

    # Create leftover (admin/staff)
    create_res = client.post(
        "/api/leftovers",
        json={
            "meal_id": meal_id,
            "dish": "Dal Tadka",
            "qty_cooked": 20.0,
            "qty_left": 2.5,
            "unit": "L",
            "notes": "Slightly excess due to rain",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    leftover_id = create_res.json()["id"]

    # Read leftovers
    list_res = client.get(f"/api/leftovers?meal_id={meal_id}", headers=admin_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["dish"] == "Dal Tadka"

    # Update leftover
    update_res = client.patch(
        f"/api/leftovers/{leftover_id}",
        json={"qty_left": 1.8, "notes": "Recounted after late students"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["qty_left"] == 1.8

    # Delete leftover
    del_res = client.delete(f"/api/leftovers/{leftover_id}", headers=admin_headers)
    assert del_res.status_code == 204

    # Verify deleted
    list_after = client.get(f"/api/leftovers?meal_id={meal_id}", headers=admin_headers)
    assert list_after.status_code == 200
    assert len(list_after.json()) == 0
