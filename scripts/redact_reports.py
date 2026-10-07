"""Creates web versions of past project reports with personal data removed
(phone numbers, private addresses, handwritten signatures). Original metadata is kept.
Coordinates are PDF points (1/72 inch), measured on the source documents.
Run from the donate-site folder:  python scripts/redact_reports.py
"""
import pymupdf

SRC = r"..\Material COPIES"
NOTE_SIG = "signature removed"
JOBS = [
    {
        "src": "Report from Straight Trianing Center for Logos Circle Zanzibar on use of Funds for Computers.pdf",
        "out": "Report-Logos-Circle-Zanzibar-computers-2025.pdf",
        "notes": {2: (330, 622, 540, 652, "Online version: a private address has been covered."),
                  4: (330, 762, 540, 797, "Online version: phone numbers and e-mail on the receipt have been covered.")},
        "boxes": {
            2: [(322, 205, 384, 235, ""),      # invoice: recipient's private address (name kept)
                (276, 281, 314, 287.4, ""),    # invoice: delivery address, line 1 (street)
                (167, 287.2, 223, 293.6, "")], # invoice: delivery address, line 2 (postcode/town)
            4: [(122, 590, 392, 608, "")],     # supplier receipt: phone numbers and e-mail
        },
    },
    {
        "src": "SL application letter for TUI 2024-11-05.pdf",
        "out": "Application-TUI-Care-Foundation-2024-11-05.pdf",
        "notes": {2: (330, 430, 540, 470, "Online version: phone numbers and handwritten signatures have been removed.")},
        "boxes": {
            2: [(108, 273, 193, 288, ""),      # phone Modest
                (343, 273, 429, 288, ""),      # phone Umi
                (115, 340, 197, 355, ""),      # phone Zamraty
                (347, 340, 435, 355, ""),      # phone Yanis
                (86, 290, 152, 331, NOTE_SIG), # signatures
                (328, 288, 432, 310, NOTE_SIG),
                (80, 356, 164, 386, NOTE_SIG),
                (316, 355, 400, 402, NOTE_SIG)],
        },
    },
]

for job in JOBS:
    doc = pymupdf.open(fr"{SRC}\{job['src']}")
    meta = {k: v for k, v in doc.metadata.items() if k not in ("format", "encryption")}
    for pno, boxes in job["boxes"].items():
        page = doc[pno - 1]
        for x0, y0, x1, y1, note in boxes:
            page.add_redact_annot(pymupdf.Rect(x0, y0, x1, y1), text=note, fontsize=5,
                                  fill=(0, 0, 0), text_color=(1, 1, 1))
        # blank only the covered pixels of scanned/embedded images, remove covered text
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_PIXELS)
    # red note boxes, so readers see these are additions to the original
    for pno, (x0, y0, x1, y1, text) in job.get("notes", {}).items():
        page, rect, red = doc[pno - 1], pymupdf.Rect(x0, y0, x1, y1), (0.75, 0.1, 0.1)
        page.draw_rect(rect, color=red, fill=(1, 0.95, 0.95), width=0.8)
        page.insert_textbox(rect + (6, 5, -6, -4), text, fontsize=8, color=red)
    doc.set_metadata(meta)
    out = fr"assets\docs\{job['out']}"
    doc.save(out, garbage=4, deflate=True)
    print(out, pymupdf.open(out).metadata.get("producer"))
