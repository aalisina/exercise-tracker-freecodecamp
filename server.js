require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')


mongoose.connect(process.env.MONGO_URI, ()=> {
  console.log('Connected to DB!')
})

const exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String,
})

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

const Exercise = mongoose.model('Exercise', exerciseSchema)
const User = mongoose.model('User', userSchema)

app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users',  async (req, res) => {
  const { body } = req
  const newUser = new User(body)
  try {
  const savedUser = await newUser.save()
  res.json(savedUser)
  } catch (error) {
    res.status(500).send(error)
  }
})

app.get('/api/users', async (_, res)=> {
    try {
        const users = await User.find()
        res.json(users)

    } catch(error) {
        console.error(error)
    }
})

app.post('/api/users/:id/exercises',  async (req, res)=> {

  const { body } = req;
  const { id } = req.params

  let date;

 if (!body.date) {
   date = new Date().toDateString();
 } else {
   date = new Date(body.date).toDateString()
 }
  
  try {
      const user = await User.findById(id)
      user.log.push({
        "description": body.description, 
        "duration": parseInt(body.duration), 
        "date": date,
        })
        
    user.save()
    const resObj = {      
      "username": user.username,
      "description": body.description, 
      "duration": parseInt(body.duration), 
      "_id": id,
      "date": date,
    }
    console.log(resObj)
    res.json(resObj)
  } catch(error) {
    res.json({"message": error})
  }
  
})
  
  

app.get('/api/users/:id/logs', async (req, res)=> {

  const { id } = req.params
  let { from, to, limit } = req.query;

  // if no from, to and limit code
  if (!limit && !to && !from) {
    try {
      const user = await User.findById(id)

      const resObj = {
        "username": user.username,
        "count": user.log.length,
        "_id": "user._id",
        "log": user.log
      }
      res.json(resObj)
      
    } catch(error) {
      res.send(error)
    }
    
    // else if there is a from, to, limit
  } else {
        
    
    if(!from) {
    from = new Date(1800-01-01)
  } else {
    from = new Date(from)
  }
    if(!to) {
    to = new Date(3000-01-01)
  } else {
    to = new Date(to)
  }
    if(!limit) {
    limit = 99999
    } else {
      limit = parseInt(limit)
    }

  
  try {
  const user = await User.findById(id) 
    
  const arrayTransformer = (obj) => {
    let date = new Date(obj.date)
    return {
      "date": date,
      "description": obj.description,
      "duration": obj.duration
    }
  }
  const filteredArrayOfLogs = user.log.map( (object) => {
   return arrayTransformer(object)
  })

  const filteredByDates = filteredArrayOfLogs.map( (element) => {
    return (element.date <= to && element.date >= from)
  })

  const finalArray = filteredByDates.slice(0, limit)
  console.log(finalArray)
                               
  const resObj = {  
  "count": user.log.length,
  "username": user.username,
    "_id": user._id,
  "log": finalArray
  }
    
    res.json(resObj)
    
  } catch(err) {
    console.error(err)
    res.json({message: err})
  }
  }
  

  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
