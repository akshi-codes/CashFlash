# Temporary AWS demo deployment

This stack runs the CashFlash frontend, main API, PSP API, and MySQL on one
Ubuntu Lightsail instance in `ap-southeast-2` (Sydney). It is for a temporary
demo, not a production financial service. It does not deploy the optional AI
service or Ollama.

## How traffic and data are arranged

- Caddy serves the built React files and sends `/api`, `/websocket`, and
  `/files` requests to the main API. The browser uses one HTTPS origin.
- Caddy requests a Let's Encrypt short-lived certificate for the instance's
  stable public IPv4 address. It renews certificates automatically; keep its
  `caddy_data` volume and allow inbound TCP ports 80 and 443.
- The main API calls the PSP over the private Compose network. Neither API nor
  MySQL publishes a host port. MySQL is reachable only by the two app services.
- Both Java services require TLS for their MySQL connections (`sslMode=REQUIRED`).
  MySQL 8.4 generates TLS certificates on first initialization. This encrypts
  traffic but does not verify the server's identity; it is scoped to this private
  demo network. It also supports MySQL's default password authentication without
  enabling public-key retrieval over an unencrypted connection.
- MySQL data and profile/KYC uploads use named persistent Docker volumes.
  These volumes survive container rebuilds, but are lost if the instance and
  its disk are deleted. Keep backups before upgrades or teardown.
- `JWT_SECRET` must be identical in both Spring services. It signs and checks
  the app's login tokens; changing it logs users out.

## Cost and limits to understand first

As checked on October 13, 2026, the account has **$120 of Free plan credits**,
and the plan expires on **April 13, 2027**. The Sydney Lightsail Linux 2 GB
bundle (`small_3_2`) is listed at **$12/month**, or about **$72 for six months**,
leaving roughly **$48** before
snapshots, outbound transfer above Sydney's regional allowance, tax, or other
billable items. Sydney receives half of the listed 3 TB transfer allowance.
This is a tight-memory demo size, so we cap service memory and build images on
your local machine before sending them to the instance. Monitor memory and logs;
if it runs out of memory, the next Lightsail size costs twice as much and will
not fit the remaining six-month credit estimate. Set a billing alert and
calendar a teardown date.

A single instance has no high availability. A host, disk, or availability-zone
failure can take down the app. The 2 GB plan may be memory constrained under
load; it is the budget-conscious choice for a small demo and needs observation.

## Local rehearsal

Use `compose.local.yaml` with the base file to run the same images locally.
It uses a separate Compose project (`cashflash-local-demo`) and separate volumes.
The website binds only to `127.0.0.1:25180`, using HTTP without public certificate
requests. Open `http://localhost:25180` in the browser.

Create a private, Git-ignored `.env.local` with the same keys as `.env.example`,
fresh random secrets, `PUBLIC_HOST=localhost`, and
`PUBLIC_ORIGIN=http://localhost:25180`. Never use the example passwords.

```powershell
docker compose --env-file .env.local -f compose.yaml -f compose.local.yaml up -d --no-build
docker compose --env-file .env.local -f compose.yaml -f compose.local.yaml ps
docker compose --env-file .env.local -f compose.yaml -f compose.local.yaml down
```

The last command stops this rehearsal and keeps its stored data. The local
override requires Docker Compose 2.24.4 or later for `!override` support.

## Prepare AWS secrets on Windows

From this directory in PowerShell:

```powershell
Copy-Item .env.example .env
$secret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Generate separate values for `MYSQL_ROOT_PASSWORD`, `MYSQL_APP_PASSWORD`, and
`JWT_SECRET`; use letters and digits only for the MySQL passwords. Edit `.env`
to put the reserved public IPv4 address in `PUBLIC_HOST` and
`PUBLIC_ORIGIN=https://<that-ip>`. Keep `.env` private; Git ignores it.

## Deployment sequence

1. Confirm the account's Free plan and remaining AWS credits. Create an Ubuntu
   Lightsail Linux 2 GB instance in Sydney, then attach a static IPv4 address.
2. Open inbound TCP `80` and `443` to the public. Restrict SSH (`22`) to your
   current public IP. Do not open `3306`, `28080`, or `28082`.
3. On your Windows machine, build the app images locally using Docker Desktop
   or Rancher Desktop. `.env.example` supplies build-time placeholder values;
   no AWS credentials or app secrets are embedded in the images:

   ```powershell
   docker compose --env-file .env.example -f compose.yaml -f compose.build.yaml build
   docker save -o cashflash-demo-images.tar cashflash-main:local cashflash-psp:local cashflash-web:local
   ```

4. Connect to the instance over SSH, install Docker Engine and the Docker
   Compose plugin from Docker's official Ubuntu instructions, and create the
   `deploy/aws-demo` directory. Copy `compose.yaml`, `mysql-init.sh`, and the
   generated image archive there with `scp`. Securely copy your completed `.env`
   over SSH as well; do not copy `.env.example` as a live secrets file. The
   Dockerfiles and `compose.build.yaml` are only needed on your PC for image
   creation.
5. Create `deploy/aws-demo/.env` on the instance using the secret values above
   and the attached static IPv4 address. Load the images and start the stack:

   ```bash
   docker load -i cashflash-demo-images.tar
   docker compose --env-file .env pull db
   docker compose --env-file .env up -d --no-build --pull never
   docker compose ps
   docker compose logs --tail=100 web api psp db
   ```

   The separate `pull db` downloads MySQL's ready-made image. The transferred
   archive contains only our three application images, so MySQL must be present
   before starting with `--pull never`.

6. Open `https://<static-ip>` in a current browser. The first certificate
   request needs public reachability on ports 80 and 443 and can take a short
   time. Check `docker compose logs -f web` if HTTPS is not ready.
7. To update after a code change, rebuild the images locally, export and copy
   the new archive, then load it and run `docker compose --env-file .env up -d
   --no-build --pull never`. Back up the database and uploads first.

## Operations and teardown

```bash
# Follow app logs
docker compose logs -f api psp

# Stop containers but keep database, uploads, and Caddy certificates
docker compose down

# Destructive: also deletes the named database, uploads, and certificate volumes
docker compose down --volumes
```

When finished, first create any backups you need. Then remove the Lightsail
instance and static IP in the AWS console, and check Billing for remaining
resources such as snapshots. `docker compose down` alone does not stop AWS
instance charges.

## Current deployment boundary

This repository change prepares the application and Compose stack. It does not
create AWS resources. Before that step, review the current credit balance and
approve the exact Lightsail instance, firewall rules, and estimated six-month
cost.
