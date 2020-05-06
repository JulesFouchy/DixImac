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
                            const seed = 0
                            const scriptStr = `
                                fill(255, 0, 0)
                                ellipse(200, 200, 100, 100)
                            `
                            res.send(`
                                <script src="https://cdn.jsdelivr.net/npm/p5@1.0.0/lib/p5.js"></script>
                                <script>
                                function setup() {
                                    createCanvas(500, 750)
                                    background(0)
                                    randomSeed(${seed})
                                    ${scriptStr}
                                
                                    const oCanvas = document.getElementById("defaultCanvas0")
                                    const data = oCanvas.toDataURL("image/png")
                                    oCanvas.remove()
                                    document.body.innerHTML = data
                                }
                                </script>
                            `)
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