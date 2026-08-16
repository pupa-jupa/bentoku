# Porcelain toolbar implementation plan

1. Generate three approved transparent raster sources: normal pill, active pill, and round icon
   button. Inspect alpha, symmetry, crop margins, and match between the three files.
2. Copy approved PNG sources into `art/user-assets/ui/`, build lossless runtime WebP files, and
   add registry entries so the preload scene loads them.
3. Replace the top-button Graphics background with an image-backed component while preserving
   live text, callbacks, tutorial permissions, hover/press feedback, and a Graphics fallback.
4. Change the localized Settings title to `Settings` / `Настройки` and update stale README copy.
5. Add or adjust tests for registry assets and settings copy, then run the complete verification
   suite and capture final browser screenshots.
6. Commit and push the verified implementation, deploy it to the linked Vercel production
   project, and open the stable site for review.
