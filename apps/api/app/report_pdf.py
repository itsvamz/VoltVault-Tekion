from io import BytesIO
from datetime import date
from xml.sax.saxutils import escape
import qrcode
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Line, Circle, String


def years(months):
    value = months / 12
    return f"{value:.0f} years" if months >= 120 else f"{value:.1f} years"


def life_span(threshold):
    months = threshold.get("months_range")
    if not months:
        return "Not projectable"
    if threshold.get("state") == "at_or_below" or months[1] == 0:
        return "At or below now"
    if threshold.get("beyond_horizon"):
        return "Beyond 20 years"
    low, high = months
    return f"up to {years(high)}" if low == 0 else f"{years(low)}–{years(high)}"


def life_miles(threshold):
    miles = threshold.get("miles_range")
    if not miles or miles[1] == 0:
        return "Unknown"
    low, high = miles
    return f"up to {high:,.0f} mi" if low == 0 else f"{low:,.0f}–{high:,.0f} mi"


def render(payload, url, integrity):
    p = payload
    b = BytesIO()
    styles = getSampleStyleSheet()
    styles["Title"].textColor = colors.HexColor("#14483e")
    styles["BodyText"].leading = 15
    styles["Heading2"].keepWithNext = True
    styles["Heading2"].spaceAfter = 10
    story = []

    def para(text, style="BodyText"):
        story.append(Paragraph(escape(str(text)), styles[style]))
        # A spacer after a heading would satisfy keepWithNext on its own,
        # leaving the actual paragraph orphaned on the next page.
        if style != "Heading2":
            story.append(Spacer(1, 10))

    para("Battery Health Report", "Title")
    para("Dealer-issued evidence summary")
    para(p["vehicle"], "Heading2")
    para("Masked VIN: " + p["vin"].replace("•", "*"))
    para(f"Version {p['version']} | Assessment date: {p['as_of']} | {p['miles']:,.0f} mi")
    health = (
        f"{p['interval'][0]}–{p['interval'][1]}%"
        if p["interval"]
        else "Insufficient vehicle evidence"
    )
    para("Valid until: " + p.get("expires_on", "Not specified"))
    para("Estimated battery health: " + health, "Heading2")
    para(f"Evidence quality: {p['quality']}. {p['reason']}")
    if p["last"]:
        para(f"Last recorded reading: {p['last']['value']:g}% on {p['last']['date']}")
    life = p.get("life") or {}
    if life.get("status") == "projected":
        para("Projected usable life", "Heading2")
        lead = next(
            (
                t
                for t in life["thresholds"]
                if t["state"] == "projected" and not t["beyond_horizon"]
            ),
            None,
        )
        if lead:
            para(
                f"At the observed loss of {life['annual_loss_pp']:g} percentage points per year, "
                f"this pack is projected to stay above {lead['percent']:g}% for about "
                f"{life_span(lead)}."
            )
        rows = [["Reference level", "Projected above this level", "Further distance"]] + [
            [f"{t['percent']:g}% - {t['label']}", life_span(t), life_miles(t)]
            for t in life["thresholds"]
        ]
        table = Table(rows, repeatRows=1, colWidths=[190, 170, 130])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf6f3")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#dde4e8")),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 8))
        para(life["disclaimer"])
    elif life.get("status") == "stable":
        para("Projected usable life", "Heading2")
        para(life["reason"] + ". " + life["disclaimer"])
    para("Current-pack Timeline", "Heading2")
    para("Pack: " + p["pack"] + ". Earlier pack readings are excluded from this estimate.")
    if p.get("pack_context") and p["pack_context"].get("start_date"):
        para(
            "Segment start: "
            + p["pack_context"]["start_date"]
            + " ("
            + p["pack_context"]["verification"]
            + "). Replacement warranty is assessed separately."
        )
    rs = sorted(p["readings"], key=lambda r: r["date"])
    if rs:
        drawing = Drawing(500, 170)
        start = date.fromisoformat(rs[0]["date"]).toordinal()
        end = date.fromisoformat(rs[-1]["date"]).toordinal()
        for tick in [0, 25, 50, 75, 100]:
            y = 25 + tick * 1.1
            drawing.add(Line(35, y, 470, y, strokeColor=colors.HexColor("#dde4e8")))
            drawing.add(String(2, y - 3, str(tick) + "%", fontSize=8))
        points = [
            (
                35
                + (date.fromisoformat(r["date"]).toordinal() - start) / max(1, end - start) * 435,
                25 + r["value"] * 1.1,
            )
            for r in rs
        ]
        for a, z in zip(points, points[1:]):
            drawing.add(Line(*a, *z, strokeColor=colors.HexColor("#007e72"), strokeWidth=1.5))
        for x, y in points:
            drawing.add(
                Circle(x, y, 3, fillColor=colors.white, strokeColor=colors.HexColor("#007e72"))
            )
        drawing.add(String(35, 8, rs[0]["date"], fontSize=8))
        drawing.add(String(417, 8, rs[-1]["date"], fontSize=8))
        story.append(drawing)
        rows = [["Date", "Health", "Odometer", "Source"]] + [
            [r["date"], f"{r['value']:g}%", f"{r['miles']:,.0f} mi", r["source"]] for r in rs
        ]
        t = Table(rows, repeatRows=1, colWidths=[90, 60, 100, 240])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf6f3")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                    ("TOPPADDING", (0, 0), (-1, -1), 9),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#dde4e8")),
                ]
            )
        )
        story.append(t)
    para("Warranty information", "Heading2")
    para(p["warranty"])
    para("Limitations", "Heading2")
    para(p["limitations"])
    for warning in p["warnings"]:
        para(warning)
    para(
        "Battery health is usable capacity relative to the reference capacity, not charge level or guaranteed driving range."
    )
    q = BytesIO()
    qrcode.make(url).save(q, format="PNG")
    q.seek(0)
    # Keep the whole closing block together so a single integrity line can never
    # spill onto an otherwise blank page.
    story.append(
        KeepTogether(
            [
                Spacer(1, 8),
                Table(
                    [
                        [
                            Image(q, 88, 88),
                            Paragraph(
                                'Scan for the current status of this exact version.<br/><br/><link href="'
                                + escape(url)
                                + '">Open published report</link>',
                                styles["BodyText"],
                            ),
                        ]
                    ],
                    colWidths=[110, 380],
                ),
                Paragraph(escape(url), styles["BodyText"]),
                Paragraph(escape(p["dealer"]), styles["BodyText"]),
                Paragraph("Generated: " + escape(p["generated_at"]), styles["BodyText"]),
                Paragraph(
                    "Integrity ID: "
                    + escape(
                        integrity[:24] + " (snapshot identity, not manufacturer verification)"
                    ),
                    styles["BodyText"],
                ),
            ]
        )
    )

    def page(c, doc):
        c.saveState()
        c.setFillColor(colors.white)
        c.rect(0, 0, 612, 792, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#63717b"))
        c.setFont("Helvetica", 8)
        c.drawString(
            42,
            22,
            f"Battery Timeline · Tek-Qubit concept | Version {p['version']} | Page {doc.page}",
        )
        c.restoreState()

    SimpleDocTemplate(
        b,
        pagesize=(612, 792),
        leftMargin=42,
        rightMargin=42,
        topMargin=40,
        bottomMargin=42,
        title="Battery Health Report",
    ).build(story, onFirstPage=page, onLaterPages=page)
    return b.getvalue()
