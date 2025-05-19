# Next.js + PostgreSQL + C# Integration

This project generates C# entities and CQRS pattern classes from any PostgreSQL table for backend projects. It provides a rapid development capability for backend service development in .NET Core using modern technologies.

## Features

- Next.js 13+ with App Router
- PostgreSQL database integration
- Generate C# codes for backend
- Dockerized development environment
- Font optimization with [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)


## Getting Started

First, run the development server:

configure .env file
````
> touch .env
> echo -e "DATABASE_URL=postgres://username:password@localhost:5432/postgre\nNEXT_PUBLIC_NAMESPACE=Taz.Services" >> .env
````

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


## Docker installation

Define your postgresql connection in 
# .env file
````
DATABASE_URL=postgres://username:password@localhost:5432/postgre
NEXT_PUBLIC_NAMESPACE=Taz.Services
````
# docker-compose.yml file
````
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://username:password@localhost:5432/postgre
    restart: unless-stopped
````
```
> docker-compose build --no-cache
> docker-compose up -d
```
