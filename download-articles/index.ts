import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { chromium } from "playwright-chromium"

type DownloadedArticle = {
  url: string,
  imageUrl: string,
  paragraphs: string[],
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const articlesToDownload: {urls: string[]} = req.body
  
  // if urls are not supplied, return 400
  if (!articlesToDownload || !articlesToDownload.urls) {
    context.res = {
      status: 400,
      body: JSON.stringify({
        error: "urls are not defined."
      }),
      headers: {
        "Content-Type": "application/json",
      }
    }
    return
  }

  // setup playwright
  const browser = await chromium.launch()
  const page = await browser.newPage()


  const downloadedArticles: DownloadedArticle[] = []

  const urls = articlesToDownload.urls
  for (const url of urls) {
    // to concatenate with the image url
    const {protocol, host} = new URL(url)

    // go to the url
    await Promise.all([
      page.goto(url),
      page.waitForNavigation()
    ])
    
    // retrieve the article body
    const bodyLocator = page.locator("div.p-article__body p")
    const paragraphs = await bodyLocator.evaluateAll(list => list.map(elem => {
      return elem.textContent
    }))

    // retrieve the image url if present
    await page.waitForTimeout(500)
    const imageLocator = page.locator("div.p-article__mainImg img")

    const imageUrl: string|null = (await imageLocator.count()) > 0
      ? protocol + "//" + host + (await imageLocator.evaluate(elem => elem.getAttribute("src")))
      : null

    downloadedArticles.push({url, imageUrl, paragraphs})
  }

  context.res = {
    status: 200,
    body: JSON.stringify({articles: downloadedArticles}),
    headers: {
      "Content-Type": "application/json",
    }
  }
}

export default httpTrigger