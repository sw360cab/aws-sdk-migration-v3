import fs from 'node:fs';
import path from 'node:path';
import {uploadToS3, basicDownload} from './s3Utils.js';

const BUCKET_NAME = process.env.BUCKET || "aws.minimalgap.com"; 
const outFolder = "out";

;(async() => {
  const uploadPath = outFolder + path.sep + "upload.txt";
  const downloadPath = outFolder + path.sep + "download.txt";
  const objectKey = uploadPath;
  
  fs.mkdirSync(outFolder);
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(uploadPath);
    ws.write('ok', () => ws.end());
    ws.on("finish", resolve);
    ws.on("error", reject);
  });

  await uploadToS3(uploadPath, BUCKET_NAME, objectKey);
  await basicDownload(BUCKET_NAME, objectKey, downloadPath);
})();

