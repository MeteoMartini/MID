"""Reproduce MID SVG contours from the pinned MetPy 1.7.1 font.
Developer-only: python extract_synop_glyphs.py /path/to/wx_symbols.ttf
Requires fontTools. Does not fetch or execute upstream code.
Source/license: public/licenses/metpy-weather-symbols.txt.
"""
import hashlib,json,sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
FONT_SHA256='110f8c675dec96e68cead16e4fe4e94d5fe7516eb8dc4953c9ccb9261c4dc637'
CODEPOINTS={56: 59864, 57: 59865, 66: 59874, 67: 59875, 68: 59876, 69: 59877, 71: 59879, 73: 59881, 75: 59883, 76: 59884, 77: 59885, 78: 59886, 79: 59887, 83: 59891, 84: 59892, 85: 59893, 86: 59894, 87: 59895, 88: 59896, 89: 59897, 90: 59898, 96: 59910, 99: 59915}
HEADER='// WMO present-weather contours extracted from MetPy v1.7.1 wx_symbols.ttf.\n// Upstream font: OGCMetOceanDWG/WorldWeatherSymbols, modified by MetPy.\n// CC BY 4.0; converted to local SVG paths and fitted within MID phase plates.\n// Attribution: public/licenses/metpy-weather-symbols.txt. No runtime font/download.\n'
font_path=Path(sys.argv[1])
if hashlib.sha256(font_path.read_bytes()).hexdigest()!=FONT_SHA256:
 raise SystemExit('Unexpected font SHA256: stop without writing output')
font=TTFont(font_path);glyphs=font.getGlyphSet();cmap=font.getBestCmap();rows={}
for code,point in CODEPOINTS.items():
 glyph=glyphs[cmap[point]];bounds=BoundsPen(glyphs);glyph.draw(bounds)
 x0,y0,x1,y1=bounds.bounds;pen=SVGPathPen(glyphs);glyph.draw(pen)
 scale=min(24/(x1-x0),17/(y1-y0));tx=16-(x0+x1)*scale/2;ty=12+(y0+y1)*scale/2
 rows[code]=f'<path transform="translate({tx:.5f} {ty:.5f}) scale({scale:.7f} {-scale:.7f})" d="{pen.getCommands()}" fill="currentColor"/>'
root=Path(__file__).resolve().parents[2]
(root/'src/synopWeatherGlyphPaths.ts').write_text(HEADER+'export const SYNOP_WEATHER_PATHS:Readonly<Record<number,string>>='+json.dumps(rows,separators=(',',':'),ensure_ascii=False)+';\n')
