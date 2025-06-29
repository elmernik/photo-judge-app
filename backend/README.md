

# 📚 Nature Photography Competition Judge API API Usage & Documentation

Once the server is running, you can access the interactive API documentation to explore and test all available endpoints:

* **Swagger UI:** `http://127.0.0.1:8000/docs`
* **ReDoc:** `http://127.0.0.1:8000/redoc`

The API is organized into logical groups (tags) which correspond to the router files in `app/api/routers/`.

---

## 📂 Project Structure & Code Guide

The project follows a modular, service-oriented structure to separate concerns and improve maintainability. Here’s a guide to where you can find key functionality:


app/
├── api/          # API Layer: Endpoints & Dependencies
│   ├── deps.py
│   └── routers/
│       ├── judging.py
│       ├── management.py
│       └── images.py
│
├── core/         # Core Application Logic
│   ├── config.py
│   └── startup.py
│
├── crud/         # Database Operations
│   └── crud.py
│
├── db/           # Database Setup
│   ├── database.py
│   ├── models.py
│   └── schemas.py
│
├── services/     # Business Logic
│   ├── ai_services.py
│   └── judging_service.py
│
└── main.py       # Application Entrypoint


### Directory Breakdown

* **`main.py`**: The main entrypoint that initializes the FastAPI application, sets up middleware, and includes the API routers. It's kept intentionally lean.

* **`api/`**: This package contains all the API-specific code.
    * **`routers/`**: Each file (`judging.py`, `management.py`) defines a set of related API endpoints using `APIRouter`. This is where you'll find the path operations (`@router.post`, `@router.get`, etc.).
    * **`deps.py`**: Holds common API dependencies, like the `get_db` function used for dependency injection.

* **`services/`**: This is where the core business logic lives. The API routers call functions in this layer to perform the actual work.
    * **`judging_service.py`**: Contains the logic for processing and evaluating an image.
    * **`guideline_service.py`**: Handles generating competition guidelines via Tavily and Google Gemini.

* **`core/`**: Contains application-wide configuration and startup logic.
    * **`config.py`**: Manages environment variables and application settings using Pydantic.
    * **`startup.py`**: Contains logic that runs on application startup, such as seeding the database with initial data.

* **`crud/`**: The data access layer.
    * **`crud.py`**: Contains all functions for interacting directly with the database (Create, Read, Update, Delete). These functions are called by the API and service layers.

* **`db/`**: Contains everything related to the database schema and connection.
    * **`models.py`**: Defines the SQLAlchemy database models (the tables).
    * **`schemas.py`**: Defines the Pydantic schemas used for data validation, request bodies, and API responses.
    * **`database.py`**: Manages the database engine and session creation.
