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

var userSchema = new Schema({
	name : String,
	email : {type: String, unique: true},
	password : String
});

userSchema.set('toJSON', { transform: function (doc, ret, options) {
	delete ret.__v;
	delete ret.password;
}});

var Session = mongoose.model('Session', sessionSchema);
var User = mongoose.model('User', userSchema);

exports.Session = Session;
exports.User = User;
exports.UUID = createUUID;