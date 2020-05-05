const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('dotenv/config')

mongoose.connect(
    process.env.DB_CONNECTION,
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    () => console.log('Connected to DB !')
)

router.get('/cardSrc/:id', (req, res) => res.send(`Seen ${req.params.id}`))

module.exports = router