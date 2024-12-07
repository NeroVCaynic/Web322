/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: Abdullah Student ID: 148680234 Date: 7th Dec, 2024
*
* Published URL: https://web322-kohl.vercel.app/
*
********************************************************************************/

const countryData = require("./modules/country-service");
const authData = require("./modules/auth-service");
const path = require("path");
const clientSessions = require("client-sessions");
const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

// app.use(express.static('public')); // causing tailwindCSS not working on vercel.com
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: "session",
    secret: "abdullah5",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get("/register", (req, res) => {

  res.render("register");
});

app.post("/register", (req, res) => {

  authData.registerUser(req.body).then(() => {

      res.render("register", { successMessage: "User created" });
    }).catch((err) => {

      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.get("/login", (req, res) => {

  res.render("login");
});

app.post("/login", (req, res) => {
  
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body).then((user) => {

      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };

      res.redirect("/countries");
    }).catch((err) => {

      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/logout", (req, res) => {

  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  
  res.render("userHistory", { user: req.session.user });
});

app.get("/countries", async (req,res)=>{

  let countries = [];
  try {
    if(req.query.region){
      countries = await countryData.getCountriesByRegion(req.query.region);
    } else if(req.query.subRegion) {
      countries = await countryData.getCountriesBySubRegion(req.query.subRegion);
    } else {
      countries = await countryData.getAllCountries();
    }

    res.render("countries", {countries})
  }catch(err){
    res.status(404).render("404", {message: err});
  }

});

app.get("/countries/:id", async (req,res)=>{
  
  try{
    let country = await countryData.getCountryById(req.params.id);
    // res.send(country);
    res.render("country", {country})
  }catch(err){
    console.log(" err:",  err)
    res.status(404).render("404", {message: err});
  }
});

// Route to render the Add Country form
app.get('/addCountry', ensureLogin, async (req, res) => {
  try {
    const subRegions = await countryData.getAllSubRegions()
    res.render('addCountry', { subRegions });
  } catch (err) {
    res.status(500).render('500', { message: "Unable to load SubRegions" });
  }
});

// Route to handle form submission
app.post('/addCountry', ensureLogin, async (req, res) => {
  const data = req.body;
  data.landlocked = data.landlocked ? true : false;

  try {
    await countryData.addCountry(data);
    res.redirect('/countries');
  } catch (err) {
    res.status(500).render('500', { message: "Unable to add country" });
  }
});

app.get('/editCountry/:id', ensureLogin, async (req, res) => {
  try {
    const dataC = await countryData.getCountryById(req.params.id);
    const dataSB = await countryData.getAllSubRegions();

    res.render('editCountry', { country: dataC, subRegions: dataSB });
    
  } catch (err) {
    res.status(404).render('404', { message: err });
  }
});

app.post('/editCountry', ensureLogin, async (req, res) => {
  const data = req.body;
  data.landlocked = data.landlocked ? true : false;

  try {
    await countryData.editCountry(req.body.id, data);
    
    res.redirect('/countries');
  } catch (err) {
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get('/deleteCountry/:id', ensureLogin, async (req, res) => {
  try {
    await countryData.deleteCountry(req.params.id);
    
    res.redirect('/countries');
  } catch (err) {
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

app.use((req, res, next) => {
  res.status(500).render("500", {message: `I'm sorry, but we have encountered the following error: ${err}`});
});

countryData.initialize().then(authData.initialize).then(() => {

  app.listen(HTTP_PORT, () => { console.log(`Server is running on port ${HTTP_PORT}`); });
}).catch((err) => {

  console.error(`Unable to start server: ${err}`);
});