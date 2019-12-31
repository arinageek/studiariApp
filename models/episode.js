var mongoose = require("mongoose");

var episodeSchema = new mongoose.Schema({
	name: String,
	link: String,
	subtitles: String,
	russianSub: {type: String, default: null},
	parent: {
		id:{
			type: mongoose.Schema.Types.ObjectId,
            ref: "Season"
		}
	}
});

module.exports = mongoose.model("Episode", episodeSchema);