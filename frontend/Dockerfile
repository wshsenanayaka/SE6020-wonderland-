FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# The local Kubernetes ingress exposes the API on this host. Cognito settings
# are intentionally omitted so Minikube uses the application's legacy local auth.
ENV VITE_API_BASE_URL=http://api.wonderland.local
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
