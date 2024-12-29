// const express = require("express");
// const mysql = require("mysql");
// const bodyParser = require("body-parser");
// const cors = require("cors");

// const app = express();
// const PORT = 8000;

// app.use(bodyParser.json);
// app.use(cors());



const mysql = require("mysql");
const bodyParser = require("body-parser");
const express = require('express');
const router = express.Router();

//const bcrypt = require("bcrypt");


// const app = express();
// const PORT = 8000;
// app.use(cors());
// app.use(express.json());

//const formattedBirthDate = moment(birthDate).format("YYYY-MM-DD");

// app.use(bodyParser.json);
 const db = mysql.createConnection({
  host:"localhost",
  user:"mostafa",
  password:"123456",
  database:"fitness",
  });
  db.connect((err) =>{
      if (err) throw err;
  });
// app.get("/", (req, res) => {
//   console.log("heree")
//   res.send("Hello from Express!");
// });

// app.listen(PORT, () => {
//   console.log(`Express server running at http://localhost:${PORT}/`);
// });


// app.use(express.json())

router.post("/SignIn",(req,res)=>{
 const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  query = `SELECT *
  FROM user
  WHERE email='${email}'`;
  db.query(query,(err, result)=>{
    if (err){
        res.status(500).send("error fetching user data."+err);  
    }
    else{
        const user = result[0];
        if (!user) {
          return res.status(401).json({ error: "Invalid email." });
        }
        if (user.password !== password) {
          return res.status(401).json({ error: "Invalid email or password." });
        }
      }
      res.status(200).json({ message: "Sign in successful!" });
});
  

});

router.get("/",(req, res)=>{ 
    const email = req.query.email
    console.log("email: ", email)
     query = `SELECT *
                   FROM user
                   WHERE email='${email}'`;
    db.query(query,(err, result)=>{
        if (err){
            res.status(500).send("error fetching user data.");
        }
        else{
            res.json(result);
        }
    });
});
router.put("/",(req, res)=>{
    const{name, phone, birthDate, email}=req.body;
    if (!name || !phone || !birthDate) {
      return res.status(400).send("All fields are required.");
    }    
    const query = `
    UPDATE user
    SET name = '${name}' ,phone ='${phone}' ,birthDate='${birthDate}'
    WHERE email ='${email}'
  `;
  db.query(query, [name, phone, birthDate, email], (err, result) => {
    if (err) {
      console.error("Database Error: ", err);
      res.status(500).send("Error updating user data.");
    } else {
      res.json({ message: "User updated successfully." });
    }
  });
});

router.post("/", async(req,res)=>{
const {name, email, password, sex, birthDate, phone}= req.body;

if (!name ||!email||!password||!sex||!birthDate||!phone){
return res.status(400).json({error:"All fields are required."});
}
if(!["m", "f"].includes(sex)){
  return res.status(400).json({erorr:"Invalid value for sex"});
}
try{
 // const hashedPass = await bcrypt.hash(password,10);
  const query=`
    INSERT INTO user (name, email, password, sex, birthDate, phone)
      VALUES (?, ?, ?, ?, ?, ?)
  `;

  router.query(query,[name, email, password, sex, birthDate, phone],(err,result)=>{
    if(err){
     // console.log(err);
      if (err.code=="ER_DUP_ENTRY"){
        return res.status(400).json({error:"phone number already exists"});
      }
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Email already exists." });
      }
      console.log("Database error",err);
      return res.status(500).json({error:"Internal server error"});
    }
    res.status(201).json({message:"user created successfully",userId: result.insertId});
  });
}catch(error){
  console.error("error hashing password",error);
  res.status(500).json({error:"internal server error"});
}
});


module.exports = router;
