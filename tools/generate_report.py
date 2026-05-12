#!/usr/bin/env python3
"""Generate a print-ready HTML financial statement from a Lacucina Italiana backup dump.

Usage:
    python3 tools/generate_report.py <backup.json> [-o output.html]
    python3 tools/generate_report.py <backup.json> --from 2026-01-01 --to 2026-03-31

Reads the JSON dump produced by the POS app (`{ orders: [...], orderCounter: N }`)
and emits a single self-contained HTML file that opens directly in a browser and
prints cleanly to PDF (File → Print → Save as PDF).
"""

from __future__ import annotations

import argparse
import html
import json
import sys
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

CURRENCY = "฿"  # Thai Baht


def fmt_money(amount: float) -> str:
    return f"{CURRENCY}{amount:,.0f}"


def fmt_int(n: int) -> str:
    return f"{n:,}"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build an HTML sales statement from a backup dump.")
    p.add_argument("input", type=Path, help="Path to backup JSON dump")
    p.add_argument("-o", "--output", type=Path, default=None,
                   help="Output HTML file (default: <input>.report.html)")
    p.add_argument("--from", dest="date_from", default=None,
                   help="Inclusive start date YYYY-MM-DD (default: earliest in dump)")
    p.add_argument("--to", dest="date_to", default=None,
                   help="Inclusive end date YYYY-MM-DD (default: latest in dump)")
    p.add_argument("--shop-name", default="Lacucina Italiana",
                   help="Shop name to print in the report header")
    p.add_argument("--owner", default="Soontaree Srikanjana",
                   help="Owner / account holder name to print in the report header")
    return p.parse_args()


def load_orders(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    orders = data.get("orders") if isinstance(data, dict) else data
    if not isinstance(orders, list):
        sys.exit("Input is not a recognized backup dump (expected { orders: [...] }).")
    return orders


def order_dt(o: dict) -> datetime:
    return datetime.fromtimestamp(o["timestamp"] / 1000)


def normalize_legacy_dates(orders: list[dict], cutoff: date = date(2025, 12, 1)) -> int:
    """Re-stamp orders dated before `cutoff` to the cutoff day, preserving time-of-day.

    The early test-period entries (e.g. 2023) are treated as inaccurate and folded
    into December 2025 so the statement reflects only the genuine trading history.
    Returns the count of orders that were shifted.
    """
    shifted = 0
    for o in orders:
        ts = o.get("timestamp")
        if not ts:
            continue
        d = datetime.fromtimestamp(ts / 1000)
        if d.date() < cutoff:
            new_dt = datetime(cutoff.year, cutoff.month, cutoff.day,
                              d.hour, d.minute, d.second, d.microsecond)
            o["timestamp"] = int(new_dt.timestamp() * 1000)
            shifted += 1
    return shifted


def filter_period(orders: list[dict], date_from: str | None, date_to: str | None) -> list[dict]:
    if not orders:
        return orders
    if date_from:
        df = datetime.strptime(date_from, "%Y-%m-%d").date()
        orders = [o for o in orders if order_dt(o).date() >= df]
    if date_to:
        dt = datetime.strptime(date_to, "%Y-%m-%d").date()
        orders = [o for o in orders if order_dt(o).date() <= dt]
    return orders


def safe_str(v) -> str:
    return "" if v is None else str(v)


def humanize_label(value: str | None, fallback: str = "—") -> str:
    if not value:
        return fallback
    return value.replace("-", " ").title()


def describe_items(items: list[dict]) -> str:
    if not items:
        return "—"
    parts = []
    for it in items:
        name = it.get("name") or "Item"
        size = it.get("size") or it.get("variant")
        parts.append(f"{name} ({size})" if size else name)
    return ", ".join(parts)


def aggregate(orders: list[dict]) -> dict:
    total_revenue = sum(int(o.get("price", 0) or 0) for o in orders)
    by_day_orders: dict[date, list[dict]] = defaultdict(list)
    by_day_revenue: Counter = Counter()
    by_month_orders: Counter = Counter()
    by_month_revenue: Counter = Counter()
    by_source_revenue: Counter = Counter()
    by_source_orders: Counter = Counter()
    by_eat_revenue: Counter = Counter()
    by_eat_orders: Counter = Counter()
    by_payment_revenue: Counter = Counter()
    by_payment_orders: Counter = Counter()
    by_item_revenue: Counter = Counter()
    by_item_qty: Counter = Counter()

    for o in orders:
        d = order_dt(o)
        day = d.date()
        month = (d.year, d.month)
        price = int(o.get("price", 0) or 0)

        by_day_orders[day].append(o)
        by_day_revenue[day] += price
        by_month_orders[month] += 1
        by_month_revenue[month] += price
        by_source_revenue[o.get("orderSource") or "unknown"] += price
        by_source_orders[o.get("orderSource") or "unknown"] += 1
        by_eat_revenue[o.get("eatType") or "unknown"] += price
        by_eat_orders[o.get("eatType") or "unknown"] += 1
        pay = o.get("paymentType") or "cash"
        by_payment_revenue[pay] += price
        by_payment_orders[pay] += 1

        for it in o.get("items", []) or []:
            name = it.get("name") or "Item"
            by_item_revenue[name] += int(it.get("price", 0) or 0)
            by_item_qty[name] += 1

    days = sorted(by_day_orders.keys())
    operating_days = len(days)
    return {
        "total_orders": len(orders),
        "total_revenue": total_revenue,
        "operating_days": operating_days,
        "avg_daily_revenue": (total_revenue / operating_days) if operating_days else 0,
        "avg_daily_orders": (len(orders) / operating_days) if operating_days else 0,
        "avg_order_value": (total_revenue / len(orders)) if orders else 0,
        "period_start": days[0] if days else None,
        "period_end": days[-1] if days else None,
        "by_day_orders": by_day_orders,
        "by_day_revenue": by_day_revenue,
        "by_month_orders": by_month_orders,
        "by_month_revenue": by_month_revenue,
        "by_source_revenue": by_source_revenue,
        "by_source_orders": by_source_orders,
        "by_eat_revenue": by_eat_revenue,
        "by_eat_orders": by_eat_orders,
        "by_payment_revenue": by_payment_revenue,
        "by_payment_orders": by_payment_orders,
        "by_item_revenue": by_item_revenue,
        "by_item_qty": by_item_qty,
    }


CSS = """
:root {
    --accent: #D35400;
    --ink: #1a1a1a;
    --muted: #6b6b6b;
    --rule: #d8d4cf;
    --rule-strong: #2a2a2a;
    --paper: #ffffff;
    --paper-tint: #faf7f2;
}

* { box-sizing: border-box; }

html, body {
    margin: 0;
    padding: 0;
    background: #ececec;
    color: var(--ink);
    font-family: "Helvetica Neue", "Arial", "Liberation Sans", "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.45;
}

.page {
    max-width: 880px;
    margin: 24px auto;
    background: var(--paper);
    padding: 48px 56px 64px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.08);
}

.statement-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid var(--rule-strong);
    padding-bottom: 14px;
    margin-bottom: 24px;
}

.statement-head .brand {
    font-size: 22pt;
    letter-spacing: 0.04em;
    color: var(--accent);
    font-weight: 700;
}

.statement-head .subtitle {
    color: var(--muted);
    font-size: 10pt;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.statement-head .meta {
    text-align: right;
    font-size: 9.5pt;
    color: var(--muted);
}

.statement-head .meta .label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 8pt;
    color: #999;
}

.statement-head .meta .value {
    color: var(--ink);
    font-weight: 600;
    font-size: 10.5pt;
}

h2.section {
    font-size: 12.5pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink);
    border-bottom: 1px solid var(--rule-strong);
    padding-bottom: 4px;
    margin: 28px 0 12px;
}

p.intro {
    color: var(--muted);
    font-style: normal;
    margin: 0 0 18px;
    font-size: 10pt;
}

/* Summary KPI grid */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border-top: 1px solid var(--rule);
    border-left: 1px solid var(--rule);
}

.kpi {
    border-right: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    padding: 12px 14px;
}

.kpi .label {
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
}

.kpi .value {
    font-size: 16pt;
    font-weight: 700;
    color: var(--ink);
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
}

.kpi .value.accent { color: var(--accent); }

.kpi .hint {
    font-size: 8.5pt;
    color: var(--muted);
    margin-top: 2px;
    font-style: normal;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    font-variant-numeric: tabular-nums;
}

table.breakdown th,
table.breakdown td {
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid var(--rule);
}

table.breakdown thead th {
    border-bottom: 1.5px solid var(--rule-strong);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 8.5pt;
    color: var(--muted);
    background: var(--paper-tint);
}

table.breakdown td.num,
table.breakdown th.num {
    text-align: right;
}

table.breakdown tfoot td {
    border-top: 1.5px solid var(--rule-strong);
    border-bottom: none;
    font-weight: 700;
}

.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

/* Daily ledger */
.day-block {
    margin: 18px 0 8px;
    page-break-inside: avoid;
    break-inside: avoid;
}

.day-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid var(--rule-strong);
    padding-bottom: 4px;
    margin-bottom: 6px;
}

.day-header .date {
    font-size: 11.5pt;
    font-weight: 700;
    color: var(--accent);
}

.day-header .summary {
    font-size: 10pt;
    color: var(--muted);
}

table.ledger {
    font-size: 9.5pt;
    line-height: 1.25;
}

table.ledger thead th {
    text-align: left;
    padding: 4px 6px;
    border-bottom: 1px solid var(--rule);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 8pt;
    font-weight: 600;
    white-space: nowrap;
}

table.ledger tbody td {
    padding: 2px 6px;
    border-bottom: 1px solid #f0ece6;
    vertical-align: top;
    white-space: nowrap;
}

/* Only the Items column may wrap onto multiple lines. */
table.ledger td.items,
table.ledger th.items {
    white-space: normal;
    word-break: break-word;
}

table.ledger tbody tr:nth-child(even) td {
    background: var(--paper-tint);
}

table.ledger td.num,
table.ledger th.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

table.ledger td.muted {
    color: var(--muted);
}

table.ledger tfoot td {
    border-top: 1.5px solid var(--rule-strong);
    padding-top: 4px;
    font-weight: 700;
}

.tag {
    display: inline-block;
    border: 1px solid var(--rule);
    border-radius: 3px;
    padding: 0 5px;
    font-size: 8.5pt;
    color: var(--muted);
    background: #fff;
    line-height: 1.4;
}

.tag.eat-in { color: #2e7d32; border-color: #c8e6c9; }
.tag.take-away { color: #1565c0; border-color: #bbdefb; }

.signoff {
    margin-top: 40px;
    padding-top: 18px;
    border-top: 1px solid var(--rule-strong);
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    color: var(--muted);
    font-style: normal;
}

@page { size: A4; margin: 14mm 12mm; }

@media print {
    body { background: white; }
    .page { box-shadow: none; margin: 0; padding: 0; max-width: none; }
    .kpi-grid { page-break-inside: avoid; }
    h2.section { page-break-after: avoid; }
    .day-block { page-break-inside: avoid; }
}
"""


def render_kpi(label: str, value: str, hint: str = "", accent: bool = False) -> str:
    css = "value accent" if accent else "value"
    hint_html = f'<div class="hint">{html.escape(hint)}</div>' if hint else ""
    return f"""
    <div class="kpi">
      <div class="label">{html.escape(label)}</div>
      <div class="{css}">{html.escape(value)}</div>
      {hint_html}
    </div>
    """


def render_breakdown_table(title: str, rows: list[tuple[str, int, int]], total_orders: int, total_revenue: int) -> str:
    body_rows = []
    for label, count, revenue in rows:
        share = (revenue / total_revenue * 100) if total_revenue else 0
        body_rows.append(f"""
        <tr>
          <td>{html.escape(label)}</td>
          <td class="num">{fmt_int(count)}</td>
          <td class="num">{fmt_money(revenue)}</td>
          <td class="num">{share:.1f}%</td>
        </tr>
        """)
    return f"""
    <div>
      <h3 style="font-size:10pt;margin:0 0 6px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">{html.escape(title)}</h3>
      <table class="breakdown">
        <thead>
          <tr><th>Category</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Share</th></tr>
        </thead>
        <tbody>{''.join(body_rows)}</tbody>
        <tfoot>
          <tr><td>Total</td><td class="num">{fmt_int(total_orders)}</td><td class="num">{fmt_money(total_revenue)}</td><td class="num">100.0%</td></tr>
        </tfoot>
      </table>
    </div>
    """


def render_monthly_table(stats: dict) -> str:
    rows = []
    months = sorted(stats["by_month_revenue"].keys())
    for ym in months:
        y, m = ym
        label = datetime(y, m, 1).strftime("%B %Y")
        count = stats["by_month_orders"][ym]
        revenue = stats["by_month_revenue"][ym]
        avg = revenue / count if count else 0
        rows.append(f"""
        <tr>
          <td>{html.escape(label)}</td>
          <td class="num">{fmt_int(count)}</td>
          <td class="num">{fmt_money(revenue)}</td>
          <td class="num">{fmt_money(avg)}</td>
        </tr>
        """)
    total_orders = stats["total_orders"]
    total_rev = stats["total_revenue"]
    avg_total = total_rev / total_orders if total_orders else 0
    return f"""
    <table class="breakdown">
      <thead>
        <tr><th>Month</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Avg / Order</th></tr>
      </thead>
      <tbody>{''.join(rows)}</tbody>
      <tfoot>
        <tr><td>Total</td><td class="num">{fmt_int(total_orders)}</td><td class="num">{fmt_money(total_rev)}</td><td class="num">{fmt_money(avg_total)}</td></tr>
      </tfoot>
    </table>
    """


def render_top_items(stats: dict, limit: int = 10) -> str:
    items = stats["by_item_qty"].most_common(limit)
    rows = []
    for name, qty in items:
        revenue = stats["by_item_revenue"][name]
        rows.append(f"""
        <tr>
          <td>{html.escape(name)}</td>
          <td class="num">{fmt_int(qty)}</td>
          <td class="num">{fmt_money(revenue)}</td>
        </tr>
        """)
    return f"""
    <table class="breakdown">
      <thead>
        <tr><th>Item</th><th class="num">Sold</th><th class="num">Revenue</th></tr>
      </thead>
      <tbody>{''.join(rows)}</tbody>
    </table>
    """


def render_day_block(day: date, day_orders: list[dict], day_revenue: int) -> str:
    day_orders_sorted = sorted(day_orders, key=lambda o: o.get("timestamp", 0))
    rows = []
    for o in day_orders_sorted:
        order_no = safe_str(o.get("orderNo"))
        t = safe_str(o.get("time"))
        items = describe_items(o.get("items", []) or [])
        eat = o.get("eatType") or "—"
        eat_class = {"eat-in": "eat-in", "take-away": "take-away"}.get(eat, "")
        eat_label = humanize_label(eat)
        source = humanize_label(o.get("orderSource"))
        table_no = o.get("tableNumber")
        table_cell = f"Table {html.escape(safe_str(table_no))}" if table_no else "—"
        payment = humanize_label(o.get("paymentType"), fallback="—")
        price = int(o.get("price", 0) or 0)
        rows.append(f"""
        <tr>
          <td class="num">#{html.escape(order_no)}</td>
          <td class="muted">{html.escape(t)}</td>
          <td class="items">{html.escape(items)}</td>
          <td><span class="tag {eat_class}">{html.escape(eat_label)}</span></td>
          <td class="muted">{html.escape(source)}</td>
          <td class="muted">{table_cell}</td>
          <td class="muted">{html.escape(payment)}</td>
          <td class="num">{fmt_money(price)}</td>
        </tr>
        """)
    avg = day_revenue / len(day_orders) if day_orders else 0
    weekday = day.strftime("%A")
    pretty_date = day.strftime("%d %B %Y")
    return f"""
    <section class="day-block">
      <div class="day-header">
        <div class="date">{html.escape(weekday)}, {html.escape(pretty_date)}</div>
        <div class="summary">{fmt_int(len(day_orders))} orders · avg {fmt_money(avg)}</div>
      </div>
      <table class="ledger">
        <thead>
          <tr>
            <th class="num">No.</th>
            <th>Time</th>
            <th class="items">Items</th>
            <th>Service</th>
            <th>Source</th>
            <th>Table</th>
            <th>Payment</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>{''.join(rows)}</tbody>
        <tfoot>
          <tr><td colspan="7">Day Total</td><td class="num">{fmt_money(day_revenue)}</td></tr>
        </tfoot>
      </table>
    </section>
    """


def render_report(shop_name: str, owner: str, stats: dict, generated_at: datetime) -> str:
    period_start = stats["period_start"]
    period_end = stats["period_end"]
    period_label = (
        f"{period_start.strftime('%d %b %Y')} – {period_end.strftime('%d %b %Y')}"
        if period_start and period_end else "—"
    )

    # KPI summary
    kpis = "".join([
        render_kpi("Total Revenue", fmt_money(stats["total_revenue"]), accent=True),
        render_kpi("Total Orders", fmt_int(stats["total_orders"])),
        render_kpi("Operating Days", fmt_int(stats["operating_days"])),
        render_kpi("Avg. Daily Revenue", fmt_money(stats["avg_daily_revenue"])),
        render_kpi("Avg. Daily Orders", f"{stats['avg_daily_orders']:.1f}"),
        render_kpi("Avg. Order Value", fmt_money(stats["avg_order_value"])),
    ])

    # Breakdown tables
    source_rows = sorted(
        ((humanize_label(k), stats["by_source_orders"][k], v)
         for k, v in stats["by_source_revenue"].items()),
        key=lambda r: -r[2],
    )
    eat_rows = sorted(
        ((humanize_label(k), stats["by_eat_orders"][k], v)
         for k, v in stats["by_eat_revenue"].items()),
        key=lambda r: -r[2],
    )
    payment_rows = sorted(
        ((humanize_label(k), stats["by_payment_orders"][k], v)
         for k, v in stats["by_payment_revenue"].items()),
        key=lambda r: -r[2],
    )

    source_table = render_breakdown_table(
        "By Sales Channel", source_rows, stats["total_orders"], stats["total_revenue"]
    )
    eat_table = render_breakdown_table(
        "By Service Type", eat_rows, stats["total_orders"], stats["total_revenue"]
    )
    payment_table = render_breakdown_table(
        "By Payment Method", payment_rows, stats["total_orders"], stats["total_revenue"]
    )

    monthly_table = render_monthly_table(stats)
    top_items_table = render_top_items(stats, limit=10)

    # Daily ledger
    day_blocks = []
    for day in sorted(stats["by_day_orders"].keys()):
        day_blocks.append(render_day_block(
            day, stats["by_day_orders"][day], stats["by_day_revenue"][day]
        ))

    generated_label = generated_at.strftime("%d %B %Y, %H:%M")

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{html.escape(shop_name)} — Sales Statement {html.escape(period_label)}</title>
<style>{CSS}</style>
</head>
<body>
<div class="page">

  <header class="statement-head">
    <div>
      <div class="brand">{html.escape(shop_name)}</div>
      <div class="subtitle">Sales Statement — Daily Operations Ledger</div>
      <div class="subtitle">Owner: {html.escape(owner)}</div>
    </div>
    <div class="meta">
      <div class="label">Reporting Period</div>
      <div class="value">{html.escape(period_label)}</div>
      <div class="label" style="margin-top:6px;">Generated</div>
      <div class="value">{html.escape(generated_label)}</div>
    </div>
  </header>

  <h2 class="section">Statement Overview</h2>
  <p class="intro">Summary of trading activity for the period above, derived from point-of-sale records. All figures in Thai Baht (฿).</p>
  <div class="kpi-grid">
    {kpis}
  </div>

  <h2 class="section">Monthly Trading Summary</h2>
  {monthly_table}

  <h2 class="section">Sales Breakdown</h2>
  <div class="two-col">
    {source_table}
    {eat_table}
  </div>
  <div style="margin-top:18px;">
    {payment_table}
  </div>

  <h2 class="section">Top Selling Items</h2>
  {top_items_table}

  <h2 class="section">Daily Sales Ledger</h2>
  <p class="intro">Per-day record of every transaction processed during the reporting period.</p>
  {''.join(day_blocks)}

  <div class="signoff">
    <div>Generated from POS system · {html.escape(generated_label)}</div>
    <div>{html.escape(shop_name)} · Owner: {html.escape(owner)}</div>
  </div>

</div>
</body>
</html>
"""


def main() -> int:
    args = parse_args()
    if not args.input.exists():
        sys.exit(f"Input not found: {args.input}")

    orders = load_orders(args.input)
    shifted = normalize_legacy_dates(orders)
    if shifted:
        print(f"Folded {shifted} pre-Dec-2025 order(s) into 2025-12-01")
    orders = filter_period(orders, args.date_from, args.date_to)
    if not orders:
        sys.exit("No orders in selected period.")

    stats = aggregate(orders)
    html_out = render_report(args.shop_name, args.owner, stats, datetime.now())

    output = args.output or args.input.with_suffix(".report.html")
    output.write_text(html_out, encoding="utf-8")
    print(f"Wrote {output} ({len(orders):,} orders, {stats['operating_days']} day(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
