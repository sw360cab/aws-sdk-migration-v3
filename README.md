# Migrating AWS SDK from v2 to v3

## Setup

Create the following files in the folder `./secrets/aws`:

* for `v2` -> `config.json`

```json
{
  "accessKeyId": <YOUR_ACCESS_KEY_ID>, 
  "secretAccessKey": <YOUR_SECRET_ACCESS_KEY>,
  "region": "us-east-1"
}
```

* for `v3` -> `credentials` (ini format)

```ini
[default]
aws_access_key_id= <YOUR_ACCESS_KEY_ID>
aws_secret_access_key=<YOUR_SECRET_ACCESS_KEY>
```
