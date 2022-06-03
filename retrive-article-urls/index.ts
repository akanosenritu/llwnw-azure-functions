import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { chromium } from "playwright-chromium"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  // get the lang code
  const lang = context.bindingData.lang

  const url = `https://www3.nhk.or.jp/nhkworld/${lang}/news/`


  // setup playwright
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // go to the landing page
  await Promise.all([
    page.goto(url),
    page.waitForNavigation(),
  ])

  // retrieve main news titles and links
  await page.waitForSelector("div.p-topNews")
  await page.waitForTimeout(1000)
  const cardTitlesLocator = page.locator("div.p-topNews div.c-item__title")
  const news = await cardTitlesLocator.evaluateAll(list => list.map(elem => {
    const title = elem.textContent
    const url = "https://www3.nhk.or.jp/" + elem.querySelector("a").getAttribute("href")
    return {title, url}
  }))

  context.res = {
    body: JSON.stringify({count: await cardTitlesLocator.count(), news}),
    headers: {
      "Content-Type": "application/json"
    },
    status: 200,
  }
}

export default httpTrigger