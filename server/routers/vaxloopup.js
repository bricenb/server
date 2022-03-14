const router = require("express").Router();
const puppeteer = require("puppeteer");

router.get("/", async (req, res) => {
    try {
        const apple = "052E21A";
        //console.log(apple);
        JSON.stringify(apple)
        //console.log(apple);
        const chromeOptions = {
            headless: true,
            defaultViewport: null,
            args: [
                "--incognito",
                "--no-sandbox",
                "--single-process",
                "--no-zygote"
                ],
        };
        const browser = await puppeteer.launch(chromeOptions);
        const page = await browser.newPage();
        await page.goto("https://www.modernatx.com/covid19vaccine-eua/providers/vial-lookup");
        //console.log(apple);
        await page.type("#lotNumber", apple);
        //console.log(apple);
        await page.click(".sticky-minimize");
        await page.click("#submitLotNumber");
        await page.waitForNetworkIdle();
        //await page.screenshot({path: "amazing.png", fullPage: true});

        const info = await page.$eval(".lot-number-expiry", el => el.textContent);
        console.log(info);
        
        await browser.close();

        res.json(info);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

module.exports = router;
