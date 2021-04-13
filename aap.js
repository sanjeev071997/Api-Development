const express = require("Express");
const path = require("path");
const aap = express();
const fs = require("fs");
const port = 8000;
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mydb', { useNewUrlParser: true, useUnifiedTopology: true });

aap.use(express.urlencoded());

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("we are connected")
});

const candidateSchema = new mongoose.Schema({
    name: String,
    email:{ 
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true,
        validate: {
            validator: async function(email) {
              const user = await this.constructor.findOne({ email });
              if(user) {
                if(this.id === user.id) {
                  return true;
                }
                return false;
              }
              return true;
            },
            message: props => 'The specified email address is already in use.'
          }
      }
});

const candidate = mongoose.model('candidate', candidateSchema);

aap.post('/candidate', (req, res) => {
    var myData = new candidate({name : req.body.name,email : req.body.email});
    myData.save().then(() => {
        db.collection('candidates').findOne({id : {$gte:req.body.id}}, function(err, doc){
            res.status(200).json(doc)
        });
    }).catch((error) => {
        res.status(404).json({'error' : error.message})
    });

});


const testSchema = new mongoose.Schema({
    id: String,
    test_round: String,
    score: String
});

const test = mongoose.model('test_score', testSchema);


aap.post('/update_test_scores', (req, res) => {
    // console.log(req.body)
    id = req.body.id
    test_round = req.body.test_round
    score = req.body.score
    
    db.collection('test_scores').updateOne({'id' : req.body.id}, {$set : {'score' : req.body.test_round, 'test_round' : req.body.score}}).then( () => {
        console.log('success')
        res.status(200).send('success')
    }).catch(()=> {
        res.status(402).send('error')
        console.log('error')
    });

});

aap.post('/insert_test_score', (req, res) => {
    if (req.body.score > 10){
        res.json({'error' : 'score can not more then 10'});
        return;
    }
    var myData = new test({id : req.body.id, test_round : req.body.test_round, score : req.body.score});
    myData.save().then(() => {
        db.collection('test_scores').findOne({id : {$gte:req.body.id}}, function(err, doc){
            res.status(200).send(doc)
        });
    }).catch((error) => {
        res.status(404).json({'error' : error.message})
});

});


aap.get('/high_score', (req, res) => {
    db.collection('test_scores').findOne({}, {sort : {score : -1}} , function(err, doc) {
    res.json(doc)
}); 
});

aap.listen(port, () => {
    console.log(`The application started successfully on port ${port}`)
});
