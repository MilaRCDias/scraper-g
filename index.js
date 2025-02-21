const { chromium } = require('playwright');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

const websites = [
  process.env.WEBSITE1, 
  process.env.WEBSITE2 
];

const searchTerms = ["april", "mai", "juni", "märz"];

async function scrapeWebsite(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`🔍 Scraping: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('#scheduledproducts', { timeout: 10000 });
  console.log("✅ Page fully loaded.");

  const allText = await page.locator('#scheduledproducts').innerText();
  console.log("📌 Extracted Text:");
  console.log(allText);

  let foundMatches = [];

  searchTerms.forEach(term => {
    if (allText.toLowerCase().includes(term)) {
      console.log(`✅ Found "${term}" in the text on ${url}!`);
      foundMatches.push(term);
    }
  });

  await browser.close();

  return foundMatches.length > 0 ? { url, matches: foundMatches } : null;
}

async function scrapeAll() {
  let results = [];

  for (let url of websites) {
    const result = await scrapeWebsite(url);
    if (result) {
      results.push(result);
    }
  }

  if (results.length > 0) {
    sendEmail(results);
  } else {
    console.log("🚫 No matches found on any website.");
  }
}

function sendEmail(results) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.PASSWORD, 
    }
  });

  let messageBody = "The following courses were found:\n\n";

  results.forEach(result => {
    messageBody += `📌 **Website:** ${result.url}\n`;
    messageBody += `✅ **Matches:** ${result.matches.join(", ")}\n\n`;
  });

  let mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL, 
    subject: 'Course Alert: April/Mai/Juni Found!',
    text: messageBody,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('✅ Email sent:', info.response);
    }
  });
}

scrapeAll();
