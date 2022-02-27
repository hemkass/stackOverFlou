const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

//import du modèle
const User = require("../models/user");

// import du Middleware d'authentification
const auth = require("../middleWare");

// Inscription
router.post("/user/signup", async (req, res) => {
  if (req.fields.email !== undefined && req.fields.username !== undefined) {
    try {
      const isUser = await User.findOne({ email: req.fields.email });

      if (isUser) {
        res.json({ message: "email déjà présent" });
      } else {
        const password = req.fields.password;
        const salt = uid2(16);
        const hash = SHA256(password + salt).toString(encBase64);

        let description = "";
        if (req.fields.description) {
          description = req.fields.description;
        }

        let firstname = "";
        if (req.fields.firstname) {
          firstname = req.fields.firstname;
        }

        let lastname = "";
        if (req.fields.lastname) {
          lastname = req.fields.lastname;
        }

        const newUser = new User({
          token: uid2(16),
          salt: salt,
          hash: hash,
          email: req.fields.email,

          account: {
            firstname: firstname,
            lastname: lastname,
            username: req.fields.username,
            phone: req.fields.phone,
            description: description,
            //avatar:
          },
        });
        if (req.files.picture) {
          let avatarToUpload = req.files.picture.path;

          const result = await cloudinary.uploader.upload(avatarToUpload, {
            public_id: `StackOverFlou/users/${newUser._id}`,
            width: 100,
            height: 100,
            gravity: "faces",
            crop: "thumb",
            radius: "max",
          });

          newUser.account.avatar = result.secure_url;
        } else {
          newUser.account.avatar =
            "https: //res.cloudinary.com/dyj84szrx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_mx,bo_5px_solid_red,b_rgb:262c35/v1635089804/vinted/users/blank-profile-picture-973461_1280_uxswkl.png";
        }
        console.log(newUser.account.avatar);
        await newUser.save();

        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
            firstname: newUser.account.firstname,
            lastname: newUser.account.lastname,
            phone: newUser.account.phone,
            avatar: newUser.account.avatar,
            description: description,
          },
        });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(428).json({ message: "mail and username required" });
  }
});

// Se connecter:
router.post("/user/login", async (req, res) => {
  try {
    const isUser = await User.findOne({ email: req.fields.email });

    if (isUser) {
      const newHash = SHA256(req.fields.password + isUser.salt).toString(
        encBase64
      );
      if (newHash === isUser.hash) {
        res.status(200).json({
          _id: isUser._id,
          token: isUser.token,
          account: {
            username: isUser.account.username,
            phone: isUser.account.phone,
          },
        });
      } else {
        res.status(428).json({ message: "Invalid password or mail" });
      }
    } else {
      res.status(428).json({ message: "Invalid request" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* modifier des informations du profil  */

router.post("/user/update", auth, async (req, res) => {
  try {
    const isUser = await User.findOne({ token: req.user.token });

    if (req.user) {
      const keys = Object.keys(req.fields);
      console.log(keys);
      keys.forEach((element) => {
        switch (element) {
          case "username":
            isUser.account.username = req.fields.username;

          case "description":
            isUser.account.description = req.fields.description;

          default:
            console.log("hello");
            break;
        }
      });

      await isUser.save();
      return res.json({
        message: `your profil has been updated`,
        isUser,
      });

      /*  console.log("user", req.user.account.username); */
    } else {
      res.status(401).json({ message: "Please login" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* modifier la photo du profil (ou la supprimer)  */

router.post("/user/update/photo", auth, async (req, res) => {
  try {
    if (req.user) {
      const isUser = await User.findOne({ token: req.user.token });

      if (req.files.picture) {
        //1) Supprimer l'ancienne photo
        cloudinary.api.delete_resources(isUser.picture);

        //2) upploader la nouvelle photo
        let newPictureToUpload = req.files.picture.path;

        const result = await cloudinary.uploader.upload(newPictureToUpload, {
          public_id: `StackOverFlou/users/${newUser._id}`,
          width: 400,
          height: 400,
          crop: "limit",
          effect: "improve",
        });

        console.log(result);
        isUser.account.avatar = result;
        await isUser.save();
        return res.json({
          message: `your photo has been updated`,
        });
      } else {
        isUser.account.avatar =
          "https: //res.cloudinary.com/dyj84szrx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_mx,bo_5px_solid_red,b_rgb:262c35/v1635089804/vinted/users/blank-profile-picture-973461_1280_uxswkl.png";
        await isUser.save();
        return res.json({
          message: `your photo has been deleted`,
        });
      }
    } else {
      res.status(401).json({ message: "Please login" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* supprimer le compte */

router.delete("/user/delete", auth, async (req, res) => {
  try {
    if (req.user) {
      const UserDeleted = await User.findById(req.user._id);
      console.log(UserDeleted.account.avatar);
      cloudinary.api.delete_resources(`${UserDeleted.account.avatar}`);

      UserDeleted.remove();

      res.status(200).json({ message: "your account has been deleted" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
