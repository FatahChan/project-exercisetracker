const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

require('dotenv').config()


//https://stackoverflow.com/questions/11526504/minimum-and-maximum-date
const maxDate = new Date(8640000000000)
const minDate = new Date(0);


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}


const UserSchema = new mongoose.Schema({
  username: {type: String, unique: true, required: true},
  count: {type: Number},
  log: [{
    description: {type: String},
    duration: {type:Number, min: 1},
    date: {type: Date}
  }]
});
const User = new mongoose.model('Users', UserSchema);

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/users', (req, res) =>{
  console.log('here');
  const usernameReq = req.body.username;
  User.findOne({username: usernameReq}, (err, data) =>{
    if(err) console.log(err);
    if(data){
      res.json({username: data.username, _id: data._id})
    }else{
      User.create({username: usernameReq}, (err) => {
        if(err) console.log();
        User.findOne({username: usernameReq, count: 0}, (err, data) => {
          if (err) console.log(err);
          if (data) {
            res.json({username: data.username, _id: data._id})
          }
        })
      });
    }
  });
});

app.post('/api/users/:_id/exercises', (req, res)=>{
  const _idReq = req.params._id;
  const descriptionReq = req.body.description;
  const durationReq = Number(req.body.duration);
  const dateReq = new Date(req.body.date);
  //https://stackoverflow.com/questions/41501939/how-to-update-a-array-value-in-mongoose
  User.findByIdAndUpdate(_idReq,
      {
          "$push": {"log":
                { "description": descriptionReq,
                  "duration": durationReq,
                  "date": dateReq
                }},
          "$inc": {"count": 1}
      },
      {"new": true},
      (err, data) =>{
        if(err) console.log(err);
        res.json({
          "_id": data._id,
          "username": data.username,
          "date": dateReq.toDateString(),
          "duration": durationReq,
          "description": descriptionReq
        });
      }
  );
});


app.get('/api/users/:_id/logs', (req, res) =>{
  //https://stackoverflow.com/questions/11973304/mongodb-mongoose-querying-at-a-specific-date
  const _idReq = req.params._id;
  const fromReq = req.query.from || minDate;
  const toReq = req.query.to || maxDate;
  const limitReq = req.query.limit;

  const filter = {
    _id: _idReq,
  }
  User.findById(_idReq).exec((err, data)=>{
      if(err) console.log(err);
      let logs = [];
      for (let i = 0; i < data.log.length; i++){

        if(data.log[i].date >= fromReq && data.log[i].date <= toReq){
          const log = {
            description: data.log[i].description,
            duration: data.log[i].duration,
            date: data.log[i].date.toDateString()
          }
          logs.push(log);
        }
      }

      res.json({
            username: data.username,
            count: data.count,
            _id: data._id,
            log: logs
          }
      )
    }
  )
});











const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
