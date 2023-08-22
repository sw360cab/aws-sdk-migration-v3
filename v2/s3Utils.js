import fs from 'node:fs';
import { PassThrough, Readable } from 'node:stream';
import AWS from 'aws-sdk';

import {initAws} from './init.js';
// setup AWS SDK
initAws();
const S3 = new AWS.S3();

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
  fs.createReadStream(filePath, { highWaterMark: 1024 * 16 }).pipe(s3Stream);
  
  return S3.upload({
    Bucket: bucket,
    Key: key,
    Body: s3Stream
  }).promise()
  .then(() => `${bucket}/${key}`)
  .catch(e => {
    console.error("unable to upload", e);
  })
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
  return S3.getObject(params).promise()
  .then((download_) => {
    Readable.from(download_.Body).pipe(new fs.createWriteStream(destPath));
  }).catch(e => {
    console.error("unable to download", e);
  })
};

export {uploadToS3, basicDownload};