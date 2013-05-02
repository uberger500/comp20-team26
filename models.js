var mongoose = require('mongoose');

var createUUID = function() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = new Array(36);
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
};

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var sessionSchema = new Schema({
    user : ObjectId, // User object ID
    token : String
});

var scoreSchema = new Schema({
    user : ObjectId, // User object ID
    game_title: String,
    score: Number,
    created_at: {type: Date, default: new Date()}
});

var userSchema = new Schema({
	name : String,
	email : {type: String, unique: true},
	password : String, // bcrypt
    flights: {type: [String], default: []},
    total_flights: {type: Number, default: 0},
    total_miles: {type: Number, default: 0},
    average_speed: {type: Number, default: 0},
    average_altitude: {type: Number, default: 0},
    all_speeds: {type: [Number], default: [0]},
    all_altitudes: {type: [Number], default: [0]},
    number_of_states: {type: Number, default: 0},
    states: {type:[String], default: []}
});

userSchema.set('toJSON', { transform: function (doc, ret, options) {
	delete ret.__v;
	delete ret.password;
}});

var Session = mongoose.model('Session', sessionSchema);
var Score = mongoose.model('Score', scoreSchema);
var User = mongoose.model('User', userSchema);

exports.Session = Session;
exports.Score = Score;
exports.User = User;
exports.UUID = createUUID;