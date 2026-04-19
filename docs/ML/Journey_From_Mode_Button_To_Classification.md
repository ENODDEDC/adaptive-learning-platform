# What happens after someone picks a learning mode

This note follows **one learner** from the moment they **choose a learning mode** (for example from the mode buttons while viewing material) all the way to the point where the system has **successfully applied machine learning** to shape their learning preference—using plain language only.

---

## 1. The choice registers on the device

When the learner turns a mode **on**, the app starts a simple stopwatch for that mode and notes that this mode was opened. If they had another mode open before, the app first closes out that previous mode in the same way (so the story stays one mode at a time).

A first packet of information can be sent right away so the learner’s totals are not stuck only in the browser.

---

## 2. Very quick “peek and leave” visits are softened

If the learner leaves a mode almost immediately, the app treats that like noise: it **does not** treat it as a serious time block for that mode. That way, random tapping does not look like deep study.

---

## 3. Meaningful time and actions add up

When the learner stays long enough, the app adds **how long** they were in that mode.  

Inside the mode, ordinary study actions (switching tabs, moving through steps, writing a reflection, exploring a concept, and similar) are counted as **extra engagement**, not just “the mode was open.” Those richer signals matter later when the system judges whether the picture of the learner is trustworthy.

---

## 4. Packets are sent to the learner’s account on the server

While they study, the app bundles small lists of events and the **running snapshot** of their session (modes used, times, assistant use, engagement counters). It sends these to the platform while they are **signed in**.  

Sending happens when enough events pile up, on a timer, or when something important happens (for example using the floating assistant).

---

## 5. The server stores the visit and updates the long-term picture

Each delivery is tied to the same **study session** for that browser visit. The server saves (or refreshes) one behavior record per session.

Then it updates the learner’s **long-term profile totals**. Importantly, it only adds the **new change** since the last save for that session, so the same session snapshot does not inflate counts over and over.

It also notes **which calendar day** this activity belonged to, and keeps a short rolling memory of recent study days. That helps later when judging whether habits look spread out or crammed into a single day.

---

## 6. The server refreshes simple “shape” scores for that session

From time spent in opposite pairs of modes (active vs reflective, hands-on vs conceptual, visual vs narrator-style, step-by-step vs big-picture), the server derives **rough balance scores** for that saved behavior. Those are supporting context; the big decision still leans on the running totals and the learning-style step below.

---

## 7. The “is there enough trustworthy signal?” check

After every update, the server looks at the learner’s **running totals**: how many mode opens and assistant actions, total time, spread across modes, depth-style engagement, whether patterns look like idle clicking, and whether activity appears on **more than one day** when that matters.

Together with **how many** interactions have been collected, the system decides if the evidence is strong enough to **allow** an automatic learning-style update at this moment. If the milestone is reached but the signal still looks weak or shallow, the automatic step **waits**.

---

## 8. The milestone gate for automatic learning-style updates

Automatic learning-style refresh is tied to **interaction milestones** (for example around fifty interactions, then higher steps, then regular steps).  

Only when both the **milestone** and the **trustworthiness** check above agree will the system try to refresh the learner’s style automatically.

---

## 9. Machine learning vs backup rules

When the gate opens, the system builds a **compact summary** of the learner’s patterns from the long-term totals.

- If the **external learning-style service** is healthy and answers, that answer drives the new style dimensions, confidence, and recommended modes.  
- If that service is unavailable or does not return a usable answer, the platform uses its **built-in rule-based** path instead, still producing dimensions and recommendations.

Either way, the result is written onto the learner’s **learning style profile** (including when it was last updated and how many automatic passes have run).

---

## 10. What the learner sees: provisional first, final when the bar is higher

After a successful automatic pass, the profile holds real scores and recommendations, but the UI treats the label as **provisional** until a **higher bar** is met: the system wants strong model confidence, healthy variety across modes, sensible cross-day behavior, and patterns that do not look like empty clicking—**all together**.

When that stricter check passes, the same profile is treated as **final** in settings and in viewers that respect that distinction. Until then, the learner still gets guidance, but it is clearly framed as an early read.

---

## 11. How to read this as one story

**Tap a mode → time and actions accumulate → honest totals update on the server → at special interaction levels the system asks “is this good evidence?” → if yes, it asks the learning engine (or falls back to rules) → saves style and tips → the interface shows provisional or final based on how trustworthy the combination looks.**

That is the full path from **one learning mode button** to **machine learning successfully shaping learning preference** (with sensible waiting and fallbacks along the way).
