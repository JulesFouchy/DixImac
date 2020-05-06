const express = require('express')
const router = express.Router()
require('dotenv/config')

const MongoClient = require('mongodb').MongoClient
const client = new MongoClient(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
try {
    client.connect().then( (client) => {
        const db = client.db('diximac')
        db.collection('authors').find().toArray( (err, result) => {
            if (err) console.log(err)
            else {
                console.log(result);
            }
        })
    })
}
catch(err) {
    console.log('-----Error while connecting to database-----')
    console.log(err)
    console.log('-------------------------')
}

router.get('/cardSrc/:id', (req, res) => res.send(`Seen ${req.params.id}`))

module.exports = router