# FoodFusion source archive

Private research for **Jia Cooks**.

## Rule

Book cards must **never look like FoodFusion**:
- No promo / login / signup / #HappyCooking
- No “Research note from Food Fusion” stories
- Tags: `family`, `roman-urdu` — not `foodfusion`

Keep:
- English method
- Roman Urdu under each step (`tip`, labeled in UI)
- Hero images

Regen: `python3 scripts/scrape-foodfusion.py --bodies 80 --curate 40 --emit-ts`
