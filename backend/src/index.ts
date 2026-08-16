import { createApp } from './app.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const port = process.env.PORT ? Number(process.env.PORT) : 4010;

const app = createApp();

app.listen(port, () => {
  console.log(`checkpoint backend listening on port ${port}`);
});
