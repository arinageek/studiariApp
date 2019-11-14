var mongoose = require("mongoose");

var movieSchema = new mongoose.Schema({
	title: String,
    image: String,
    description: String,
	language: String,
	link: String,
	subtitles: String,
	englishSub: {type: String, default: null},
	spanishSub: {type: String, default: null},
	russianSub: {type: String, default: null},
	germanSub: {type: String, default: null},
	frenchSub: {type: String, default: null}
});

module.exports = mongoose.model("Movie", movieSchema);