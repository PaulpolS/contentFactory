import os
from PIL import Image, ImageDraw, ImageFont

def generate_logos():
    logos_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/content_vault/logos"
    os.makedirs(logos_dir, exist_ok=True)
    
    # 1. Generate Gold Crown Logo
    crown_path = os.path.join(logos_dir, "crown.png")
    if not os.path.exists(crown_path):
        img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Gold colors
        gold_fill = (245, 158, 11, 255) # F59E0B
        gold_border = (251, 191, 36, 255) # FBBF24
        
        # Crown coordinates
        # Draw base bar
        draw.rounded_rectangle([(30, 180), (226, 210)], radius=6, fill=gold_fill, outline=gold_border, width=4)
        
        # Draw spikes
        points = [
            (30, 180),
            (30, 80),
            (80, 130),
            (128, 50),
            (176, 130),
            (226, 80),
            (226, 180)
        ]
        draw.polygon(points, fill=gold_fill, outline=gold_border)
        
        # Draw little circles on spikes
        draw.ellipse([(18, 68), (42, 92)], fill=gold_border)
        draw.ellipse([(116, 38), (140, 62)], fill=gold_border)
        draw.ellipse([(214, 68), (238, 92)], fill=gold_border)
        
        # Draw a little gem in center
        draw.polygon([(118, 140), (128, 120), (138, 140), (128, 160)], fill=(239, 68, 68, 255)) # Red Gem
        
        img.save(crown_path, "PNG")
        print("Generated default crown.png")
        
    # 2. Generate Blue AI Badge Logo
    ai_badge_path = os.path.join(logos_dir, "ai-badge.png")
    if not os.path.exists(ai_badge_path):
        img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Colors
        cyan_fill = (8, 145, 178, 255) # #0891B2
        cyan_border = (34, 211, 238, 255) # #22D3EE
        
        # Draw outer circle
        draw.ellipse([(20, 20), (236, 236)], fill=(15, 23, 42, 235), outline=cyan_border, width=6)
        
        # Draw inner cyan circle
        draw.ellipse([(40, 40), (216, 216)], fill=(8, 145, 178, 40), outline=cyan_fill, width=2)
        
        # Draw AI text in center
        # Since we may not have specific fonts here, we'll draw simple thick geometric letters
        # Letter 'A'
        draw.line([(85, 160), (110, 90)], fill=cyan_border, width=12)
        draw.line([(110, 90), (135, 160)], fill=cyan_border, width=12)
        draw.line([(95, 135), (125, 135)], fill=cyan_border, width=12)
        
        # Letter 'I'
        draw.line([(165, 90), (165, 160)], fill=cyan_border, width=12)
        draw.line([(150, 90), (180, 90)], fill=cyan_border, width=12)
        draw.line([(150, 160), (180, 160)], fill=cyan_border, width=12)
        
        img.save(ai_badge_path, "PNG")
        print("Generated default ai-badge.png")

if __name__ == "__main__":
    generate_logos()
