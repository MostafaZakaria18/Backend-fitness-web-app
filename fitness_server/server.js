const express= require("express");
const cors = require("cors");

const app = express();
const PORT = 8000;
app.use(cors())

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});

const sgMail = require('@sendgrid/mail');

app.use(express.json())


app.post("/generate-otp", (req, res) => {
    console.log( req.body.email)
    sendOTPEmail(req.body.email);
    res.json("otp sent to "+ req.body.email)
  });

sgMail.setApiKey('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');

function generateOTP(length) {
    let otp = '';
  const digits = '0123456789';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  console.log("otp is "+otp)
  return otp
  
}

async function sendOTPEmail(email) {
const generatedOTP = generateOTP(10);
  const msg = {
    to: email,
    from: 'youssef.16jan@gmail.com', 
    subject: 'Your OTP Code',
    text: `Your OTP is: ${generatedOTP}`
  };

  try {
    await sgMail.send(msg);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error);
  }
}

function validateOTP(inputOTP, generatedOTP) {
  return inputOTP === generatedOTP;
}

const usersRoute = require('./User');


app.use('/user', usersRoute);

const otpLength = 6;
const generatedOTP = generateOTP(otpLength);
const userEmail = 'youssefjan010@gmail.com'; 

// sendOTPEmail(userEmail, generatedOTP);

// rl.question("Enter the OTP sent to your device: ", (userInput) => {
//   if (validateOTP(userInput.trim(), generatedOTP)) {
//     console.log("OTP validated successfully. Access granted!");
//   } else {
//     console.log("Invalid OTP. Access denied.");
//   }
//   rl.close();
// });