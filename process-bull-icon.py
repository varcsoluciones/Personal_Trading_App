import os
import zlib
import struct
import math

# 1. Read raw uploaded bull image PNG
with open("/tmp/bull_raw.png", "rb") as f:
    data = f.read()

pos = 8
idat_chunks = []
while pos < len(data):
    length, = struct.unpack(">I", data[pos:pos+4])
    chunk_type = data[pos+4:pos+8]
    chunk_data = data[pos+8:pos+8+length]
    pos += 12 + length
    if chunk_type == b"IDAT":
        idat_chunks.append(chunk_data)

raw = zlib.decompress(b"".join(idat_chunks))
row_size = 1 + 1024 * 3

# Helper to check if pixel in original is part of the white outer corner frame
def is_outer_white(x, y):
    # The inner black squircle has radius approx 220px from corners
    # Corners are around (< 140, < 140), (> 884, < 140), (< 140, > 884), (> 884, > 884)
    r = raw[y*row_size + 1 + x*3]
    g = raw[y*row_size + 1 + x*3 + 1]
    b = raw[y*row_size + 1 + x*3 + 2]
    
    # Outer white corners
    if r > 240 and g > 240 and b > 240:
        # Check if in corner zone
        if (x < 180 and y < 180) or (x > 844 and y < 180) or (x < 180 and y > 844) or (x > 844 and y > 844):
            return True
        if x < 15 or x > 1008 or y < 15 or y > 1008:
            return True
    return False

def render_bull_icon(out_filename, out_size):
    raw_out = bytearray()
    scale = 1024.0 / out_size
    
    for oy in range(out_size):
        raw_out.append(0) # filter type 0
        for ox in range(out_size):
            # Map to original 1024x1024 coordinates
            sx = int(ox * scale)
            sy = int(oy * scale)
            sx = max(0, min(1023, sx))
            sy = max(0, min(1023, sy))
            
            # Sample 4 sub-pixels for smooth anti-aliased scaling
            r_acc, g_acc, b_acc = 0, 0, 0
            
            sub_coords = [
                (ox * scale, oy * scale),
                (ox * scale + scale * 0.5, oy * scale),
                (ox * scale, oy * scale + scale * 0.5),
                (ox * scale + scale * 0.5, oy * scale + scale * 0.5),
            ]
            
            for cx, cy in sub_coords:
                ix = max(0, min(1023, int(cx)))
                iy = max(0, min(1023, int(cy)))
                
                if is_outer_white(ix, iy):
                    # Replace outer white frame with solid black (#0A0A0C)
                    pr, pg, pb = 10, 10, 12
                else:
                    pr = raw[iy*row_size + 1 + ix*3]
                    pg = raw[iy*row_size + 1 + ix*3 + 1]
                    pb = raw[iy*row_size + 1 + ix*3 + 2]
                    
                r_acc += pr
                g_acc += pg
                b_acc += pb
                
            fr = r_acc // 4
            fg = g_acc // 4
            fb = b_acc // 4
            
            raw_out.extend([fr, fg, fb, 255])
            
    # Build PNG
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    ihdr_data = struct.pack(">IIBBBBB", out_size, out_size, 8, 6, 0, 0, 0)
    png.extend(struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data)))
    
    compressed = zlib.compress(bytes(raw_out), 9)
    png.extend(struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", zlib.crc32(b"IDAT" + compressed)))
    
    png.extend(struct.pack(">I", 0) + b"IEND" + struct.pack(">I", zlib.crc32(b"IEND")))
    
    with open(out_filename, "wb") as f:
        f.write(png)
    print(f"✅ Generated {out_filename} ({out_size}x{out_size}) - Bull on Solid Black")

os.makedirs("public", exist_ok=True)
render_bull_icon("public/apple-touch-icon.png", 180)
render_bull_icon("public/apple-touch-icon-precomposed.png", 180)
render_bull_icon("public/icon-192.png", 192)
render_bull_icon("public/icon-512.png", 512)
render_bull_icon("public/favicon.png", 64)

