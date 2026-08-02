import type { Recipe } from './types';

export type HealthierSwap = NonNullable<Recipe['healthierSwaps']>[number];

/** Healthier ingredient swaps keyed by flagship / popular recipe id. */
export const SWAPS: Record<string, HealthierSwap[]> = {
  'butter-chicken': [
    { from: 'cream', to: 'low-fat yogurt or evaporated skim milk', deltaKcal: -80, deltaProtein: 2, note: 'Stir off heat so it doesn’t split.' },
    { from: 'butter', to: '1 tbsp oil + splash of water', deltaKcal: -60, note: 'Keep a knob of butter to finish if you want aroma.' },
    { from: 'white rice', to: 'brown rice or cauliflower rice', deltaKcal: -40 },
  ],
  'chana-masala': [
    { from: 'extra oil tadka', to: '1 tsp oil + water sauté', deltaKcal: -50 },
    { from: 'white rice', to: 'brown rice or roti', deltaKcal: -30 },
    { from: 'fried garnish', to: 'fresh coriander and lemon', deltaKcal: -40 },
  ],
  'seekh-kebab': [
    { from: 'full-fat mince', to: 'lean mince (≤10% fat)', deltaKcal: -70, deltaProtein: 3 },
    { from: 'deep fry / heavy oil pan', to: 'grill or air fry', deltaKcal: -50 },
    { from: 'naan', to: 'salad bowl or wholemeal roti', deltaKcal: -80 },
  ],
  'buttermilk-pancakes': [
    { from: 'butter in batter', to: 'half oil / half applesauce', deltaKcal: -40 },
    { from: 'maple syrup pour', to: 'fruit + teaspoon honey', deltaKcal: -90, note: 'Sweetness without the flood.' },
    { from: 'all-purpose flour', to: 'half oats blended in', deltaProtein: 2, deltaKcal: -20 },
  ],
  shakshuka: [
    { from: 'extra olive oil', to: '1 tbsp oil total', deltaKcal: -40 },
    { from: 'full-fat feta', to: 'reduced-fat feta or yogurt dollop', deltaKcal: -35 },
    { from: 'white bread mop', to: 'wholemeal toast', deltaKcal: -20 },
  ],
  'roast-chicken': [
    { from: 'skin on', to: 'remove skin after roasting', deltaKcal: -60 },
    { from: 'butter rub', to: 'herb + oil rub', deltaKcal: -50 },
    { from: 'roast potatoes in lots of oil', to: 'air-fry or oven with spray oil', deltaKcal: -70 },
  ],
  'risotto-milanese': [
    { from: 'butter finish', to: 'parmesan + splash of stock', deltaKcal: -45 },
    { from: 'full cream', to: 'skip cream; rely on starch', deltaKcal: -60 },
    { from: 'white wine + butter', to: 'stock + lemon zest', deltaKcal: -30 },
  ],
  tiramisu: [
    { from: 'mascarpone full tub', to: 'half mascarpone + Greek yogurt', deltaKcal: -90, deltaProtein: 4 },
    { from: 'sugar in cream', to: 'reduce sugar by 25%', deltaKcal: -40 },
    { from: 'ladyfinger soak heavy', to: 'light espresso dip only', deltaKcal: -25 },
  ],
  'masala-chai': [
    { from: 'full-fat milk', to: 'low-fat or oat milk', deltaKcal: -35 },
    { from: '2–3 tsp sugar', to: '½ tsp sugar or stevia', deltaKcal: -30 },
    { from: 'long boil with cream', to: 'short simmer, milk last', deltaKcal: -20 },
  ],
  'kung-pao-tofu': [
    { from: 'deep-fried tofu', to: 'air-fried or pan-seared tofu', deltaKcal: -80 },
    { from: 'extra oil stir-fry', to: 'nonstick + 1 tbsp oil', deltaKcal: -50 },
    { from: 'white rice', to: 'brown rice or cauliflower rice', deltaKcal: -40 },
  ],
  'halloumi-wrap': [
    { from: 'thick halloumi slab', to: 'thinner slices, more salad', deltaKcal: -60 },
    { from: 'full-fat yogurt', to: '0% Greek yogurt', deltaKcal: -25, deltaProtein: 2 },
    { from: 'buttery flatbread', to: 'wholemeal wrap', deltaKcal: -30 },
  ],
  'caprese-orzo': [
    { from: 'extra olive oil', to: '1 tbsp oil + lemon', deltaKcal: -40 },
    { from: 'full-fat mozzarella', to: 'part-skim mozzarella', deltaKcal: -35 },
    { from: 'orzo white', to: 'wholewheat orzo or quinoa', deltaKcal: -20, deltaProtein: 2 },
  ],
  'sourdough-focaccia': [
    { from: 'heavy oil dimples', to: 'light oil spray + herbs', deltaKcal: -50 },
    { from: 'cheese topping', to: 'tomato + rosemary only', deltaKcal: -40 },
  ],
  'karahi-chicken': [
    { from: 'extra ghee', to: '2 tbsp oil max', deltaKcal: -70 },
    { from: 'cream finish', to: 'tomato puree reduction', deltaKcal: -60 },
    { from: 'white rice', to: 'salad or brown rice', deltaKcal: -40 },
  ],
  'jia-karahi': [
    { from: 'ghee tadka', to: 'measured oil tadka', deltaKcal: -50 },
    { from: 'skin-on chicken', to: 'skinless pieces', deltaKcal: -55 },
  ],
  samosas: [
    { from: 'deep fry', to: 'bake or air fry', deltaKcal: -100, note: 'Brush lightly with oil.' },
    { from: 'potato-only filling', to: 'half potato, half peas/lentils', deltaProtein: 3, deltaKcal: -20 },
  ],
  pakoras: [
    { from: 'deep fry', to: 'air fry with oil mist', deltaKcal: -120 },
    { from: 'thick besan batter', to: 'thinner coat, more veg', deltaKcal: -40 },
  ],
  'alfredo-pasta': [
    { from: 'cream + butter', to: 'Greek yogurt + pasta water', deltaKcal: -120, deltaProtein: 5 },
    { from: 'white pasta', to: 'wholewheat pasta', deltaKcal: -15, deltaProtein: 2 },
  ],
  'egg-fried-rice': [
    { from: 'extra oil wok', to: '1 tbsp oil + nonstick', deltaKcal: -60 },
    { from: 'white rice', to: 'day-old brown rice', deltaKcal: -25 },
    { from: '2 eggs', to: '1 egg + 2 whites', deltaKcal: -40, deltaProtein: 2 },
  ],
  'banana-bread': [
    { from: 'oil / butter', to: 'half oil, half mashed banana', deltaKcal: -40 },
    { from: 'brown sugar full amount', to: 'reduce sugar 25%', deltaKcal: -35 },
    { from: 'white flour only', to: 'half wholemeal', deltaKcal: -10, deltaProtein: 1 },
  ],
  naan: [
    { from: 'butter brush', to: 'light oil or skip', deltaKcal: -45 },
    { from: 'refined flour', to: 'half atta', deltaKcal: -15 },
  ],
  'chicken-stir-fry': [
    { from: 'heavy oil stir-fry', to: '1 tbsp oil + splash stock', deltaKcal: -55 },
    { from: 'sweet sauce heavy', to: 'soy + garlic + chili, less sugar', deltaKcal: -40 },
    { from: 'white rice', to: 'cauliflower rice or brown', deltaKcal: -40 },
  ],
  'veggie-curry': [
    { from: 'coconut cream', to: 'light coconut milk or yogurt', deltaKcal: -70 },
    { from: 'extra oil', to: '1 tbsp oil sauté', deltaKcal: -40 },
  ],
  'handi-chicken': [
    { from: 'cream / cheese', to: 'yogurt finish', deltaKcal: -80, deltaProtein: 3 },
    { from: 'butter', to: 'oil, less quantity', deltaKcal: -50 },
  ],
  'sweet-sour-chicken': [
    { from: 'deep-fried batter', to: 'air-fry or bake lightly coated', deltaKcal: -110 },
    { from: 'sugar in sauce', to: 'half sugar + pineapple', deltaKcal: -50 },
  ],
  'kfc-chicken': [
    { from: 'deep fry', to: 'air fry breaded pieces', deltaKcal: -150 },
    { from: 'buttermilk full fat', to: 'low-fat buttermilk or yogurt dip', deltaKcal: -30 },
  ],
  cheesecake: [
    { from: 'full-fat cream cheese', to: 'half cream cheese + Greek yogurt', deltaKcal: -90, deltaProtein: 4 },
    { from: 'sugar', to: 'reduce 20–25%', deltaKcal: -40 },
  ],
  'aloo-paratha': [
    { from: 'ghee fry', to: 'dry tawa + ½ tsp oil', deltaKcal: -60 },
    { from: 'potato filling only', to: 'potato + peas / paneer light', deltaProtein: 3 },
  ],
};
