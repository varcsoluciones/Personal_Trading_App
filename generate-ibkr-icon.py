import os
import zlib
import struct
import math

os.makedirs("public", exist_ok=True)

def point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def point_in_rounded_rect(px, py, rx, ry, rw, rh, rad):
    if px < rx or px > rx + rw or py < ry or py > ry + rh:
        return False
    # Check corners
    if px < rx + rad and py < ry + rad:
        return math.hypot(px - (rx + rad), py - (ry + rad)) <= rad
    if px > rx + rw - rad and py < ry + rad:
        return math.hypot(px - (rx + rw - rad), py - (ry + rad)) <= rad
    if px < rx + rad and py > ry + rh - rad:
        return math.hypot(px - (rx + rad), py - (ry + rh - rad)) <= rad
    if px > rx + rw - rad and py > ry + rh - rad:
        return math.hypot(px - (rx + rw - rad), py - (ry + rh - rad)) <= rad
    return True

def create_ibkr_png(filename, size):
    width = size
    height = size
    raw_data = bytearray()
    
    # IBKR-inspired Geometry:
    # 1. Outer canvas: Sleek deep black/charcoal background (#0c0c0e)
    # 2. Central element: Interactive Brokers signature vibrant crimson red badge (#d32f2f / #e11d48)
    #    with stylized geometric white/silver precision bars & quantitative monogram cut.
    
    badge_w = width * 0.62
    badge_h = height * 0.62
    badge_x = (width - badge_w) / 2.0
    badge_y = (height - badge_h) / 2.0
    badge_rad = badge_w * 0.22
    
    # White precision bars inside the red badge (normalized relative to badge)
    # Bar 1 (Left vertical stem of 'P' / pillar)
    bar1_poly = [
        (badge_x + badge_w * 0.22, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.38, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.38, badge_y + badge_h * 0.78),
        (badge_x + badge_w * 0.22, badge_y + badge_h * 0.78),
    ]
    
    # Bar 2 (Top horizontal bar of 'T' / upper loop)
    bar2_poly = [
        (badge_x + badge_w * 0.38, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.78, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.78, badge_y + badge_h * 0.36),
        (badge_x + badge_w * 0.38, badge_y + badge_h * 0.36),
    ]
    
    # Bar 3 (Middle connecting bar / quant step)
    bar3_poly = [
        (badge_x + badge_w * 0.38, badge_y + badge_h * 0.46),
        (badge_x + badge_w * 0.68, badge_y + badge_h * 0.46),
        (badge_x + badge_w * 0.68, badge_y + badge_h * 0.58),
        (badge_x + badge_w * 0.38, badge_y + badge_h * 0.58),
    ]
    
    # Dynamic institutional accent notch (white geometric step)
    step_poly = [
        (badge_x + badge_w * 0.52, badge_y + badge_h * 0.66),
        (badge_x + badge_w * 0.78, badge_y + badge_h * 0.66),
        (badge_x + badge_w * 0.78, badge_y + badge_h * 0.78),
        (badge_x + badge_w * 0.52, badge_y + badge_h * 0.78),
    ]

    for y in range(height):
        raw_data.append(0) # filter type 0
        ny = (y / (height - 1)) * 2.0 - 1.0
        for x in range(width):
            nx = (x / (width - 1)) * 2.0 - 1.0
            
            # Sub-pixel sampling (4x supersampling)
            sub_samples = [
                (x + 0.25, y + 0.25),
                (x + 0.75, y + 0.25),
                (x + 0.25, y + 0.75),
                (x + 0.75, y + 0.75),
            ]
            
            r_acc, g_acc, b_acc, a_acc = 0, 0, 0, 0
            
            for sx, sy in sub_samples:
                # Background: sleek Apple-style dark gradient
                dist_center = math.hypot((sx / width - 0.5) * 2, (sy / height - 0.5) * 2)
                bg_val = max(10, int(18 - dist_center * 8))
                
                # Check if in red badge
                in_badge = point_in_rounded_rect(sx, sy, badge_x, badge_y, badge_w, badge_h, badge_rad)
                
                if in_badge:
                    # Check if inside white monogram bars
                    in_white = (
                        point_in_polygon(sx, sy, bar1_poly) or
                        point_in_polygon(sx, sy, bar2_poly) or
                        point_in_polygon(sx, sy, bar3_poly) or
                        point_in_polygon(sx, sy, step_poly)
                    )
                    
                    if in_white:
                        # Crisp white / diamond silver
                        pr, pg, pb = 255, 255, 255
                    else:
                        # Interactive Brokers Signature Crimson Red (#E11D48 -> #BE123C)
                        rel_y = (sy - badge_y) / badge_h
                        pr = int(225 - 25 * rel_y)
                        pg = int(29 - 10 * rel_y)
                        pb = int(72 - 20 * rel_y)
                else:
                    # Background dark obsidian
                    pr, pg, pb = bg_val, bg_val, bg_val + 2
                
                r_acc += pr
                g_acc += pg
                b_acc += pb
                a_acc += 255
                
            raw_data.extend([r_acc // 4, g_acc // 4, b_acc // 4, a_acc // 4])
            
    # Build PNG
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data)))
    
    compressed = zlib.compress(bytes(raw_data), 9)
    png.extend(struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", zlib.crc32(b"IDAT" + compressed)))
    
    png.extend(struct.pack(">I", 0) + b"IEND" + struct.pack(">I", zlib.crc32(b"IEND")))
    
    with open(filename, "wb") as f:
        f.write(png)
    print(f"✅ Generated {filename} ({width}x{height}) - IBKR Style")

create_ibkr_png("public/icon-ibkr-512.png", 512)
create_ibkr_png("public/apple-touch-icon-ibkr.png", 180)

