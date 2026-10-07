# donate.straighttraining.center

Fundraising website for the new building of **Straight Training Center**, a free English school for 200+ children in Fuoni, Zanzibar.

Plain HTML, CSS and JavaScript – no build step, no cookies, no tracking.

## What lives where

| File | What to edit there |
|---|---|
| `index.html` | All page text (English) |
| `data/config.json` | Building phases, their cost and status (`done`, `building`, `next`, `planned`), donor names, exchange rate |
| `data/accounts.json` | Donation channels and account details |
| `data/progress.json` | **Do not edit by hand** – written from the public ledger by `scripts/fetch_progress.py` |
| `assets/docs/` | Published PDFs (personal data removed by `scripts/redact_*.py`) |

## Live numbers from the ledger

The progress bar reads the public construction ledger at
<https://construction.straighttraining.center>. To refresh the numbers locally:

```
python scripts/fetch_progress.py
```

## Preview locally

```
python -m http.server 8642
```

then open <http://localhost:8642>.
