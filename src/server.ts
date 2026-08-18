import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { pool } from './config/db';

const PORT = Number(process.env.PORT) || 3000;

const app = createApp(pool);

app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});
