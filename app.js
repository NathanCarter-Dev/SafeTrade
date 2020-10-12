const express = require("express")
const app = express();
const mongoose = require("mongoose")
const methodOverride = require("method-override")
const expressSession = require("express-session");
const passport = require("passport")
const localStrategy = require("passport-local")
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const Grid = require("gridfs-stream")
const bodyParser = require("body-parser")
// DB

app.use(methodOverride("_method"));
app.use(express.static("./public"))
app.use(express.static("./models"))
app.use(bodyParser.json());

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(expressSession({
  secret: "Once again Coco wins cutest dog!",
  resave: false,
  saveUninitialized: false
}))
// connection
 mongoose.connect("mongodb://localhost/safepay", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// init gfs
let gfs;
mongoose.connection.once("open", () => {
  // init stream
  gfs = Grid(mongoose.connection.db, mongoose.mongo) 
  
  gfs.collection('uploads')
});

// Storage
const storage = new GridFsStorage({
  url: "mongodb://localhost/safepay",
  file: (req, file) => {
    console.log(file)
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
       
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({storage});

app.set("view engine", "ejs")




//models 
const User = require("./models/user.js")
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next) {
  res.locals.currentUser = req.user;
  next();
})
//routes
const authRoute = require("./routes/auth.js")
const tradeRoute = require("./routes/trades.js");
const middleware = require("./middleware.js");
const Trade = require("./models/trade.js");
app.use(authRoute)
app.use(tradeRoute)



app.get("/", (req,res) => res.render("./index"))

//upload file
app.post('/upload/:tradeid', upload.single("file"), middleware.isLoggedIn,(req, res) => {
  res.json({file: req.file})
  User.findById(req.user._id, (err, user) => {
    if(err) {
      console.log(err)
      res.redirect("back")
    } else {
      Trade.findById(req.params.tradeid, (err, trade) => {
        if(err) {
          console.log(err)
          res.redirect("back")  
        } else {
          trade.files.push(req.file.filename)
          trade.save()
          console.log(trade)
        }
      })
      user.files.push(req.file.filename)
      user.save()
      console.log(user)
    }
  })
 
});


//download file
app.get("/download/:filename", middleware.isLoggedIn, (req, res) => {
  // console.log('id', req.params.id)
  gfs.files.findOne({ filename: req.params.filename}, (err, file) => {
    if(!file || file.length === 0) {
      return res.status(404).json({err: 'No file exists'})
    }
    
    //check whether user has permission to download file
    User.findById(req.user._id, (err,user) => {
      if(err) {
        res.redirect("back")
        console.log(err)
      } else {
        if(user.files.includes(req.params.filename)) {
          const readstream = gfs.createReadStream({ filename: req.params.filename });
            readstream.pipe(res);  
        } else {
          //if user doesnt own file perms
          res.send("You do not own this file.")
        }
      }
    })
    
  });
})

//delete file
app.get("/delete/:tradeid/:filename", middleware.isLoggedIn, (req, res) => {
  // console.log('id', req.params.id)
  gfs.files.findOne({ filename: req.params.filename}, (err, file) => {
    if(!file || file.length === 0) {
      return res.status(404).json({err: 'No file exists'})
    }

    //find trade and delete from trade list
    Trade.findById(req.params.tradeid, (err, trade) => {
      if(err) {
        console.log(err)
        res.redirect("back")  
      } else {
        let index = trade.files.indexOf(req.params.filename)
        trade.files.splice(index, 1)
        trade.save()
        console.log(trade)
      }
    })

    //check whether user has permission to download file
    User.findById(req.user._id, (err,user) => {
      if(err) {
        res.redirect("back")
        console.log(err)
      } else {
        if(user.files.includes(req.params.filename)) {
          let index = user.files.indexOf(req.params.filename)
          user.files.splice(index, 1)
          user.save()

          gfs.remove({ filename: req.params.filename }, (err) => {
            if (err) res.status(500).send(err);
            res.send('File Deleted');
          });
        } else {
          //if user doesnt own file perms
          res.send("You do not own this file.")
        }
      }
    })
    
  });
})

//start server port 3000
app.listen("3000", (req,res) => console.log("Server listening on port 3"))