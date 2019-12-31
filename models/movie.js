var mongoose = require("mongoose");

var movieSchema = new mongoose.Schema({
	title: String,
    image: String,
    description: String,
	language: String,
	link: String,
	subtitles: String,
	russianSub: {type: String, default: null}
});

module.exports = mongoose.model("Movie", movieSchema);