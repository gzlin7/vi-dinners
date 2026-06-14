# 🍲 Mise en Cart 🛒

*A week of dinners in one grocery run.*

Mise en Cart rolls a menu of dinner recipes and compiles a single,
department-organized grocery list for the whole menu — taking the hassle out of
deciding what to cook and cutting down trips to the store.

## Features

- **Over 800 curated recipes** from my favorite recipe sites.
- **Roll a menu** of 1–6 recipes, shopping for 2–6 servings.
- **Reduce leftovers** — picks bias toward recipes that share high-waste-risk
  ingredients, so less food goes to waste.
- **Reroll** the whole menu, **swap** a single recipe, or **lock** the ones you
  want to keep before rerolling the rest.
- **Consolidated grocery list** grouped by store department, with quantities
  scaled to your serving count and pantry staples flagged separately.
- **Leftover forecast** showing what — and how much — you'll have left over.
- **Share a menu** via a link that reproduces the exact same recipes and servings.

## How "Reduce leftovers" works

With **Reduce leftovers** on, rerolls don't pick uniformly at random. Each
candidate recipe is scored against what's already in the cart (your locked
recipes plus the ones picked so far) to consolidate shopping without making the
menu monotonous, then chosen by weighted-random sampling. The score combines:

- **Waste-weighted ingredient sharing.** Sharing an ingredient earns credit
  proportional to how much of a typical store package goes unused *and* how fast
  it spoils. Sharing a bunch of cilantro (bought whole for a teaspoon, dead in
  days) is worth far more than sharing chicken (you buy about what you need, and
  it keeps).
- **Marginal leftover forecast.** For ingredients with known package sizes, the
  score uses the actual change in leftover mass from adding a recipe: reusing an
  already-open package scores positive, while forcing a new perishable package
  scores negative — the same objective shown in the leftover forecast.
- **Variety penalties.** Repeated protein or cuisine is penalized, so the menu
  stays varied even as the cart consolidates.
- **Rating nudge.** Higher-rated recipes get a small boost.
- **Softmax sampling.** Rather than always taking the top score (which would
  make every reroll identical), picks are sampled from a softmax over scores —
  so you get fresh menus each reroll while still favoring low-waste combinations.

Turn **Reduce leftovers** off for plain uniform-random picks.

## Tech

React + Vite, styled with Tailwind CSS. Built and deployed as a static site
from `docs/`.

## Contributing a recipe

TODO
