# Run the development servers for both backend and frontend
dev:
	@echo "Starting backend server on http://localhost:8000"; \
	trap 'kill $$BE_PID' EXIT; \
	backend/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend & \
	BE_PID=$$!; \
	echo "Starting frontend dev server on http://localhost:5173"; \
	cd frontend && npm run dev

# A simplified run command for demonstration
run: dev

# Clean up generated files
clean:
	@echo "Cleaning up..."
	rm -rf backend/venv
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf frontend
