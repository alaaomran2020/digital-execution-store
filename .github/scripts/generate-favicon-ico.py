#!/usr/bin/env python3
"""Generate a Windows-compatible ICO for Digital Execution using only stdlib.

Preserves the dark square and white DE initials from favicon/favicon.svg.
"""
from pathlib import Path
import struct

W = H = 32
glyphs = {
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
}
pixels = [[(0x0B, 0x12, 0x20, 255) for _ in range(W)] for _ in range(H)]
for char, x0 in [("D", 5), ("E", 17)]:
    for j, line in enumerate(glyphs[char]):
        for i, bit in enumerate(line):
            if bit == "1":
                for dy in range(2):
                    for dx in range(2):
                        x, y = x0 + i*2 + dx, 9 + j*2 + dy
                        pixels[y][x] = (255, 255, 255, 255)
# ICO BMP pixels: bottom-up BGRA, 1-bit AND mask (all opaque).
xor_data = b"".join(bytes((b,g,r,a)) for row in reversed(pixels) for r,g,b,a in row)
and_data = bytes(4 * H)
dib_header = struct.pack("<IiiHHIIiiII", 40, W, H*2, 1, 32, 0,
                         len(xor_data)+len(and_data), 0, 0, 0, 0)
bmp = dib_header + xor_data + and_data
ico = struct.pack("<HHH", 0, 1, 1) + struct.pack("<BBBBHHII", 32, 32, 0, 0, 1, 32, len(bmp), 22) + bmp
assert len(ico) == 4286
Path("favicon.ico").write_bytes(ico)
print("Created favicon.ico:", len(ico), "bytes; 32x32, 32-bit Windows icon")
