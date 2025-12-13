import os
import re

def generate_hero():
    # Configuration
    WIDTH = 1200
    HEIGHT = 630
    BG_COLOR = "#16161b"
    BRAND_COLOR = "#0000ff"
    TEXT_COLOR = "#ffffff"
    
    # Paths
    LOGO_PATH = "public/logo.svg"
    OUTPUT_PATH = "public/hero_gen.svg"
    
    # Read Logo
    with open(LOGO_PATH, 'r') as f:
        logo_content = f.read()
        
    # Extract Font Style
    style_match = re.search(r'<style>(.*?)</style>', logo_content, re.DOTALL)
    font_style = style_match.group(1) if style_match else ""
    
    # Extract Logo Elements (excluding svg tag and defs)
    # We'll just grab everything inside <svg> and filter out defs if possible, or just grab the paths/text/polygon
    # SVG content is simple: defs, text, path, polygon.
    # We will copy the defs (which has style) and the shapes.
    
    # Let's extract shape elements
    shapes = re.findall(r'(<(?:text|path|polygon).*?/>|</(?:text|path|polygon)>)', logo_content, re.DOTALL)
    # This regex is weak. simpler to just strip the svg wrappers.
    
    # robust extraction: find <svg ...>(.*)</svg>
    inner_content_match = re.search(r'<svg[^>]*>(.*)</svg>', logo_content, re.DOTALL)
    inner_content = inner_content_match.group(1) if inner_content_match else ""
    
    # Remove existing <style> from inner to avoid duplication if we put it in defs? 
    # Actually we can just keep it.
    
    # We need to wrap the logo shapes in a group to position them.
    # The logo viewBox is -50 -7 200 200.
    # It draws in that coordinate space.
    # We want to center it.
    # Let's say we want logo to be 200px wide.
    # Logo logical width is 200 (from viewBox width).
    # So scale=1 is 200px.
    # Let's position it at top center.
    # Center X = 600.
    # Center Y = ~250?
    
    # We'll use a transform.
    # The logo coordinates start around -50.
    # So to center at 0,0 (relative), we adjust.
    # Actually, simpler to just translate.
    
    svg_template = f'''<svg width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            {font_style}
            .hero-title {{
                font-family: Orbitron;
                font-weight: 900;
                font-size: 80px;
                fill: {TEXT_COLOR};
                text-anchor: middle;
                text-transform: uppercase;
                letter-spacing: -2px;
            }}
            .hero-subtitle {{
                font-family: Orbitron;
                font-weight: 700;
                font-size: 80px;
                fill: {BRAND_COLOR};
                text-anchor: middle;
                text-transform: uppercase;
                letter-spacing: -2px;
            }}
        </style>
    </defs>
    o
    <!-- Background -->
    <rect width="100%" height="100%" fill="{BG_COLOR}"/>
    
    <!-- Logo Group -->
    <!-- Logo viewBox is -50 -7 200 200. 
         Ideally we translate it so it appears centered.
         Let's scale it by 1.5.
         Translate to center x=600, y=200.
    -->
    <g transform="translate(600, 220) scale(1.2)">
        <g transform="translate(-50, -50)"> <!-- approximate centering correction based on viewBox -->
            {inner_content}
        </g>
    </g>
    
    <!-- Text -->
    <text x="600" y="480" class="hero-title">Pinned Casts</text>
    <text x="600" y="560" class="hero-subtitle">Dynamic View</text>
    
</svg>'''

    with open(OUTPUT_PATH, 'w') as f:
        f.write(svg_template)
    
    print(f"Generated {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_hero()
