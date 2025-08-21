This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Routing Conventions

This project uses Spanish for its primary URL routes to maintain consistency across the user-facing application (e.g., `/registro`, `/carrito`, `/perfil`).

To ensure a good user experience and for SEO purposes, common English-language equivalents are permanently redirected (301) to their Spanish counterparts. For example:

- `/register` redirects to `/registro`

This convention is enforced via redirects in `next.config.mjs`. Please adhere to this pattern when creating new pages.

## UI and Styling Conventions

### Navbar-Hero Gap

To ensure the sticky navbar does not obscure content, a global top padding is applied to the `<main>` element in `src/app/layout.js`. This can create a visual gap on pages where a component should appear directly beneath the navbar, such as the homepage hero.

To resolve this, a negative top margin (e.g., `-mt-16 sm:-mt-20`) is applied to the specific component that needs to close the gap. This counteracts the global padding locally without affecting other pages. An example of this fix can be found in `src/components/Hero.js`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
// cambio de prueba
