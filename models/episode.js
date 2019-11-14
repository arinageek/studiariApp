var mongoose = require("mongoose");

var episodeSchema = new mongoose.Schema({
	name: String,
	link: String,
	subtitles: String,
	englishSub: {type: String, default: null},
	spanishSub: {type: String, default: null},
	russianSub: {type: String, default: null},
	germanSub: {type: String, default: null},
	frenchSub: {type: String, default: null},
	parent: {
		id:{
			type: mongoose.Schema.Types.ObjectId,
            ref: "Season"
		}
	}
});

module.exports = mongoose.model("Episode", episodeSchema);