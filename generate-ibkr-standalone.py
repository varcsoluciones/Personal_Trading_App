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
    if px < rx + rad and py < ry + rad:
        return math.hypot(px - (rx + rad), py - (ry + rad)) <= rad
    if px > rx + rw - rad and py < ry + rad:
        return math.hypot(px - (rx + rw - rad), py - (ry + rad)) <= rad
    if px < rx + rad and py > ry + rh - rad:
        return math.hypot(px - (rx + rad), py - (ry + rh - rad)) <= rad
    if px > rx + rw - rad and py > ry + rh - rad:
        return math.hypot(px - (rx + rw - rad), py - (ry + rh - rad)) <= rad
    return True

def create_standalone_ibkr_png(filename, size):
    width = size
    height = size
    raw_data = bytearray()
    
    # 1. Dark matte obsidian canvas (#0a0a0c)
    # 2. Central Interactive Brokers Crimson Red Square
    badge_w = width * 0.72
    badge_h = height * 0.72
    badge_x = (width - badge_w) / 2.0
    badge_y = (height - badge_h) / 2.0
    badge_rad = badge_w * 0.22
    
    # Normalized coordinates inside badge (0..1)
    # P vertical stem (left)
    p_stem = [
        (badge_x + badge_w * 0.18, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.32, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.32, badge_y + badge_h * 0.78),
        (badge_x + badge_w * 0.18, badge_y + badge_h * 0.78),
    ]
    
    # P upper loop top
    p_top = [
        (badge_x + badge_w * 0.32, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.52, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.52, badge_y + badge_h * 0.34),
        (badge_x + badge_w * 0.32, badge_y + badge_h * 0.34),
    ]
    
    # P loop right
    p_right = [
        (badge_x + badge_w * 0.44, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.56, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.56, badge_y + badge_h * 0.52),
        (badge_x + badge_w * 0.44, badge_y + badge_h * 0.52),
    ]
    
    # P loop mid
    p_mid = [
        (badge_x + badge_w * 0.32, badge_y + badge_h * 0.42),
        (badge_x + badge_w * 0.52, badge_y + badge_h * 0.42),
        (badge_x + badge_w * 0.52, badge_y + badge_h * 0.54),
        (badge_x + badge_w * 0.32, badge_y + badge_h * 0.54),
    ]
    
    # T horizontal bar
    t_bar = [
        (badge_x + badge_w * 0.50, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.82, badge_y + badge_h * 0.22),
        (badge_x + badge_w * 0.82, badge_y + badge_h * 0.34),
        (badge_x + badge_w * 0.50, badge_y + badge_h * 0.34),
    ]
    
    # T vertical stem
    t_stem = [
        (badge_x + badge_w * 0.62, badge_y + badge_h * 0.34),
        (badge_x + badge_w * 0.74, badge_y + badge_h * 0.34),
        (badge_x + badge_w * 0.74, badge_y + badge_h * 0.78),
        (badge_x + badge_w * 0.62, badge_y + badge_h * 0.78),
    ]
    
    # Rightward trading momentum arrow
    arrow_head = [
        (badge_x + badge_w * 0.70, badge_y + badge_h * 0.42),
        (badge_x + badge_w * 0.86, badge_y + badge_h * 0.54),
        (badge_x + badge_w * 0.70, badge_y + badge_h * 0.66),
        (badge_x + badge_w * 0.70, badge_y + badge_h * 0.58),
        (badge_x + badge_w * 0.60, badge_y + badge_h * 0.58),
        (badge_x + badge_w * 0.60, badge_y + badge_h * 0.50),
        (badge_x + badge_w * 0.70, badge_y + badge_h * 0.50),
    ]

    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            sub_samples = [
                (x + 0.25, y + 0.25),
                (x + 0.75, y + 0.25),
                (x + 0.25, y + 0.75),
                (x + 0.75, y + 0.75),
            ]
            
            r_acc, g_acc, b_acc, a_acc = 0, 0, 0, 0
            
            for sx, sy in sub_samples:
                # Dark obsidian background
                dist_center = math.hypot((sx / width - 0.5) * 2, (sy / height - 0.5) * 2)
                bg_val = max(10, int(18 - dist_center * 8))
                
                in_badge = point_in_rounded_rect(sx, sy, badge_x, badge_y, badge_w, badge_h, badge_rad)
                
                if in_badge:
                    in_white = (
                        point_in_polygon(sx, sy, p_stem) or
                        point_in_polygon(sx, sy, p_top) or
                        point_in_polygon(sx, sy, p_right) or
                        point_in_polygon(sx, sy, p_mid) or
                        point_in_polygon(sx, sy, t_bar) or
                        point_in_polygon(sx, sy, t_stem) or
                        point_in_polygon(sx, sy, arrow_head)
                    )
                    
                    if in_white:
                        pr, pg, pb = 255, 255, 255
                    else:
                        # IBKR Signature Crimson Red with subtle vertical gradient (#D32F2F -> #B71C1C)
                        rel_y = (sy - badge_y) / badge_h
                        pr = int(218 - 35 * rel_y)
                        pg = int(24 - 10 * rel_y)
                        pb = int(45 - 20 * rel_y)
                else:
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
    print(f"✅ Generated {filename} ({width}x{height})")

create_standalone_ibkr_png("public/icon-ibkr-standalone-512.png", 512)
create_standalone_ibkr_png("public/apple-touch-icon-ibkr-standalone.png", 180)

