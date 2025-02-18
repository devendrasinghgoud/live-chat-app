const bcrypt = require("bcryptjs");

async function testHash() {
    const plainPassword = "123456"; // The password you are trying to login with
    const storedHash = "$2a$10$EyTCOtMEElWk6duJWYtVmeAxkPshIIqreFbj4/CKqj3kaT6ohAp9S"; // Your stored hash

    // Compare manually
    const isMatch = await bcrypt.compare(plainPassword, storedHash);
    console.log("Password Match Test:", isMatch);
}

testHash();
