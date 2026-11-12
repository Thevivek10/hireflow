# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# The pages choose their API base from NODE_ENV: "production" points at the
# hosted Render backend, anything else uses a relative /api that nginx proxies
# to the backend container. Building with "development" keeps the Docker stack
# self-contained (see nginx.conf for the matching /api/api rewrite).
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
