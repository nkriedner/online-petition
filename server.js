// Import express, express-handlebars and database functions:
const express = require("express");
const app = express();
const hb = require("express-handlebars");
const {
    registerUser,
    createSignerProfile,
    getSignerInfosToEdit,
    updateUsersMainInfos,
    updateUsersPassword,
    updateUsersProfile,
    findUser,
    signPetition,
    getSignersNames,
    getSignersNamesByCity,
    getSignature,
    findSignature,
    deleteSignature,
} = require("./db"); // (destructured)

// Import module for setting session-cookies:
const cookieSession = require("cookie-session");
let cookieSecret;
if (process.env.COOKIE_SECRET) {
    cookieSecret = process.env.COOKIE_SECRET;
} else {
    cookieSecret = require("./secrets.json").COOKIE_SECRET;
}

// const secrets = require("./secrets.json");
// const COOKIE_SECRET = secrets.COOKIE_SECRET;

// Module with methods for password security:
const { hash, compare } = require("./utils/bc");

// Module to prevent CSRF attacks:
const csurf = require("csurf");

app.use(
    cookieSession({
        // secret: COOKIE_SECRET,
        secret: cookieSecret,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

// To use the csrf preventing module (this MUST come after cookieSession):
app.use(csurf());

app.use(function (req, res, next) {
    // this prevents clicking jacking
    res.setHeader("x-frame-options", "deny");

    // this creates the csrfToken and makes it available to all of our templates
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Set up handlebars:
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(express.static("views/images")); // to make images from this folder display

// Serve static files from the public directory:
app.use(express.static("public"));

// Middleware to check if there's userId in cookie session and redirect to login page if not
// app.use((req, res, next) => {
//     const urls = ["/profile", "/petition", "/thanks", "/signers"];
//     if (urls.includes(req.url) && !req.session.userId) {
//         return res.redirect("/login");
//     }
//     next();
// });

// Home Route (working)
app.get("/", (req, res) => {
    console.log("GET request to / route");
    console.log("req.session: ", req.session);
    // Check if the user is logged in AND the petion was signed:
    if (req.session.userId && req.session.signatureId) {
        console.log("redirecting to -> thanks route");
        res.redirect("/thanks");
        // else if the user is logged in BUT petition is not signed:
    } else if (req.session.userId) {
        console.log("redirecting to -> petition route");
        res.redirect("/petition");
        // else send to register/login:
    } else {
        console.log("redirecting to -> register route");
        res.redirect("/register");
    }
});

// Register GET Route:
app.get("/register", (req, res) => {
    console.log("GET request to /register route");
    console.log("req.session: ", req.session);
    // Check if the user is logged in AND the petion was signed:
    if (req.session.userId && req.session.signatureId) {
        console.log("redirecting to -> thanks route");
        res.redirect("/thanks");
        // else if the user is logged in BUT petition is not signed:
    } else if (req.session.userId) {
        console.log("redirecting to -> petition route");
        res.redirect("/petition");
        // else send to register/login:
    } else {
        console.log("presenting -> registration page");
        res.render("registration");
    }
});

// Register POST Route:
app.post("/register", (req, res) => {
    console.log("POST request to /register route");
    // Hash password (note: password_hash is the raw password input):
    hash(req.body.password_hash).then((hashed_password) => {
        console.log("hashing the password input to: ", hashed_password);
        // Insert submitted data into users table in database:
        console.log("inserting the data into the database...");
        registerUser(
            req.body.first_name,
            req.body.last_name,
            req.body.email_address,
            hashed_password
        )
            .then((result) => {
                // Set a session cookie with the userId:
                req.session.userId = result.rows[0].id;
                console.log("setting a session cookie for userId");
                console.log("req.session: ", req.session);
                console.log("redirecting to -> profile route");
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("error on /registration route:", err);
                res.render("registration", {
                    error:
                        "There was something wrong with your registration. Please try again!",
                });
            });
    });
});

// Login GET Route:
app.get("/login", (req, res) => {
    console.log("GET request to /login route");
    console.log("req.session: ", req.session);
    // Check if the user is logged in AND the petion was signed:
    if (req.session.userId && req.session.signatureId) {
        console.log("redirecting to -> thanks route");
        res.redirect("/thanks");
        // else if the user is logged in BUT petition is not signed:
    } else if (req.session.userId) {
        console.log("redirecting to -> petition route");
        res.redirect("/petition");
        // else send to register/login:
    } else {
        console.log("presenting -> login page");
        res.render("login");
    }
});

// Login POST Route:
app.post("/login", (req, res) => {
    console.log("POST request to /login route");
    // Find the user in the database:
    findUser(req.body.email_address)
        .then((result) => {
            // console.log("result.rows:", result.rows);
            // Check if a user exists for tis email - if there is none (0):
            if (result.rows.length === 0) {
                return res.render("login", {
                    userNonExisting:
                        "Sorry, but there is no user registered for this email-address. ",
                });
            }
            // If there is a user with the email -> compare the entered password with the db password:
            compare(req.body.password_hash, result.rows[0].password_hash).then(
                (match) => {
                    // console.log("match for password: ", match);
                    // If password is correct:
                    if (match) {
                        // Set a session cookie with the userId:
                        console.log("setting a session cookie for userId");
                        req.session.userId = result.rows[0].id;
                        // Make a db request to check if there is a signature for the id
                        findSignature(req.session.userId).then((sigResult) => {
                            // if there is no signature for that user_id:
                            if (sigResult.rows.length === 0) {
                                console.log("redirecting to -> petition route");
                                res.redirect("/petition");
                            } else {
                                // -> if then set sig id + redirect to thanks page
                                // (??? not sure if i can use this from above)
                                req.session.signatureId = result.rows[0].id;
                                console.log(
                                    "setting a session cookie for signatureId:",
                                    req.session.signatureId
                                );
                                res.redirect("/thanks");
                            }
                        });
                    } else {
                        // If password is incorrect:
                        res.render("login", {
                            wrongPassword:
                                "Sorry, but that password is incorrect. Try again!",
                        });
                    }
                }
            );
        })
        .catch((err) => {
            console.log("error on /login route:", err);
            res.render("login", {
                loginError:
                    "There was something wrong with your login. Please try again!",
            });
        });
});

// Logout Route
app.get("/logout", (req, res) => {
    console.log("get request to /logout route");
    console.log("req.session: ", req.session);
    console.log("deleting session cookies...");
    req.session.signatureId = null;
    req.session.userId = null;
    res.redirect("/");
});

// Profile GET Route:
app.get("/profile", (req, res) => {
    console.log("get request to /profile route.");
    res.render("profile");
});

// Profile POST Route:
app.post("/profile", (req, res) => {
    console.log("POST request to profile route.");
    // console.log(req.body);
    console.log("req.session: ", req.session);
    createSignerProfile(
        req.session.userId,
        req.body.age,
        req.body.city,
        req.body.home_page
    )
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("profile route error: ", err);
            res.render("profile", {
                errorInProfile:
                    "Unfortunately something went wrong here. Please try again!",
            });
        });
    // res.send("profile post end");
});

// Profile Edit GET Route:
app.get("/profile/edit", (req, res) => {
    console.log("get request to /profile/edit route.");
    console.log("req.session.userId: ", req.session.userId);
    // res.render("edit");
    getSignerInfosToEdit(req.session.userId).then((result) => {
        // console.log(result.rows);
        res.render("edit", {
            userInfos: result.rows,
        });
    });
});

app.post("/profile/edit", (req, res) => {
    console.log("POST request to /profile/edit route.");
    console.log("updated password length:", req.body.password_hash.length);
    if (req.body.password_hash.length > 0) {
        console.log("password will be updated");
        hash(req.body.password_hash).then((hashed_password) => {
            console.log("hashed_password: ", hashed_password);
            Promise.all([
                updateUsersMainInfos(
                    req.body.first_name,
                    req.body.last_name,
                    req.body.email_address,
                    req.session.userId
                ),
                updateUsersPassword(hashed_password, req.session.userId),
                updateUsersProfile(
                    req.body.age,
                    req.body.city,
                    req.body.url,
                    req.session.userId
                ),
            ]).then(() => {
                // res.send("POST request to /profile/edit route successful.");
                res.redirect("/thanks");
            });
        });
    } else {
        console.log("no update for password");
        Promise.all([
            updateUsersMainInfos(
                req.body.first_name,
                req.body.last_name,
                req.body.email_address,
                req.session.userId
            ),
            updateUsersProfile(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            ),
        ]).then(() => {
            // res.send("POST request to /profile/edit route successful.");
            res.redirect("/thanks");
        });
    }
});

// Thanks Route:
app.get("/thanks", (req, res) => {
    console.log("get request to /thanks route");
    console.log("req.session: ", req.session);
    // console.log("req.session.signatureId:", req.session.signatureId);
    // Check if user has signed yet (if not redirect to /petition route):
    if (!req.session.signatureId) {
        res.redirect("/");
    } else {
        // if he has signed send to /thanks route:
        //      -> get the signature from database
        getSignature(req.session.userId).then((result) => {
            // getSignature(req.session.signatureId).then((result) => {
            // console.log("result.rows[0]:", result.rows[0]);
            const { signature } = result.rows[0];
            //  -> render the /thanks page with an image of the signature
            res.render("thanks", {
                signature: signature,
            });
        });
    }
});

// Thanks POST Route for deleting signature:
app.post("/thanks", (req, res) => {
    console.log("POST request to /thanks route to delete signature");
    console.log("signatureId: ", req.session.signatureId);
    console.log("userId: ", req.session.userId);
    deleteSignature(req.session.userId).then(() => {
        req.session.signatureId = null;
        res.redirect("/petition");
        // res.send("POST request to /thanks route to delete signature");
    });
});

// Petition GET Route:
app.get("/petition", (req, res) => {
    console.log("get request to /petition route");
    console.log("req.session: ", req.session);

    getSignature(req.session.userId);

    // Check if the petition was signed (if it was redirect to /thanks route):
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        // If petition was not signed yet:
        res.render("petition");
    }
});

// Petition POST Route (for when the user submits their signature):
app.post("/petition", (req, res) => {
    console.log("POST request on /petitiion was made!");
    // Insert submitted data into signatures table in database:
    // console.log("req.body.signature:", req.body.signature);
    signPetition(req.session.userId, req.body.signature)
        .then((result) => {
            // console.log("result.rows[0]:", result.rows[0]);
            // Set sesscon cookie to remember that user has signed and redirect to /thanks route:
            const { id } = result.rows[0];
            req.session.signatureId = id;
            console.log(
                "req.session.signatureId set to: ",
                req.session.signatureId
            );
            res.redirect("/thanks");
        })
        // TASK -> if the db insert fails (i.e. your promise from the db query gets rejected),
        // rerender petition.handlebars and pass an indication that there should be an error message
        // shown to the template.
        .catch((err) => {
            console.log(err);
            res.render("petition", {
                error:
                    "Ooops, looks like you haven't signed correctly. Please try again!",
            }); // TASK: Add error message to petition route in this case
        });
});

// Signers Route:
app.get("/signers", (req, res) => {
    console.log("get request to /signers route");
    // Check if user has signed yet (if not redirect to /petition route):
    if (!req.session.signatureId) {
        res.redirect("/register");
    }
    // Get the data of the people who signed:
    getSignersNames(req.session.userId).then((result) => {
        // console.log("result.rows: ", result.rows);
        res.render("signers", {
            signers: result.rows,
        });
    });
});

// Signers City Route:
app.get("/signers/:city", (req, res) => {
    console.log("get request to: ", req.params.city);
    getSignersNamesByCity(req.params.city).then((result) => {
        res.render("signers", {
            signers: result.rows,
            chosenCity: req.params.city,
        });
    });
    // res.send(`get request to: ${req.params.city}`);
});

app.listen(process.env.PORT || 8080, () => {
    console.log("petition up and running on port 8080");
});
