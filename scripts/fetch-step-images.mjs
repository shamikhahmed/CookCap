/**
 * DISABLED — Foodish / LoremFlickr category guesses produced wrong step photos
 * (latte→cupcake, bread→dosa, gulab→samosa, etc).
 *
 * Use instead:
 *   node scripts/rematch-step-images.mjs
 *
 * To hide a dish's step photos: omit its key from
 * `src/lib/recipes/step-images.generated.json` and delete
 * `public/recipes/steps/<id>-*.webp`.
 */
console.error(
  'fetch-step-images.mjs is disabled.\nUse: node scripts/rematch-step-images.mjs',
);
process.exit(1);
