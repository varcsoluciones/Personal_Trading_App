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

def dist_to_segment(px, py, x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    nearest_x = x1 + t * dx
    nearest_y = y1 + t * dy
    return math.hypot(px - nearest_x, py - nearest_y)

def create_wine_pt_png(filename, size):
    width = size
    height = size
    raw_data = bytearray()
    
    # Elegant Full-Bleed Wine / Crimson / Burgundy Background
    # Top: #9F1239 (Deep Crimson Wine), Bottom: #881337 / #700E2C (Rich Bordeaux Wine)
    
    # Centered 'P' and 'T' geometric monogram
    # Sizing: box spans from 0.16 to 0.84 width and 0.22 to 0.78 height
    cx = width * 0.5
    cy = height * 0.5
    
    # 'P' Geometry (Left Side)
    # 1. P left vertical stem
    p_stem = [
        (width * 0.20, height * 0.24),
        (width * 0.32, height * 0.24),
        (width * 0.32, height * 0.76),
        (width * 0.20, height * 0.76),
    ]
    
    # 2. P top horizontal bar
    p_top = [
        (width * 0.32, height * 0.24),
        (width * 0.52, height * 0.24),
        (width * 0.52, height * 0.35),
        (width * 0.32, height * 0.35),
    ]
    
    # 3. P right vertical outer curve/bar
    p_right = [
        (width * 0.42, height * 0.24),
        (width * 0.54, height * 0.24),
        (width * 0.54, height * 0.54),
        (width * 0.42, height * 0.54),
    ]
    
    # 4. P middle horizontal bar
    p_mid = [
        (width * 0.32, height * 0.43),
        (width * 0.52, height * 0.43),
        (width * 0.52, height * 0.54),
        (width * 0.32, height * 0.54),
    ]
    
    # 'T' Geometry (Right Side)
    # 1. T top horizontal bar
    t_top = [
        (width * 0.50, height * 0.24),
        (width * 0.80, height * 0.24),
        (width * 0.80, height * 0.35),
        (width * 0.50, height * 0.35),
    ]
    
    # 2. T center vertical stem
    t_stem = [
        (width * 0.60, height * 0.35),
        (width * 0.72, height * 0.35),
        (width * 0.72, height * 0.76),
        (width * 0.60, height * 0.76),
    ]
    
    # Geometric Rightward Momentum Arrow Cutout in T
    arrow_poly = [
        (width * 0.68, height * 0.44),
        (width * 0.84, height * 0.55),
        (width * 0.68, height * 0.66),
        (width * 0.68, height * 0.59),
        (width * 0.58, height * 0.59),
        (width * 0.58, height * 0.51),
        (width * 0.68, height * 0.51),
    ]
    
    # Subtle upward execution notch in P stem
    up_arrow_poly = [
        (width * 0.26, height * 0.38),
        (width * 0.38, height * 0.50),
        (width * 0.33, height * 0.50),
        (width * 0.33, height * 0.64),
        (width * 0.26, height * 0.64),
    ]

    for y in range(height):
        raw_data.append(0) # filter type none
        rel_y = y / height
        for x in range(width):
            sub_samples = [
                (x + 0.25, y + 0.25),
                (x + 0.75, y + 0.25),
                (x + 0.25, y + 0.75),
                (x + 0.75, y + 0.75),
            ]
            
            r_acc, g_acc, b_acc, a_acc = 0, 0, 0, 0
            
            for sx, sy in sub_samples:
                # Flat Wine Red / Rich Burgundy Background (#A2113A -> #780B2B)
                bg_r = int(162 - 42 * (sy / height))
                bg_g = int(17 - 6 * (sy / height))
                bg_b = int(58 - 15 * (sy / height))
                
                # Check if in white monogram
                in_white = (
                    point_in_polygon(sx, sy, p_stem) or
                    point_in_polygon(sx, sy, p_top) or
                    point_in_polygon(sx, sy, p_right) or
                    point_in_polygon(sx, sy, p_mid) or
                    point_in_polygon(sx, sy, t_top) or
                    point_in_polygon(sx, sy, t_stem) or
                    point_in_polygon(sx, sy, arrow_poly)
                )
                
                if in_white:
                    # Crisp diamond white
                    pr, pg, pb = 255, 255, 255
                else:
                    pr, pg, pb = bg_r, bg_g, bg_b
                
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
    print(f"✅ Generated {filename} ({width}x{height}) - Wine Red PT Monogram")

# Generate all official active app icons
create_wine_pt_png("public/apple-touch-icon.png", 180)
create_wine_pt_png("public/apple-touch-icon-precomposed.png", 180)
create_wine_pt_png("public/icon-192.png", 192)
create_wine_pt_png("public/icon-512.png", 512)
create_wine_pt_png("public/favicon.png", 64)

