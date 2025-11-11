FROM node:20-alpine AS build
WORKDIR /app

# Enable corepack and pnpm
RUN corepack enable

# Install deps with pnpm (use lockfile for reproducibility)
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

ARG BASE_PATH=/
ENV BASE_PATH=${BASE_PATH}
ARG VITE_API_URL
ARG VITE_PINATA_JWT
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PINATA_JWT=${VITE_PINATA_JWT}
RUN pnpm build -- --base=${BASE_PATH}

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
