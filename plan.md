1. **Add `moraremfranca.com.br` Site Scraper:**
   - I will create `src/sites/moraremfranca.ts` with a boilerplate scraper template to fulfill the user's request to add more real estate sites (despite the fact that it resolves poorly within the container).
   - I will update `src/sites/index.ts` to include `moraremfranca`.
   - I will verify these changes with `npx tsc -p tsconfig.json`.

2. **Enhance User Experience in `client/src/Home.tsx`:**
   - I will modify `client/src/Home.tsx` by using `replace_with_git_merge_diff` to remove the redundant `motion.div` wrapper around the `<EmptyState />` component since `<EmptyState />` already has its own internal motion animation. The current implementation creates an unnecessary nested animation wrapper, leading to disjointed behavior.
   - I will also refine the framer motion page entry transition in the main container of `Home.tsx` by adding `exit={{ opacity: 0 }}`.

3. **Verify Frontend UI Compilation:**
   - I will execute `cd client && npm run build` to verify the React changes compile without error.
   - I will execute `npm run test` on the backend to ensure the scraper tests pass.

4. **Complete Pre Commit Steps:**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit Changes:**
   - Once all verifications pass, submit the change using a descriptive commit message.
