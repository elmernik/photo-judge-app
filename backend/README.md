# 📚 Photography Competition Judge — Backend API Usage & Architecture

Once the server is running, the interactive API documentation is available at:

* `http://127.0.0.1:8000/docs`

The API is organized into logical groups via FastAPI tags, corresponding to router modules in `app/api/routers/`.

---

## 🧭 Project Structure

The backend follows a modular, service-oriented design for clarity and maintainability.

```
app/
├── api/          # API layer (routing, dependencies)
│   ├── deps.py
│   └── routers/
│       ├── judging.py
│       ├── management.py
│       └── images.py
│
├── core/         # Global configuration and startup logic
│   ├── config.py
│   └── startup.py
│
├── crud/         # Data access (CRUD operations)
│   └── crud.py
│
├── db/           # Database schema and session handling
│   ├── database.py
│   ├── models.py
│   └── schemas.py
│
├── services/     # Business logic layer
│   ├── judging_service.py
│   └── guideline_service.py
│
└── main.py       # FastAPI app entrypoint
```

---

## 📁 Directory Overview

### `main.py`

Initializes the FastAPI application, includes all routers, and configures middleware. It serves as the central entrypoint.

### `api/`

Contains the API layer:

* **`routers/`**: Defines API endpoints using `APIRouter`:

  * `judging.py`: Endpoints for evaluating images.
  * `management.py`: Endpoints for managing competitions, criteria, and prompts.
  * `images.py`: Endpoints for image upload and retrieval.
* **`deps.py`**: Common dependencies (e.g., `get_db` for DB session injection).

### `services/`

Implements core business logic, invoked by routers:

* `judging_service.py`: Handles image analysis and scoring logic.
* `guideline_service.py`: Generates competition guidelines using external AI services (e.g., Tavily, Gemini).

### `core/`

Global configuration:

* `config.py`: Loads environment variables and settings via Pydantic.
* `startup.py`: Startup routines, such as database seeding.

### `crud/`

Encapsulates direct database operations:

* `crud.py`: Defines functions for data manipulation (Create, Read, Update, Delete).

### `db/`

Manages the database schema and connectivity:

* `models.py`: SQLAlchemy models defining the database schema.
* `schemas.py`: Pydantic schemas for request/response validation.
* `database.py`: SQLAlchemy engine and session setup.

---
