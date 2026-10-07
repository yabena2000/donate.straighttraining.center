"""One-off asset preparation: resizes source photos/logos from the shared
'Material COPIES' folder into web-sized files under assets/.
Run from the donate-site folder:  python scripts/prepare_assets.py
"""
import os, shutil, zipfile, io
from PIL import Image, ImageOps
import pymupdf, segno

SRC = os.path.join("..", "Material COPIES")
OUT = "assets"
C = os.path.join(SRC, "construction pics")
V = os.path.join(SRC, "video mat")

PHOTOS = {
    # name: (source path, max width)
    "hero-students": (os.path.join(V, "2026-07-11 Modest and Teachers", "IMG_1826.jpeg"), 2000),
    "teachers-group": (os.path.join(V, "2026-07-11 Modest and Teachers", "IMG_1808.jpeg"), 1400),
    "class-group": (os.path.join(V, "2026-07-11 Modest and Teachers", "IMG_1825.jpeg"), 1200),
    "rented-room": (os.path.join(V, "2025-07-05 playing cards and cooking", "WhatsApp Image 2026-07-09 at 12.35.48.jpeg"), 1000),
    "card-games": (os.path.join(V, "2025-07-05 playing cards and cooking", "WhatsApp Image 2026-07-09 at 12.35.49 (1).jpeg"), 1000),
    "cooking": (os.path.join(V, "2025-07-05 playing cards and cooking", "WhatsApp Image 2026-07-09 at 12.35.47 (1).jpeg"), 1000),
    "circle-game": (os.path.join(V, "2026-01-27 Computer Class pictures and video", "5fcd5e18-6022-43f6-8d16-30c6beee143f.jpeg"), 1000),
    "computer-class": (os.path.join(V, "2026-01-27 Computer Class pictures and video", "WhatsApp Image 2026-07-09 at 12.31.51 (6).jpeg"), 1000),
    "computers": (os.path.join(V, "2026-01-27 Computer Class pictures and video", "WhatsApp Image 2026-07-09 at 12.31.51 (3).jpeg"), 1000),
    "bookshelf": (os.path.join(V, "2026-01-27 Computer Class pictures and video", "WhatsApp Image 2026-07-09 at 12.31.51 (5).jpeg"), 1000),
    "schedule-board": (os.path.join(V, "2026-05-24 Schedule Board", "schedule board pic.jpeg"), 1000),
    # construction diary
    "d-2026-07-11-plot": (os.path.join(C, "2026-07-11 Plot Pictures", "IMG_1834.jpeg"), 1200),
    "d-2026-07-27-first-day": (os.path.join(C, "2026-07-27 construction first day", "79952161-B7A7-4588-918D-E65A6C87358D.jpg"), 1200),
    "d-2026-07-29-wall": (os.path.join(C, "2026-07-29 construction third day", "5B59062E-AEB2-49A9-8AEA-01DA362253E6.jpg"), 1200),
    "d-2026-08-03-wall": (os.path.join(C, "2026-08-03 construction", "867F7C21-99AB-4BF6-BEC4-4B12C997719D.jpg"), 1200),
    "d-2026-08-25-gate": (os.path.join(C, "2026-08-25 construction gate", "209C442F-AF9F-42BB-B91F-DFF622315A6A.jpg"), 1200),
    "d-2026-08-28-groundwater": (os.path.join(C, "2026-08-28 construction water", "photo_2026-09-05_09-47-56.jpg"), 1200),
    "d-2026-08-29-digging": (os.path.join(C, "2026-08-29 construction", "B966AA3A-A6F9-4A0F-AACE-686AA269C46D.jpg"), 1200),
    "d-2026-09-04-foundation": (os.path.join(C, "2026-09-04 construction", "72402D96-FAE0-4C93-8BE9-23C89080C694.jpg"), 1200),
    "d-2026-09-07-rubble": (os.path.join(C, "2026-09-07 construction rubble cars", "A3023C83-D3EB-42AE-B05E-206400E3EAB9.jpg"), 1200),
    "d-2026-09-13-students": (os.path.join(C, "2026-09-13 construction students helping", "816EFEB1-58C3-44EF-91DA-A9D16D143539.jpg"), 1200),
    "d-2026-09-13-students-2": (os.path.join(C, "2026-09-13 construction students helping", "4E550CD2-D5AE-4CFA-B4DE-28CBBCDCC537.jpg"), 1200),
    "d-2026-09-17-concrete": (os.path.join(C, "2026-09-17 construction", "8C65D845-52F9-4418-9EB3-2A4D4BCDB781.jpg"), 1200),
    "d-2026-09-18-foundation-complete": (os.path.join(C, "2026-09-18 construction foundation complete", "8F4D23A9-F100-434B-8F76-E8E5D45C04A9.jpg"), 1400),
}


def save_photo(name, src, width):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path = os.path.join(OUT, "img", "photos", name + ".jpg")
    im.save(path, quality=74, optimize=True, progressive=True)
    return path, im.size


def main():
    sizes = {}
    for name, (src, w) in PHOTOS.items():
        p, size = save_photo(name, src, w)
        sizes[name] = size
        print(f"{p}  {size}  {os.path.getsize(p)//1024} KB")

    logos = os.path.join(OUT, "img", "logos")
    L = os.path.join(SRC, "donor logos")
    for src, dst in [("stc logo.jpeg", "stc.jpg"), ("dsfa.jpeg", "dsfa.jpg"),
                     ("modest tour logo.jpeg", "modest-tour.jpg"), ("zanzibarcamp.jpeg", "zanzibar-camp.jpg")]:
        im = Image.open(os.path.join(L, src)).convert("RGB")
        if im.width > 600:
            im = im.resize((600, round(im.height * 600 / im.width)), Image.LANCZOS)
        im.save(os.path.join(logos, dst), quality=88)
    with zipfile.ZipFile(os.path.join(L, "tui Logo-1.zip")) as z:
        im = Image.open(io.BytesIO(z.read("Logo/master_TUI_CareFoundation_3C.png")))
        im.thumbnail((700, 700))
        im.save(os.path.join(logos, "tui-care-foundation.png"), optimize=True)

    # 3D views of the planned building
    plans = os.path.join(SRC, "building plans")
    for src, dst in [("SL 3d views.PDF", "plan-3d-views.jpg"),
                     ("SLbuilding with colored roof phase1+2 A3.PDF", "plan-phase1-roof.jpg")]:
        pix = pymupdf.open(os.path.join(plans, src))[0].get_pixmap(dpi=150)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        im.thumbnail((1600, 1600))
        im.save(os.path.join(OUT, "img", dst), quality=82)

    # QR codes for crypto addresses
    for name, data in [("eth", "ethereum:0x601c5e1dcb301fe2fd0df34bc96c7237c91d73d8"),
                       ("btc", "bitcoin:bc1qduj9sks7d7vct2y8tk4d6ve5frvx33vvftdscw")]:
        segno.make(data, error="m").save(os.path.join(OUT, "img", f"qr-{name}.svg"),
                                         scale=4, border=2, dark="#1f1b16")

    shutil.copy(os.path.join(SRC, "STC SfA contract 2026-07-13 final signed.pdf"),
                os.path.join(OUT, "docs", "STC-dSfA-MoU-2026-07-13.pdf"))
    print(sizes)


if __name__ == "__main__":
    main()
