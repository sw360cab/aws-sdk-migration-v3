import fs from 'node:fs';
import path from 'node:path';
import {uploadToS3, basicDownload} from './v3/s3Utils.js';
// import {uploadToS3, basicDownload} from './v2/s3Utils.js';

const BUCKET_NAME = process.env.BUCKET || "aws.blog.minimalgap.com"; 
const outFolder = "out";

;(async() => {
  const uploadPath = outFolder + path.sep + "upload.txt";
  const downloadPath = outFolder + path.sep + "download.txt";
  const objectKey = uploadPath;
  
  fs.mkdirSync(outFolder, {recursive: true});
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(uploadPath);
    ws.write('ok', () => ws.end());
    ws.on("finish", resolve);
    ws.on("error", reject);
  });

  console.log(await uploadToS3(uploadPath, BUCKET_NAME, objectKey));
  await basicDownload(BUCKET_NAME, objectKey, downloadPath);
})();

