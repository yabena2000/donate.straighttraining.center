"""Creates the web version of the signed MoU with personal data covered:
handwritten signatures, ID numbers, dates of birth, phone numbers and home addresses.
Names, dates, amounts and all other content stay readable. Original metadata is kept.
Pages with official documents (registration, licence, purchase contract) are stamped
"ONLINE COPY - NOT VALID FOR OFFICIAL USE" and flattened to images, so the stamp
cannot be removed from the PDF.
Coordinates are PDF points (1/72 inch), measured on the source document.
Run from the donate-site folder:  python scripts/redact_mou.py
"""
import math
import sys
import pymupdf

SRC = r"..\Material COPIES\STC SfA contract 2026-07-13 final signed.pdf"
OUT = r"assets\docs\STC-dSfA-MoU-2026-07-13.pdf"
LOGO_XREF = 11   # page header logo, present on every page – never touched
SIG = "signature removed"
STAMPED = [2, 3, 4, 12, 13, 14, 15, 16]   # BPRA certificate, BPRA form, business licence, purchase contract
OUT_DPI = 110

BOXES = {
    # p.3 – BPRA registration form of STC: ID numbers, dates of birth, phone numbers, home addresses
    3: [(235, 230, 274, 242, ""), (370, 249, 414, 261, ""), (233, 266, 282, 280, ""),       # applicant
        (233, 383, 282, 396, ""),                                                          # business phone
        (235, 430, 276, 442, ""), (366, 453, 412, 466, ""), (259, 474, 306, 486, ""),      # owner 1
        (235, 497, 418, 514, ""),
        (235, 576, 276, 588, ""), (370, 602, 418, 614, ""), (259, 625, 316, 637, ""),      # owner 2
        (235, 650, 404, 670, "")],
    # pp.12-16 – plot purchase contract: ID numbers, phone numbers (incl. in the lawyer's stamp), signatures
    12: [(212, 193, 362, 205, ""),                                                         # lawyer letterhead phones
         (114, 365, 173, 378, ""), (240, 365, 327, 378, ""),                               # seller 1 ID, phone
         (114, 425, 242, 438, ""), (298, 425, 388, 438, ""),                               # seller 2 ID, phone
         (447, 531, 476, 542, ""), (111, 542, 176, 555, ""),                               # buyer phone
         (250, 636, 318, 676, "")],                                                        # stamp phones
    13: [(290, 612, 340, 630, ""), (274, 625, 312, 648, "")],
    14: [(158, 320, 244, 336, ""), (330, 298, 410, 330, SIG), (158, 481, 268, 497, ""), (355, 460, 405, 497, SIG),
         (290, 553, 350, 585, ""), (262, 575, 318, 612, "")],
    15: [(158, 280, 246, 294, ""), (347, 205, 398, 236, SIG), (158, 417, 251, 432, ""), (351, 343, 402, 372, SIG),
         (158, 567, 246, 582, ""), (360, 477, 423, 502, SIG), (262, 566, 310, 600, ""), (226, 590, 280, 630, "")],
    16: [(158, 212, 248, 227, ""), (100, 332, 290, 371, SIG), (245, 304, 290, 332, ""), (222, 318, 268, 348, "")],
}

doc = pymupdf.open(SRC)
meta = {k: v for k, v in doc.metadata.items() if k not in ("format", "encryption")}

# Signature page (p.26): cover every handwritten signature image
sig_page = doc[25]
for img in sig_page.get_images(full=True):
    if img[0] != LOGO_XREF:
        for r in sig_page.get_image_rects(img[0]):
            sig_page.add_redact_annot(r, text=SIG, fontsize=5, fill=(0, 0, 0), text_color=(1, 1, 1))
sig_page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_REMOVE)

for pno, boxes in BOXES.items():
    page = doc[pno - 1]
    for x0, y0, x1, y1, note in boxes:
        page.add_redact_annot(pymupdf.Rect(x0, y0, x1, y1), text=note, fontsize=5,
                              fill=(0, 0, 0), text_color=(1, 1, 1))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_PIXELS)

# Notes for readers, in red boxes so they read as additions to the original
RED = (0.75, 0.1, 0.1)
def note_box(page, rect, text):
    page.draw_rect(rect, color=RED, fill=(1, 0.95, 0.95), width=0.8)
    page.insert_textbox(rect + (6, 5, -6, -4), text, fontsize=8, color=RED)

note_box(sig_page, pymupdf.Rect(290, 672, 495, 712),
         "Online version: handwritten signatures have been removed. The signed original is available on request.")
STAMP_NOTE = ("ONLINE COPY - NOT VALID FOR OFFICIAL USE. Published for transparency only; "
              "not proof of registration, licence or ownership. Originals are held by Straight Training Center.")
EXTRA = {3: " ID numbers, dates of birth, phone numbers and home addresses have been covered.",
         12: " ID numbers, phone numbers and signatures in this contract have been covered."}


def stamp(page, note):
    """Big diagonal stamp across the scanned document plus a red note below it."""
    r = page.rect
    imgs = [q for x in page.get_images(full=True) for q in page.get_image_rects(x[0])]
    doc_r = max(imgs, key=lambda q: q.width * q.height)   # the scan; the header logo is small
    angle = math.degrees(math.atan2(doc_r.height, doc_r.width))
    centre = pymupdf.Point((doc_r.x0 + doc_r.x1) / 2, (doc_r.y0 + doc_r.y1) / 2)
    diag = math.hypot(doc_r.width, doc_r.height)
    lines = ("ONLINE COPY", "NOT VALID FOR OFFICIAL USE")
    s1, s2 = (min(cap, diag * 0.85 / pymupdf.get_text_length(t, fontname="hebo", fontsize=1))
              for t, cap in zip(lines, (90, 48)))
    for text, size, dy in ((lines[0], s1, -s2 * 0.35), (lines[1], s2, s2 * 1.05)):
        w = pymupdf.get_text_length(text, fontname="hebo", fontsize=size)
        page.insert_text(pymupdf.Point(centre.x - w / 2, centre.y + dy), text, fontname="hebo",
                         fontsize=size, color=RED, fill_opacity=0.4, stroke_opacity=0.4,
                         morph=(centre, pymupdf.Matrix(-angle)))
    h = 46 if len(note) > 160 else 38
    top = doc_r.y1 + 6 if doc_r.y1 + 6 + h < r.height - 70 else doc_r.y1 - h - 6
    box = pymupdf.Rect(max(40, doc_r.x0), top, min(r.width - 40, max(doc_r.x1, doc_r.x0 + 420)), top + h)
    page.draw_rect(box, color=RED, fill=(1, 0.93, 0.93), width=1.2)
    page.insert_textbox(box + (7, 5, -7, -3), note, fontsize=8, fontname="hebo", color=RED)


for pno in STAMPED:
    stamp(doc[pno - 1], STAMP_NOTE + EXTRA.get(pno, ""))

# Flatten the stamped pages to images so the stamp cannot be stripped out
for pno in STAMPED:
    old = doc[pno - 1]
    rect = old.rect
    jpg = old.get_pixmap(dpi=OUT_DPI).tobytes("jpg", jpg_quality=65)
    new = doc.new_page(pno - 1, width=rect.width, height=rect.height)
    new.insert_image(rect, stream=jpg)
    doc.delete_page(pno)

# copy into a fresh document so the replaced page images are not carried along as orphans
clean = pymupdf.open()
clean.insert_pdf(doc)
doc = clean
doc.set_metadata(meta)  # keep author/creator/producer/dates of the original document
doc.save(sys.argv[1] if len(sys.argv) > 1 else OUT, garbage=4, deflate=True)
print(len(doc), "pages,", pymupdf.open(sys.argv[1] if len(sys.argv) > 1 else OUT).metadata["producer"])
