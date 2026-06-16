#!/usr/bin/env python3
import os
import sys
import sqlite3
import json
import math
import uuid
import argparse
import logging
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Add scripts directory to path to import vault_init
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vault_init import VaultSystemInitializer

# Try importing pythainlp, fallback to simple whitespace splitting
try:
    from pythainlp import word_tokenize
except ImportError:
    print("[WARNING] pythainlp not installed. Falling back to space-based tokenization.")
    def word_tokenize(text, engine=None):
        return text.split(" ")

class ThaiSyllableWrapper:
    """
    Thai Syllable Protection text wrapping engine.
    Ensures Thai text is wrapped gracefully without breaking syllables.
    Includes advanced protection to prevent new lines from starting with floating vowels or tonemarks.
    """
    def __init__(self, font, max_width, logger=None):
        self.font = font
        self.max_width = max_width
        self.logger = logger

    def get_text_width(self, text: str) -> int:
        """Calculate the visual width of the text in pixels."""
        return int(self.font.getlength(text))

    def wrap_text(self, text: str) -> list:
        """
        Wrap Thai text into lines using PyThaiNLP newcut word tokenize.
        Pulls base consonants if a line starts with a floating vowel or tonemark.
        Preserves manual newline breaks cleanly.
        """
        # Split text by raw newlines to preserve manual structure
        paragraphs = text.split("\n")
        all_wrapped_lines = []

        for paragraph in paragraphs:
            if not paragraph.strip():
                continue
                
            words = word_tokenize(paragraph)
            current_line = ""

            for word in words:
                test_line = f"{current_line}{word}" if current_line else word
                if self.get_text_width(test_line) > self.max_width:
                    if not current_line:
                        all_wrapped_lines.append(word)
                        current_line = ""
                    else:
                        all_wrapped_lines.append(current_line)
                        current_line = word
                else:
                    current_line = test_line

            if current_line:
                all_wrapped_lines.append(current_line)

        lines = all_wrapped_lines

        # Apply Vowel/Tonemark Floating Protection Rules
        # FLOATING_CHARS include upper/lower floating vowels and tonemarks
        FLOATING_CHARS = {'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', '่', '้', '๊', '๋', '์', 'ั', '็', 'ํ'}
        
        i = 1
        while i < len(lines):
            line = lines[i]
            if not line:
                i += 1
                continue
            
            # If the first character of the new line is a floating vowel or tonemark
            if line[0] in FLOATING_CHARS:
                if self.logger:
                    self.logger.info(f"[PillowDraw] ✂️ Floating mark detected at start of line: '{line[0]}'. Applying protection.")
                
                # Pull characters from the end of the previous line until we pull a non-floating character
                pulled = ""
                while i > 0 and len(lines[i-1]) > 0 and (not pulled or pulled[0] in FLOATING_CHARS):
                    char = lines[i-1][-1]
                    lines[i-1] = lines[i-1][:-1]
                    pulled = char + pulled
                
                # Prepend the pulled character(s) to the beginning of the current line
                lines[i] = pulled + lines[i]
                
                # Cleanup if the previous line is now empty
                if i > 0 and not lines[i-1]:
                    lines.pop(i-1)
                    i -= 1
            i += 1

        return [l for l in lines if l]


class GraphicGeneratorModule:
    """
    Advanced Pillow-based Image Generator for Content Factory V2.
    Supports high-quality procedural backgrounds, 5 styles, 3 dimensions, and 3 color themes.
    """
    def __init__(self, external_root_path: str):
        # Initialize vault folders, logging, and database
        self.init = VaultSystemInitializer(external_root_path).setup_directories().setup_logging()
        self.logger = self.init.logger
        self.db_path = self.init.db_path
        self.root_path = self.init.root_path
        
        # Load the premium Thai font Mitr-Medium.ttf
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.font_path = os.path.join(current_dir, "Mitr-Medium.ttf")
        if not os.path.exists(self.font_path):
            self.logger.warning(f"[PillowDraw] ⚠️ Font file not found at {self.font_path}. Using default system font fallback.")
        else:
            self.logger.info(f"[PillowDraw] 📂 Font Mitr-Medium loaded successfully from {self.font_path}")

        # Dimensions & Aspect Ratios
        self.aspect_ratios = {
            "1:1": (1080, 1080),
            "4:5": (1080, 1350),
            "4:3": (1080, 810),
            "16:9": (1280, 720),
            "9:16": (1080, 1920)
        }

        # Premium Eye-Catching Color Themes (including V1 presets mapped for both IDs and labels)
        self.color_themes = {
            # V2 Defaults
            "Classic Red Blue": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),       # Dark zinc to rich black
                "primary_text": (255, 255, 255),                  # White
                "highlight_fill": (220, 38, 38),                  # Premium Red #DC2626
                "highlight_text": (255, 255, 255),                # White
                "secondary_highlight": (29, 78, 216),            # Deep Blue #1D4ED8
                "accent_line": (220, 38, 38)
            },
            "Emerald Gold": {
                "bg_gradient": ((2, 44, 34), (2, 15, 12)),        # Deep Emerald to dark green-black
                "primary_text": (255, 255, 255),                  # White
                "highlight_fill": (5, 150, 105),                  # Emerald Green #059669
                "highlight_text": (245, 158, 11),                 # Luxurious Gold #F59E0B
                "secondary_highlight": (245, 158, 11),            # Luxurious Gold
                "accent_line": (245, 158, 11)
            },
            "Neon Purple": {
                "bg_gradient": ((76, 29, 149), (15, 23, 42)),     # Deep purple to slate
                "primary_text": (255, 255, 255),                  # White
                "highlight_fill": (168, 85, 247),                 # Neon Purple #A855F7
                "highlight_text": (250, 204, 21),                 # Neon Yellow #FACC15
                "secondary_highlight": (249, 115, 22),            # Neon Orange #F97316
                "accent_line": (168, 85, 247)
            },

            # V1 Palettes Ported
            "classic": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (225, 29, 29),                  # Red #E11D1D
                "highlight_text": (255, 242, 0),                  # Yellow #FFF200
                "secondary_highlight": (22, 136, 240),            # Blue #1688F0
                "accent_line": (225, 29, 29)
            },
            "tg-classic": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (225, 29, 29),                  # Red #E11D1D
                "highlight_text": (255, 242, 0),                  # Yellow #FFF200
                "secondary_highlight": (22, 136, 240),            # Blue #1688F0
                "accent_line": (225, 29, 29)
            },
            "emerald_gold": {
                "bg_gradient": ((2, 44, 34), (2, 15, 12)),
                "primary_text": (248, 250, 252),                  # #F8FAFC
                "highlight_fill": (5, 150, 105),                  # Green #059669
                "highlight_text": (250, 204, 21),                 # Gold #FACC15
                "secondary_highlight": (15, 118, 110),            # Teal #0F766E
                "accent_line": (250, 204, 21)
            },
            "tg-emerald-gold": {
                "bg_gradient": ((2, 44, 34), (2, 15, 12)),
                "primary_text": (248, 250, 252),                  # #F8FAFC
                "highlight_fill": (5, 150, 105),                  # Green #059669
                "highlight_text": (250, 204, 21),                 # Gold #FACC15
                "secondary_highlight": (15, 118, 110),            # Teal #0F766E
                "accent_line": (250, 204, 21)
            },
            "orange_teal": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (249, 115, 22),                 # Orange #F97316
                "highlight_text": (253, 224, 71),                 # Yellow #FDE047
                "secondary_highlight": (8, 145, 178),             # Cyan #0891B2
                "accent_line": (249, 115, 22)
            },
            "tg-orange-teal": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (249, 115, 22),                 # Orange #F97316
                "highlight_text": (253, 224, 71),                 # Yellow #FDE047
                "secondary_highlight": (8, 145, 178),             # Cyan #0891B2
                "accent_line": (249, 115, 22)
            },
            "purple_lime": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (124, 58, 237),                 # Purple #7C3AED
                "highlight_text": (190, 242, 100),                # Lime #BEF264
                "secondary_highlight": (79, 70, 229),             # Indigo #4F46E5
                "accent_line": (124, 58, 237)
            },
            "tg-purple-lime": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (124, 58, 237),                 # Purple #7C3AED
                "highlight_text": (190, 242, 100),                # Lime #BEF264
                "secondary_highlight": (79, 70, 229),             # Indigo #4F46E5
                "accent_line": (124, 58, 237)
            },
            "rose_cyan": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (225, 29, 72),                  # Rose #E11D48
                "highlight_text": (34, 211, 238),                 # Cyan #22D3EE
                "secondary_highlight": (14, 116, 144),             # Deep Cyan #0E7490
                "accent_line": (225, 29, 72)
            },
            "tg-rose-cyan": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (225, 29, 72),                  # Rose #E11D48
                "highlight_text": (34, 211, 238),                 # Cyan #22D3EE
                "secondary_highlight": (14, 116, 144),             # Deep Cyan #0E7490
                "accent_line": (225, 29, 72)
            },
            "amber_indigo": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 247, 237),                  # #FFF7ED
                "highlight_fill": (245, 158, 11),                 # Amber #F59E0B
                "highlight_text": (254, 240, 138),                # Cream #FEF08A
                "secondary_highlight": (79, 70, 229),             # Indigo #4F46E5
                "accent_line": (245, 158, 11)
            },
            "tg-amber-indigo": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 247, 237),                  # #FFF7ED
                "highlight_fill": (245, 158, 11),                 # Amber #F59E0B
                "highlight_text": (254, 240, 138),                # Cream #FEF08A
                "secondary_highlight": (79, 70, 229),             # Indigo #4F46E5
                "accent_line": (245, 158, 11)
            },
            "magenta_mint": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (219, 39, 119),                 # Pink #DB2777
                "highlight_text": (167, 243, 208),                # Mint #A7F3D0
                "secondary_highlight": (16, 185, 129),             # Green #10B981
                "accent_line": (219, 39, 119)
            },
            "tg-magenta-mint": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (219, 39, 119),                 # Pink #DB2777
                "highlight_text": (167, 243, 208),                # Mint #A7F3D0
                "secondary_highlight": (16, 185, 129),             # Green #10B981
                "accent_line": (219, 39, 119)
            },
            "graphite_gold": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (248, 250, 252),                  # #F8FAFC
                "highlight_fill": (55, 65, 81),                   # Slate #374151
                "highlight_text": (251, 191, 36),                 # Gold #FBBF24
                "secondary_highlight": (146, 64, 14),             # Bronze #92400E
                "accent_line": (251, 191, 36)
            },
            "tg-graphite-gold": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (248, 250, 252),                  # #F8FAFC
                "highlight_fill": (55, 65, 81),                   # Slate #374151
                "highlight_text": (251, 191, 36),                 # Gold #FBBF24
                "secondary_highlight": (146, 64, 14),             # Bronze #92400E
                "accent_line": (251, 191, 36)
            },
            "navy_coral": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (29, 78, 216),                  # Navy #1D4ED8
                "highlight_text": (251, 113, 133),                # Coral #FB7185
                "secondary_highlight": (15, 23, 42),               # Ink #0F172A
                "accent_line": (29, 78, 216)
            },
            "tg-navy-coral": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (29, 78, 216),                  # Navy #1D4ED8
                "highlight_text": (251, 113, 133),                # Coral #FB7185
                "secondary_highlight": (15, 23, 42),               # Ink #0F172A
                "accent_line": (29, 78, 216)
            },
            "white_hot": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (251, 146, 60),                 # Orange #FB923C
                "highlight_text": (250, 204, 21),                 # Yellow #FACC15
                "secondary_highlight": (248, 250, 252),            # White #F8FAFC
                "accent_line": (251, 146, 60)
            },
            "tg-white-hot": {
                "bg_gradient": ((24, 24, 27), (9, 9, 11)),
                "primary_text": (255, 255, 255),
                "highlight_fill": (251, 146, 60),                 # Orange #FB923C
                "highlight_text": (250, 204, 21),                 # Yellow #FACC15
                "secondary_highlight": (248, 250, 252),            # White #F8FAFC
                "accent_line": (251, 146, 60)
            }
        }

    def get_font(self, size: int, font_family: str = "Mitr") -> ImageFont:
        """Load truetype font with fallback to default."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(current_dir, f"{font_family}-Medium.ttf"),
            os.path.join(current_dir, f"{font_family}-Bold.ttf"),
            os.path.join(current_dir, f"{font_family}-Regular.ttf"),
            os.path.join(current_dir, f"{font_family}.ttf"),
            self.font_path
        ]
        for path in candidates:
            if path and os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except Exception as e:
                    pass
        return ImageFont.load_default()

    def format_subscribers(self, followers) -> str:
        """Format subscriber count for badges dynamically."""
        if not followers:
            return "452K Sub"
        try:
            followers = int(followers)
            if followers >= 1_000_000:
                return f"{followers / 1_000_000:.1f}M Sub".replace(".0M", "M")
            elif followers >= 1_000:
                return f"{followers / 1_000:.1f}K Sub".replace(".0K", "K")
            else:
                return f"{followers} Sub"
        except Exception:
            return "452K Sub"

    def generate_procedural_background(self, width: int, height: int, theme_colors: dict) -> Image.Image:
        """Generate a gorgeous gradient background with geometric overlays."""
        bg1, bg2 = theme_colors["bg_gradient"]
        img = Image.new("RGBA", (width, height))
        draw = ImageDraw.Draw(img)

        # 1. Linear Diagonal/Vertical Gradient
        for y in range(height):
            t = y / height
            r = int(bg1[0] + (bg2[0] - bg1[0]) * t)
            g = int(bg1[1] + (bg2[1] - bg1[1]) * t)
            b = int(bg1[2] + (bg2[2] - bg1[2]) * t)
            draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

        # 2. Draw sophisticated abstract grid and concentric elements
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)

        grid_spacing = 80
        for x in range(0, width, grid_spacing):
            overlay_draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 8))
        for y in range(0, height, grid_spacing):
            overlay_draw.line([(0, y), (width, y)], fill=(255, 255, 255, 8))

        # Accent glows
        accent = theme_colors["highlight_fill"]
        glow_color = (accent[0], accent[1], accent[2], 25)
        overlay_draw.ellipse(
            [(-width // 4, -height // 4), (width * 3 // 4, height * 3 // 4)],
            outline=glow_color,
            width=5
        )
        overlay_draw.ellipse(
            [(width // 4, height // 4), (width * 5 // 4, height * 5 // 4)],
            outline=glow_color,
            width=8
        )

        return Image.alpha_composite(img, overlay)

    def draw_tilted_word_layer(self, canvas: Image.Image, word: str, font: ImageFont, x: int, y: int, fill_color: tuple, text_color: tuple, angle_rad: float):
        """Draw a word inside a beautifully tilted, anti-aliased, rounded rectangle that dynamically fits the text height and aligns perfectly to the baseline."""
        word_w = int(font.getlength(word))
        bbox = font.getbbox(word)
        
        # Exact height of characters in this word
        word_h = bbox[3] - bbox[1] if bbox else int(font.size * 0.7)
        y_offset = bbox[1] if bbox else 0

        # Compact, tight paddings to perfectly fit the word dynamically scaling with font size
        padding_x = int(font.size * getattr(self, "highlight_padding_x", 0.22))
        padding_y = int(font.size * getattr(self, "highlight_padding_y", 0.09))
        box_w = word_w + 2 * padding_x
        box_h = word_h + 2 * padding_y

        # Temporary canvas with margins to prevent clipping
        temp_w = box_w + 40
        temp_h = box_h + 40
        temp_img = Image.new("RGBA", (temp_w, temp_h), (0, 0, 0, 0))
        temp_draw = ImageDraw.Draw(temp_img)

        bx1, by1 = 20, 20
        bx2, by2 = bx1 + box_w, by1 + box_h

        # Draw rounded rectangle box with capsule pill radius
        box_radius = box_h // 2
        temp_draw.rounded_rectangle([(bx1, by1), (bx2, by2)], radius=box_radius, fill=fill_color)
        
        # Position the text baseline perfectly relative to the padding top and character top offset
        tx = bx1 + padding_x
        ty = by1 + padding_y - y_offset
        temp_draw.text((tx, ty), word, font=font, fill=text_color)

        # Rotate using BICUBIC filtering for smooth outline edges
        angle_deg = angle_rad * 180 / math.pi
        rotated_img = temp_img.rotate(angle_deg, resample=Image.Resampling.BICUBIC, expand=True)

        # Calculate exact center alignment on the main canvas (adding y_offset mathematically cancels out differences)
        desired_cx = x + word_w / 2
        desired_cy = y + (word_h / 2) + y_offset

        rx, ry = rotated_img.size
        paste_x = int(desired_cx - rx / 2)
        paste_y = int(desired_cy - ry / 2)

        canvas.paste(rotated_img, (paste_x, paste_y), rotated_img)

    def draw_text_with_shadow(self, draw: ImageDraw.Draw, text: str, position: tuple, font: ImageFont, fill_color=(255, 255, 255), shadow_color=(0, 0, 0, 180)):
        """Render readable text with drop shadow."""
        sx, sy = position[0] + 3, position[1] + 3
        draw.text((sx, sy), text, font=font, fill=shadow_color)
        draw.text(position, text, font=font, fill=fill_color)

    def prepare_base_canvas(self, width: int, height: int, base_image_path: str, theme_colors: dict) -> Image.Image:
        """Loads and scales the base image or generates a beautiful procedural fallback."""
        if base_image_path and os.path.exists(base_image_path):
            try:
                self.logger.info(f"[PillowDraw] 📸 Loading base image from: {base_image_path}")
                base_img = Image.open(base_image_path).convert("RGBA")
                
                # Landscape/Square/Portrait Resizing while maintaining aspect ratio (crop outer parts)
                canvas = Image.new("RGBA", (width, height), "black")
                img_aspect = base_img.width / base_img.height
                canvas_aspect = width / height

                # If the canvas is vertical (e.g. 9:16, 4:5) and the image is landscape (e.g. 16:9)
                if canvas_aspect <= 0.8 and canvas_aspect < img_aspect:
                    self.logger.info("[PillowDraw] 🌟 Using blurred backdrop technique to prevent excessive zooming.")
                    # 1. Create blurred background (scale to cover, then blur)
                    # To cover, we scale by height (as img_aspect > canvas_aspect)
                    bg_h = height
                    bg_w = int(height * img_aspect)
                    bg_resized = base_img.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
                    
                    # Center crop for bg
                    bg_crop = Image.new("RGBA", (width, height))
                    bg_offset_x = (width - bg_w) // 2
                    bg_crop.paste(bg_resized, (bg_offset_x, 0))
                    
                    # Apply strong Gaussian blur
                    blurred_bg = bg_crop.filter(ImageFilter.GaussianBlur(radius=40))
                    
                    # Darken the background slightly for readability (draw a dark overlay)
                    darken_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 100)) # 100 alpha dark overlay
                    final_bg = Image.alpha_composite(blurred_bg, darken_overlay)
                    
                    # 2. Scale the clean foreground image to fit the width of the canvas (avoiding crop)
                    fg_w = width
                    fg_h = int(width / img_aspect)
                    fg_resized = base_img.resize((fg_w, fg_h), Image.Resampling.LANCZOS)
                    
                    # Center paste the clean foreground image
                    fg_offset_y = (height - fg_h) // 2
                    final_bg.paste(fg_resized, (0, fg_offset_y), fg_resized)
                    
                    canvas.paste(final_bg, (0, 0))
                    return canvas

                if img_aspect > canvas_aspect:
                    # Image is wider than canvas
                    new_h = height
                    new_w = int(height * img_aspect)
                else:
                    # Image is taller than canvas
                    new_w = width
                    new_h = int(width / img_aspect)

                resized = base_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                # Center crop paste
                offset_x = (width - new_w) // 2
                offset_y = (height - new_h) // 2
                canvas.paste(resized, (offset_x, offset_y))
                return canvas
            except Exception as e:
                self.logger.error(f"[PillowDraw] ❌ Failed loading image: {e}. Falling back to procedural background.")

        self.logger.info("[PillowDraw] 🎨 Generating gorgeous procedural background fallback.")
        return self.generate_procedural_background(width, height, theme_colors)

    def draw_category_badge(self, canvas: Image.Image, badge_style: str, text: str, subtext: str, theme_colors: dict, font_family: str = "Mitr"):
        """Draws the beautiful V2 category badge at top-left corner matching HTML5 preview exactly."""
        draw = ImageDraw.Draw(canvas)
        width, height = canvas.size
        
        # Override title/subtitle defaults if empty
        title = text if text else "AI"
        subtitle = subtext if subtext else "Content Lab"
        
        # Setup fonts using DM Sans / Mitr based on program configuration
        title_font = self.get_font(int(width * 0.028), font_family) # 2.8cqw
        subtitle_font = self.get_font(int(width * 0.018), font_family) # 1.8cqw
        
        # Bounding box height measures
        title_bbox = title_font.getbbox(title)
        title_h = title_bbox[3] - title_bbox[1] if title_bbox else int(width * 0.028)
        
        subtitle_bbox = subtitle_font.getbbox(subtitle)
        subtitle_h = subtitle_bbox[3] - subtitle_bbox[1] if subtitle_bbox else int(width * 0.018)
        
        # Exact width based on text
        tw = int(title_font.getlength(title))
        sw = int(subtitle_font.getlength(subtitle))
        text_width = max(tw, sw)
        
        # Cozy padding & spacing proportions
        pad_x = int(width * 0.03) # 3cqw
        pad_y = int(width * 0.015) # 1.5cqw
        line_gap = int(width * 0.005) # 0.5cqw
        
        badge_w = text_width + 2 * pad_x
        badge_h = title_h + subtitle_h + line_gap + 2 * pad_y
        
        # Exact position top-left (4cqw)
        bx = int(width * 0.04)
        by = int(width * 0.04)
        
        # Colors mapped dynamically from the premium Palette Themes
        bg_color = theme_colors.get("highlight_fill", (220, 38, 38))
        border_color = theme_colors.get("accent_line", (220, 38, 38))
        text_color = theme_colors.get("highlight_text", (255, 255, 255))
        sub_text_color = (255, 255, 255)
        
        # Draw rounded rectangle badge with premium border glow outline (0.3cqw solid)
        draw.rounded_rectangle(
            [(bx, by), (bx + badge_w, by + badge_h)],
            radius=int(width * 0.015), # 1.5cqw
            fill=bg_color,
            outline=border_color,
            width=max(1, int(width * 0.003)) # 0.3cqw
        )
        
        # Draw title & subtitle text
        title_x = bx + pad_x
        title_y = by + pad_y - (title_bbox[1] if title_bbox else 0)
        draw.text((title_x, title_y), title, font=title_font, fill=text_color)
        
        subtitle_x = bx + pad_x
        subtitle_y = by + pad_y + title_h + line_gap - (subtitle_bbox[1] if subtitle_bbox else 0)
        draw.text((subtitle_x, subtitle_y), subtitle, font=subtitle_font, fill=sub_text_color)

    def draw_youtube_channel_badge(self, canvas: Image.Image, author_name=None, author_followers=0, author_avatar_path=None, font_family: str = "Mitr", position: str = "top-left"):
        """Draws a premium YouTube channel card badge with avatar, name, subscriber count and futuristic cyber design details."""
        draw = ImageDraw.Draw(canvas)
        width, height = canvas.size
        
        channel_name = author_name or "YouTube Channel"
        subs_text = self.format_subscribers(author_followers) if author_followers else "YouTube"
        
        # Fonts
        name_font = self.get_font(int(width * 0.025), font_family)
        subs_font = self.get_font(int(width * 0.023), font_family)
        meta_font = self.get_font(int(width * 0.012), font_family) # Small cyber meta text
        
        # Measure text
        name_bbox = name_font.getbbox(channel_name)
        name_h = name_bbox[3] - name_bbox[1] if name_bbox else int(width * 0.025)
        name_w = int(name_font.getlength(channel_name))
        
        subs_bbox = subs_font.getbbox(subs_text)
        subs_h = subs_bbox[3] - subs_bbox[1] if subs_bbox else int(width * 0.023)
        subs_w = int(subs_font.getlength(subs_text))
        
        meta_text = "YT // CREATOR"
        meta_bbox = meta_font.getbbox(meta_text)
        meta_w = int(meta_font.getlength(meta_text))
        meta_h = meta_bbox[3] - meta_bbox[1] if meta_bbox else int(width * 0.012)

        # Verified checkmark badge size
        v_size = max(12, int(width * 0.018))
        
        # Avatar dimensions
        avatar_size = int(width * 0.06)
        avatar_gap = int(width * 0.018)
        
        # Padding
        pad_x = int(width * 0.025)
        pad_y = int(width * 0.016)
        line_gap = int(width * 0.005)
        
        # Left Cyber Accent Bar width and gap
        accent_bar_w = max(3, int(width * 0.004))
        accent_bar_gap = int(width * 0.012)
        
        # Card dimensions
        text_block_w = max(name_w + 10 + v_size, subs_w + int(width * 0.025), meta_w)
        card_w = pad_x + accent_bar_w + accent_bar_gap + avatar_size + avatar_gap + text_block_w + pad_x
        card_h = max(avatar_size, name_h + subs_h + line_gap) + 2 * pad_y
        
        # Adjust Card position based on parameter
        if position == "bottom-right":
            bx = width - card_w - int(width * 0.04)
            by = height - card_h - int(width * 0.04)
        else: # top-left
            bx = int(width * 0.04)
            by = int(width * 0.04)
            
        # Draw semi-transparent dark card with neon red outline and inner transparent white frame
        card_overlay = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
        card_draw = ImageDraw.Draw(card_overlay)
        
        # Outer neon red glow outline (draw multiple layers for glow effect)
        for glow_w, glow_alpha in [(8, 15), (5, 40), (2, 90)]:
            card_draw.rounded_rectangle(
                [(0, 0), (card_w - 1, card_h - 1)],
                radius=int(width * 0.018),
                fill=None,
                outline=(255, 0, 51, glow_alpha),
                width=glow_w
            )
            
        # Main solid card body with sleek glass border outline
        card_draw.rounded_rectangle(
            [(0, 0), (card_w - 1, card_h - 1)],
            radius=int(width * 0.018),
            fill=(12, 12, 14, 230), # Deep black obsidian glass
            outline=(255, 255, 255, 30), # Thin translucent white inner edge
            width=1
        )
        
        # Draw Left Cyber Neon Accent Bar
        accent_x = pad_x // 2
        accent_y = pad_y
        accent_h = card_h - 2 * pad_y
        card_draw.rounded_rectangle(
            [(accent_x, accent_y), (accent_x + accent_bar_w, accent_y + accent_h)],
            radius=accent_bar_w // 2,
            fill=(255, 0, 51, 240) # Bright neon red
        )
        
        # Draw Avatar
        avatar_x_rel = pad_x + accent_bar_w + accent_bar_gap
        avatar_y_rel = (card_h - avatar_size) // 2
        
        avatar_drawn = False
        if author_avatar_path:
            avatar_full_path = author_avatar_path
            if not os.path.isabs(avatar_full_path):
                avatar_full_path = os.path.join(self.root_path, author_avatar_path)
            
            if os.path.exists(avatar_full_path):
                try:
                    avatar_img = Image.open(avatar_full_path).convert("RGBA")
                    avatar_img = avatar_img.resize((avatar_size, avatar_size), Image.Resampling.LANCZOS)
                    
                    # Create circular mask
                    mask = Image.new("L", (avatar_size, avatar_size), 0)
                    mask_draw = ImageDraw.Draw(mask)
                    mask_draw.ellipse((0, 0, avatar_size - 1, avatar_size - 1), fill=255)
                    
                    # Create circular avatar
                    avatar_circle = Image.new("RGBA", (avatar_size, avatar_size), (0, 0, 0, 0))
                    avatar_circle.paste(avatar_img, (0, 0), mask)
                    
                    # Paste avatar relative to card_overlay
                    card_overlay.paste(avatar_circle, (avatar_x_rel, avatar_y_rel), avatar_circle)
                    
                    # Draw glowing border ring (neon red layers)
                    for glow_w, glow_alpha in [(5, 40), (3, 100), (1, 200)]:
                        card_draw.ellipse(
                            (avatar_x_rel, avatar_y_rel, avatar_x_rel + avatar_size - 1, avatar_y_rel + avatar_size - 1),
                            outline=(255, 0, 51, glow_alpha),
                            width=glow_w
                        )
                    
                    avatar_drawn = True
                except Exception as ex:
                    self.logger.warning(f"[PillowDraw] Failed to draw channel avatar: {ex}")
        
        if not avatar_drawn:
            # Fallback: high-tech red play button circle
            fallback = Image.new("RGBA", (avatar_size, avatar_size), (0, 0, 0, 0))
            fb_draw = ImageDraw.Draw(fallback)
            
            # Glowing background
            fb_draw.ellipse((0, 0, avatar_size - 1, avatar_size - 1), fill=(15, 15, 15, 255))
            fb_draw.ellipse((0, 0, avatar_size - 1, avatar_size - 1), outline=(255, 0, 51, 255), width=2)
            
            # Draw play triangle
            tri_size = int(avatar_size * 0.32)
            cx, cy = avatar_size // 2, avatar_size // 2
            fb_draw.polygon([
                (cx - tri_size // 3, cy - tri_size // 2),
                (cx - tri_size // 3, cy + tri_size // 2),
                (cx + tri_size // 2, cy)
            ], fill=(255, 0, 51, 255))
            
            card_overlay.paste(fallback, (avatar_x_rel, avatar_y_rel), fallback)
            
        # Draw channel text details relative to card
        text_x_rel = avatar_x_rel + avatar_size + avatar_gap
        
        # Calculate Y placement
        content_h = name_h + subs_h + line_gap
        start_y = (card_h - content_h) // 2
        
        # Draw YT // CREATOR small tag at top right of the text block area or top-right card corner
        meta_x_rel = card_w - pad_x - meta_w
        meta_y_rel = pad_y // 2
        card_draw.text((meta_x_rel, meta_y_rel), meta_text, font=meta_font, fill=(255, 255, 255, 130))
        
        # Draw channel name
        name_y_rel = start_y - (name_bbox[1] if name_bbox else 0)
        card_draw.text((text_x_rel, name_y_rel), channel_name, font=name_font, fill=(255, 255, 255))
        
        # Draw YouTube-Red Verified Badge (circle + checkmark)
        v_x_rel = text_x_rel + name_w + 8
        v_y_rel = name_y_rel + (name_h - v_size) // 2 + (name_bbox[1] if name_bbox else 0)
        card_draw.ellipse([(v_x_rel, v_y_rel), (v_x_rel + v_size, v_y_rel + v_size)], fill=(255, 0, 51, 255))
        
        # Draw white tick mark inside circle
        tick_width = max(1, int(v_size * 0.15))
        card_draw.line([
            (v_x_rel + v_size * 0.3, v_y_rel + v_size * 0.5), 
            (v_x_rel + v_size * 0.48, v_y_rel + v_size * 0.7), 
            (v_x_rel + v_size * 0.75, v_y_rel + v_size * 0.32)
        ], fill=(255, 255, 255), width=tick_width)
        
        # Draw subscriber count with a glowing neon red dot
        subs_y_rel = name_y_rel + name_h + line_gap + (name_bbox[1] if name_bbox else 0) - (subs_bbox[1] if subs_bbox else 0)
        dot_w = int(subs_font.getlength("● "))
        
        card_draw.text((text_x_rel, subs_y_rel), "●", font=subs_font, fill=(255, 0, 51))
        card_draw.text((text_x_rel + dot_w, subs_y_rel), subs_text, font=subs_font, fill=(240, 240, 240))
        
        # Paste card updates back onto canvas
        canvas.paste(card_overlay, (bx, by), card_overlay)

    def draw_quadratic_bezier(self, draw, x0, y0, cx, cy, x1, y1, fill, width, steps=30):
        points = []
        for i in range(steps + 1):
            t = i / steps
            x = (1 - t)**2 * x0 + 2 * (1 - t) * t * cx + t**2 * x1
            y = (1 - t)**2 * y0 + 2 * (1 - t) * t * cy + t**2 * y1
            points.append((x, y))
        draw.line(points, fill=fill, width=width, joint="round")

    def draw_callout_overlays(self, canvas: Image.Image, text: str, highlight: str, placement: str, sticker_style: str, theme_colors: dict, width: int, height: int, image_split_y: int, font_family: str = "Mitr"):
        """Draws the premium vector arrows, custom sticker callouts, and highlighted speech bubbles."""
        draw = ImageDraw.Draw(canvas)
        
        # 1. Resolve coordinates
        variants = {
            "left-face": {"textX": 0.055, "textY": 0.49, "align": "left", "stickerX": 0.31, "stickerY": 0.40, "arrowStartX": 0.38, "arrowStartY": 0.45, "arrowCtrlX": 0.42, "arrowCtrlY": 0.39, "arrowEndX": 0.47, "arrowEndY": 0.36},
            "left-upper": {"textX": 0.060, "textY": 0.32, "align": "left", "stickerX": 0.34, "stickerY": 0.30, "arrowStartX": 0.39, "arrowStartY": 0.34, "arrowCtrlX": 0.44, "arrowCtrlY": 0.29, "arrowEndX": 0.50, "arrowEndY": 0.30},
            "right-face": {"textX": 0.94, "textY": 0.40, "align": "right", "stickerX": 0.66, "stickerY": 0.35, "arrowStartX": 0.64, "arrowStartY": 0.39, "arrowCtrlX": 0.59, "arrowCtrlY": 0.33, "arrowEndX": 0.52, "arrowEndY": 0.32},
            "right-low": {"textX": 0.92, "textY": 0.53, "align": "right", "stickerX": 0.67, "stickerY": 0.47, "arrowStartX": 0.65, "arrowStartY": 0.49, "arrowCtrlX": 0.59, "arrowCtrlY": 0.43, "arrowEndX": 0.51, "arrowEndY": 0.39},
            "center-pop": {"textX": 0.50, "textY": 0.50, "align": "center", "stickerX": 0.52, "stickerY": 0.34, "arrowStartX": 0.50, "arrowStartY": 0.42, "arrowCtrlX": 0.51, "arrowCtrlY": 0.36, "arrowEndX": 0.53, "arrowEndY": 0.31}
        }
        
        var = variants.get(placement, variants["left-face"])
        
        # Calculate real pixel points relative to the split image height
        ref_h = image_split_y
        
        tx = int(width * var["textX"])
        ty = int(ref_h * var["textY"])
        st_x = int(width * var["stickerX"])
        st_y = int(ref_h * var["stickerY"])
        
        as_x = int(width * var["arrowStartX"])
        as_y = int(ref_h * var["arrowStartY"])
        ac_x = int(width * var["arrowCtrlX"])
        ac_y = int(ref_h * var["arrowCtrlY"])
        ae_x = int(width * var["arrowEndX"])
        ae_y = int(ref_h * var["arrowEndY"])
        
        # 2. Draw Callout speech box
        box_w, box_h = 340, 115
        
        # Adjust tx/ty based on alignment so the box doesn't clip
        if var["align"] == "right":
            box_x = tx - box_w
            box_y = ty - box_h // 2
        elif var["align"] == "center":
            box_x = tx - box_w // 2
            box_y = ty - box_h // 2
        else: # left
            box_x = tx
            box_y = ty - box_h // 2
            
        # Draw double bordered transparent black box
        draw.rounded_rectangle([(box_x - 2, box_y - 2), (box_x + box_w + 2, box_y + box_h + 2)], radius=15, fill=None, outline=(255, 255, 255, 120), width=2)
        draw.rounded_rectangle([(box_x, box_y), (box_x + box_w, box_y + box_h)], radius=13, fill=(12, 12, 12, 235), outline=theme_colors["accent_line"], width=3)
        
        c_text_font = self.get_font(22, font_family)
        c_highlight_font = self.get_font(28, font_family)
        
        draw.text((box_x + 20, box_y + 18), text[:28], font=c_text_font, fill=(255, 255, 255, 255))
        draw.text((box_x + 20, box_y + 54), highlight[:20], font=c_highlight_font, fill=theme_colors["highlight_text"])
        
        # 3. Resolve Sticker Style
        sticker_configs = {
            "chunky-arrow": {"kind": "arrow", "accent": (234, 255, 0), "secondary": (5, 5, 5)},
            "red-arrow": {"kind": "arrow", "accent": (255, 43, 43), "secondary": (255, 255, 255)},
            "circle-highlight": {"kind": "circle", "accent": (234, 255, 0), "secondary": (255, 255, 255)},
            "double-circle": {"kind": "circle", "accent": (56, 189, 248), "secondary": (255, 255, 255)},
            "focus-frame": {"kind": "frame", "accent": (234, 255, 0), "secondary": (255, 255, 255)},
            "cursor-click": {"kind": "cursor", "accent": (255, 255, 255), "secondary": (14, 165, 233)},
            "magnifier": {"kind": "magnifier", "accent": (255, 255, 255), "secondary": (34, 211, 238)},
            "spark-burst": {"kind": "burst", "accent": (250, 204, 21), "secondary": (239, 68, 68)},
            "fire-badge": {"kind": "badge", "accent": (239, 68, 68), "secondary": (250, 204, 21)},
            "money-badge": {"kind": "badge", "accent": (34, 197, 94), "secondary": (234, 255, 0)},
            "trend-up": {"kind": "trend", "accent": (34, 197, 94), "secondary": (255, 255, 255)},
            "play-pulse": {"kind": "play", "accent": (255, 0, 51), "secondary": (255, 255, 255)},
            "alert-pop": {"kind": "alert", "accent": (250, 204, 21), "secondary": (17, 24, 39)},
            "question-pop": {"kind": "question", "accent": (168, 85, 247), "secondary": (255, 255, 255)},
            "secret-tag": {"kind": "tag", "accent": (17, 24, 39), "secondary": (234, 255, 0)},
            "viral-ribbon": {"kind": "ribbon", "accent": (14, 165, 233), "secondary": (255, 255, 255)},
            "lightning": {"kind": "lightning", "accent": (250, 204, 21), "secondary": (17, 24, 39)}
        }
        
        st_cfg = sticker_configs.get(sticker_style, sticker_configs["chunky-arrow"])
        kind = st_cfg["kind"]
        accent = st_cfg["accent"]
        secondary = st_cfg["secondary"]
        
        # 4. Draw Sticker overlay
        cqw = width // 100
        
        if kind == "arrow":
            self.draw_quadratic_bezier(draw, as_x, as_y, ac_x, ac_y, ae_x, ae_y, fill=(255, 255, 255), width=int(3.2 * cqw))
            self.draw_quadratic_bezier(draw, as_x, as_y, ac_x, ac_y, ae_x, ae_y, fill=secondary, width=int(2.2 * cqw))
            self.draw_quadratic_bezier(draw, as_x, as_y, ac_x, ac_y, ae_x, ae_y, fill=accent, width=int(1.35 * cqw))
            
            angle = math.atan2(ae_y - ac_y, ae_x - ac_x)
            h_len = 6.4 * cqw
            h_w = 3.2 * cqw
            bc_x = ae_x - h_len * math.cos(angle)
            bc_y = ae_y - h_len * math.sin(angle)
            sv1_x = bc_x + h_w * math.sin(angle)
            sv1_y = bc_y - h_w * math.cos(angle)
            sv2_x = bc_x - h_w * math.sin(angle)
            sv2_y = bc_y + h_w * math.cos(angle)
            draw.polygon([(ae_x, ae_y), (sv1_x, sv1_y), (sv2_x, sv2_y)], fill=accent, outline=(255, 255, 255))
            
        elif kind == "circle":
            r_x = 9 * cqw
            r_y = 6.5 * cqw
            draw.ellipse([(ae_x - r_x - 2, ae_y - r_y - 2), (ae_x + r_x + 2, ae_y + r_y + 2)], fill=None, outline=(255, 255, 255), width=2)
            draw.ellipse([(ae_x - r_x, ae_y - r_y), (ae_x + r_x, ae_y + r_y)], fill=None, outline=accent, width=3)
            
        elif kind == "frame":
            r_w = 18 * cqw
            r_h = 12 * cqw
            draw.rounded_rectangle([(ae_x - r_w//2 - 2, ae_y - r_h//2 - 2), (ae_x + r_w//2 + 2, ae_y + r_h//2 + 2)], radius=10, fill=None, outline=(255, 255, 255), width=2)
            draw.rounded_rectangle([(ae_x - r_w//2, ae_y - r_h//2), (ae_x + r_w//2, ae_y + r_h//2)], radius=8, fill=None, outline=accent, width=3)
            
        elif kind == "cursor":
            cx, cy = st_x, st_y
            pts = [
                (cx, cy),
                (cx + int(4.8 * cqw), cy + int(7.8 * cqw)),
                (cx + int(3.5 * cqw), cy + int(4.5 * cqw)),
                (cx + int(6.0 * cqw), cy + int(4.0 * cqw))
            ]
            draw.polygon(pts, fill=(255, 255, 255), outline=(0, 0, 0))
            
        elif kind == "magnifier":
            cx, cy = st_x, st_y
            m_r = int(5.5 * cqw)
            draw.ellipse([(cx - m_r, cy - m_r), (cx + m_r, cy + m_r)], fill=None, outline=(255, 255, 255), width=4)
            draw.line([(cx + int(m_r * 0.7), cy + int(m_r * 0.7)), (cx + int(m_r * 1.5), cy + int(m_r * 1.5))], fill=secondary, width=6)
            
        elif kind == "lightning":
            cx, cy = st_x, st_y
            pts = [
                (cx - int(2 * cqw), cy - int(4 * cqw)),
                (cx + int(3 * cqw), cy - int(1 * cqw)),
                (cx + int(1 * cqw), cy - int(1 * cqw)),
                (cx + int(4 * cqw), cy + int(5 * cqw)),
                (cx - int(3 * cqw), cy + int(1 * cqw)),
                (cx - int(1 * cqw), cy + int(1 * cqw))
            ]
            draw.polygon(pts, fill=accent, outline=(255, 255, 255))
            
        elif kind == "burst":
            cx, cy = st_x, st_y
            pts = []
            num_points = 14
            for i in range(2 * num_points):
                angle = i * math.pi / num_points
                r = (8 * cqw) if i % 2 == 0 else (4.5 * cqw)
                pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
            draw.polygon(pts, fill=accent, outline=(255, 255, 255), width=2)
            
            lbl = "NEW" if sticker_style == "spark-burst" else "HOT"
            lbl_font = self.get_font(16, font_family)
            lw = int(lbl_font.getlength(lbl))
            draw.text((cx - lw // 2, cy - 8), lbl, font=lbl_font, fill=(255, 255, 255))
            
        elif kind == "play":
            cx, cy = st_x, st_y
            pw, ph = int(14 * cqw), int(10 * cqw)
            draw.rounded_rectangle([(cx - pw//2, cy - ph//2), (cx + pw//2, cy + ph//2)], radius=8, fill=accent, outline=(255, 255, 255), width=2)
            tw, th = int(3 * cqw), int(4 * cqw)
            draw.polygon([
                (cx - tw//2, cy - th//2),
                (cx - tw//2, cy + th//2),
                (cx + tw//2, cy)
            ], fill=(255, 255, 255))
            
        elif kind == "badge":
            cx, cy = st_x, st_y
            m_r = int(7 * cqw)
            draw.ellipse([(cx - m_r, cy - m_r), (cx + m_r, cy + m_r)], fill=accent, outline=(255, 255, 255), width=2)
            icon = "🔥" if sticker_style == "fire-badge" else "฿"
            lbl_font = self.get_font(20, font_family)
            lw = int(lbl_font.getlength(icon))
            draw.text((cx - lw // 2, cy - 12), icon, font=lbl_font, fill=secondary)

    def is_keyword_match(self, word: str, keywords: list) -> bool:
        """Check if a token word is inside or matches the target keywords list."""
        if not keywords:
            return False
        cleaned = word.strip().lower()
        if not cleaned:
            return False
        for kw in keywords:
            kw_clean = kw.strip().lower()
            if not kw_clean:
                continue
            if kw_clean in cleaned or cleaned in kw_clean:
                return True
        return False

    def generate_poster(self, content_id: str, base_image_path: str, headline: str, keywords: list, aspect_ratio="1:1", theme_name="Classic Red Blue", layout_style="top_gainers", author_name=None, author_followers=0, author_avatar_path=None,
                        show_logo=False, page_logo_path=None, page_logo_size=10.0, page_logo_margin_x=20, page_logo_margin_y=20, page_logo_corner="top-right",
                        show_badge=True, badge_style="dev-pick", badge_text="AI", badge_subtext="Content Lab",
                        show_news_card=False, news_title=None, news_detail=None, news_source=None,
                        show_callout=False, callout_text=None, callout_highlight=None, callout_placement="random", callout_sticker="random",
                        show_meme=False, meme_text=None, meme_subtext=None,
                        credit_text="วางแผนเป็น เห็นทางรวย", font_scale=1.0, image_split=60, font_family="Mitr",
                        headline_align="left", headline_margin=35, highlight_color_set="classic",
                        highlight_padding_x=0.22, highlight_padding_y=0.09) -> str:
        """
        Creates posters dynamically for 5 layout templates with clean Thai text wrapping and V1 dynamic overlays.
        Saves render in content_vault and registers row in SQLite.
        """
        self.highlight_padding_x = highlight_padding_x
        self.highlight_padding_y = highlight_padding_y

        self.logger.info(f"[PillowDraw] 🎨 Beginning image render for Content ID: {content_id} (Ratio: {aspect_ratio}, Theme: {theme_name}, Layout: {layout_style}, Font: {font_family})")
        self.logger.info(f"[PillowDraw] 🗣️ Headline: '{headline}'")
        self.logger.info(f"[PillowDraw] 🖍️ Keywords: {keywords}")

        # Resolve active text alignment with backward compatibility fallback
        align = headline_align
        if not align or align not in ["left", "center", "right"]:
            align = "left" if layout_style == "top_gainers" else "center"

        # 1. Setup dimensions and colors
        width, height = self.aspect_ratios.get(aspect_ratio, (1080, 1080))
        theme_colors = self.color_themes.get(theme_name, self.color_themes["Classic Red Blue"])

        # Calculate split Y coordinate for layout cropping
        image_split_y = int(height * (image_split / 100.0))

        # 2. Prepare baseline canvas
        if layout_style == "top_gainers":
            canvas = Image.new("RGBA", (width, height), "black")
            top_canvas = self.prepare_base_canvas(width, image_split_y, base_image_path, theme_colors)
            canvas.paste(top_canvas, (0, 0))
        else:
            canvas = self.prepare_base_canvas(width, height, base_image_path, theme_colors)
            
        draw = ImageDraw.Draw(canvas)

        # Adjust headline font sizes dynamically to fit dimensions beautifully, scaled by font_scale
        if aspect_ratio == "16:9":
            font_size = int(45 * font_scale)
            line_height = int(45 * 1.4 * font_scale)
        elif aspect_ratio == "4:3":
            font_size = int(48 * font_scale)
            line_height = int(48 * 1.4 * font_scale)
        elif aspect_ratio == "9:16":
            font_size = int(65 * font_scale)
            line_height = int(65 * 1.4 * font_scale)
        elif aspect_ratio == "4:5":
            font_size = int(55 * font_scale)
            line_height = int(55 * 1.4 * font_scale)
        else:  # 1:1
            font_size = int(55 * font_scale)
            line_height = int(55 * 1.4 * font_scale)

        font = self.get_font(font_size, font_family)
        max_text_width = width - 120 # Padding margins of 60px
        
        # Wrapping headline
        if "\n" in headline:
            # Explicit line breaks from triple headline mode — respect them directly
            explicit_lines = [l.strip() for l in headline.split("\n") if l.strip()]
            
            # Auto-scale font down if any line exceeds max_text_width, but stop scaling at min_font_size
            original_font_size = font_size
            min_font_size = max(40, int(original_font_size * 0.75))
            font = self.get_font(font_size, font_family)
            while font_size > min_font_size:
                max_line_w = max(int(font.getlength(line)) for line in explicit_lines)
                if max_line_w <= max_text_width:
                    break
                font_size -= 2
                line_height = int(font_size * 1.4)
                font = self.get_font(font_size, font_family)
            
            # If any line still exceeds max_text_width at min_font_size, wrap it using ThaiSyllableWrapper
            font = self.get_font(font_size, font_family)
            wrapper = ThaiSyllableWrapper(font, max_text_width, self.logger)
            wrapped_lines = []
            for line in explicit_lines:
                if int(font.getlength(line)) > max_text_width:
                    wrapped_parts = wrapper.wrap_text(line)
                    wrapped_lines.extend(wrapped_parts)
                else:
                    wrapped_lines.append(line)
            
            if font_size != original_font_size:
                self.logger.info(f"[PillowDraw] ✂️ Auto-scaled font from {original_font_size}px to {font_size}px to fit explicit lines")
            else:
                self.logger.info(f"[PillowDraw] ✂️ Using {len(wrapped_lines)} explicit/wrapped headline lines (font {font_size}px)")
        else:
            font = self.get_font(font_size, font_family)
            wrapper = ThaiSyllableWrapper(font, max_text_width, self.logger)
            wrapped_lines = wrapper.wrap_text(headline)
            self.logger.info(f"[PillowDraw] ✂️ ThaiSyllableWrapper wrapped headline into {len(wrapped_lines)} lines safely.")

        # Calculate heights and splits based on image_split input
        split_pct = image_split / 100.0
        image_split_y = int(height * split_pct)

        # ==========================================
        # 3. Apply Specific Design Components/Layouts
        # ==========================================

        if layout_style == "youtube":
            # YouTube documentary style
            # Apply vertical smooth black gradient fade at bottom
            gradient = Image.new("RGBA", (width, height))
            draw_grad = ImageDraw.Draw(gradient)
            fade_start = int(height * 0.45)
            for y in range(fade_start, height):
                alpha = int(245 * (y - fade_start) / (height - fade_start))
                draw_grad.line([(0, y), (width, y)], fill=(12, 12, 12, alpha))
            canvas = Image.alpha_composite(canvas, gradient)
            draw = ImageDraw.Draw(canvas)

            # Draw centered/bottom-left text
            text_y = int(height * 0.5)
            # Dynamic aligned wrapped lines
            for line in wrapped_lines:
                line_w = int(font.getlength(line))
                if align == "center":
                    tx = (width - line_w) // 2
                elif align == "right":
                    tx = width - 60 - line_w
                else: # left
                    tx = 60
                self.draw_text_with_shadow(draw, line, (tx, text_y), font, fill_color=theme_colors["primary_text"])
                text_y += line_height

            # Draw bottom-right Channel Badge Card
            self.draw_youtube_channel_badge(canvas, author_name, author_followers, author_avatar_path, font_family=font_family, position="bottom-right")

        elif layout_style == "ai_news":
            # AI News style with Top-Left red strap & neon outline
            strap_x, strap_y = 35, 35
            strap_w, strap_h = 230, 65
            
            # Neon purple/pink border
            neon_color = (255, 0, 127, 255) if theme_name != "Neon Purple" else (168, 85, 247, 255)
            draw.rounded_rectangle([(strap_x - 3, strap_y - 3), (strap_x + strap_w + 3, strap_y + strap_h + 3)], radius=8, fill=None, outline=neon_color, width=3)
            # Red inner fill
            draw.rounded_rectangle([(strap_x, strap_y), (strap_x + strap_w, strap_y + strap_h)], radius=6, fill=(220, 38, 38, 255))
            
            strap_font = self.get_font(28)
            strap_text = "ข่าว AI"
            sw = int(strap_font.getlength(strap_text))
            draw.text((strap_x + (strap_w - sw) // 2, strap_y + 12), strap_text, font=strap_font, fill=(255, 255, 255, 255))
            
            # Dynamic aligned headline
            text_y = int(height * 0.4)
            for line in wrapped_lines:
                line_w = int(font.getlength(line))
                if align == "center":
                    tx = (width - line_w) // 2
                elif align == "right":
                    tx = width - 60 - line_w
                else: # left
                    tx = 60
                self.draw_text_with_shadow(draw, line, (tx, text_y), font, fill_color=theme_colors["primary_text"])
                text_y += line_height

        elif layout_style == "github":
            # GitHub Trends green strap
            strap_x, strap_y = 35, 35
            strap_w, strap_h = 210, 60
            
            # GitHub theme green strap
            draw.rounded_rectangle([(strap_x, strap_y), (strap_x + strap_w, strap_y + strap_h)], radius=6, fill=(16, 185, 129, 255))
            
            strap_font = self.get_font(26)
            strap_text = "GITHUB"
            sw = int(strap_font.getlength(strap_text))
            draw.text((strap_x + (strap_w - sw) // 2, strap_y + 12), strap_text, font=strap_font, fill=(255, 255, 255, 255))
            
            # Dynamic aligned text
            text_y = int(height * 0.4)
            for line in wrapped_lines:
                line_w = int(font.getlength(line))
                if align == "center":
                    tx = (width - line_w) // 2
                elif align == "right":
                    tx = width - 60 - line_w
                else: # left
                    tx = 60
                self.draw_text_with_shadow(draw, line, (tx, text_y), font, fill_color=theme_colors["primary_text"])
                text_y += line_height

        elif layout_style == "quotes":
            # Inspiring Quotes minimalist center-aligned layout
            # Large quote font
            quote_font_size = int(height * 0.16)
            quote_font = self.get_font(quote_font_size)
            quote_color = (theme_colors["accent_line"][0], theme_colors["accent_line"][1], theme_colors["accent_line"][2], 90)

            # Left opening quotation mark
            draw.text((int(width * 0.08), int(height * 0.12)), "“", font=quote_font, fill=quote_color)

            # Dynamic aligned wrapped lines
            total_text_h = len(wrapped_lines) * line_height
            text_y = (height - total_text_h) // 2

            for line in wrapped_lines:
                line_w = int(font.getlength(line))
                if align == "center":
                    tx = (width - line_w) // 2
                elif align == "right":
                    tx = width - 60 - line_w
                else: # left
                    tx = 60
                self.draw_text_with_shadow(draw, line, (tx, text_y), font, fill_color=theme_colors["primary_text"])
                text_y += line_height

            # Right closing quotation mark
            draw.text((int(width * 0.78), text_y - 20), "”", font=quote_font, fill=quote_color)

            # Gold author line at the bottom
            author_lbl = f"— {author_name if author_name else 'Content Factory V2'}"
            author_font = self.get_font(28)
            aw = int(author_font.getlength(author_lbl))
            gold_color = (245, 158, 11, 255)
            self.draw_text_with_shadow(draw, author_lbl, ((width - aw) // 2, int(height * 0.85)), author_font, fill_color=gold_color)

        else:
            # layout_style == "top_gainers" (Editorial Banner / Dynamic Grid Split)
            
            # Gold/orange divider bar of height 8px
            divider_color = theme_colors["accent_line"]
            draw.rectangle([(0, image_split_y - 8), (width, image_split_y)], fill=divider_color)
            
            # Solid black backing box
            draw.rectangle([(0, image_split_y), (width, height)], fill=(12, 12, 12, 255))
            
            color_sets = {
                "classic": [
                    {"box": (255, 0, 51, 255), "text": (255, 255, 255, 255)}, # Cyber YouTube Red
                    {"box": (255, 230, 0, 255), "text": (10, 10, 10, 255)},    # Cyber Neon Yellow
                    {"box": (255, 255, 255, 255), "text": (255, 0, 51, 255)}   # White box with Cyber Red text
                ],
                "cyber": [
                    {"box": (236, 72, 153, 255), "text": (255, 255, 255, 255)}, # Pink #EC4899
                    {"box": (139, 92, 246, 255), "text": (255, 255, 255, 255)}, # Purple #8B5CF6
                    {"box": (6, 182, 212, 255), "text": (0, 0, 0, 255)}       # Cyan #06B6D4
                ],
                "gold": [
                    {"box": (180, 83, 9, 255), "text": (255, 255, 255, 255)},  # Dark Gold #B45309
                    {"box": (245, 158, 11, 255), "text": (0, 0, 0, 255)},     # Amber #F59E0B
                    {"box": (251, 191, 36, 255), "text": (0, 0, 0, 255)}       # Light Gold #FBBF24
                ],
                "forest": [
                    {"box": (16, 185, 129, 255), "text": (255, 255, 255, 255)}, # Emerald #10B981
                    {"box": (132, 204, 22, 255), "text": (0, 0, 0, 255)},     # Lime #84CC16
                    {"box": (20, 184, 166, 255), "text": (255, 255, 255, 255)}  # Teal #14B8A6
                ],
                "sunset": [
                    {"box": (249, 115, 22, 255), "text": (255, 255, 255, 255)}, # Orange #F97316
                    {"box": (244, 63, 94, 255), "text": (255, 255, 255, 255)},  # Rose #F43F5E
                    {"box": (245, 158, 11, 255), "text": (0, 0, 0, 255)}      # Amber #F59E0B
                ]
            }
            active_color_set = color_sets.get(highlight_color_set, color_sets["classic"])

            # Margins inside the solid box
            text_y = image_split_y + headline_margin
            
            import re
            clean_keywords = [kw.strip() for kw in keywords if kw.strip()]
            
            for line_idx, line in enumerate(wrapped_lines):
                line_w = int(font.getlength(line))
                
                if align == "center":
                    x_cursor = (width - line_w) // 2
                elif align == "right":
                    x_cursor = width - 60 - line_w
                else: # left
                    x_cursor = 60
                
                if not clean_keywords:
                    draw.text((x_cursor, text_y), line, font=font, fill=(255, 255, 255, 255))
                else:
                    sorted_kws = sorted(clean_keywords, key=len, reverse=True)
                    escaped_kws = [re.escape(kw) for kw in sorted_kws]
                    pattern = f"({'|'.join(escaped_kws)})"
                    
                    parts = re.split(pattern, line, flags=re.IGNORECASE)
                    
                    for part in parts:
                        if not part:
                            continue
                        
                        part_w = int(font.getlength(part))
                        
                        is_match = any(part.lower() == kw.lower() for kw in clean_keywords)
                        if is_match:
                            color_config = active_color_set[line_idx % len(active_color_set)]
                            box_color = color_config["box"]
                            txt_color = color_config["text"]
                            # Dynamic alternating tilt: even lines lean left, odd lines lean right
                            angle_rad = -0.03 if line_idx % 2 == 0 else 0.02
                            
                            self.draw_tilted_word_layer(canvas, part, font, x_cursor, text_y, box_color, txt_color, angle_rad)
                            self.logger.info(f"[PillowDraw] 🎯 Sticker box rendered for keyword: '{part}' in line {line_idx+1} using {highlight_color_set} theme")
                        else:
                            draw.text((x_cursor, text_y), part, font=font, fill=(255, 255, 255, 255))
                            
                        x_cursor += part_w
                        
                text_y += line_height

            # Draw Credit at the very bottom center of the backing box
            credit_font = self.get_font(20)
            credit_lbl = f"เครดิต: {credit_text}"
            clw = int(credit_font.getlength(credit_lbl))
            draw.text(((width - clw) // 2, height - 45), credit_lbl, font=credit_font, fill=(200, 200, 200))


        # ==========================================
        # 4. Draw Advanced Visual Overlays (V1 Style)
        # ==========================================

        # A. Top-Left Category Badge (Strap / Label)
        if show_badge:
            if badge_style == "youtube-channel":
                self.draw_youtube_channel_badge(canvas, author_name, author_followers, author_avatar_path, font_family=font_family)
            else:
                self.draw_category_badge(canvas, badge_style, badge_text, badge_subtext, theme_colors, font_family=font_family)

        # B. Page Logo Placement (supports 4 corners)
        if show_logo and page_logo_path:
            logo_full_path = page_logo_path
            if not os.path.isabs(logo_full_path):
                logo_full_path = os.path.join(self.root_path, page_logo_path)
            
            if os.path.exists(logo_full_path):
                try:
                    self.logger.info(f"[PillowDraw] 🏷️ Overlaying page logo: {logo_full_path} at corner: {page_logo_corner}")
                    logo_img = Image.open(logo_full_path).convert("RGBA")
                    
                    logo_scale_pct = page_logo_size / 100.0
                    target_w = int(width * logo_scale_pct)
                    aspect = logo_img.width / logo_img.height
                    target_h = int(target_w / aspect)
                    
                    logo_resized = logo_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                    
                    # Calculate position based on corner
                    corner = page_logo_corner or "top-right"
                    if corner == "top-left":
                        px = page_logo_margin_x
                        py = page_logo_margin_y
                    elif corner == "top-right":
                        px = width - target_w - page_logo_margin_x
                        py = page_logo_margin_y
                    elif corner == "bottom-left":
                        px = page_logo_margin_x
                        py = height - target_h - page_logo_margin_y
                    elif corner == "bottom-right":
                        px = width - target_w - page_logo_margin_x
                        py = height - target_h - page_logo_margin_y
                    else:
                        px = width - target_w - page_logo_margin_x
                        py = page_logo_margin_y
                    
                    canvas.paste(logo_resized, (px, py), logo_resized)
                except Exception as ex:
                    self.logger.error(f"[PillowDraw] ❌ Failed to draw page logo: {ex}")
            else:
                # Dotted placeholder
                placeholder_w = int(width * 0.10)
                px = width - placeholder_w - page_logo_margin_x
                py = page_logo_margin_y
                draw.rounded_rectangle([(px, py), (px + placeholder_w, py + placeholder_w)], radius=8, fill=(0, 0, 0, 115), outline=(255, 255, 255, 90), width=2)
                placeholder_font = self.get_font(14)
                ptw = int(placeholder_font.getlength("LOGO"))
                draw.text((px + (placeholder_w - ptw) // 2, py + (placeholder_w - 18) // 2), "LOGO", font=placeholder_font, fill=(255, 255, 255, 180))

        # C. News Card Overlay (Bottom-Left of background image)
        if show_news_card:
            self.logger.info("[PillowDraw] 📰 Drawing news card overlay")
            card_w = int(width * 0.50)
            card_h = 160
            card_x = 60
            card_y = image_split_y - card_h - 40
            
            # Semi-transparent black card box
            draw.rounded_rectangle([(card_x, card_y), (card_x + card_w, card_y + card_h)], radius=15, fill=(12, 12, 12, 225), outline=(255, 255, 255, 204), width=3)
            
            card_title = news_title if news_title else (headline if headline else "หัวข้อข่าวเด่น")
            card_detail = news_detail if news_detail else "ข้อมูลสรุปเนื้อหารายละเอียดข่าวสั้นๆ ให้อ่านกระชับ ได้ใจความสะดุดตา"
            card_source = news_source if news_source else "คลังข้อมูลวิเคราะห์"
            
            c_title_font = self.get_font(24)
            c_detail_font = self.get_font(18)
            c_source_font = self.get_font(14)
            
            card_wrapper = ThaiSyllableWrapper(c_detail_font, card_w - 40, self.logger)
            wrapped_detail_lines = card_wrapper.wrap_text(card_detail)[:2]
            
            draw.text((card_x + 20, card_y + 18), card_title[:30], font=c_title_font, fill=(255, 242, 0))
            dy = card_y + 55
            for line in wrapped_detail_lines:
                draw.text((card_x + 20, dy), line, font=c_detail_font, fill=(255, 255, 255))
                dy += 26
                
            draw.text((card_x + 20, card_y + card_h - 28), f"ที่มา: {card_source}", font=c_source_font, fill=(200, 200, 200))

        # D. Callout Overlay (Tilted label box and custom badge stickers)
        if show_callout and callout_text:
            self.logger.info("[PillowDraw] 💬 Drawing premium high-fidelity callout & sticker overlays")
            self.draw_callout_overlays(
                canvas=canvas,
                text=callout_text,
                highlight=callout_highlight if callout_highlight else "น่าแชร์มากๆ!",
                placement=callout_placement,
                sticker_style=callout_sticker,
                theme_colors=theme_colors,
                width=width,
                height=height,
                image_split_y=image_split_y,
                font_family=font_family
            )

        # E. Meme Sticker Overlay (Bottom-Right of background image)
        if show_meme:
            self.logger.info("[PillowDraw] 🤪 Drawing meme sticker overlay")
            card_w = int(width * 0.32)
            card_h = 100
            card_x = width - card_w - 40
            card_y = image_split_y - card_h - 40
            
            border_color = theme_colors["accent_line"]
            draw.rounded_rectangle([(card_x, card_y), (card_x + card_w, card_y + card_h)], radius=18, fill=(255, 255, 255, 245), outline=border_color, width=4)
            
            m_text = meme_text if meme_text else "เจ๋งมากๆ!"
            m_subtext = meme_subtext if meme_subtext else "AI ช่วยย่นเวลา"
            
            m_text_font = self.get_font(22)
            m_sub_font = self.get_font(15)
            
            mtw = int(m_text_font.getlength(m_text[:20]))
            mstw = int(m_sub_font.getlength(m_subtext[:25]))
            
            draw.text((card_x + (card_w - mtw) // 2, card_y + 18), m_text[:20], font=m_text_font, fill=(15, 23, 42))
            draw.text((card_x + (card_w - mstw) // 2, card_y + 54), m_subtext[:25], font=m_sub_font, fill=(71, 85, 105))


        # ==========================================
        # 5. Save Final Image Render
        # ==========================================
        # Generate clean file name and path
        save_filename = f"render_{content_id}_{datetime.now().strftime('%y%m%d_%H%M%S')}.png"
        save_dir = os.path.join(self.root_path, "generated_graphics/pillow_renders")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, save_filename)

        # Convert to RGB to support jpeg/png export without transparency errors
        final_render = canvas.convert("RGB")
        final_render.save(save_path, "PNG")
        self.logger.info(f"[SUCCESS] [PillowDraw] 💾 Successfully saved poster design to: {save_path}")

        # 6. Register in DB & transition status
        self.write_render_to_db(content_id, save_path, aspect_ratio, theme_name, layout_style)
        return save_path

    def write_render_to_db(self, content_id: str, file_path: str, aspect_ratio: str, theme_name: str, layout_style: str):
        """Saves generated graphics log to SQLite and transitions vault record status to 'designed'."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        graphics_id = f"img_{uuid.uuid4().hex[:10]}"

        # Resolve relative path for DB persistence
        relative_path = os.path.relpath(file_path, self.root_path)

        try:
            # 1. Insert into generated_graphics
            cursor.execute("""
                INSERT INTO generated_graphics (id, content_id, file_path, image_ratio, theme_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (graphics_id, content_id, relative_path, aspect_ratio, f"{theme_name} ({layout_style})", now))
            self.logger.info(f"[PillowDraw] 💾 Inserted graphic record '{graphics_id}' to SQLite table.")

            # 2. Update status of vault_contents to 'designed'
            cursor.execute("""
                UPDATE vault_contents 
                SET status = 'designed', updated_at = ? 
                WHERE id = ?
            """, (now, content_id))
            self.logger.info(f"[PillowDraw] 🔄 Shifted content state in SQLite: '{content_id}' -> 'designed'")

            conn.commit()
        except Exception as e:
            self.logger.error(f"[PillowDraw] ❌ Failed to write details to SQLite database: {e}")
            conn.rollback()
        finally:
            conn.close()


def process_pending_records(generator: GraphicGeneratorModule, aspect_ratio: str, theme: str, layout: str, headline_align="left", headline_margin=35, highlight_color_set="classic", highlight_padding_x=0.22, highlight_padding_y=0.09):
    """Scan SQLite database and process all content records with status 'ready_for_design'."""
    generator.logger.info("[PillowDraw] 🚀 Scanning SQLite database for all pending contents ('ready_for_design')...")
    conn = sqlite3.connect(generator.db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, title, selected_headline, media_paths_json, author_name, author_followers, author_avatar_url, metadata_json
        FROM vault_contents 
        WHERE status = 'ready_for_design'
    """)
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        generator.logger.info("[PillowDraw] 💤 No pending records with status 'ready_for_design' found in SQLite database.")
        return

    generator.logger.info(f"[PillowDraw] Found {len(rows)} pending records to process.")
    for row in rows:
        c_id, title, sel_headline, media_paths_json, auth_name, auth_followers, auth_avatar, meta_json = row
        
        # Use selected_headline if present, otherwise fallback to title
        headline = sel_headline if sel_headline else title
        
        # Parse media path
        base_img = None
        if media_paths_json:
            try:
                paths = json.loads(media_paths_json)
                if paths and isinstance(paths, list):
                    # Check first path
                    candidate = paths[0]
                    if os.path.isabs(candidate):
                        base_img = candidate
                    else:
                        base_img = os.path.join(generator.root_path, candidate)
            except Exception as e:
                generator.logger.warning(f"Error parsing media_paths_json for ID '{c_id}': {e}")
        
        # Parse keywords from metadata_json
        keywords = []
        if meta_json:
            try:
                meta = json.loads(meta_json)
                keywords = meta.get("keywords", meta.get("tags", []))
                if isinstance(keywords, str):
                    keywords = [keywords]
            except Exception as e:
                generator.logger.warning(f"Error parsing metadata_json for ID '{c_id}': {e}")
                
        # If keywords still empty, try parsing capitalized terms from title/headline
        if not keywords:
            # Basic fallback: extract English words or phrases
            import re
            keywords = re.findall(r'[a-zA-Z0-9\s]+', headline)
            keywords = [kw.strip() for kw in keywords if len(kw.strip()) > 3]

        generator.generate_poster(
            content_id=c_id,
            base_image_path=base_img,
            headline=headline,
            keywords=keywords,
            aspect_ratio=aspect_ratio,
            theme_name=theme,
            layout_style=layout,
            author_name=auth_name,
            author_followers=auth_followers,
            author_avatar_path=auth_avatar,
            headline_align=headline_align,
            headline_margin=headline_margin,
            highlight_color_set=highlight_color_set,
            highlight_padding_x=highlight_padding_x,
            highlight_padding_y=highlight_padding_y
        )


def str_to_bool(val: str) -> bool:
    if not val:
        return False
    return val.strip().lower() in ("true", "1", "yes", "on", "active")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Content Factory V2 Poster Creator with Thai Syllable Wrapper Engine")
    parser.add_argument("--content-id", type=str, help="ID of content from vault_contents table to process")
    parser.add_argument("--ratio", type=str, default="1:1", help="Image aspect ratio")
    parser.add_argument("--theme", "--theme-name", dest="theme", type=str, default="Classic Red Blue", help="Color theme")
    parser.add_argument("--layout", type=str, choices=["youtube", "ai_news", "github", "quotes", "top_gainers"], default="top_gainers", help="Design layout style")
    parser.add_argument("--headline", type=str, help="Manual headline (overrides database or standalone run)")
    parser.add_argument("--keywords", type=str, help="Comma-separated manual keywords (overrides database)")
    parser.add_argument("--base-image", type=str, help="Manual base image path (overrides database)")
    parser.add_argument("--vault-root", type=str, help="Path to Content Vault root directory")
    parser.add_argument("--all-pending", action="store_true", help="Process all pending (ready_for_design) content records")

    # Custom Overlay Arguments
    parser.add_argument("--show-logo", type=str, default="false", help="Whether to show page logo")
    parser.add_argument("--page-logo-path", type=str, help="Path to page logo image")
    parser.add_argument("--page-logo-size", type=float, default=10.0, help="Page logo size in percent")
    parser.add_argument("--page-logo-margin-x", type=int, default=20, help="Page logo margin X in px")
    parser.add_argument("--page-logo-margin-y", type=int, default=20, help="Page logo margin Y in px")
    parser.add_argument("--page-logo-corner", type=str, default="top-right", choices=["top-left", "top-right", "bottom-left", "bottom-right"], help="Corner position for logo placement")

    parser.add_argument("--show-badge", type=str, default="true", help="Whether to show top-left category badge")
    parser.add_argument("--badge-style", type=str, default="dev-pick", help="Badge style (dev-pick, ai-radar, etc.)")
    parser.add_argument("--badge-text", type=str, default="AI", help="Badge category text")
    parser.add_argument("--badge-subtext", type=str, default="Content Lab", help="Badge category subtext")

    parser.add_argument("--show-news-card", type=str, default="false", help="Whether to show news card")
    parser.add_argument("--news-title", type=str, help="News card title")
    parser.add_argument("--news-detail", type=str, help="News card detail")
    parser.add_argument("--news-source", type=str, help="News card source")

    parser.add_argument("--show-callout", type=str, default="false", help="Whether to show callout overlay")
    parser.add_argument("--callout-text", type=str, help="Callout overlay text")
    parser.add_argument("--callout-highlight", type=str, help="Callout overlay highlighted word")
    parser.add_argument("--callout-placement", type=str, default="random", help="Callout placement mode")
    parser.add_argument("--callout-sticker", type=str, default="random", help="Callout sticker style")

    parser.add_argument("--show-meme", type=str, default="false", help="Whether to show meme sticker")
    parser.add_argument("--meme-text", type=str, help="Meme text")
    parser.add_argument("--meme-subtext", type=str, help="Meme subtext")

    parser.add_argument("--credit-text", type=str, default="วางแผนเป็น เห็นทางรวย", help="Page credit text")
    parser.add_argument("--font-scale", type=float, default=1.0, help="Font scaling factor")
    parser.add_argument("--image-split", type=int, default=60, help="Image vs text split percent")
    parser.add_argument("--font-family", type=str, default="Mitr", help="Typography font family")
    parser.add_argument("--headline-align", type=str, choices=["left", "center", "right"], default="left", help="Headline text alignment")
    parser.add_argument("--headline-margin", type=int, default=35, help="Top spacing/margin for headline in split layout")
    parser.add_argument("--highlight-color-set", type=str, choices=["classic", "cyber", "gold", "forest", "sunset"], default="classic", help="Highlight color set theme")
    parser.add_argument("--highlight-padding-x", type=float, default=0.22, help="Highlight horizontal padding factor")
    parser.add_argument("--highlight-padding-y", type=float, default=0.09, help="Highlight vertical padding factor")

    args, unknown = parser.parse_known_args()

    # Determine external vault root path dynamically
    vault_root = args.vault_root or os.environ.get("VAULT_ROOT") or os.environ.get("VAULT_EXTERNAL_ROOT")
    if not vault_root:
        # Standard fallback to workspace location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        vault_root = os.path.join(parent_dir, "content_vault")

    generator = GraphicGeneratorModule(vault_root)

    if args.all_pending:
        process_pending_records(generator, args.ratio, args.theme, args.layout, args.headline_align, args.headline_margin, args.highlight_color_set, args.highlight_padding_x, args.highlight_padding_y)
    else:
        # Single poster run (manual or database-fetched)
        content_id = args.content_id or f"manual_{uuid.uuid4().hex[:6]}"
        headline = args.headline
        keywords = [kw.strip() for kw in args.keywords.split(",")] if args.keywords else []
        base_image = args.base_image
        # Resolve relative paths against vault root (frontend sends relative paths like 'downloaded_media/...')
        if base_image and not os.path.isabs(base_image):
            base_image = os.path.join(generator.root_path, base_image)
        author_name = None
        author_followers = 0
        author_avatar = None

        # Try to pull missing fields from database if content_id is supplied
        if args.content_id:
            conn = sqlite3.connect(generator.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT title, selected_headline, media_paths_json, author_name, author_followers, author_avatar_url, metadata_json
                FROM vault_contents WHERE id = ?
            """, (args.content_id,))
            row = cursor.fetchone()
            conn.close()

            if row:
                db_title, db_sel_headline, db_media_json, db_auth_name, db_auth_followers, db_auth_avatar, db_meta_json = row
                if not headline:
                    headline = db_sel_headline if db_sel_headline else db_title
                if not base_image and db_media_json:
                    try:
                        paths = json.loads(db_media_json)
                        if paths and isinstance(paths, list):
                            candidate = paths[0]
                            base_image = candidate if os.path.isabs(candidate) else os.path.join(generator.root_path, candidate)
                    except Exception:
                        pass
                if not keywords and db_meta_json:
                    try:
                        meta = json.loads(db_meta_json)
                        keywords = meta.get("keywords", meta.get("tags", []))
                        if isinstance(keywords, str):
                            keywords = [keywords]
                    except Exception:
                        pass
                author_name = db_auth_name
                author_followers = db_auth_followers
                author_avatar = db_auth_avatar
            else:
                generator.logger.warning(f"Specified Content ID '{args.content_id}' not found in database. Using manual values.")

        # Final checks/fallbacks for manual run
        if not headline:
            headline = "สร้างระบบ AI ยอดนิยมระดับพรีเมียมด้วย Python Pillow และคำไทยสมบูรณ์แบบ"
        if not keywords:
            keywords = ["AI", "Python Pillow", "คำไทย"]

        generator.generate_poster(
            content_id=content_id,
            base_image_path=base_image,
            headline=headline,
            keywords=keywords,
            aspect_ratio=args.ratio,
            theme_name=args.theme,
            layout_style=args.layout,
            author_name=author_name,
            author_followers=author_followers,
            author_avatar_path=author_avatar,
            show_logo=str_to_bool(args.show_logo),
            page_logo_path=args.page_logo_path,
            page_logo_size=args.page_logo_size,
            page_logo_margin_x=args.page_logo_margin_x,
            page_logo_margin_y=args.page_logo_margin_y,
            page_logo_corner=args.page_logo_corner,
            show_badge=str_to_bool(args.show_badge),
            badge_style=args.badge_style,
            badge_text=args.badge_text,
            badge_subtext=args.badge_subtext,
            show_news_card=str_to_bool(args.show_news_card),
            news_title=args.news_title,
            news_detail=args.news_detail,
            news_source=args.news_source,
            show_callout=str_to_bool(args.show_callout),
            callout_text=args.callout_text,
            callout_highlight=args.callout_highlight,
            callout_placement=args.callout_placement,
            callout_sticker=args.callout_sticker,
            show_meme=str_to_bool(args.show_meme),
            meme_text=args.meme_text,
            meme_subtext=args.meme_subtext,
            credit_text=args.credit_text,
            font_scale=args.font_scale,
            image_split=args.image_split,
            font_family=args.font_family,
            headline_align=args.headline_align,
            headline_margin=args.headline_margin,
            highlight_color_set=args.highlight_color_set,
            highlight_padding_x=args.highlight_padding_x,
            highlight_padding_y=args.highlight_padding_y
        )
