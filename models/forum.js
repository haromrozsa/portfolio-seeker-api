const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forumSchema = new Schema({
  name: String,
  data: String,
  date: Date,
  updated: Boolean
});

//Create the model class
var Forum = mongoose.model('Forum', forumSchema);

//Export the model
module.exports = Forum;
