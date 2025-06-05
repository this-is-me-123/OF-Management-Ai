import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import rateLimit from 'express-rate-limit';

const app = express();
app.set('trust proxy', 1); // Trust first proxy
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use('/api', apiLimiter); // Apply the rate limiting middleware to API calls only
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));