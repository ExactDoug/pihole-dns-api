# Pi-hole API for DNS

#### You:
Does the pi.hole open source DNS server that is self hosted have an API that I can leverage in order to interface to it and dynamically add DNS records for the local DNS section?

#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
Short answer: **Yes, but it depends on which Pi-hole version you’re on and what you mean by “API.”**

---

## 1. Pi-hole v5.x (current stable for most installs)

In v5, there is **no official, fully documented REST API specifically for Local DNS records**. The built-in “API” is mostly for stats and some config tweaks, not CRUD on Local DNS.

People work around this in a few common ways:

1. **Call the existing web (HTTP) API endpoints with a script**\
   Community scripts use the same endpoints the web UI uses to manage *custom DNS* (which are stored in `/etc/pihole/custom.list`). For example, this Bash script talks to Pi-hole’s HTTP API to add/edit custom DNS entries. citeturn0search3turn0search13

2. **Edit the files directly + reload**
   - Local/custom A records live in files like `/etc/pihole/custom.list` (or similar, depending on version).
   - You can automate by:
     - Appending/removing entries in that file
     - Running `pihole restartdns` or `pihole-FTL restart` so Pi-hole picks them up. citeturn0search3turn0search9

3. **Roll your own small API wrapper**\
   Example: a Node.js app that exposes HTTP endpoints and under the hood edits a Pi-hole list file and restarts FTL. citeturn0search9

So on v5, **you *can* automate Local DNS**, but it’s via:

- “Unofficial” use of the Admin web endpoints **or**
- Direct file manipulation + restart

—not a clean, versioned REST interface.

---

## 2. Pi-hole v6.x (beta / newer) – REST `/config` API

Pi-hole v6 introduces a **new REST API**. That API **does** expose config management, including DNS hosts (Local DNS records):

- Forum answers for v6 point to the `/config` endpoint and specifically `dns.hosts` for managing custom DNS/hosts. citeturn0search10turn0search1
- Another thread about automating local DNS with v6 confirms use of the new REST API and mentions endpoints like `DELETE /config/dns/hosts/{value}` for host entries. citeturn0search1

So if you’re on **Pi-hole v6** (currently still in heavy development / beta):

- You **can** use the official REST API to:
  - Authenticate
  - Read existing Local DNS records (`dns.hosts`)
  - Add/update/delete entries via `/config` endpoints

This is the cleanest way to “dynamically add DNS records for the local DNS section.”

---

## 3. What should *you* do?

### If you’re still on v5 (most common):

You basically have two practical options:

1. **Script against the current web API (reuse what the UI does)**
   - Use a pre-built script like `pihole_customdns_api` as a reference: it authenticates to the web interface, calls the HTTP endpoints, and updates custom DNS entries. citeturn0search3turn0search13
   - Integrate that into your MSP tooling (Datto RMM, N-Able, etc.) or your own automation.

2. **Edit `/etc/pihole/custom.list` (or equivalent) and restart DNS**
   - Your app or script:
     - Adds/removes a line like `192.168.1.10 myhost.lan`
     - Calls `pihole restartdns`
   - Simple, robust, no dependency on internal web endpoints—good for infra automation.

### If you’re willing to move to v6:

- Use the **official REST API**:
  - Auth via `/api/auth`
  - Read/update via `/config` (and the `dns.hosts` section)
- This gives you clean, documented-ish endpoints for Local DNS and is the “future-proof” path. citeturn0search10turn0search1

---

## 4. Summary in plain terms

- **Does Pi-hole have an API?**\
  Yes, there’s an HTTP API. In v5 it’s mostly internal/underdocumented; in v6 there’s a proper REST API.

- **Can you use it to dynamically add Local DNS entries?**
  - **v5:** Not via a nice official REST endpoint, but you can:
    - Use community scripts that hit the existing web endpoints, or
    - Directly modify Pi-hole’s custom DNS files and restart DNS.
  - **v6:** Yes, the new **`/config`** REST API lets you manage `dns.hosts` (Local DNS) in a supported way.

If you tell me which version you’re running and what your preferred automation stack is (PowerShell, Bash, Python, Ansible, etc.), I can sketch a concrete example for you (e.g., a small script that adds `hostname.domain` → `IP` to Pi-hole automatically).


#### You:
Search for a community project that actually provides this functionality for pi.hole version 5.

#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
Yes — there *is* a community project that does exactly this for Pi-hole 5.

### 1. Bash-based API wrapper (my main recommendation)

**Project:** `f-fritz/pihole_customdns_api` citeturn1view0

What it is:

- A **Bash script** that talks directly to the Pi-hole **HTTP API** to manage the same “Local DNS → DNS Records” entries you see in the web UI.
- It was originally written for Pi-hole 5 and then updated for v6 auth; the core logic (add/remove/list custom DNS) works against v5’s HTTP API as well. citeturn1view0

Key features:

- **Add** custom A/AAAA records
- **Overwrite** existing entries
- **Remove** entries
- **Get**/list all custom DNS entries

From the README: citeturn1view0

```bash
Usage: ./pihole-customdns.sh [--add [--overwrite]] | [--remove] | [--get] <domain> <ip_address>
  --add           Add a custom DNS entry (default action if no flag provided)
  --overwrite     Overwrite an existing entry if the IP doesn't match
  --remove        Remove a custom DNS entry
  --get           List all existing custom DNS entries
  <domain>        Domain name for the custom DNS entry
  <ip_address>    IP address for the custom DNS entry
Examples:
  ./pihole-customdns.sh --add example.com 192.168.1.100
  ./pihole-customdns.sh --add --overwrite example.com 192.168.1.200
  ./pihole-customdns.sh --remove example.com 192.168.1.200
  ./pihole-customdns.sh --get
```

How you’d typically use it in your world:

- Drop it on the Pi-hole host.
- Configure `.env` with Pi-hole URL + API password.
- Call it from:
  - PowerShell (`ssh pi@pihole ./pihole-customdns.sh --add …`)
  - Datto RMM / N-Able scripts
  - Any automation that needs to dynamically register or remove local A records for VMs, containers, customer sites, etc.

It’s basically a thin, ready-made API layer around Pi-hole 5’s local DNS feature.

---

### 2. Node.js REST API service (alternative approach)

**Project:** `bistaalish/pihole-dns-api` (PIHole DNS Record Manager) citeturn2view0

What it does:

- Runs a **Node.js HTTP server** that exposes REST endpoints to manage records stored in `/etc/pihole/home.list`, then **restarts `pihole-FTL`** after each change so they take effect. citeturn2view0
- Endpoints include:
  - `POST /add` — add a record (JSON body `{ "IP": "...", "record": "host.domain" }`)
  - `POST /delete` — remove a record
  - `GET /reset` — reset to a saved “old” list
  - `GET /` — list all current records citeturn2view0

Because it manipulates the list file + restarts FTL, it’s effectively **version-agnostic** and works fine with Pi-hole 5 as long as your instance actually uses that file. (You’d just want to confirm whether your local DNS records are mapped through `home.list` vs `custom.list` on your specific install.)

---

### TL;DR for you

If you want **“no extra service, just a tool I can script against”** for Pi-hole 5:

> Use **`pihole_customdns_api`** — it’s a small Bash script that turns Pi-hole 5’s local DNS into an actual, scriptable API (add/remove/list). citeturn1view0

If you’d rather have a **proper REST microservice** sitting in front of Pi-hole:

> Use **`pihole-dns-api`** — Node.js app exposing `/add`, `/delete`, etc., and handling the file edits + FTL restart for you. citeturn2view0

If you tell me which one smells better to you (Bash vs Node), I can sketch a concrete integration example (e.g., a PowerShell function or RMM script) around it.


#### You:
Does the bash-based one also provide a means to restart whatever part of the pie hole Service would be necessary in order for the new records to be loaded up so that they become effective and start getting served out?

#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
Short answer: **it doesn’t have its *own* “restart DNS” step – and it doesn’t need one.**

Here’s what’s going on:

- The `pihole_customdns_api` script simply talks to the **same HTTP endpoints that the Pi-hole web UI and `pihole -a addcustomdns` use** to add/remove custom DNS entries. citeturn2view0
- When Pi-hole adds a custom DNS entry via its own tools, it automatically **reloads the DNS server (FTL) so the change takes effect** – you can see this in the CLI output for `pihole -a addcustomdns`, which explicitly shows:\
  `"[✓] Adding custom DNS entry..."` followed by `"[✓] Restarting DNS server"`. citeturn4search1
- The web UI does the same kind of thing under the hood: when you add records there, it calls internal commands that reload lists and flush cache as needed. citeturn4search4

Because the Bash script is just driving that **same HTTP API**, the “reload / restart the DNS part” behavior is handled *by Pi-hole itself*. From your perspective:

> **You run the script → it adds/removes the record via the HTTP API → Pi-hole reloads DNS → the new record starts getting served.**

So:

- **No**, the script doesn’t expose an extra “restart FTL” command.
- **Yes**, records added with the script become effective right away, just like if you added them in the UI.

If you *want* an explicit safety belt, you can always wrap it in your own helper, e.g.:

```bash
./pihole-customdns.sh --add host.example.lan 192.168.1.50
pihole restartdns reload
```

(or `docker exec pihole pihole restartdns reload` in a containerized setup), but in normal use with the HTTP API you shouldn’t need that.


#### You:
OK. Does it have any way for us to make sure that it stays up and running? And or any type of health check?

#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
Good question to ask before you start wiring automation into it.

Short version:

- That Bash script is **not a daemon** – there’s nothing to “keep running”.
- It also does **not** ship with a built-in health check endpoint.
- Health/uptime is really about **Pi-hole itself**, and you can absolutely monitor that.

Let me break it down simply and give you concrete options.

---

## 1. Script vs Service

The `pihole_customdns_api` Bash script:

- Is a **one-shot CLI tool**.
- You call it, it does its thing, it exits.
- There’s no background process or listener to crash or hang.

So there’s nothing to “keep up” like a Node/Go microservice. Reliability is:

> “Is the Pi-hole API reachable, and does the script return exit code 0?”

You can build your own checks around that very easily.

---

## 2. Health-checking Pi-hole itself

Here are practical things you can monitor to be confident that:

1. Pi-hole is up
2. Custom DNS entries are working
3. The script is functioning

### A. DNS-level health check (most meaningful)

From any monitoring system or cron:

```bash
dig +short my-test-host.lan @PIHOLE_IP
```

- Expect a specific IP (e.g. `192.168.1.50`).
- If it returns that IP → DNS + custom host are working.
- If it times out or returns nothing → Pi-hole or FTL is unhappy.

You can wrap this in a small script that exits non-zero when it fails, and have your monitoring (or RMM) alert on that.

---

### B. API-level health check

Pi-hole’s API can return status/summary; hitting that tells you:

- Web interface is up
- FTL is talking to the web part
- Auth (if any) is working

Example (no token / example URL):

```bash
curl -s "http://pihole.lan/admin/api.php?summary"
```

You should get JSON back (even if partially redacted). Non-200 or empty? Something’s wrong.

If using an API token:

```bash
curl -s "http://pihole.lan/admin/api.php?summaryRaw&auth=${PIHOLE_API_TOKEN}"
```

You can have your monitoring verify:

- HTTP 200
- JSON contains expected fields (e.g. `"status":"enabled"` or `"dns_queries_today"`).

---

### C. Script-level “self-check”

Because the Bash wrapper is just a CLI tool, you can use it itself as a health check:

1. **“List” check** (read-only)

If it supports a “get/list” mode (which it does), run from cron or RMM:

```bash
./pihole-customdns.sh --get >/dev/null 2>&1
RESULT=$?

if [ $RESULT -ne 0 ]; then
  echo "Pi-hole custom DNS API script failed with exit code $RESULT"
  # trigger alert / send to your monitoring, etc.
fi
```

If that returns 0 consistently, the script can:

- Reach the Pi-hole web API
- Auth correctly
- Parse a response

2. **Test record add/remove** (more thorough)

For deeper checks (maybe daily, not every minute):

```bash
TEST_HOST="healthcheck-pihole.local"
TEST_IP="192.0.2.123"

# Add test record
./pihole-customdns.sh --add "$TEST_HOST" "$TEST_IP" || exit 1

# Verify over DNS
RESOLVED_IP=$(dig +short "$TEST_HOST" @PIHOLE_IP)
[ "$RESOLVED_IP" = "$TEST_IP" ] || exit 2

# Clean up
./pihole-customdns.sh --remove "$TEST_HOST" "$TEST_IP" || exit 3
```

Hook that into your monitoring and alert on non-zero exit codes.

---

## 3. “Keeping it up” from a service perspective

If you *do* want a **service** to front this (e.g., a REST API your tools call):

- You can wrap the Bash script in a tiny systemd service plus a small HTTP wrapper (Python Flask, Node, whatever).
- Then:
  - Use `systemd`’s `Restart=on-failure` for the HTTP service.
  - Health check the HTTP endpoint (`/health`) which just calls `./pihole-customdns.sh --get` and returns 200/500 accordingly.

But that’s something *you*’d add — the Bash project itself is not a long-running service.

---

## 4. What I’d recommend for you specifically

Given you run an MSP and already have RMM/monitoring:

1. **Primary health check**
   - A DNS check from your monitoring system:
     - `dig` against Pi-hole for a known custom record.
2. **Secondary (optional) API/script check**
   - Periodic `./pihole-customdns.sh --get` and alert on non-zero exit code.
3. **If you later wrap it with a web service**
   - Add a `/health` endpoint that:
     - Does a quick `--get` call
     - Returns HTTP 200/500
   - Put that under your normal HTTP health checks / uptime robot.

If you tell me which monitoring stack you’re using most (Datto, N-able, Zabbix, PRTG, etc.), I can sketch an exact health-check script or sensor definition you can drop in.


#### You:
Well, I want something that is exposed via HTTP so I can hit it with an MCP server or rest client or curl client, in order to allow for means of utilizing it from multiple different clients.

#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
Gotcha—that makes sense.

**Direct answer:**\
The Bash-based `pihole_customdns_api` **is *not* an HTTP service**. It’s just a CLI that calls Pi-hole’s existing HTTP endpoints under the hood. So you **can’t** hit it directly from a REST client/MCP tool; you’d need a thin HTTP wrapper or a different project.

---

## Option 1 – Use an existing HTTP API service (Node.js)

There *is* a small Node service that already exposes Pi-hole custom DNS over HTTP:

**Project:** `bistaalish/pihole-dns-api` citeturn0view0

- Runs as a Node app (daemon) on your Pi-hole box.
- Stores A-records in `/etc/pihole/home.list`.
- **Automatically restarts `pihole-FTL`** after every change so records take effect. citeturn0view0
- Exposes simple HTTP endpoints:

  - `POST /add` – add a record
    - JSON body: `{"IP":"192.168.10.1","record":"test.home.lab"}`
  - `POST /delete` – delete a record
  - `GET /` – list all records
  - `GET /reset` – restore from `home.list.old` citeturn0view0

Example `curl` to add a record:

```bash
curl -X POST http://pihole-host:3000/add \
  -H "Content-Type: application/json" \
  -d '{"IP":"192.168.10.1","record":"test.home.lab"}'
```

That’s already exactly the shape you want for a generic MCP tool / REST client.

---

## Option 2 – Wrap the Bash script with your own tiny HTTP API

If you *really* like the Bash script’s behavior and want to keep using it, you can put a tiny HTTP server in front of it.

For example (pseudo-Flask style):

```python
from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.post("/dns")
def add_record():
    data = request.get_json()
    host = data["host"]
    ip = data["ip"]
    result = subprocess.run(
        ["/usr/local/bin/pihole-customdns.sh", "--add", host, ip],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return jsonify({"ok": False, "stderr": result.stderr}), 500
    return jsonify({"ok": True})

@app.delete("/dns")
def delete_record():
    data = request.get_json()
    host = data["host"]
    ip = data["ip"]
    result = subprocess.run(
        ["/usr/local/bin/pihole-customdns.sh", "--remove", host, ip],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return jsonify({"ok": False, "stderr": result.stderr}), 500
    return jsonify({"ok": True})

# then run under gunicorn/systemd, etc.
```

Then you can hit:

```bash
curl -X POST http://pihole-host:5000/dns \
  -H "Content-Type: application/json" \
  -d '{"host":"test.home.lab","ip":"192.168.10.1"}'
```

From any client (MCP, scripts, RMM, etc.).

---

## Which should you pick?

- **Want something ready-made & HTTP-native?**\
  Use **`pihole-dns-api`** (Node) and point your MCP server / REST clients at it. citeturn0view0

- **Want to keep the Bash script and are comfortable running a tiny web shim?**\
  Wrap `pihole_customdns_api` with a microservice (Python/Node/Go) like in the example above.

If you tell me your preferred runtime (Node vs Python vs “meh, whatever”), I can sketch a more concrete, production-ish wrapper (with a `/health` endpoint, simple auth, etc.) tailored to that.


#### You:
No, I do not need to use the bash version. I am perfectly happy to use the existing node solution that someone else already built.

#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
\[Unsupported Content]


#### ChatGPT:
Perfect, that makes this nice and straightforward.

Here’s how I’d suggest you use the **Node-based PIHole DNS Record Manager (`pihole-dns-api`)** as your HTTP-facing layer.

---

## 1. What this Node service gives you

From the GitHub repo: it’s a Node.js app that:

- Listens on HTTP (default **port 3000**). citeturn0search0
- Stores A records in `/etc/pihole/home.list`.
- **Restarts `pihole-FTL` after each change**, so records become active immediately. citeturn0search0
- Exposes these endpoints:

  - `POST /add` – add a record
    - JSON: `{ "IP": "192.168.10.1", "record": "test.home.lab" }`
  - `POST /delete` – delete a record (same JSON body)
  - `GET /reset` – restore `/etc/pihole/home.list` from `/etc/pihole/home.list.old`
  - `GET /` – list all records in `/etc/pihole/home.list` citeturn0search0

That’s exactly what you need for MCP / REST / curl clients.

---

## 2. Basic install steps (on your Pi-hole box)

On the Pi-hole host (or a sidecar VM/container that can reach `/etc/pihole` and `systemctl`):

```bash
# 1) Install Node.js if not present (example for Debian/Ubuntu)
sudo apt update
sudo apt install -y nodejs npm

# 2) Clone the repo
cd /opt
sudo git clone https://github.com/bistaalish/pihole-dns-api.git
cd pihole-dns-api

# 3) Install dependencies
sudo npm install

# 4) Start it
npm start
```

By default this will listen on port **3000** (you can change that in `index.js`). citeturn0search0

You’ll probably want to turn it into a systemd service later so it starts on boot — I can sketch that if you’d like.

---

## 3. How you’ll call it (from MCP/REST/curl/etc.)

### Add a record

```bash
curl -X POST http://pihole-host:3000/add \
  -H "Content-Type: application/json" \
  -d '{"IP":"192.168.10.10","record":"app.lab.local"}'
```

### Delete a record

```bash
curl -X POST http://pihole-host:3000/delete \
  -H "Content-Type: application/json" \
  -d '{"IP":"192.168.10.10","record":"app.lab.local"}'
```

### List all records

```bash
curl http://pihole-host:3000/
```

That is exactly the shape an MCP server or any generic HTTP client can consume.

---

## 4. Health checking it

Since this is a real HTTP service, you can:

- Have your monitoring / RMM / MCP do:
  - `GET http://pihole-host:3000/` and check for HTTP 200 + valid body.
- Or add a dedicated `/health` route (tiny change in `index.js`) that:
  - Returns 200 if it can read `/etc/pihole/home.list` and maybe run a lightweight `pihole-FTL` status check.

---

## 5. A couple of “gotchas” to keep in mind

- The project **assumes `/etc/pihole/home.list`** is the file Pi-hole loads; that’s fine on many setups, but:
  - Just verify that your Pi-hole actually uses that file (or adjust the path in `index.js`).
- It restarts `pihole-FTL` on every add/delete/reset, which is great for correctness, but:
  - Don’t hammer it with hundreds of changes per second.
  - If you need bulk changes, we can adapt the flow (e.g., batch updates + single restart).

---

If you tell me where you’re planning to run this (bare Pi, Docker Pi-hole, VM, etc.) and what your MCP server expects (plain HTTP, bearer token, etc.), I can give you a more tailored “drop this in `index.js` and this in `/etc/systemd/system/...`” setup.
