import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { PAYLOAD_LIMIT } from './constants.js'


const app = express()

// Middlerwares
app.use(express.json({limit: PAYLOAD_LIMIT}))
app.use(express.urlencoded({extended: true, limit: PAYLOAD_LIMIT}))
app.use(express.static('public'))
app.use(cookieParser())
app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials: true
}))

export default app