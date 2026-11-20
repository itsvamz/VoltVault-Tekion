"""Remaining-life projection: deterministic, evidence-gated, never a failure prediction."""

from datetime import date, timedelta

from fastapi.testclient import TestClient

from apps.api.app.domain import assess, remaining_life
from apps.api.app.main import app

client = TestClient(app)
TODAY = date(2026, 11, 16)


def login(role):
    client.post("/api/session", json={"role": role})


def projection(**kw):
    a = dict(interval=[85, 89], slope=-2.0, annual_miles=12000, quality="moderate", count=4)
    a.update(kw)
    return remaining_life(a)


def test_projection_uses_the_interval_bounds():
    life = projection()
    assert life["status"] == "projected"
    assert life["annual_loss_pp"] == 2.0
    assert [t["percent"] for t in life["thresholds"]] == [80, 70]
    eighty, seventy = life["thresholds"]
    # Optimistic health gives the longest life, pessimistic health the shortest.
    assert eighty["months_range"] == [30, 54]
    assert eighty["miles_range"] == [30000, 54000]
    assert seventy["months_range"] == [90, 114]
    assert seventy["state"] == "projected"
    assert life["disclaimer"].startswith("Projection continues")


def test_dealer_pricing_reference_is_added_once():
    life = remaining_life(dict(interval=[85, 89], slope=-2.0), reference_health=90)
    assert [t["percent"] for t in life["thresholds"]] == [90.0, 80, 70]
    assert life["thresholds"][0]["label"] == "Dealer pricing reference"
    duplicate = remaining_life(dict(interval=[85, 89], slope=-2.0), reference_health=80)
    assert [t["percent"] for t in duplicate["thresholds"]] == [80.0, 70]


def test_no_projection_without_a_gated_trend():
    no_slope = projection(slope=None)
    assert no_slope["status"] == "insufficient_evidence"
    assert all(t["months_range"] is None for t in no_slope["thresholds"])
    assert "three comparable reading dates" in no_slope["reason"]

    no_interval = remaining_life(dict(interval=None, slope=None))
    assert no_interval["status"] == "insufficient_evidence"
    assert no_interval["thresholds"][0]["state"] == "not_projectable"


def test_flat_or_rising_health_is_not_a_lifetime_estimate():
    for slope in (-0.1, 0.4):
        life = projection(slope=slope)
        assert life["status"] == "stable"
        assert all(t["state"] == "no_measurable_loss" for t in life["thresholds"])


def test_thresholds_already_reached_or_beyond_the_horizon():
    below = projection(interval=[64, 68])
    assert below["thresholds"][0]["state"] == "at_or_below"
    assert below["thresholds"][0]["months_range"] == [0, 0]

    straddling = projection(interval=[69, 72])
    assert straddling["thresholds"][1]["months_range"] == [0, 12]
    assert straddling["thresholds"][1]["state"] == "projected"

    slow = projection(interval=[90, 92], slope=-0.2, annual_miles=None)
    assert slow["thresholds"][0]["beyond_horizon"] is True
    assert slow["thresholds"][0]["miles_range"] is None


def test_assess_derives_annual_mileage_from_confirmed_history():
    def reading(i, days_ago, value, miles):
        return {
            "id": f"mileage-{i}",
            "pack": "original",
            "state": "confirmed",
            "measurement": "health",
            "basis": "usable capacity",
            "value": value,
            "date": str(TODAY - timedelta(days=days_ago)),
            "miles": miles,
            "source": "OEM diagnostic tool",
            "method": "BMS capacity estimate",
            "reference_basis": "Original usable capacity",
            "created_at": "2026-01-01T00:00:00+00:00",
        }

    readings = [reading(1, 640, 95, 22000), reading(2, 400, 94, 26000), reading(3, 60, 92, 34000)]
    a = assess(readings, "original", TODAY)
    assert a["slope"] is not None
    assert a["annual_miles"] == round(12000 / (580 / 365.25))
    assert remaining_life(a)["annual_miles"] == a["annual_miles"]


def test_workspace_and_report_keep_the_dealer_reference_internal():
    login("manager")
    manager = client.get("/api/vehicles/1").json()
    assert manager["life"]["status"] == "projected"
    assert [t["percent"] for t in manager["life"]["thresholds"]] == [90.0, 80.0, 70.0]
    assert manager["life"]["annual_loss_pp"] is not None

    login("sales")
    sales = client.get("/api/vehicles/1").json()
    assert [t["percent"] for t in sales["life"]["thresholds"]] == [80.0, 70.0]
    assert "policy" not in sales and "base" not in sales

    login("manager")
    report = client.post("/api/vehicles/1/reports", json={"valid_days": 90}).json()
    payload = report["payload"]["life"]
    assert [t["percent"] for t in payload["thresholds"]] == [80.0, 70.0]
    client.post("/api/reports/" + report["id"] + "/publish")
    public = client.get("/api/public/reports/" + report["token"]).json()
    assert public["life"] == payload
    assert "Dealer pricing reference" not in str(public)


def test_projection_travels_with_an_immutable_snapshot():
    login("manager")
    report = client.post("/api/vehicles/5/reports", json={"valid_days": 30}).json()
    frozen = report["payload"]["life"]
    client.post("/api/reports/" + report["id"] + "/publish")
    visit = client.post("/api/vehicles/5/intake-visit")
    if visit.status_code == 200:
        draft = client.post(
            "/api/service-visits/" + visit.json()["id"] + "/capture-drafts",
            json={
                "value": 80,
                "measurement": "health",
                "date": "2026-11-15",
                "odometer": 47000,
                "unit": "mi",
                "source": "Independent test",
                "basis": "usable capacity",
                "pack": "original",
            },
        ).json()
        client.post("/api/capture-drafts/" + draft["id"] + "/confirm")
    public = client.get("/api/public/reports/" + report["token"]).json()
    assert public["life"] == frozen
