# Module M7 & M8: Headcount Forecasting & Automated Portion Planner

**Implemented:** Phase 1, Day 8  
**Author:** Sendhamil Selvan  
**Related Modules:** M3 (Meals & Menu Management), M4 (Student Check-in), M5 (Kitchen Operations Dashboard)

## 1. Overview
To eliminate kitchen guesswork before meal preparation, Day 8 introduces two integrated backend intelligence modules and connects them directly to the Kitchen Operations Dashboard:
- **Module M7 (Headcount Forecasting Engine):** Predicts the final dining headcount ($\hat{H}$), uncertainty range ($[\text{low}, \text{high}]$), and confidence score by combining live confirmed student check-ins with historical turnout estimation for non-responders.
- **Module M8 (Automated Portion Planner):** Parses per-person dish portion specifications (e.g., `"0.35 kg"`, `"2 pcs"`, `"0.15 L"`) from the scheduled meal and multiplies them against the predicted headcount and bounds to compute exact batch cooking quantities.

## 2. Mathematical Model (`baseline-v1`)
Let:
- $N$ = Total active students
- $E$ = Confirmed eating check-ins
- $S$ = Confirmed skipping check-ins
- $U = \max(0, N - (E + S))$ = Non-responders

### Non-Responder Turnout Estimation
1. **Baseline Prior ($P_{\text{prior}}$):**
   - Weekdays: Breakfast `0.60`, Lunch `0.75`, Dinner `0.70`
   - Weekends: Breakfast `0.40`, Lunch `0.50`, Dinner `0.45`
2. **Historical Blending:** Queries up to the last 14 past meals of the same `meal_type` to compute historical attendance rate $P_{\text{hist}}$. Blends $0.70 \cdot P_{\text{hist}} + 0.30 \cdot P_{\text{prior}}$.
3. **Predicted Headcount & Interval:**
   $$\hat{H} = E + \text{round}(U \times P_{\text{attend}})$$
   Margin of uncertainty scales with non-responders ($U$) and shrinks to 0 as response rate $\frac{E + S}{N} \to 100\%$:
   $$\text{confidence} = 0.50 + 0.50 \times \frac{E + S}{N}$$

## 3. API Endpoints
- `GET /api/forecast/{meal_id}` — Computes/retrieves the headcount forecast, non-responder breakdown, confidence score, and dish portion targets.
- `POST /api/forecast/{meal_id}/recalculate` — Forces recomputation from live student check-ins and persists an updated `Forecast` record.

## 4. Files Added & Updated
- `backend/app/models/forecast.py` — SQLAlchemy `Forecast` model (`forecasts` table).
- `backend/app/schemas/forecast.py` — `PortionTarget` and `ForecastOut` Pydantic schemas.
- `backend/app/services/forecast.py` — Forecasting algorithm and database persistence.
- `backend/app/services/portion_planner.py` — Regex portion parser and batch multiplier.
- `backend/app/api/forecast.py` — REST API endpoints.
- `backend/app/main.py` — Registered `forecast.router` under `/api`.
- `frontend/src/pages/KitchenPage.jsx` — Integrated Headcount Forecast & Smart Portion Plan panel with live Recalculate action.
- `backend/tests/test_forecast.py` & `backend/run_tests.py` — Unit and integration test suite.

## 5. Verification & Test Results
All **41 automated tests** in `backend/run_tests.py` passed (`41 PASSED, 0 FAILED`), covering:
- Portion string parsing (`kg`, `pcs`, `L`, fallback handling)
- Batch portion scaling across predicted, min, and max bounds
- Non-responder turnout estimation and confidence score scaling
- Live forecast recalculation when student check-ins update
- HTTP 404 validation for non-existent meal IDs
- Frontend Vite production build (`vite build` succeeded cleanly in 528ms)
