# Cold Start Interest Tracking

## What It Is
A behavioral interest detection system for new users who have no learning style classification yet (cold start problem). It passively observes user behavior while reading the cold start preview panel and suggests a learning mode when genuine interest is detected.

## How It Works
1. User opens a PDF with no prior ML classification
2. System tracks behavioral signals in real-time (every 2 seconds)
3. Computes an interest score (0–1) per learning mode
4. When score ≥ 0.7, a callout/pointer appears pointing to the suggested learning mode button
5. Once user clicks a learning mode, ML tracking takes over

## Behavioral Signals Tracked
| Signal | Weight | Implementation |
|---|---|---|
| Dwell time | 30% | `totalTime` per mode |
| Scroll depth | 15% | `maxScrollDepth` |
| Return visits | 10% | `returnVisits` |
| Text selection | 10% | `textSelections` |
| Relative engagement | 15% | vs. average across modes |
| Mouse movement | 5% | `mouseMoveEvents` |
| Hover time | 5% | `mouseHoverTime` |
| Focus retention | 5% | window focus/blur |
| Deep engagement | 5% | combined high-value events |

## Research Basis
- **Mouse behavior as engagement indicator** — *Journal of Educational Computing Research, 2020* (ERIC EJ1241667): Uses mouse movement data to detect student engagement in online learning.
- **Behavioral trace data as learning engagement indicators** — *Frontiers in Psychology, 2024*: Validates scroll, time-on-task, and interaction traces as engagement signals in university e-learning.

> Note: Dwell time received the highest weight (30%) because literature consistently identifies it as the strongest single predictor of user interest. The remaining weights were distributed based on the relative importance of each signal as described in the Frontiers in Psychology (2024) study on behavioral trace data. The 0.7 threshold was set through observation and testing within this educational context — a standard practice in applied systems research when no domain-specific threshold exists in literature.

## Important Distinction
This system is **separate from the ML classifier**. The ML classification is driven by which learning modes the user clicks and how long they spend in them (`useLearningModeTracking`). The interest tracking is a cold start UX feature only.

## Why Interest Tracking Data Does NOT Go to ML
The interest tracking data stays client-side only and is never saved to the database or sent to the ML classifier. This is on purpose.

The interest tracking only watches the student passively reading the auto-generated preview content on the right side. The student did not choose that content — it was shown automatically. So we cannot use passive reading behavior to say "this is their learning style." Using it in the ML would give unreliable results.

The ML only uses data from when the student actually clicks and uses a learning mode — because that is when the student is making a real choice that reflects their true learning preference.

This is consistent with the distinction between **implicit feedback** (passive behavior) and **explicit feedback** (active choice) in recommender systems research — where explicit signals are recognized as more reliable for preference classification (Jawaheer et al., 2010; ACM RecSys).
