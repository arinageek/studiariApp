var mongoose = require("mongoose");

var seasonSchema = new mongoose.Schema({
    name: String,
	episodes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Episode"
        }
    ],
	parent: {
		id:{
			type: mongoose.Schema.Types.ObjectId,
            ref: "Blog"
		}
	}
	
});

module.exports = mongoose.model("Season", seasonSchema);