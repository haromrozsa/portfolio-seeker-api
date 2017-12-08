const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forumSchema = new Schema({
  name: String,
  url: String,
  data: String,
  createdate: Date,
  updatedate: Date,
  updated: Boolean
});

//Create the model class
var Forum = mongoose.model('Forum', forumSchema);

//Export the model
module.exports = Forum;
