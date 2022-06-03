import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { format, utcToZonedTime } from "date-fns-tz"
import fetch from "cross-fetch"

const LANGUAGES = [
  "ar",  // Arabic
  "bn",  // Bengali
  "es",  // Spanish
  "fa",  // Persian
  "fr",  // French
  "ja",  // Japanese
  "hi",  // Hindi
  "id",  // Indonesian
  "ja",  // Japanese
  "kr",  // Korean
  "my",  // Burmese
  "pt",  // Portuguese
  "ru",  // Russian
  "sw",  // Swahili
  "th",  // Thai
  "tr",  // Turkish
  "uk",  // Ukranien
  "ur",  // Urdu,
  "vi",  // Vietnamese
  "zh",  // Chinese Simplified
  "zt",  // Chinese Traditional
]

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  // get the language
  const lang = context.bindingData.lang
  if (LANGUAGES.findIndex(elem => elem === lang) === -1) {
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({"error": `the provided language ${lang} is not available.`})
    }
    return
  }

  // retrieve the article urls
  const articlesData: {
    count: number,
    news: {title: string, url: string}[]
  } = await fetch(`https://func-llwnw.azurewebsites.net/api/retrieve-article-urls/${lang}`, {
    method: "GET",
    headers: {
      "x-functions-key": process.env["AzureFunctionsFuncLLWNWHostKey"]
    }
  }).then(res => res.json())

  // retrieve the article bodies
  const urls = articlesData.news.map(datum => datum.url)
  const articleBodies: {
    articles: {url: string, imageUrl: string, paragraphs: string[]}[]
  } = await fetch(`https://func-llwnw.azurewebsites.net/api/download-articles`, {
    method: "POST",
    headers: {
      "x-functions-key": process.env["AzureFunctionsFuncLLWNWHostKey"],
      "Content-Type": "application/json",
    },
    body: JSON.stringify({urls})
  }).then(res => res.json())

  // merge the data
  for (const articleData of articlesData.news) {
    const body = articleBodies.articles.find(article => article.url === articleData.url) 
    if (body) {
      Object.assign(articleData, body)
    }
  }

  // create the final data
  const titles = articlesData.news.map(article => article.title)
  const now = format(utcToZonedTime(new Date(), "Asia/Tokyo"), "yyyy-MM-dd'T'hh:mm:ss xxx", {timeZone: "Asia/Tokyo"})
  const uploadedData = {...articlesData, titles, createdAt: now}

  // upload the data
  await fetch(`https://func-llwnw.azurewebsites.net/api/save-articles/${lang}`, {
    method: "POST",
    headers: {
      "x-functions-key": process.env["AzureFunctionsFuncLLWNWHostKey"],
      "Content-Type": "application/json",
    },
    body: JSON.stringify(uploadedData)
  })

  context.res = {
    status: 200,
    body: JSON.stringify(uploadedData),
    headers: {
      "Content-Type": "application/json",
    }
  }
}

export default httpTrigger