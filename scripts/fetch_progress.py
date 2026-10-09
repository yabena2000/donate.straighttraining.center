"""Pulls the current totals from the public beancount ledger (Fava) and writes
data/progress.json, which the website reads for its progress bar.

Run from the donate-site folder:  python scripts/fetch_progress.py
(GitHub Actions runs this every night, see .github/workflows/update-progress.yml)

Ledger conventions this relies on:
  Equity:*                          one account per donor or channel (credits = donations, incl. pledges)
  Assets:Pending:* / Assets:Pledged:*   promised money that has not arrived yet
  Expenses:*                        construction expenses; the second level (Expenses:Material, ...) is the category
Amounts are kept per currency (EUR and TZS); the website counts EUR as EUR and
converts TZS with tsPerEur (thousand TZS per EUR) from data/config.json.
"""
import json, os, re, sys, urllib.parse, urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIG = json.load(open(os.path.join(ROOT, "data", "config.json"), encoding="utf8"))
PENDING = CONFIG.get("pendingAccounts", "^Assets:(Pending|Pledged):")


def query(bql):
    url = CONFIG["ledgerApi"] + "?" + urllib.parse.urlencode({"query_string": bql})
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)["data"]["rows"]


def add(target, key, inventory, sign=1):
    """Accumulate a Fava inventory {currency: amount} into target[key], rounded."""
    bucket = target.setdefault(key, {})
    for cur, amount in (inventory or {}).items():
        bucket[cur] = round(bucket.get(cur, 0) + sign * amount, 2)


def main():
    donors, pending, expenses = {}, {}, {}
    for account, inv in query("SELECT account, units(sum(position)) WHERE account ~ '^Equity:' GROUP BY account"):
        add(donors, account, inv, sign=-1)          # equity is credited, so flip the sign
    for account, inv in query("SELECT account, units(sum(position)) WHERE account ~ '^Assets:' GROUP BY account"):
        if re.match(PENDING, account):
            add(pending, account, inv)
    for account, inv in query("SELECT account, units(sum(position)) WHERE account ~ '^Expenses:' GROUP BY account"):
        add(expenses, ":".join(account.split(":")[:2]), inv)

    last = query("SELECT max(date)")[0][0]
    out = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="minutes"),
        "lastEntry": last,
        "note": "Amounts per currency.",
        "donors": donors,
        "pending": pending,
        "expenses": dict(sorted(expenses.items(), key=lambda kv: -sum(kv[1].values()))),
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
