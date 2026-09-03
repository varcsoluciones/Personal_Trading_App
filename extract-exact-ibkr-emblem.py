import os
import zlib
import struct
import math

# 1. Read mockup image PNG
with open("/tmp/mockup.png", "rb") as f:
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

# Exact emblem center & scale in the mockup
cx = 520.0
cy = 500.0
emb_w = 400.0
emb_h = 360.0

# Interactive Brokers Signature Crimson Wine Red (#B81D24 -> #9E1520 / #88121B)
top_r, top_g, top_b = 186, 28, 40    # #BA1C28
bot_r, bot_g, bot_b = 142, 18, 28    # #8E121C

def render_fullbleed_icon(out_filename, out_size):
    target_emb_w = out_size * 0.65
    scale = target_emb_w / emb_w
    
    out_cx = out_size / 2.0
    out_cy = out_size / 2.0
    
    raw_out = bytearray()
    
    for oy in range(out_size):
        raw_out.append(0) # filter type 0
        rel_y = oy / out_size
        
        # Smooth institutional wine red background gradient (no borders)
        bg_r = int(top_r * (1.0 - rel_y) + bot_r * rel_y)
        bg_g = int(top_g * (1.0 - rel_y) + bot_g * rel_y)
        bg_b = int(top_b * (1.0 - rel_y) + bot_b * rel_y)
        
        for ox in range(out_size):
            src_x = cx + (ox - out_cx) / scale
            src_y = cy + (oy - out_cy) / scale
            
            x0 = int(math.floor(src_x))
            y0 = int(math.floor(src_y))
            x1 = x0 + 1
            y1 = y0 + 1
            
            if 0 <= x0 < 1023 and 0 <= y0 < 1023:
                fx = src_x - x0
                fy = src_y - y0
                
                def get_rgb(sx, sy):
                    r = raw[sy*row_size + 1 + sx*3]
                    g = raw[sy*row_size + 1 + sx*3 + 1]
                    b = raw[sy*row_size + 1 + sx*3 + 2]
                    return r, g, b
                
                r00, g00, b00 = get_rgb(x0, y0)
                r10, g10, b10 = get_rgb(x1, y0)
                r01, g01, b01 = get_rgb(x0, y1)
                r11, g11, b11 = get_rgb(x1, y1)
                
                sr = (r00*(1-fx) + r10*fx)*(1-fy) + (r01*(1-fx) + r11*fx)*fy
                sg = (g00*(1-fx) + g10*fx)*(1-fy) + (g01*(1-fx) + g11*fx)*fy
                sb = (b00*(1-fx) + b10*fx)*(1-fy) + (b01*(1-fx) + b11*fx)*fy
                
                # White emblem alpha mask calculation
                whiteness = (sg + sb) / 2.0
                alpha = max(0.0, min(1.0, (whiteness - 45.0) / 125.0))
                
                # Boost white sharpness
                white_intensity = max(sr, sg, sb)
                wr, wg, wb = 255, 255, 255
                
                final_r = int(bg_r * (1.0 - alpha) + wr * alpha)
                final_g = int(bg_g * (1.0 - alpha) + wg * alpha)
                final_b = int(bg_b * (1.0 - alpha) + wb * alpha)
            else:
                final_r, final_g, final_b = bg_r, bg_g, bg_b
                
            raw_out.extend([max(0, min(255, final_r)), max(0, min(255, final_g)), max(0, min(255, final_b)), 255])
            
    # Build PNG
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    ihdr_data = struct.pack(">IIBBBBB", out_size, out_size, 8, 6, 0, 0, 0)
    png.extend(struct.pack(">I", len(ihdr_data)) + b"IHDR" + ihdr_data + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data)))
    
    compressed = zlib.compress(bytes(raw_out), 9)
    png.extend(struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", zlib.crc32(b"IDAT" + compressed)))
    
    png.extend(struct.pack(">I", 0) + b"IEND" + struct.pack(">I", zlib.crc32(b"IEND")))
    
    with open(out_filename, "wb") as f:
        f.write(png)
    print(f"✅ Generated {out_filename} ({out_size}x{out_size})")

render_fullbleed_icon("public/apple-touch-icon.png", 180)
render_fullbleed_icon("public/apple-touch-icon-precomposed.png", 180)
render_fullbleed_icon("public/icon-192.png", 192)
render_fullbleed_icon("public/icon-512.png", 512)
render_fullbleed_icon("public/favicon.png", 64)

