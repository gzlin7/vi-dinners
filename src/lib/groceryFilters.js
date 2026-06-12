// Shopping list filters and grocery department classifier.
//
// Departments model one loop through the store: perimeter first (produce,
// meat, dairy, bakery), then the center aisles, so the list reads in
// shopping-walk order. All matching runs on the aggregator's normalized
// ingredient key (lowercased, singularized).

// Ingredients to omit entirely (assumed always on hand). Exact-name match —
// a substring match here would also delete real items like "Bell Pepper",
// "Sugar Snap Peas", or "Pepper Jack Cheese".
const alwaysHaveRegex =
  /^(?:unit |box )?(?:black |white |brown |kosher |sea )?(?:salt|pepper|sugar)$/;
export function shouldOmitIngredient(raw, key) {
  return raw.toLowerCase().includes("to taste") || alwaysHaveRegex.test(key);
}

// List of substrings probably already have
export const pantryFilterSubstring = [
  "oil", "butter", "cornstarch",
  "powder", "soy sauce", "garlic", "vinegar", "paprika", "baking", "honey",
  "bay lea", "thyme", "cumin", "basil", "ketchup", "mayonnaise",
  "rosemary", "oregano", "parsley"];

// Grocery departments. Array order = display order (one loop through the
// store). `priority` = match order, which must differ from display order so
// specific aisles claim items first (e.g. "mushroom stock" must hit Canned
// before "mushroom" hits Produce, "fish sauce" must hit Sauces before Meat,
// "corn tortilla" must hit Bakery before Produce).
export const groceryDeptFilters = [
  {
    name: "Produce",
    priority: 6,
    keywords: [
      "carrot", "onion", "celery", "radish", "apple", "mushroom", "shallot",
      "lime", "lemon", "orange", "tomato", "lettuce", "cabbage", "potato",
      "leek", "turnip", "asparagus", "broccoli", "cauliflower", "pea",
      "green bean", "spinach", "berry", "squash", "zucchini",
      // fresh herbs & aromatics
      "scallion", "green onion", "cilantro", "ginger", "chive", "dill",
      "mint", "tarragon", "sage", "lemongrass",
      // fresh chilis (bare "pepper" would steal Pepper Jack Cheese etc.)
      "jalapeño", "poblano", "serrano", "habanero", "shishito",
      "bell pepper", "chili pepper", "green pepper",
      // more veg & fruit
      "arugula", "avocado", "kale", "cucumber", "corn", "brussel",
      "parsnip", "bok choy", "fennel", "beet", "kiwi", "mango", "pineapple",
      "banana", "grape", "pear", "peach", "melon", "pomegranate", "romaine",
      "spring mix", "salad", "coleslaw", "edamame", "guacamole",
      "pico de gallo", "mixed green", "eggplant", "watercress", "collard",
      "artichoke", "bean",
    ],
  },
  {
    name: "Meat & Seafood",
    priority: 5,
    keywords: [
      "beef", "chicken", "pork", "sausage", "turkey", "lamb", "ham", "fish",
      "shrimp", "salmon", "bacon", "steak", "chuck", "brisket", "roast",
      "tilapia", "lobster", "cod", "branzino", "trout", "tuna", "sirloin",
      "fillet", "filet", "duck", "veal", "meatball", "pancetta",
      "prosciutto", "chorizo", "scallop", "crab", "mahi", "halibut",
      "catfish", "barramundi", "sole",
    ],
  },
  {
    name: "Dairy & Eggs",
    priority: 8,
    keywords: [
      "egg", "milk", "cream", "crema", "cheese", "yogurt", "half-and-half",
      "mozzarella", "feta", "parmesan", "cheddar", "ricotta", "gouda",
      "brie", "queso", "paneer", "halloumi", "tofu", "crème fraîche",
      "hummus",
    ],
  },
  {
    name: "Bakery & Bread",
    priority: 2,
    keywords: [
      "bun", "bread", "baguette", "flatbread", "pita", "ciabatta",
      "brioche", "tortilla", "naan", "roll", "croissant", "muffin",
    ],
  },
  {
    name: "Dry Goods & Pasta",
    priority: 7,
    keywords: [
      "rice", "pasta", "noodle", "shell", "vermicelli", "couscous",
      "quinoa", "farro", "orzo", "gnocchi", "spaghetti", "linguine",
      "penne", "fettuccine", "rigatoni", "tortellini", "ravioli",
      "macaroni", "ramen", "udon", "polenta", "grit", "oat", "lentil",
      "panko", "breadcrumb", "flour", "tempura",
      // nuts, seeds, dried fruit (baking/snack aisle)
      "almond", "walnut", "peanut", "pecan", "pistachio", "cashew",
      "pine nut", "pepita", "sesame seed", "dried apricot", "raisin",
      "dried cranberry", "bulgur", "wonton", "tagliatelle", "dried cherry",
      "coconut", "sunflower seed",
    ],
  },
  {
    name: "Canned & Jarred",
    priority: 1,
    keywords: [
      "can", "canned", "broth", "stock", "bouillon", "coconut milk",
      "black bean", "kidney bean", "cannellini", "chickpea", "refried",
      "crushed tomato", "diced tomato", "olive", "artichoke heart", "adobo",
    ],
  },
  {
    name: "Sauces & Condiments",
    priority: 3,
    keywords: [
      "sauce", "mustard", "sriracha", "pesto", "marinara", "jam", "jelly",
      "syrup", "glaze", "salsa", "miso", "paste", "pickle", "dressing",
      "vinaigrette", "gochujang", "tahini", "chutney", "relish", "caper",
      "mirin", "kimchi",
    ],
  },
  {
    name: "Spices & Seasonings",
    priority: 4,
    keywords: [
      "spice", "seasoning", "blend", "chili flake", "za'atar", "turmeric",
      "cayenne", "peppercorn", "cinnamon", "nutmeg", "allspice",
      "coriander", "zest", "extract", "herbe", "celery salt", "dukkah",
      "sumac",
    ],
  },
];

// Keywords match as whole words so "pea" can't claim "peanut" and "bread"
// can't claim "breadcrumb".
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const matchOrder = [...groceryDeptFilters]
  .sort((a, b) => a.priority - b.priority)
  .map((gf) => ({
    name: gf.name,
    matchers: gf.keywords.map((k) => new RegExp(`\\b${escapeRegex(k)}\\b`)),
  }));

export function classifyIngredient(key) {
  for (const dept of matchOrder) {
    if (dept.matchers.some((m) => m.test(key))) return dept.name;
  }
  return "Miscellaneous";
}

// Display order for rendering
export const groceryDeptOrder = [
  ...groceryDeptFilters.map((gf) => gf.name),
  "Miscellaneous",
];
