# Sessions

Booking platform for independent barbers. UI comes from [`@sessions/design-system`](https://github.com/hazmatic94/Sessions-Design-System).

Clone that repo next to this one, then install it and copy the icons into `public/assets`:

```bash
npm install ../Sessions-Design-System
cp -R node_modules/@sessions/design-system/assets ./public/assets
```

Open the home shell:

```bash
npm run dev
```

That serves the top nav and left rail at `http://127.0.0.1:43123`. The page background is black900.

Components are imported from the package source, for example:

```js
import { renderSessionsButton } from "@sessions/design-system/src/components/button/index.js";
```
