import fs from 'node:fs';
import { PassThrough } from 'node:stream';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import {initAws, region} from './init.js';
// setup AWS SDK
const awsConfigEnv = initAws();

/**
 * Upload to S3 piping file stream read to s3.
 * 
 * @param {string} filePath file path from where read
 * @param {string} bucket target bucket
 * @param {string} key target key
 */
 const uploadToS3 = (filePath, bucket, key) => {
  const s3Stream = new PassThrough();
  // pipe file and s3 stream to upload
  fs.createReadStream(filePath, {
    highWaterMark: 1024 * 16
  }).pipe(s3Stream);
  
  const upload = new Upload({
    client: new S3Client({region, credentials: awsConfigEnv}),
    params: {
      Bucket: bucket,
      Key: key,
      Body: s3Stream,
    }
  });

  return upload.done()
  .then(_ => {
    return `${bucket}/${key}`;
  });
};

 /**
  * Gather Media from S3 bucket. Partial download is supported and may be required,
  * by the client providing range header (`start`-`end`)
  * 
  * @param {string} bucket target bucket
  * @param {string} key target key
  * @param {string} destPath destination file for data downloaded
  */
 const basicDownload = function(bucket, key, destPath) {
  const params = { Bucket: bucket, Key: key };
  
  return new S3Client({region, credentials: awsConfigEnv}).send(new GetObjectCommand(params))
  .then(async (download_) => {
    download_.Body.pipe(new fs.createWriteStream(destPath));
  }).catch(e => {
    console.error("unable to download", e);
  })
};

export {uploadToS3, basicDownload};