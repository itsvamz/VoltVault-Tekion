"""Cold-start intake: a baseline test is not the same as dealer service history."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from apps.api.app.main import app
from apps.api.app.store import engine, get, put

client = TestClient(app)
VID = "intake-case"


def setup_vehicle():
    with Session(engine) as s:
        if get(s, "vehicle", VID):
            return
        put(
            s,
            "vehicle",
            VID,
            {
                "id": VID,
                "stock": "EV-T900",
                "vin": "DEMO0000000TEST01",
                "make": "Chevrolet",
                "model": "Bolt EV",
                "year": 2023,
                "miles": 31000,
                "in_service": "2023-05-01",
                "pack": "original",
                "scenario": "Intake baseline only",
                "base": 22000,
                "included": "no",
                "revision": 1,
                "provenance": "Test fixture",
            },
        )
        put(
            s,
            "visit",
            VID,
            {"id": VID, "vehicle": VID, "ro": "RO-T900", "state": "Inspection open"},
        )
        s.commit()


def login(role="manager"):
    client.post("/api/session", json={"role": role})


def baseline_body(**kw):
    b = dict(
        value=93,
        measurement="health",
        date="2026-10-20",
        odometer=31000,
        unit="mi",
        source="Independent test",
        basis="usable capacity",
        pack="original",
    )
    b.update(kw)
    return b


def capture(visit_id, **kw):
    return client.post(
        "/api/service-visits/" + visit_id + "/capture-drafts",
        json=baseline_body(**kw),
    )


def test_intake_baseline_then_service_history():
    setup_vehicle()
    login("manager")

    v = client.get("/api/vehicles/" + VID).json()
    assert v["evidence_state"] == "none"
    assert v["assessment"]["interval"] is None

    visit = client.post("/api/vehicles/" + VID + "/intake-visit")
    assert visit.status_code == 200
    assert visit.json()["kind"] == "intake"
    assert client.post("/api/vehicles/" + VID + "/intake-visit").json()["id"] == visit.json()["id"]

    d = capture(visit.json()["id"])
    assert d.status_code == 200
    assert d.json()["origin"] == "intake"
    reading = client.post("/api/capture-drafts/" + d.json()["id"] + "/confirm").json()
    assert reading["reading"]["origin"] == "intake"
    assert reading["reading"]["provenance"] == "Acquisition baseline test"

    v = client.get("/api/vehicles/" + VID).json()
    assert v["evidence_state"] == "baseline_only"
    assert v["baseline"]["reading_id"] == d.json()["id"]
    assert v["assessment"]["count"] == 1
    assert v["assessment"]["quality"] == "limited"

    report = client.post("/api/vehicles/" + VID + "/reports").json()
    client.post("/api/reports/" + report["id"] + "/publish")
    public = client.get("/api/public/reports/" + report["token"]).json()
    assert public["evidence_basis"]["state"] == "baseline_only"
    assert public["evidence_basis"]["intake_readings"] == 1
    assert "acquisition baseline" in public["limitations"]

    # A dealer service reading upgrades the record from baseline-only to history.
    service = client.post(
        "/api/service-visits/" + VID + "/capture-drafts",
        json=baseline_body(
            value=92,
            date="2026-11-10",
            odometer=32000,
            source="OEM diagnostic tool",
        ),
    )
    assert service.status_code == 200
    assert service.json()["origin"] == "service"
    assert client.post("/api/capture-drafts/" + service.json()["id"] + "/confirm").status_code == 200

    v = client.get("/api/vehicles/" + VID).json()
    assert v["evidence_state"] == "history"
    assert v["baseline"]["reading_id"] == d.json()["id"]

    # A new report version reflects the stronger evidence basis; the old one stays frozen.
    newer = client.post("/api/vehicles/" + VID + "/reports").json()
    client.post("/api/reports/" + newer["id"] + "/publish")
    assert client.get("/api/public/reports/" + newer["token"]).json()["evidence_basis"] == {
        "state": "history",
        "intake_readings": 1,
        "service_readings": 1,
    }
    assert (
        client.get("/api/public/reports/" + report["token"]).json()["evidence_basis"]["state"]
        == "baseline_only"
    )


def test_intake_guards_and_permissions():
    setup_vehicle()
    login("sales")
    assert client.post("/api/vehicles/" + VID + "/intake-visit").status_code == 403

    login("manager")
    # Seeded vehicle 1 already has service history; it cannot be treated as a fresh intake.
    refused = client.post("/api/vehicles/1/intake-visit")
    assert refused.status_code == 409
    assert refused.json()["detail"]["code"] == "history_exists"

    # A baseline still obeys the health/duplicate rules.
    visit = client.post("/api/vehicles/" + VID + "/intake-visit").json()
    charge = capture(visit["id"], measurement="charge", value=80)
    assert client.post("/api/capture-drafts/" + charge.json()["id"] + "/confirm").status_code == 422
    duplicate = capture(visit["id"], value=93, date="2026-10-20")
    assert client.post("/api/capture-drafts/" + duplicate.json()["id"] + "/confirm").status_code == 409

    login("technician")
    assert client.post("/api/vehicles/" + VID + "/reports").status_code == 403
