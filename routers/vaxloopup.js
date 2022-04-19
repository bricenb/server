/**
 * vaxloopup.js handels all calls to the server that beign with /vaxloopup
 * 1 post request
 * requires: 
 * router: from express
 * puppetter: headless chrome driver
 */
const router = require("express").Router();
const puppeteer = require("puppeteer");
/**
 * path: "vaxloopup/"
 * looks up moderna or J&J vax lot numbers and checks legitmacy
 */
router.post("/", async (req, res) => {
    try {
        //takes in lot number and lot provider from request
        const { lotNum, lotProvider } = req.body;
        JSON.stringify(lotNum);
        //Moderna lot number look up
        if (lotProvider === "moderna") {
            //launches browser
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            //goes to moderna lot number look up site
            await page.goto("https://www.modernatx.com/covid19vaccine-eua/providers/vial-lookup");
            //finds finds input filed with id of lotNumber and inputs the lot number
            await page.type("#lotNumber", lotNum);
            await page.click(".sticky-minimize");
            await page.click("#submitLotNumber");
            await page.waitForTimeout(1000);
            //finds the info that is displayed in element with className of lot-number-expiry
            const info = await page.$eval(".lot-number-expiry", el => el.textContent);
            //checks to see if info contains "Expiration"
            const vaxLegit = info.includes("Expiration");
            //closes brower window
            await browser.close();
            //reponses with vax lot info
            if (vaxLegit) {
                return res.status(200).json({SuccMessage: "Vaccine lot Number found"});
            } else {
                return res.status(404).json({errorMessage: "Vaccine lot number not found"});
            }
        } else if (lotProvider === "johnson") {
            //J&J lot number lookup
            //J&J lot number for testing 1805022
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://vaxcheck.jnj/search");
            await page.click(".PausePopup_continueButton__1FF_Z.btn.btn-none");
            await page.waitForTimeout(1000);
            await page.type(".SearhBox_control__2Z_di.false.form-control", lotNum);
            await page.click(".SearhBox_button__3dkdV.SearhBox_button__3dkdV-primary");
            await page.waitForTimeout(1000);
            try {
                const info = await page.$eval(".LotStatus_header__2nZTS", el => el.textContent);
                const vaxLegit = info.includes("Expiration");
                if (vaxLegit) {
                    return res.status(200).json({SuccMessage: "Vaccine lot Number found"});
                }
                } catch (err) {
                    return res.status(404).json({errorMessage: "Vaccine lot Number is not found"});
                }
            }
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
});

module.exports = router;