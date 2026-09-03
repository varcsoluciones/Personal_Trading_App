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

def create_png_file(filename, size):
    width = size
    height = size
    raw_data = bytearray()
    
    # Lightning Bolt Polygon (Normalized coordinates 0..1)
    zap_poly_norm = [
        (0.56, 0.16),
        (0.32, 0.48),
        (0.50, 0.48),
        (0.44, 0.84),
        (0.72, 0.42),
        (0.54, 0.42),
    ]
    zap_poly = [(px * width, py * height) for px, py in zap_poly_norm]
    
    # Pulse wave line segments
    pulse_pts_norm = [
        (0.18, 0.68),
        (0.34, 0.68),
        (0.40, 0.58),
        (0.48, 0.76),
        (0.54, 0.62),
        (0.60, 0.68),
        (0.82, 0.68)
    ]
    pulse_pts = [(px * width, py * height) for px, py in pulse_pts_norm]

    # Supersampling factor for smooth anti-aliased edges
    for y in range(height):
        raw_data.append(0) # filter type 0 (None)
        ny = (y / (height - 1)) * 2.0 - 1.0 # -1 .. 1
        for x in range(width):
            nx = (x / (width - 1)) * 2.0 - 1.0 # -1 .. 1
            
            # 1. Background: Deep obsidian space with subtle gradient and blue glow
            dist_center = math.sqrt(nx * nx + ny * ny)
            
            # Subtle radial glow
            glow = max(0.0, 1.0 - dist_center * 0.9)
            bg_r = int(10 + glow * 15)
            bg_g = int(14 + glow * 40)
            bg_b = int(24 + glow * 85)
            
            # Outer squircle / rounded corner mask for iOS
            # (iOS auto-masks touch icons, but for generic web icon we add subtle rounded aesthetic)
            r, g, b, a = bg_r, bg_g, bg_b, 255
            
            # 2. Check 4 sub-pixel samples for anti-aliasing
            sub_samples = [
                (x + 0.25, y + 0.25),
                (x + 0.75, y + 0.25),
                (x + 0.25, y + 0.75),
                (x + 0.75, y + 0.75),
            ]
            
            zap_hits = 0
            for sx, sy in sub_samples:
                if point_in_polygon(sx, sy, zap_poly):
                    zap_hits += 1
            
            # Check pulse line
            min_line_dist = 999.0
            for i in range(len(pulse_pts) - 1):
                d = dist_to_segment(x + 0.5, y + 0.5, pulse_pts[i][0], pulse_pts[i][1], pulse_pts[i+1][0], pulse_pts[i+1][1])
                if d < min_line_dist:
                    min_line_dist = d
            
            line_thickness = max(1.5, width * 0.018)
            line_intensity = max(0.0, min(1.0, 1.0 - (min_line_dist - line_thickness * 0.5) / 1.5)) if min_line_dist < line_thickness + 1.5 else 0.0
            
            if zap_hits > 0:
                # Electric gradient on lightning bolt: top cyan (0, 240, 255) to bottom vibrant blue (0, 122, 255)
                progress = (y / height)
                zr = int(20 + 20 * progress)
                zg = int(220 - 100 * progress)
                zb = int(255)
                
                blend = zap_hits / 4.0
                r = int(r * (1 - blend) + zr * blend)
                g = int(g * (1 - blend) + zg * blend)
                b = int(b * (1 - blend) + zb * blend)
            elif line_intensity > 0:
                # Pulse line glow
                lr, lg, lb = 0, 180, 255
                r = int(r * (1 - line_intensity * 0.7) + lr * (line_intensity * 0.7))
                g = int(g * (1 - line_intensity * 0.7) + lg * (line_intensity * 0.7))
                b = int(b * (1 - line_intensity * 0.7) + lb * (line_intensity * 0.7))
            else:
                # Ambient lightning halo glow
                min_zap_dist = 999.0
                for i in range(len(zap_poly)):
                    p1 = zap_poly[i]
                    p2 = zap_poly[(i + 1) % len(zap_poly)]
                    d = dist_to_segment(x + 0.5, y + 0.5, p1[0], p1[1], p2[0], p2[1])
                    if d < min_zap_dist:
                        min_zap_dist = d
                
                halo_radius = width * 0.12
                if min_zap_dist < halo_radius:
                    halo = (1.0 - min_zap_dist / halo_radius) ** 2
                    r = min(255, int(r + 0 * halo))
                    g = min(255, int(g + 110 * halo))
                    b = min(255, int(b + 240 * halo))

            raw_data.extend([r, g, b, a])
            
    # Build PNG File
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data)))
    
    compressed = zlib.compress(bytes(raw_data), 9)
    png.extend(struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", zlib.crc32(b"IDAT" + compressed)))
    
    png.extend(struct.pack(">I", 0) + b"IEND" + struct.pack(">I", zlib.crc32(b"IEND")))
    
    with open(filename, "wb") as f:
        f.write(png)
    print(f"✅ Generated {filename} ({width}x{height})")

# Generate all standard mobile & web app icons
create_png_file("public/apple-touch-icon.png", 180)
create_png_file("public/apple-touch-icon-precomposed.png", 180)
create_png_file("public/icon-192.png", 192)
create_png_file("public/icon-512.png", 512)
create_png_file("public/favicon.png", 64)

# Create Web App Manifest (for Android, Chrome, and iOS PWA support)
manifest = """{
  "name": "Personal Trading Pro",
  "short_name": "Trading Pro",
  "description": "Análisis Cuantitativo, Señales & Backtesting para Criptomonedas, Acciones y ETFs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
"""

with open("public/manifest.json", "w", encoding="utf-8") as f:
    f.write(manifest)
print("✅ Generated public/manifest.json")
