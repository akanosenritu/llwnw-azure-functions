import { AzureFunction, Context } from "@azure/functions"
import { fetch } from "cross-fetch"

const LANGUAGES = [
  "es",
  "fr",
  "tr",
  "zh"
]

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const result = await Promise.all(LANGUAGES.map(language => {
    return fetch(`https://func-llwnw.azurewebsites.net/api/daily-task1/${language}`, {
      headers: {
        "x-functions-key": process.env["AzureFunctionsFuncLLWNWHostKey"]
      }
    })
  }))

  context.res = {
    status: 200,
  }
}

export default timerTrigger
