import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { format } from "date-fns"
import { utcToZonedTime } from "date-fns-tz"
import { BlobServiceClient } from "@azure/storage-blob"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  // get the language
  const lang = context.bindingData.lang

  // construct the file name
  const now = format(utcToZonedTime(new Date(), "Asia/Tokyo"), "yyyy-MM-dd_hh-mm")
  const fileName = `${lang}/${now}_${lang}.json`

  // setup the azure storage
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env["AzureStorageConnectionString"] || "")
  const containerClient = blobServiceClient.getContainerClient("articles")
  const blockBlobClient = containerClient.getBlockBlobClient(fileName)

  // encode the data
  const data = req.body
  const encodedData = JSON.stringify(data)

  // upload the data
  await blockBlobClient.upload(encodedData, encodedData.length)
  
  // return the response
  context.res = {
    status: 201,
    headers: {
      "Content-Type": "application/json",
    },
    body: encodedData
  }
}

export default httpTrigger