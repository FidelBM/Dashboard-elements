# Supply Chain Review Intelligence

V1 scaffold for a machine learning review analysis application for supply chain customer feedback.

This repository is initialized as a small monorepo:

- `apps/web`: Next.js frontend and application API routes.
- `services/ml-api`: FastAPI service for ML analysis endpoints.
- `prisma`: Prisma schema and database files.
- `docs`: Product and technical documentation.
- `scripts`: Utility scripts.

The product source of truth is `docs/especificacion_app_ml_resenas_supply_chain_v1.md`.

## Stack

- Frontend: Next.js
- ML/API service: FastAPI
- Database: PostgreSQL
- ORM: Prisma
- Containers: Docker Compose

## Local Development

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- Next.js on `http://localhost:3000`
- FastAPI ML API on `http://localhost:8000`

3. Check health endpoints:

- Web: http://localhost:3000/api/health
- ML API: http://localhost:8000/model-health
- ML API docs: http://localhost:8000/docs

4. Open the frontend:

```bash
http://localhost:3000
```

The landing page confirms that the frontend is running and that `NEXT_PUBLIC_ML_API_URL` and `DATABASE_URL` are configured.

## Functional Demo

The Docker web container prepares the demo database on startup with Prisma `db push` and seed data:

```bash
docker compose up --build
```

Then open `http://localhost:3000/login` and use the role selector to enter as:

- `Customer Success`: operational dashboard, manual prediction, upload, follow-ups, critical clients and exports.
- `Analista / Calidad`: model quality, upload errors and official human corrections.
- `Dirección Comercial`: read-only executive dashboards and reports.
- `Administrador`: full access, audit log and user management.

Demo assets:

- Guided script: `docs/demo_script_v1.md`
- Upload sample: `docs/sample_upload_reviews.csv`

Recommended demo flow:

1. Login by role.
2. Run a manual prediction with critical cancellation text and high NPS.
3. Upload `docs/sample_upload_reviews.csv`.
4. Review processed results and detail panel.
5. Open critical clients and create or update a follow-up.
6. Login as Analyst/Quality and register a human correction.
7. Login as Commercial Direction and show executive reports.
8. Login as Admin to show audit log and export results.

## Services

| Service | Port | Purpose |
|---|---:|---|
| `web` | 3000 | Next.js frontend |
| `ml-api` | 8000 | FastAPI ML service |
| `db` | 5432 | PostgreSQL database |

## Prototype Login

The Next.js app includes a simple cookie-based prototype login at `http://localhost:3000/login`.

Available demo roles:

- `ADMIN`: access to all placeholder views.
- `CUSTOMER_SUCCESS`: dashboard, upload reviews, manual entry, processed reviews, critical clients, follow-ups, and exports.
- `ANALYST_QUALITY`: dashboard, processed reviews, human corrections, upload history, upload errors, and model quality.
- `COMMERCIAL_DIRECTION`: read-only dashboard and reports.

This is only a local V1 routing foundation. Real password handling and production authentication are not implemented yet.

## ML API

The FastAPI service exposes the V1 analysis endpoints:

- `GET /model-health`
- `POST /predict`
- `POST /batch-predict`
- `POST /validate-file`
- `POST /recommendation`

Recommendations and explanations are generated in Spanish. The response field `prediction_source` identifies whether the result came from `rule_based_fallback`, `trained_model`, or `hybrid_model_rules`.

## Initial ML Training

The initial risk training workflow lives in `services/ml-api/training/train_risk_model.py`. It loads CSV or Excel review history, maps original classifications to `HIGH`, `MEDIUM`, `LOW`, or `MANUAL_REVIEW`, compares Logistic Regression, Linear SVM, and Random Forest, and saves the best joblib model by prioritizing recall for `HIGH` risk.

```bash
python services/ml-api/training/train_risk_model.py --input data/resenas_historicas.xlsx --output-dir services/ml-api/models
```

Training outputs include the fitted model, fitted feature pipeline, metadata, JSON metrics, and a Markdown evaluation report. See `services/ml-api/README.md` for loading instructions and the V1 modeling note: this is an operational risk estimator based on available signals, not a definitive churn predictor unless validated churn labels are available.

## Database

Prisma schema and seed files live in `prisma/`. Run Prisma commands from the repository root:

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

For host-run Prisma commands, `DATABASE_URL` should point to `localhost`, as shown in `.env.example`. Docker Compose injects an internal `db` hostname URL into the containers automatically.

Useful commands:

```bash
npm run db:studio
```

The seed creates the four V1 roles, demo users for each role, demo clients, demo reviews, and demo predictions for those reviews. Demo passwords are placeholders only; authentication is not implemented yet.

## Current Scope

This V1 prototype includes role-based routing, CSV/Excel upload, manual review entry, prediction execution, dashboards by role, follow-up tracking, human corrections, audit logging, exports, and the initial ML training/loading path. Authentication is still prototype cookie-based and should be hardened before any production use.

## Environment Variables

The required local variables are defined in `.env.example`:

- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `NEXT_PUBLIC_ML_API_URL`
- `ML_API_PORT`
- `USE_EXTERNAL_AI_RECOMMENDATIONS`
