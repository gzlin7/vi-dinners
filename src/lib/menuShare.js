// Shareable menu links: the selected recipes + portions encode into the URL
// fragment, which never hits the server — so a static GitHub Pages site can
// reproduce any menu from a link. IDs are the first 8 hex chars of each
// recipe's HelloFresh ObjectId (verified unique across the deduped catalog).

const ID_LEN = 8;

export const recipeId = (recipe) =>
  recipe.canonical_url.match(/([0-9a-f]{24})$/)[1].slice(0, ID_LEN);

export function buildMenuUrl(selectedRecipes, portions) {
  const ids = selectedRecipes.filter(Boolean).map(recipeId).join(".");
  const hash = `#m=${ids}&p=${portions}`;
  return { url: `${location.origin}${location.pathname}${hash}`, hash };
}

// Returns { recipes, portions } if the current URL carries a menu, else null
export function parseMenuHash(allRecipes) {
  const m = location.hash.match(/m=([0-9a-f.]+)/);
  if (!m) return null;
  const byId = new Map(allRecipes.map((r) => [recipeId(r), r]));
  const recipes = m[1]
    .split(".")
    .map((id) => byId.get(id))
    .filter(Boolean);
  if (recipes.length === 0) return null;
  const p = location.hash.match(/p=(\d+)/);
  const portions = p ? Math.min(6, Math.max(2, parseInt(p[1]))) : 2;
  return { recipes, portions };
}
