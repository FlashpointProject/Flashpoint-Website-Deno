FROM denoland/deno:2.9.8@sha256:a0d88a7fcbd44f062cba2748e19df67d30290ad12aa203c7c1e0b12462c483f0
WORKDIR /app
# Copy manifests first so the dependency install layer caches across
# source-only edits
COPY deno.json deno.lock ./
RUN deno ci --prod --skip-types
# Then copy the rest of the source
COPY . .
# Same permissions as `deno task start` in deno.json
CMD ["deno", "run", "--allow-read", "--allow-write", "--allow-net", "--allow-sys", "--allow-ffi", "main.js"]
