import { createApp } from '../src/app';
import { pool } from '../src/config/db';

export default createApp(pool);
