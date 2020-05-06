const express = require('express')
const router = express.Router()
require('dotenv/config')

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const client = new MongoClient(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })

const dbRequest = (req) => {
    try {
        client.connect().then( (client) => {
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

dbRequest( db => {
    db.collection('authors').find().toArray( (err, result) => {
        if (err) console.log(err)
        else {
            console.log(result);
        }
    })
})

router.get('/cardSrc/:id', (req, res) => {
    dbRequest( db => {
        db.collection('cards').findOne({"_id": ObjectId(req.params.id)}, (err, result) => {
            if (err) {
                console.log('ERR')
                res.send(err)
            }
            else {
                res.send(result)
            }
        })
    })
})

module.exports = router