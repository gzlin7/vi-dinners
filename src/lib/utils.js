// Shopping list filters

// List of substrings to completely omit
export const hardFilterSubstring = ["to taste", "water", "salt", "pepper", "sugar", "flour"];
// List of substrings probably already have
export const pantryFilterSubstring = [
  "oil", "butter", "cornstarch",
  "powder", "soy sauce", "garlic", "vinegar", "paprika", "baking", "honey",
  "bay lea", "thyme", "cumin", "basil", "ketchup", "mayonnaise",
  "rosemary", "oregano", "parsley"];
// Measure words
// TODO: for parse (best effort) subject for alpha sorting within list
// determine subject to be token after the measure word
export const measureFilterSubstring = [
  "spoon", "cup", "ounce", "oz", "pound", "cube", "slice", "piece", "bunch", "head"
]

// Grocery Dept. separators
export const groceryDeptFilters = [
  { name: "Canned Goods", keywords: ["can ", "canned", "cans ", "broth"], },
  {
    name: "Meat", keywords: ["beef", "chicken", "pork", "sausage", "turkey", "lamb",
      "ham", "fish", "shrimp", "salmon", "bacon", "steak", "chuck", "brisket", "roast",
      "tilapia", "lobster", "cod", "branzino", "trout", "tuna", "sirloin", "fillet", "filet"]
  },
  {
    name: "Produce", keywords: ["carrot", "onion", "celery", "radish",
      "apple", "mushroom", "shallot", "lime", "lemon", "orange", "tomato",
      "lettuce", "cabbage", "potato", "leek", "turnip", "bell", "asparagus",
      "broccoli", "cauliflower", "peas", "beans", "spinach", "green", "berr",
      "squash", "zucc"
    ]
  },
  { name: "Dry Grains", keywords: ["rice", "pasta", "noodle", "shell", "tortilla", "vermicelli"] },
  { name: "Dairy", keywords: ["egg", "milk", "cream", "cheese", "yogurt", "half-and-half"] }
];
