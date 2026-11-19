# Transparent Metric Specification: Recovery Intelligence Score
**MoveSafe Rehabilitation Engine | Team Preva**

## Definition & Clinical Scope
The **Recovery Intelligence Score** is a transparent, multi-factorial numerical metric from **0 to 100** that quantifies patient rehabilitation adherence, exercise biomechanical quality, exertion control, and physiological stability across a completed MoveSafe session.

> [!IMPORTANT]
> The Recovery Intelligence Score is an assistive progress and adherence indicator. It is **NOT** a clinical diagnostic metric, a medical outcome measurement, or a substitute for clinical evaluation by a licensed healthcare provider.

---

## Mathematical Formulation

$$\text{Recovery Intelligence Score} = \sum_{i=1}^{6} w_i \cdot S_i$$

Where weights $w_i$ sum to 100.0%:

| Component ($S_i$) | Weight ($w_i$) | Calculation Logic & Metric Formulation |
| :--- | :--- | :--- |
| **1. Plan Completion** | **25%** | $\min\left(1.0, \frac{\text{Valid Reps}}{\text{Target Prescribed Reps}}\right) \times 25$ |
| **2. Valid Rep Ratio** | **25%** | $\left(\frac{\text{Valid Reps Meeting Full ROM}}{\text{Total Reps Attempted}}\right) \times 25$ |
| **3. Form Quality** | **20%** | $\left(\frac{\text{Reps with Zero Biomechanical Faults}}{\text{Valid Reps Count}}\right) \times 20$ |
| **4. Tempo Control** | **10%** | $\left(\frac{\text{Reps executed within safe duration [1.8s - 7.0s]}}{\text{Valid Reps Count}}\right) \times 10$ |
| **5. Effort within Limits**| **10%** | Full 10 pts if Borg RPE $\le$ prescribed ceiling (e.g. $\le 14$); 5 pts if $\le \text{ceiling}+2$; 0 pts if exceeded. |
| **6. Vitals Stability** | **10%** | Full 10 pts if zero safe-pauses triggered and vitals remained within limits; 5 pts for 1 pause; 0 pts for multiple pauses. |

---

## Interpretive Qualitative Bands

- **85.0 – 100.0**: *Excellent Adherence* — High range of motion completion, steady controlled cadence, and stable vitals.
- **70.0 – 84.9**: *Good Progress* — Solid rehabilitation performance with minor form guidance or tempo adjustments.
- **50.0 – 69.9**: *Moderate / Needs Guidance* — High fault rate, incomplete extensions, or elevated perceived exertion.
- **< 50.0**: *Incomplete / High Fault Rate* — Premature session stop, multiple safe pauses, or significant range of motion restrictions.
