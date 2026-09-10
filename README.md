# Astra page recreation

Unofficial educational recreation of [OpenAI’s GPT-6 Astra launch page](https://openai.com/index/gpt-6-astra/). This demo is not affiliated with or endorsed by OpenAI.

Interactive particle scenes, benchmark charts, tabs, video demonstrations, document viewers, image enlargement, navigation, and mobile layouts. Outbound links point to the original destinations.

Article text, benchmark data, branding, and media belong to their respective owners. Third-party libraries retain their own licenses. This static demo does not collect sign-in information or submit user data. Cookie preferences are saved locally; embedded third-party media are provided by their original hosts.

The hero follows the reference’s five authored spiral paths. The hero is fully formed on the first frame, including after reset. Stars continually flow inward and fade across recycled endpoints, while the center rotates and pointer movement displaces individual stars. The canvas rendering approximates the original bloom and respects reduced-motion preferences.

Run the animation regression checks with `node --test tests/starfield.test.cjs`.

## Compare the iterations

The live root is the latest version, including the instant spiral startup fix. Historical pages preserve the actual site code at each earlier handoff:

- [1: Initial recreation](https://t4ji.github.io/astra-page-recreation/1/) - `b02447a0`, September 10, 2026, 12:16 PDT.
- [2: Pointer correction](https://t4ji.github.io/astra-page-recreation/2/) - `975f9c58`, 12:28 PDT.
- [3: Motion and visual correction](https://t4ji.github.io/astra-page-recreation/3/) - `f8d31cda`, 12:45 PDT.
- [Latest](https://t4ji.github.io/astra-page-recreation/) - starts directly in the moving spiral.

The earlier pages intentionally retain their earlier behavior, including startup animations and missing interactions. Their navigation overlay and asset paths are the only presentation changes. See each version's provenance file for its exact revision.

The first-frame regression check reproduces the previous failure, then compares the actual renderer's first draw against the formed spiral at desktop, mobile, and retrospective-preview dimensions. Existing checks cover pointer recovery, reduced motion, continuous flow, recycling, and long-running stability. Run all checks with `node --test tests/*.test.cjs`.
