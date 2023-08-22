import path from 'node:path';
import { fromIni } from "@aws-sdk/credential-providers";

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const awsCredentialsPath = process.env.AWS_SHARED_CREDENTIALS_FILE || path.join(__dirname,'./secrets/aws/credentials');
const awsConfigPath = process.env.AWS_CONFIG_FILE || path.join(__dirname,'./secrets/aws/config');

export function initAws () {
  // if env variables are not provided
  // fallback to hardcoded static file
  if (process.env.AWS_ACCESS_KEY_ID === undefined
    && process.env.AWS_SECRET_ACCESS_KEY === undefined) {
    try {
      return fromIni({
        // Optional. The path to the shared credentials file. If not specified, the provider will use
        // the value in the `AWS_SHARED_CREDENTIALS_FILE` environment variable or a default of
        // `~/.aws/credentials`.
        filepath: awsCredentialsPath,
        // Optional. The path to the shared config file. If not specified, the provider will use the
        // value in the `AWS_CONFIG_FILE` environment variable or a default of `~/.aws/config`.
        configFilepath: awsConfigPath,
      })
    } catch(e) {
      console.error("error configuring AWS SDK", e.message);
      process.exit(1);
    }
  }
};

export const region = process.env.AWS_DEFAULT_REGION || "eu-west-1";