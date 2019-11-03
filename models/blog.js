var mongoose = require("mongoose");
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    description: String,
	language: String,
    seasons: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Season"
        }
    ]
});

module.exports = mongoose.model("Blog", blogSchema);