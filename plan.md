1. **Add new real estate scraper sites**
   - Implemented `src/sites/projetoimoveisfranca.ts` correctly parsing standard elements like `.recent-properties-box`, `title`, `price` and handling area/rooms properly, added to `src/sites/index.ts`.
   - Implemented `src/sites/imoveisremap.ts` correctly parsing using `application/ld+json` to get Kenlo-based property info smoothly, and added to `src/sites/index.ts`.
   - Ensure the new modules pass standard Jest tests (`imoveisremap-projetoimoveis.test.ts`).
2. **Improve UI Experience & Usage**
   - The user asked to enhance tool use and experience. We'll update the global "Clear filters" in `FilterSidebar` button style. Making the `X` icon red using standard tailwind utilities.
   - Run tests.
3. **Pre-commit actions**
   - Complete pre-commit steps to make sure proper testing, verifications, reviews and reflections are done.
4. **Submit changes**
   - Push code with proper commit message.
