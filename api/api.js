const express = require('express')
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

router.get('/cards', (req, res) => {
    dbRequest( db => {
        db.collection('cards').find({}).toArray( (err, result) => {
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

router.get('/cards/:id', (req, res) => {
    dbRequest( db => {
        db.collection('cards').findOne({"_id": ObjectId(req.params.id)}, (err, card) => {
            if (err) {
                console.log('ERR')
                res.json(err)
            }
            else {
                if (card) {
                    res.send(card)
                }
                else {
                    res.send('No card with such id found !')
                }
            }
        })
    })
})

router.get('/cardRenderInfo/:id', (req, res) => {
    dbRequest( db => {
        db.collection('cards').findOne({"_id": ObjectId(req.params.id)}, (err, card) => {
            if (err) {
                console.log('ERR')
                res.json(err)
            }
            else {
                if (card) {
                    res.json({
                        url: webCardsLocation + '/' + card.fileFolder + '/' + card.fileName,
                        generationMethod: card.generationMethod,
                    })
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