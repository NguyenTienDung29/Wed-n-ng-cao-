const mongoose = require('mongoose');
const MyConstants = require('./MyConstants');
console.log('MyConstants: ', MyConstants);

const uri = 'mongodb+srv://' + MyConstants.DB_USER + ':' + MyConstants.DB_PASS + '@' + MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE;
console.log('uri: ', uri);

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to ' + MyConstants.DB_SERVER + '/' + MyConstants.DB_DATABASE);
  })
  .catch((err) => {
    console.error(err);
  });