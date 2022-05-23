const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');

const requireToken = async (req, res, next) => {
  try{
  const userInfo = await User.byToken(req.headers.authorization);
  req.user = userInfo;
  next();
  }
  catch (err) {
    next(err)
  }
}

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

app.get('/api/users/:id/notes', requireToken, async(req, res, next)=> {
  try {

    if (req.user.dataValues.id == req.params.id){
      const notes = await Note.findAll({where: {
        userId: req.params.id
      }})
    res.send(notes)
  }
  }
  catch(ex){
    next(ex);
  }
});

module.exports = app;
