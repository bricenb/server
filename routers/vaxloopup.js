const router = require("express").Router();
const puppeteer = require("puppeteer");

router.post("/", async (req, res) => {
    try {
        
        const { lotNum, lotProvider } = req.body;
        JSON.stringify(lotNum);
        //Moderna lot number look up
        if (lotProvider === "moderna") {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://www.modernatx.com/covid19vaccine-eua/providers/vial-lookup");
            await page.type("#lotNumber", lotNum);
            await page.click(".sticky-minimize");
            await page.click("#submitLotNumber");
            //await page.waitForNetworkIdle();
            await page.waitForTimeout(1000);
            //await page.screenshot({path: "amazing.png", fullPage: true});
            const info = await page.$eval(".lot-number-expiry", el => el.textContent);
            const vaxLegit = info.includes("Expiration");
            await browser.close();
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