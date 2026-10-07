"""Pulls the current totals from the public beancount ledger (Fava) and writes
data/progress.json, which the website reads for its progress bar.

Run from the donate-site folder:  python scripts/fetch_progress.py
(GitHub Actions runs this every night, see .github/workflows/update-progress.yml)

Ledger conventions this relies on:
  Q:*          one equity account per donor or channel (credits = donations, incl. pledges)
  A:Pledged:*  promised money that has not arrived yet (asset / receivable)
  E:*          construction expenses; the second level (E:M, E:F, ...) is the category
Amounts in the ledger are in TS (= 1'000 TZS).
"""
import json, os, sys, urllib.parse, urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIG = json.load(open(os.path.join(ROOT, "data", "config.json"), encoding="utf8"))


def query(bql):
    url = CONFIG["ledgerApi"] + "?" + urllib.parse.urlencode({"query_string": bql})
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)["data"]["rows"]


def ts_of(inventory):
    """Value of a Fava inventory in TS. Non-TS units (e.g. EUR held at cost) are
    taken at their cost, which the query returns via cost()."""
    return sum(v for k, v in inventory.items() if k == "TS")


def main():
    donors = {}
    for account, inv in query("SELECT account, cost(sum(position)) WHERE account ~ '^Q:' GROUP BY account"):
        donors[account] = -ts_of(inv)

    pledged = {}
    for account, inv in query("SELECT account, cost(sum(position)) WHERE account ~ '^A:Pledged' GROUP BY account"):
        pledged[account] = ts_of(inv)

    expenses = {}
    for account, inv in query("SELECT account, cost(sum(position)) WHERE account ~ '^E:' GROUP BY account"):
        cat = ":".join(account.split(":")[:2])
        expenses[cat] = expenses.get(cat, 0) + ts_of(inv)

    last = query("SELECT max(date)")[0][0]

    out = {
        "unit": "TS",
        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="minutes"),
        "lastEntry": last,
        "donorsTS": {k: round(v, 2) for k, v in donors.items()},
        "pledgedTS": {k: round(v, 2) for k, v in pledged.items()},
        "expensesTS": {k: round(v, 2) for k, v in sorted(expenses.items(), key=lambda x: -x[1])},
    }
    path = os.path.join(ROOT, "data", "progress.json")
    with open(path, "w", encoding="utf8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # keep the last good progress.json if the ledger is unreachable
        print("Could not update progress:", e, file=sys.stderr)
        sys.exit(1)
