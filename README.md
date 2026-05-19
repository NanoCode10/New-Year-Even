# NanoCode10 Countdown

Landing interactiva hecha con React, TypeScript y Vite para mostrar una cuenta regresiva a Ano Nuevo con una mascota central, modo oscuro/claro, sonido opcional y una presentacion responsive.

## Demo del proyecto

- Cuenta regresiva en tiempo real.
- Toggle de tema `dark / light` con persistencia en `localStorage`.
- Toggle de sonido con persistencia en `localStorage`.
- Hero responsive para desktop y mobile.
- Modo claro con estilo mas limpio, inspirado en layouts tipo OpenClaw.
- Deploy listo para GitHub Pages.

## Stack

- React 18
- TypeScript
- Vite
- CSS custom

## Scripts disponibles

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm lint
```

## Desarrollo local

1. Instala dependencias:

```bash
pnpm install
```

2. Levanta el entorno local:

```bash
pnpm dev
```

3. Abre la URL que muestra Vite, normalmente:

```bash
http://localhost:5173
```

## Build de produccion

```bash
pnpm build
```

El resultado se genera en la carpeta `dist/`.

## Deploy

El proyecto ya tiene scripts para publicar en GitHub Pages:

```bash
pnpm deploy
```

Antes del primer deploy, revisa que el valor de `homepage` en [package.json](C:\Users\Marianoa\Desktop\New-Year-Even-main\package.json) coincida con la URL final del repositorio publicado.

## Estructura principal

```text
src/
  components/
    NewYear.tsx
    SecondsBoom.tsx
  hooks/
    useCountdown.ts
  utils/
    date.ts
  App.tsx
  App.css
```

## Notas

- El tema visual se guarda con la clave `newyear-theme`.
- El estado del sonido se guarda con la clave `newyear-sound`.
- El proyecto usa `pnpm` fijado desde `packageManager` en `package.json`.
- Si vas a subirlo a un repo nuevo, todavia falta inicializar Git en esta carpeta.
