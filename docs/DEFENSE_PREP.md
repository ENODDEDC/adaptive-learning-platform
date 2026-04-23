# Intelevo — How Panelists Will Determine If the System Is Reliable

## 1. ML Model Metrics (the numbers they'll ask for)

Chapter 2 defines exactly what metrics matter:

- **Accuracy** — does the model correctly classify the learning style?
- **Precision** — of all students classified as "Visual", how many actually are?
- **Recall** — of all actual Visual learners, how many did the model catch?
- **F1 Score** — balance of both precision and recall
- **R² Score** — how well the model explains the variance in learning style scores

The studies cited in Chapter 2 set the benchmark. Ikawati et al. got 89.8%, Baihaqi et al. got 99%, Ayyoub & Al-Kadi got 99.06%. Panelists will compare your numbers against these.

Your target per the code: 96%+ R².

---

## 2. Validation Method

Chapter 2 specifically covers K-Fold Cross Validation. Panelists will ask:

- Did you just test on the same data you trained on? (bad)
- Did you use proper train/val/test split or K-Fold? (good)

Your `train_models_improved.py` uses 5-fold GridSearchCV — that's a strong answer.

---

## 3. Data Quality

Chapter 2 mentions the eye-tracking study (Bittner et al., 2023 — 116 real participants). Panelists will ask:

- Is your training data synthetic only? (weak)
- Does it include real behavioral data? (strong)

Your improved model uses real eye-tracking data + synthetic, with zero circular logic — that's your strongest defense point.

---

## 4. FURPS Evaluation

Chapter 3 mentions FURPS (Functionality, Usability, Reliability, Performance, Supportability) with a 5-point Likert scale. Panelists will look at:

- Does the system actually adapt content based on detected learning style?
- Do users feel the personalization is accurate?
- Does the system perform consistently?

---

## 5. Pre-test / Post-test

Chapter 3 also mentions this. Panelists may ask:

- Did students perform better after using the adaptive system vs without it?
- Does the AI-generated content actually improve comprehension?

---

## Bottom line — what panelists will likely ask:

- "What is your model's accuracy/F1/R² score?"
- "How did you validate it — did you use cross-validation?"
- "Was your training data real or synthetic?"
- "How do you know the learning style classification is correct?"
- "What happens if the ML service is down?" ← your rule-based fallback answers this

Be ready with the actual numbers from your trained models. That's what makes or breaks the defense.
