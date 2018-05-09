var mongoose = require("mongoose");

var LogSchema = mongoose.Schema({
    date: Date,
    query: Object,
});

mongoose.model("Log", LogSchema);

module.exports = mongoose.model("Log");