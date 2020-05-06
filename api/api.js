const express = require('express')
const path = require('path')
const router = express.Router()
require('dotenv/config')
const cardRendering = require('../cardRendering')

const webCardsLocation = 'http://diximac.herokuapp.com/client/cards'

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
        db.collection('cards').findOne({"_id": ObjectId(req.params.id)}, (err, card) => {
            if (err) {
                console.log('ERR')
                res.json(err)
            }
            else {
                if (card) {
                    switch (card.generationMethod) {
                        case 0:
                            res.send(path.join(webCardsLocation, card.fileFolder, card.fileName))
                        break
                        case 1:
                            res.json(card)
                        break
                        case 2:
                            res.json(card)
                        break
                    }
                }
                else {
                    res.send('No card with such id found !')
                }
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