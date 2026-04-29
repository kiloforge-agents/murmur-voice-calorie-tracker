// A pragmatic food database. Calories are per "unit" (one item, one cup, one slice, etc.)
// where unit is hinted by `defaultUnit`. The parser maps spoken quantities → multiplier.

export type Macros = {
  protein: number; // grams per unit
  carbs: number;
  fat: number;
};

export type Food = {
  id: string;
  name: string; // canonical display name
  aliases: string[]; // lowercase synonyms / phrasings
  defaultUnit: string; // human label e.g. "slice", "cup", "egg", "serving"
  caloriesPerUnit: number;
  macros: Macros;
  emoji: string;
};

export const FOODS: Food[] = [
  // Proteins
  { id: "egg", name: "Egg", aliases: ["egg", "eggs", "boiled egg", "fried egg", "scrambled egg"], defaultUnit: "egg", caloriesPerUnit: 78, macros: { protein: 6, carbs: 0.6, fat: 5 }, emoji: "🥚" },
  { id: "chicken-breast", name: "Chicken breast", aliases: ["chicken breast", "chicken", "grilled chicken"], defaultUnit: "serving (4 oz)", caloriesPerUnit: 187, macros: { protein: 35, carbs: 0, fat: 4 }, emoji: "🍗" },
  { id: "salmon", name: "Salmon", aliases: ["salmon", "salmon fillet"], defaultUnit: "fillet (4 oz)", caloriesPerUnit: 233, macros: { protein: 25, carbs: 0, fat: 14 }, emoji: "🐟" },
  { id: "tuna", name: "Tuna", aliases: ["tuna", "tuna steak", "canned tuna"], defaultUnit: "serving (3 oz)", caloriesPerUnit: 99, macros: { protein: 22, carbs: 0, fat: 1 }, emoji: "🐟" },
  { id: "shrimp", name: "Shrimp", aliases: ["shrimp", "prawn", "prawns"], defaultUnit: "shrimp", caloriesPerUnit: 7, macros: { protein: 1.4, carbs: 0, fat: 0.1 }, emoji: "🦐" },
  { id: "tofu", name: "Tofu", aliases: ["tofu", "bean curd"], defaultUnit: "serving (3 oz)", caloriesPerUnit: 71, macros: { protein: 8, carbs: 1.7, fat: 4 }, emoji: "🟫" },
  { id: "bacon", name: "Bacon", aliases: ["bacon", "bacon strip", "rasher"], defaultUnit: "strip", caloriesPerUnit: 43, macros: { protein: 3, carbs: 0.1, fat: 3.3 }, emoji: "🥓" },
  { id: "sausage", name: "Sausage", aliases: ["sausage", "sausage link"], defaultUnit: "link", caloriesPerUnit: 92, macros: { protein: 5, carbs: 0.7, fat: 8 }, emoji: "🌭" },
  { id: "ground-beef", name: "Ground beef", aliases: ["ground beef", "beef", "minced beef", "hamburger meat"], defaultUnit: "serving (4 oz)", caloriesPerUnit: 287, macros: { protein: 19, carbs: 0, fat: 23 }, emoji: "🥩" },
  { id: "steak", name: "Steak", aliases: ["steak", "ribeye", "sirloin"], defaultUnit: "serving (6 oz)", caloriesPerUnit: 410, macros: { protein: 50, carbs: 0, fat: 22 }, emoji: "🥩" },

  // Grains / starches
  { id: "white-rice", name: "White rice", aliases: ["white rice", "rice", "steamed rice"], defaultUnit: "cup", caloriesPerUnit: 205, macros: { protein: 4.3, carbs: 45, fat: 0.4 }, emoji: "🍚" },
  { id: "brown-rice", name: "Brown rice", aliases: ["brown rice"], defaultUnit: "cup", caloriesPerUnit: 216, macros: { protein: 5, carbs: 45, fat: 1.8 }, emoji: "🍚" },
  { id: "pasta", name: "Pasta", aliases: ["pasta", "spaghetti", "penne", "noodles", "fettuccine"], defaultUnit: "cup", caloriesPerUnit: 220, macros: { protein: 8, carbs: 43, fat: 1.3 }, emoji: "🍝" },
  { id: "bread", name: "Bread", aliases: ["bread", "slice of bread", "toast", "white bread"], defaultUnit: "slice", caloriesPerUnit: 79, macros: { protein: 2.7, carbs: 14, fat: 1 }, emoji: "🍞" },
  { id: "bagel", name: "Bagel", aliases: ["bagel"], defaultUnit: "bagel", caloriesPerUnit: 277, macros: { protein: 11, carbs: 55, fat: 1.7 }, emoji: "🥯" },
  { id: "tortilla", name: "Tortilla", aliases: ["tortilla", "wrap", "flour tortilla"], defaultUnit: "tortilla", caloriesPerUnit: 138, macros: { protein: 4, carbs: 23, fat: 3.6 }, emoji: "🫓" },
  { id: "oatmeal", name: "Oatmeal", aliases: ["oatmeal", "oats", "porridge"], defaultUnit: "cup", caloriesPerUnit: 158, macros: { protein: 6, carbs: 27, fat: 3.2 }, emoji: "🥣" },
  { id: "cereal", name: "Cereal", aliases: ["cereal", "corn flakes", "frosted flakes"], defaultUnit: "cup", caloriesPerUnit: 110, macros: { protein: 2, carbs: 26, fat: 0.5 }, emoji: "🥣" },
  { id: "potato", name: "Potato", aliases: ["potato", "baked potato"], defaultUnit: "potato", caloriesPerUnit: 161, macros: { protein: 4.3, carbs: 37, fat: 0.2 }, emoji: "🥔" },
  { id: "fries", name: "French fries", aliases: ["fries", "french fries", "chips"], defaultUnit: "serving (medium)", caloriesPerUnit: 365, macros: { protein: 4, carbs: 48, fat: 17 }, emoji: "🍟" },

  // Fruits
  { id: "apple", name: "Apple", aliases: ["apple", "apples"], defaultUnit: "apple", caloriesPerUnit: 95, macros: { protein: 0.5, carbs: 25, fat: 0.3 }, emoji: "🍎" },
  { id: "banana", name: "Banana", aliases: ["banana", "bananas"], defaultUnit: "banana", caloriesPerUnit: 105, macros: { protein: 1.3, carbs: 27, fat: 0.4 }, emoji: "🍌" },
  { id: "orange", name: "Orange", aliases: ["orange", "oranges"], defaultUnit: "orange", caloriesPerUnit: 62, macros: { protein: 1.2, carbs: 15, fat: 0.2 }, emoji: "🍊" },
  { id: "strawberries", name: "Strawberries", aliases: ["strawberry", "strawberries"], defaultUnit: "cup", caloriesPerUnit: 49, macros: { protein: 1, carbs: 12, fat: 0.5 }, emoji: "🍓" },
  { id: "blueberries", name: "Blueberries", aliases: ["blueberry", "blueberries"], defaultUnit: "cup", caloriesPerUnit: 84, macros: { protein: 1.1, carbs: 21, fat: 0.5 }, emoji: "🫐" },
  { id: "grapes", name: "Grapes", aliases: ["grape", "grapes"], defaultUnit: "cup", caloriesPerUnit: 104, macros: { protein: 1.1, carbs: 27, fat: 0.2 }, emoji: "🍇" },
  { id: "watermelon", name: "Watermelon", aliases: ["watermelon"], defaultUnit: "cup", caloriesPerUnit: 46, macros: { protein: 0.9, carbs: 12, fat: 0.2 }, emoji: "🍉" },
  { id: "avocado", name: "Avocado", aliases: ["avocado", "avocados"], defaultUnit: "avocado", caloriesPerUnit: 234, macros: { protein: 2.9, carbs: 12, fat: 21 }, emoji: "🥑" },

  // Veg
  { id: "broccoli", name: "Broccoli", aliases: ["broccoli"], defaultUnit: "cup", caloriesPerUnit: 31, macros: { protein: 2.5, carbs: 6, fat: 0.3 }, emoji: "🥦" },
  { id: "salad", name: "Salad", aliases: ["salad", "garden salad", "green salad"], defaultUnit: "bowl", caloriesPerUnit: 150, macros: { protein: 5, carbs: 10, fat: 9 }, emoji: "🥗" },
  { id: "carrot", name: "Carrot", aliases: ["carrot", "carrots"], defaultUnit: "carrot", caloriesPerUnit: 25, macros: { protein: 0.6, carbs: 6, fat: 0.1 }, emoji: "🥕" },
  { id: "spinach", name: "Spinach", aliases: ["spinach"], defaultUnit: "cup", caloriesPerUnit: 7, macros: { protein: 0.9, carbs: 1.1, fat: 0.1 }, emoji: "🥬" },
  { id: "tomato", name: "Tomato", aliases: ["tomato", "tomatoes"], defaultUnit: "tomato", caloriesPerUnit: 22, macros: { protein: 1.1, carbs: 4.8, fat: 0.2 }, emoji: "🍅" },

  // Dairy
  { id: "milk", name: "Milk", aliases: ["milk", "whole milk"], defaultUnit: "cup", caloriesPerUnit: 149, macros: { protein: 8, carbs: 12, fat: 8 }, emoji: "🥛" },
  { id: "almond-milk", name: "Almond milk", aliases: ["almond milk"], defaultUnit: "cup", caloriesPerUnit: 39, macros: { protein: 1, carbs: 3.5, fat: 2.5 }, emoji: "🥛" },
  { id: "yogurt", name: "Greek yogurt", aliases: ["yogurt", "greek yogurt", "yoghurt"], defaultUnit: "cup", caloriesPerUnit: 100, macros: { protein: 17, carbs: 6, fat: 0.7 }, emoji: "🥣" },
  { id: "cheese", name: "Cheese", aliases: ["cheese", "cheddar", "slice of cheese"], defaultUnit: "slice", caloriesPerUnit: 113, macros: { protein: 7, carbs: 0.4, fat: 9 }, emoji: "🧀" },
  { id: "butter", name: "Butter", aliases: ["butter", "tablespoon of butter"], defaultUnit: "tablespoon", caloriesPerUnit: 102, macros: { protein: 0.1, carbs: 0, fat: 12 }, emoji: "🧈" },

  // Meals / fast food
  { id: "pizza", name: "Pizza", aliases: ["pizza", "slice of pizza", "pizza slice"], defaultUnit: "slice", caloriesPerUnit: 285, macros: { protein: 12, carbs: 36, fat: 10 }, emoji: "🍕" },
  { id: "burger", name: "Hamburger", aliases: ["burger", "hamburger", "cheeseburger"], defaultUnit: "burger", caloriesPerUnit: 540, macros: { protein: 25, carbs: 40, fat: 27 }, emoji: "🍔" },
  { id: "hotdog", name: "Hot dog", aliases: ["hot dog", "hotdog"], defaultUnit: "hot dog", caloriesPerUnit: 290, macros: { protein: 10, carbs: 22, fat: 18 }, emoji: "🌭" },
  { id: "sandwich", name: "Sandwich", aliases: ["sandwich", "sub", "sub sandwich"], defaultUnit: "sandwich", caloriesPerUnit: 350, macros: { protein: 18, carbs: 36, fat: 14 }, emoji: "🥪" },
  { id: "burrito", name: "Burrito", aliases: ["burrito"], defaultUnit: "burrito", caloriesPerUnit: 620, macros: { protein: 27, carbs: 75, fat: 24 }, emoji: "🌯" },
  { id: "taco", name: "Taco", aliases: ["taco", "tacos"], defaultUnit: "taco", caloriesPerUnit: 210, macros: { protein: 9, carbs: 19, fat: 11 }, emoji: "🌮" },
  { id: "sushi", name: "Sushi", aliases: ["sushi", "sushi roll", "sushi piece", "nigiri"], defaultUnit: "piece", caloriesPerUnit: 45, macros: { protein: 1.5, carbs: 8, fat: 0.5 }, emoji: "🍣" },
  { id: "ramen", name: "Ramen", aliases: ["ramen", "bowl of ramen"], defaultUnit: "bowl", caloriesPerUnit: 436, macros: { protein: 18, carbs: 60, fat: 14 }, emoji: "🍜" },
  { id: "soup", name: "Soup", aliases: ["soup", "bowl of soup"], defaultUnit: "bowl", caloriesPerUnit: 180, macros: { protein: 8, carbs: 22, fat: 6 }, emoji: "🥣" },
  { id: "salmon-bowl", name: "Poke bowl", aliases: ["poke bowl", "poke"], defaultUnit: "bowl", caloriesPerUnit: 540, macros: { protein: 30, carbs: 60, fat: 18 }, emoji: "🍱" },

  // Snacks / sweets
  { id: "cookie", name: "Cookie", aliases: ["cookie", "cookies", "chocolate chip cookie"], defaultUnit: "cookie", caloriesPerUnit: 148, macros: { protein: 1.7, carbs: 20, fat: 7 }, emoji: "🍪" },
  { id: "donut", name: "Donut", aliases: ["donut", "doughnut"], defaultUnit: "donut", caloriesPerUnit: 253, macros: { protein: 4, carbs: 31, fat: 14 }, emoji: "🍩" },
  { id: "muffin", name: "Muffin", aliases: ["muffin", "blueberry muffin"], defaultUnit: "muffin", caloriesPerUnit: 265, macros: { protein: 4, carbs: 44, fat: 9 }, emoji: "🧁" },
  { id: "croissant", name: "Croissant", aliases: ["croissant"], defaultUnit: "croissant", caloriesPerUnit: 231, macros: { protein: 5, carbs: 26, fat: 12 }, emoji: "🥐" },
  { id: "ice-cream", name: "Ice cream", aliases: ["ice cream", "icecream", "scoop of ice cream"], defaultUnit: "scoop", caloriesPerUnit: 137, macros: { protein: 2.3, carbs: 16, fat: 7 }, emoji: "🍨" },
  { id: "chocolate", name: "Chocolate", aliases: ["chocolate", "chocolate bar", "candy bar"], defaultUnit: "bar", caloriesPerUnit: 235, macros: { protein: 3.2, carbs: 26, fat: 13 }, emoji: "🍫" },
  { id: "chips", name: "Potato chips", aliases: ["chips", "potato chips", "crisps"], defaultUnit: "bag (1 oz)", caloriesPerUnit: 152, macros: { protein: 2, carbs: 15, fat: 10 }, emoji: "🍿" },
  { id: "popcorn", name: "Popcorn", aliases: ["popcorn"], defaultUnit: "cup", caloriesPerUnit: 31, macros: { protein: 1, carbs: 6.2, fat: 0.4 }, emoji: "🍿" },
  { id: "pretzel", name: "Pretzel", aliases: ["pretzel", "pretzels"], defaultUnit: "pretzel", caloriesPerUnit: 110, macros: { protein: 3, carbs: 23, fat: 1 }, emoji: "🥨" },
  { id: "almonds", name: "Almonds", aliases: ["almond", "almonds"], defaultUnit: "handful (1 oz)", caloriesPerUnit: 164, macros: { protein: 6, carbs: 6, fat: 14 }, emoji: "🌰" },
  { id: "peanuts", name: "Peanuts", aliases: ["peanut", "peanuts"], defaultUnit: "handful (1 oz)", caloriesPerUnit: 161, macros: { protein: 7.3, carbs: 4.6, fat: 14 }, emoji: "🥜" },
  { id: "peanut-butter", name: "Peanut butter", aliases: ["peanut butter", "pb"], defaultUnit: "tablespoon", caloriesPerUnit: 94, macros: { protein: 4, carbs: 3, fat: 8 }, emoji: "🥜" },

  // Drinks
  { id: "coffee", name: "Coffee", aliases: ["coffee", "black coffee", "espresso"], defaultUnit: "cup", caloriesPerUnit: 5, macros: { protein: 0.3, carbs: 0, fat: 0 }, emoji: "☕" },
  { id: "latte", name: "Latte", aliases: ["latte", "cafe latte", "caffe latte"], defaultUnit: "cup", caloriesPerUnit: 190, macros: { protein: 13, carbs: 19, fat: 7 }, emoji: "☕" },
  { id: "cappuccino", name: "Cappuccino", aliases: ["cappuccino"], defaultUnit: "cup", caloriesPerUnit: 120, macros: { protein: 8, carbs: 12, fat: 4 }, emoji: "☕" },
  { id: "tea", name: "Tea", aliases: ["tea", "green tea", "black tea"], defaultUnit: "cup", caloriesPerUnit: 2, macros: { protein: 0, carbs: 0.5, fat: 0 }, emoji: "🍵" },
  { id: "orange-juice", name: "Orange juice", aliases: ["orange juice", "oj"], defaultUnit: "cup", caloriesPerUnit: 112, macros: { protein: 1.7, carbs: 26, fat: 0.5 }, emoji: "🧃" },
  { id: "soda", name: "Soda", aliases: ["soda", "coke", "pepsi", "cola", "sprite"], defaultUnit: "can", caloriesPerUnit: 140, macros: { protein: 0, carbs: 39, fat: 0 }, emoji: "🥤" },
  { id: "beer", name: "Beer", aliases: ["beer"], defaultUnit: "bottle", caloriesPerUnit: 153, macros: { protein: 1.6, carbs: 13, fat: 0 }, emoji: "🍺" },
  { id: "wine", name: "Wine", aliases: ["wine", "red wine", "white wine", "glass of wine"], defaultUnit: "glass", caloriesPerUnit: 125, macros: { protein: 0.1, carbs: 4, fat: 0 }, emoji: "🍷" },
  { id: "smoothie", name: "Smoothie", aliases: ["smoothie", "fruit smoothie"], defaultUnit: "cup", caloriesPerUnit: 200, macros: { protein: 5, carbs: 40, fat: 3 }, emoji: "🥤" },
  { id: "protein-shake", name: "Protein shake", aliases: ["protein shake", "protein drink"], defaultUnit: "shake", caloriesPerUnit: 160, macros: { protein: 30, carbs: 6, fat: 2 }, emoji: "🥤" },
  { id: "water", name: "Water", aliases: ["water", "glass of water"], defaultUnit: "cup", caloriesPerUnit: 0, macros: { protein: 0, carbs: 0, fat: 0 }, emoji: "💧" },
];

export function findFood(token: string): Food | undefined {
  const t = token.toLowerCase().trim();
  if (!t) return undefined;
  // exact alias match wins
  for (const f of FOODS) {
    if (f.aliases.some((a) => a === t)) return f;
  }
  // multi-word substring match — prefer longest alias
  let best: { food: Food; len: number } | undefined;
  for (const f of FOODS) {
    for (const a of f.aliases) {
      if (t.includes(a) && a.length > (best?.len ?? 0)) {
        best = { food: f, len: a.length };
      }
    }
  }
  return best?.food;
}
