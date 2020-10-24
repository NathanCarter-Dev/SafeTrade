const express = require("express")
const mongoose = require("mongoose")
const middleware = require("../middleware.js")
const router = express.Router();
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const Grid = require("gridfs-stream")

//models
const Trade = require("../models/trade.js")
const User = require("../models/user.js")
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

//upload file
router.post('/upload/:tradeid',middleware.isLoggedIn, upload.single("file"),(req, res) => {
  //find user who is uploading file
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
        }
      })
      user.files.push(req.file.filename)
      user.save()
    }
  })
 
});


//download file
router.get("/download/:filename", middleware.isLoggedIn, (req, res) => {
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
router.get("/delete/:tradeid/:filename", middleware.isLoggedIn, (req, res) => {
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
          let index = user.files.indexOf(req.params.filename)
          user.files.splice(index, 1)
          user.save()
          
          //find trade and delete from trade list
          Trade.findById(req.params.tradeid, (err, trade) => {
            if(err) {
              console.log(err)
              res.redirect("back")  
            } else {
              let index = trade.files.indexOf(req.params.filename)
              trade.files.splice(index, 1)
              trade.save()
            }
          })
          //remove the file from gfs database
          gfs.files.remove({ filename: req.params.filename }, (err, file) => {
            if (err) res.status(500).send(err);
            res.redirect('back');
          });
        } else {
          //if user doesnt own file perms
          res.send("You do not own this file.")
        }
      }
    })
    
  });
})


module.exports = router