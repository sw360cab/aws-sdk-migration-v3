# Migrating AWS SDK from v2 to v3

> Pubished in [dev.to](https://dev.to/sw360cab/migrating-aws-sdk-from-v2-to-v3-for-s3-32lh)

Short time ago, I found myself in the very rare situation where you can dedicate some time slots to library upgrades in any of your projects. The purists will blame me for this “rare” adjective and bad practice, but even with all the good intentions, to me it is not so common to reserve time for this activity.
This makes me often feel like a lazy and bad software engineer, but breaking changes usually kills me.
And the following story will make no exception.

As I said I was starting upgrading libraries in a Node.js Git repository related to a project of [QUA](https://www.qua-app.com/en/), the startup I own and run.
I started running the command:

```bash
npm outdated
```

and after a small check I ran:

```bash
npm update
```

I achieved a consistent result. Spoiler: I can state that because I have a solid unit/integration test base.
But then I noticed a warning:

> _NOTE: We are formalizing our plans to enter AWS SDK for JavaScript (v2) into maintenance mode in 2023.
  Please migrate your code to use AWS SDK for JavaScript (v3)._

After digging into my code and googling a little bit, I found out that I was still using AWS SDK v2 throughout all the code. After a moment to recover from the loathing of this news, I branched and started to imagine how painful this journey would have been.

*Note: AWS provides an automatic tool to migrate code from v2 to v3: [Migrating your code to SDK for JavaScript V3 - AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrating-to-v3.html). Of course I preferred the hard and painful way.*

It turns out that it wasn't much to migrate. I will go through the changes soon, but the key breaking changes are:

* SDK library is now split into dedicated libraries instead of importing the whole SDK and then initializing the required service.
* Configuration can be done from ini files or local AWS CLI configuration.

## Migration in details

Let's go.
The main service I leverage in my codebase are:

* AWS S3
* AWS SES

First step was adjust libraries version in `package.json` by uninstalling current AWS SDK

```bash
npm uninstall aws-sdk --save
```

* AWS Credentials setup

```bash
npm i @aws-sdk/credential-providers --save
```

* S3

```bash
npm i @aws-sdk/client-s3 @aws-sdk/lib-storage --save
```

* SES

```bash
npm i @aws-sdk/client-ses --save
```

### Credentials Setup

In the codebase using v2 of SDK I used to setup SDK credentials either using environment variables or via a JSON config file (which was not committed 😇)

```javascript
export function initAws () {
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
```

Unfortunately with v3 loading credentials using a JSON file is not supported anymore, though it is still valid using environment variables.
However the closest way to achieve setup via external configuration files is using the library method `fromIni`:

```javascript
import { fromIni } from "@aws-sdk/credential-providers";
```

This method creates an `AwsCredentialIdentityProvider` that read

* a shared credentials file at `~/.aws/credentials`
* a shared configuration file at `~/.aws/config`

Both files are expected to be INI formatted with section names corresponding to profiles.
I have shared an example of an AWS config file since it does not contain any sensible data.

`secrets/aws/config`

```bash
[default]
region=eu-west-1
output=json
```

Whereas credentials file will include sensible information, again in `ini` format

`secrets/aws/credentials`

```bash
[default]
aws_access_key_id=<YOUR_ACCESS_KEY_ID>
aws_secret_access_key=<YOUR_SECRET_ACCESS_KEY>
```

*NOTE: the line `[default]` is referred to the \<default> profile, the ini files can contain more than one profile, all in the format `[<profile name>]`, but the profile to be employed should be reflected in the AWS SDK configuration.*

The default reference path can be overridden using environment variables:

* AWS_SHARED_CREDENTIALS_FILE for credentials
* AWS_CONFIG_FILE for config

```javascript
const awsCredentialsPath = process.env.AWS_SHARED_CREDENTIALS_FILE || path.join(__dirname,'/../secrets/aws/credentials');
const awsConfigPath = process.env.AWS_CONFIG_FILE || path.join(__dirname,'/../secrets/aws/config');

return fromIni({
  filepath: awsCredentialsPath,
  configFilepath: awsConfigPath,
})
```

The initialization of a service, like AWS SES, will be changed,

* from v2

```javascript
import AWS from 'aws-sdk';

AWS.config.loadFromPath(awsConfigPath)
const SES = new AWS.SES();
```

* to v3

```javascript
import { fromIni } from "@aws-sdk/credential-providers";
import { SESClient } from "@aws-sdk/client-ses";

const awsConfigEnv = fromIni({
  filepath: awsCredentialsPath,
  configFilepath: awsConfigPath,
})
const SES = new SESClient({region: "eu-west-1", credentials: awsConfigEnv});
```

### S3

The main AWS service I leverage in my codebase is S3 to send/retrieve data to/from AWS S3 buckets.

Couple remarks:

* in v2 to achieve a promise from a client method, a further `promise()` method should be called. In v3 the client methods tend to return natively Promises.
* In the following example I used native Node.js `Passthrough` stream. It is almost useless when using a file read stream directly, but I left it as a reminder because it is common in most use cases, especially when files will be uploaded through an HTTP POST.

    ⚠️ _These HTTP requests in Node.js are not pure readable streams but usually an object inheriting from the Node.js `stream` class, implementing methods like `write`. Passthrough streams allow passing data coming from an HTTP connection directly to the bucket without having to store them in local memory, meanwhile._

#### S3 Upload

In v2 I used to upload an “object” into a bucket like that:

```javascript
import AWS from 'aws-sdk';

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
```

Now in v3 I have to use the brand new method upload:

```javascript
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const uploadToS3 = (filePath, bucket, key) => {
  const s3Stream = new PassThrough();
  // pipe file and s3 stream to upload
  fs.createReadStream(filePath, {highWaterMark: 1024 * 16}).pipe(s3Stream);
 
  const upload = new Upload({
    client: new S3Client({region, credentials: awsConfigEnv}),params: {
      Bucket: bucket,
      Key: key,
      Body: s3Stream,
    }
  });

  return upload.done()
  .then(_ => `${bucket}/${key}`)
  .catch(e => {
    console.error("unable to upload", e);
  })
};
```

* In v3 the upload part is lead by a dedicated SDK library: `lib-storage`, which provides an `Upload` class. Its constructor returns an `EventEmitter` whereas the `done()` method returns a _Promise_ which successfully resolves when the upload to S3 bucket has finished.

#### S3 Download

v2:

```javascript
import AWS from 'aws-sdk';
import { Readable } from 'node:stream';

const basicDownload = function(bucket, key, destPath) {
  const params = { Bucket: bucket, Key: key };
  return S3.getObject(params).promise()
  .then((download_) => {
    Readable.from(download_.Body).pipe(new fs.createWriteStream(destPath));
  }).catch(e => {
    console.error("unable to download", e);
  })
};
```

Now in v3 :

```javascript
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const basicDownload = function(bucket, key, destPath) {
  const params = { Bucket: bucket, Key: key };
  return new S3Client({region, credentials: awsConfigEnv}).send(new GetObjectCommand(params))
  .then(async (download_) => {
    download_.Body.pipe(new fs.createWriteStream(destPath));
  }).catch(e => {
    console.error("unable to download", e);
  })
};
```

* In v2 `Readable` was needed to create a stream from the buffer returned by AWS SDK. Again a Node.js stream can be useful to pipe directly an HTTP response
* In v3 the response from AWS SDK contains directly a Node.js Stream in the Body field.

## References

* [@aws-sdk/credential-providers | AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_providers.html#fromtemporarycredentials "@aws-sdk/credential-providers | AWS SDK for JavaScript v3")
* [Migrating your code to SDK for JavaScript V3 - AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrating-to-v3.html "Migrating your code to SDK for JavaScript V3 - AWS SDK for JavaScript")
* [What's the AWS SDK for JavaScript? - AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html "What's the AWS SDK for JavaScript? - AWS SDK for JavaScript")
