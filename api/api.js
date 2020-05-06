const express = require('express')
const router = express.Router()
require('dotenv/config')

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const client = new MongoClient(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }).connect()

const dbRequest = (req) => {
    try {
        client.then( (client) => {
            const db = client.db('diximac')
            req(db)
        })
    }
    catch(err) {
        console.log('-----Error while connecting to database-----')
        console.log(err)
        console.log('-------------------------')
    }
}

router.get('/cardSrc/:id', (req, res) => {
    dbRequest( db => {
        db.collection('cards').findOne({"_id": ObjectId(req.params.id)}, (err, result) => {
            if (err) {
                console.log('ERR')
                res.json(err)
            }
            else {
                res.json(result)
            }
        })
    })
})

router.get('/authors', (req, res) => {
    dbRequest( db => {
        db.collection('authors').find({}).toArray( (err, result) => {
            if (err) {
                console.log('ERR')
                res.json(err)
            }
            else {
                res.json(result)
            }
        })
    })
})

module.exports = router