import dotenv from 'dotenv'

import connectDB from "./db/index.js";

// dotenv configuration in module type
dotenv.config({
  path:'./env'
})

connectDB()