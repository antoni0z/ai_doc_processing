expose-envs:
	$(eval include .env)

dev: expose-envs
	node --experimental-sqlite ./server.js & \
	(cd app/ai && uv run fastapi run --reload --port 8000) \
	& wait

clean-db:
	rm app/app.db app/app.db-shm app/app.db-wal
