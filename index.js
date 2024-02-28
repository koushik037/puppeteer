import express from "express";
import puppeteer from "puppeteer"
import htmlform from "./htmlform.js";

const app = express()
const port = process.env.PORT || 6600

app.get('/', async (req, res) => {
    res.send(htmlform)
})

app.get('/url', async (req, res) => {

    const { amazonurl } = req.query
    try {
        if (!amazonurl && amazonurl.length == 0) {
            res.send('please! provide url')
            return
        }
        let host = new URL(amazonurl)
       
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.once('request', () => {
            // console.log('page issue a request ')
        })

        page.once('requestfinished', () => {
            // console.log('page request finished')
        })
        page.once('close', () => {
            // console.log('page closed')
        })
        const response = await page.goto(amazonurl, { timeout: 0, waitUntil: ['domcontentloaded', 'networkidle2'] })
        page.setExtraHTTPHeaders({
            Accept: 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, compress, deflate, br',
            Host: host.hostname
        })

        if (response.status() !== 200) {
            res.send(`<h3> status : ${response.status()} </h3>`)
            return
        }
        const data = await page.evaluate((hostname) => {

            var pr = document.querySelector(`#productTitle`)

            if (hostname === 'www.amazon.in') {
                var priceExtract = document.querySelector('div#corePriceDisplay_desktop_feature_div > div.a-section > span.a-price > span > span.a-price-whole')// span.priceToPay > span.a-price-whole
                if (pr && priceExtract) {
                    return { title: pr.textContent, price: priceExtract.textContent }
                }
                if (pr && !priceExtract) {
                    return { title: pr.textContent }
                }
            } else if (hostname === 'www.amazon.com') {
                var priceExtract = document.querySelector('div#corePrice_desktop').querySelector('span.a-price > span.a-offscreen')
                if (pr && priceExtract) {
                    return { title: pr.textContent, price: priceExtract.textContent }
                }
                if (pr && !priceExtract) {
                    return { title: pr.textContent }
                }
            }

            return false
        }, host.hostname)
        if (!data) {
            res.send(await response.text())
            return
        }
        res.send(`<h3>Title : ${data.title}</h3><br><h4> Price : ${data.price}</h4>`)
        await page.close()
        await browser.close();

    } catch (err) {
        console.log(err)
        res.send(`error : ${err}`)
    }
})

app.listen(port, () => console.log(`server start at port ${port}`))