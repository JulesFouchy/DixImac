const express = require('express')
const router = express.Router()
// const mongoose = require('mongoose')
// const MongoClient = require('mongodb').MongoClient
require('dotenv/config')

// const mongojs = require('mongojs')
// const db = mongojs('mongodb+srv://DixImacGallery:<7QCkysdfEJ4LhU1p>@diximac-sr3ed.mongodb.net/test?retryWrites=true&w=majority', ['authors'])

// console.log(db.authors.find( (err, docs) => {
//     if(err) throw err
//     console.log('success !')
//     console.log(docs)
// }))


const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect().then((client)=>{
    const db = client.db('diximac')
    db.collection('authors').find().toArray( (err, result) => {
        if (err) {
            console.log('----------err-----------')
            console.log(err)
        }
        else {
            console.log(result);
        }
    })
})
// client.connect(err => {
//     if (err) {
//         console.log('----------err-----------')
//         console.log(err)
//     }
//     else {
//         const collection = client.db("diximac").collection("authors")
//         //console.log(collection.find())
//         console.log('dsf')
//         collection.find({}, (err, docs) => {
//             docs.each( (err, doc) => {
//                 console.log(doc)
//             })
//         })
//     }
//     // perform actions on the collection object
//     client.close();
// });


// mongoose.connect(
//     process.env.DB_CONNECTION,
//     { 
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     },
//     () => console.log('Connected to DB !')
// )


// const MongoClient = require('mongodb').MongoClient
// const uri = "mongodb+srv://DixImacGallery:7QCkysdfEJ4LhU1p@diximac-sr3ed.gcp.mongodb.net/test?retryWrites=true&w=majority"
// const client = new MongoClient(uri, { useNewUrlParser: true })
// client.connect(err => {
//     if (err) console.log(err)
//     console.log('helllo !')
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });




// const uri = process.env.DB_CONNECTION
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(err => {
// //   const collection = client.db("test").collection("devices");
//     if (err) throw err
//     console.log('Hellobvn!')
//   // perform actions on the collection object
//   client.close();
// });

router.get('/cardSrc/:id', (req, res) => res.send(`Seen ${req.params.id}`))

module.exports = router