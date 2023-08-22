import path from 'node:path';
import AWS from 'aws-sdk';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const awsConfigPath = process.env.AWS_CONFIG_FILE || path.join(__dirname,'./secrets/aws/config.json');

export function initAws () {
  // if env variables are not provided
  // fallback to hardcoded static file
    // if env variables are not provided
  // fallback to hardcoded static file
  if (process.env.AWS_ACCESS_KEY_ID === undefined
    && process.env.AWS_SECRET_ACCESS_KEY === undefined) {
    try {
      AWS.config.loadFromPath(awsConfigPath)
    } catch(e) {
      console.error(`AWS config file not found at ${awsConfigPath}`, e.message);
      process.exit(1);
    }
  }
};