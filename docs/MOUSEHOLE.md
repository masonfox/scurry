# Mousehole Integration

Scurry can integrate with [mousehole](https://github.com/t-mart/mousehole) to automatically manage MAM session tokens. This eliminates the need for manual token updates when your IP address changes.

## What is Mousehole?

Mousehole is a background service that automatically updates your seedbox IP address with MyAnonamouse (MAM). It monitors your IP address and autonomous number (AS), and updates MAM whenever they change.

## Benefits of Integration

- **Automatic token rotation**: When your IP changes, mousehole updates MAM and generates a new session token
- **No manual intervention**: Scurry automatically reads the latest token from mousehole's state file
- **Centralized management**: One service (mousehole) manages tokens for all your applications
- **Fallback support**: If mousehole is unavailable, Scurry can still use a static token file

## How It Works

1. Mousehole monitors your IP address and communicates with MAM
2. When an IP change is detected, mousehole updates MAM and receives a new session token
3. Mousehole stores this token in a `state.json` file
4. Scurry reads the token from this file (URL-decodes it) and uses it for MAM API calls
5. If the state file is unavailable, Scurry falls back to reading from `secrets/mam_api_token`

## Setup Instructions

### 1. Enable Mousehole Mode in Scurry

Add these environment variables to your `.env` file:

```bash
MOUSEHOLE_ENABLED=true
MOUSEHOLE_STATE_FILE=secrets/state.json
```

**Environment Variables:**

- `MOUSEHOLE_ENABLED`: Set to `true` to enable mousehole integration (default: `false`)
- `MOUSEHOLE_STATE_FILE`: Path to mousehole's state file (default: `secrets/state.json`)

### 2. Docker Compose Setup (Recommended)

Use the provided `docker-compose.mousehole.yml` as a reference, or modify your existing `docker-compose.yml`:

```yaml
services:
  mousehole:
    image: tmmrtn/mousehole:latest
    environment:
      TZ: Etc/UTC
    volumes:
      - mam_secrets:/srv/mousehole
    ports:
      - "5010:5010"
    restart: unless-stopped

  scurry:
    image: ghcr.io/yourusername/scurry:latest
    env_file: .env
    environment:
      MOUSEHOLE_ENABLED: "true"
      MOUSEHOLE_STATE_FILE: /app/secrets/state.json
    volumes:
      - mam_secrets:/app/secrets
    ports:
      - "3000:3000"
    depends_on:
      - mousehole
    restart: unless-stopped

volumes:
  mam_secrets:
```

**Key Points:**

- Both services mount the same Docker volume (`mam_secrets`)
- Mousehole writes to `/srv/mousehole/state.json` (default location)
- Scurry reads from `/app/secrets/state.json` (mounted read-only with `:ro`)
- The volume persists tokens across container restarts

### 3. Start the Services

```bash
# Using the mousehole compose file
docker compose -f docker-compose.mousehole.yml up -d

# Or if you've modified your main compose file
docker compose up -d
```

### 4. Configure Mousehole

1. Open the mousehole web UI at `http://localhost:5010`
2. Enter your MAM cookie (follow mousehole's instructions for obtaining this)
3. Mousehole will begin monitoring your IP and managing tokens

### 5. Verify Integration in Scurry

1. Open Scurry at `http://localhost:3000`
2. Navigate to the Settings page
3. The Token Manager should show:
   - "Token Managed by Mousehole" banner
   - Current token status (read-only)
   - Last update timestamp
   - Token source file path

## User Interface Changes

When mousehole mode is enabled, the Token Manager UI changes to a **read-only view**:

- ✅ Displays current token status and metadata
- ✅ Shows last update timestamp from mousehole
- ✅ Indicates the token source file
- ❌ Create/Update/Delete buttons are hidden
- ❌ Token input field is disabled

You'll see a purple banner stating: **"Token Managed by Mousehole"**

## Token Format

Mousehole stores tokens in URL-encoded format (e.g., `7r%2FaloY3%2B...`). Scurry automatically:

1. Reads the `currentCookie` field from `state.json`
2. URL-decodes it using `decodeURIComponent()`
3. Sends the decoded token to MAM APIs as: `Cookie: mam_id=${token}`

## Fallback Behavior

Scurry implements a graceful fallback chain:

1. **Primary**: Read from mousehole's `state.json` (if `MOUSEHOLE_ENABLED=true`)
2. **Fallback**: If state.json is missing/unreadable, read from `secrets/mam_api_token`
3. **Error**: If neither source is available, API calls will fail with token error

**Fallback Logs:**

```
Mousehole state file not found at secrets/state.json, falling back to static token
```

or

```
Failed to read from mousehole, falling back to static token: [error details]
```

## API Behavior

### GET `/api/mam-token`

Returns token information with mousehole metadata:

```json
{
  "exists": true,
  "token": "abcdef...wxyz",
  "fullLength": 292,
  "location": "secrets/state.json",
  "mouseholeInfo": {
    "enabled": true,
    "stateFile": "secrets/state.json",
    "lastUpdate": "2026-01-23T14:50:23.715-05:00",
    "mamUpdated": true
  }
}
```

### POST `/api/mam-token`

**Blocked in mousehole mode** - returns:

```json
{
  "error": "Token management is disabled when MOUSEHOLE_ENABLED=true. Tokens are managed by mousehole."
}
```

HTTP Status: `400 Bad Request`

### DELETE `/api/mam-token`

**Blocked in mousehole mode** - returns the same error as POST.

## Troubleshooting

### Issue: "Waiting for mousehole..." shown in Token Manager

**Cause**: Mousehole hasn't created the `state.json` file yet, or the volume mount is incorrect.

**Solutions:**

1. Check that mousehole is running: `docker ps | grep mousehole`
2. Verify mousehole has been configured with your MAM cookie
3. Check volume mounts: `docker inspect scurry | grep Mounts -A 10`
4. Manually trigger a check in mousehole's web UI

### Issue: Token appears but API calls fail with "Invalid cookie"

**Cause**: Token format issue or mousehole's token is out of sync.

**Solutions:**

1. Check mousehole logs: `docker logs mousehole`
2. Look for "Invalid session" errors in mousehole
3. Verify your IP matches the one registered in MAM
4. Reconfigure mousehole with a fresh MAM cookie

### Issue: Scurry logs show "Failed to read from mousehole"

**Cause**: Permission issues or state.json is malformed JSON.

**Solutions:**

1. Check file permissions: `docker exec scurry ls -la /app/secrets/`
2. Verify state.json is valid JSON: `docker exec mousehole cat /srv/mousehole/state.json | jq`
3. Ensure the volume mount path is correct in docker-compose.yml
4. Try recreating the volume: `docker volume rm mam_secrets && docker compose up -d`

### Issue: "MAM token has expired" errors

**Cause**: Mousehole may not be updating fast enough, or IP changed very recently.

**Solutions:**

1. Check mousehole's check interval: `MOUSEHOLE_CHECK_INTERVAL_SECONDS` (default: 300s)
2. Manually trigger a check in mousehole's web UI
3. Verify your seedbox/VPN IP hasn't been blacklisted by MAM
4. Check mousehole's last successful update timestamp

### Issue: Want to temporarily use manual token management

**Solution**: Set `MOUSEHOLE_ENABLED=false` in your `.env` file and restart Scurry:

```bash
docker compose restart scurry
```

You can then use the standard Token Manager UI to manually set a token in `secrets/mam_api_token`.

## Volume Mount Strategies

### Shared Named Volume (Recommended)

**Best for:** Production setups, multiple containers

```yaml
volumes:
  - mam_secrets:/srv/mousehole  # Mousehole writes
  - mam_secrets:/app/secrets:ro # Scurry reads (read-only)

volumes:
  mam_secrets:  # Docker manages the volume
```

**Pros:**
- Clean separation of concerns
- Survives container deletion
- Easy to backup (`docker volume inspect mam_secrets`)

### Bind Mount Strategy

**Best for:** Development, debugging

```yaml
volumes:
  - ./data/mousehole:/srv/mousehole
  - ./data/mousehole:/app/secrets:ro

# On host machine:
# mkdir -p ./data/mousehole
```

**Pros:**
- Easy to inspect files on host
- Can manually edit state.json for testing
- No volume cleanup needed

### Network-Based Approach (Future Enhancement)

Instead of file sharing, Scurry could call mousehole's API:

```javascript
// Hypothetical API endpoint
const res = await fetch('http://mousehole:5010/api/token');
const { token } = await res.json();
```

**Pros:**
- No shared volumes required
- More flexible for distributed setups

**Cons:**
- Requires mousehole API implementation
- Adds network dependency

*Note: This approach is not currently implemented.*

## Disabling Mousehole Integration

To switch back to manual token management:

1. Set `MOUSEHOLE_ENABLED=false` in `.env`
2. Restart Scurry: `docker compose restart scurry`
3. Use the Token Manager UI to manually configure a token
4. (Optional) Stop mousehole: `docker compose stop mousehole`

The fallback mechanism ensures Scurry continues to function even if mousehole is stopped.

## Security Considerations

1. **Read-Only Mount**: Scurry mounts the secrets volume as read-only (`:ro`) to prevent accidental modifications
2. **Token Masking**: Tokens are masked in the UI (e.g., `abcdef...wxyz`) for security
3. **No Token Editing**: POST/DELETE endpoints are blocked in mousehole mode to prevent conflicts
4. **File Permissions**: Docker ensures proper ownership with the `app:app` user

## Advanced Configuration

### Custom State File Location

If mousehole stores its state file in a non-standard location:

```bash
# In Scurry's .env
MOUSEHOLE_ENABLED=true
MOUSEHOLE_STATE_FILE=/custom/path/to/state.json
```

Adjust volume mounts accordingly:

```yaml
volumes:
  - custom_location:/custom/path:ro
```

### Multiple Scurry Instances with One Mousehole

You can run multiple Scurry instances reading from the same mousehole:

```yaml
services:
  mousehole:
    # ... mousehole config ...

  scurry-books:
    # ... scurry config ...
    volumes:
      - mam_secrets:/app/secrets:ro

  scurry-audiobooks:
    # ... another scurry instance ...
    volumes:
      - mam_secrets:/app/secrets:ro  # Same volume, different instance
```

Both instances will read the same token without conflicts.

## Related Links

- [Mousehole GitHub Repository](https://github.com/t-mart/mousehole)
- [Mousehole Docker Hub](https://hub.docker.com/r/tmmrtn/mousehole)
- [MAM Security Preferences](https://www.myanonamouse.net/preferences/index.php?view=security)

## Changelog

- **v2.1.0**: Initial mousehole integration support
  - Added `MOUSEHOLE_ENABLED` and `MOUSEHOLE_STATE_FILE` environment variables
  - Implemented automatic token reading from state.json
  - Added fallback to static token file
  - Updated Token Manager UI with read-only mousehole view
  - Blocked POST/DELETE token endpoints in mousehole mode

## Contributing

Found a bug or have a feature request? Please open an issue on the [Scurry GitHub repository](https://github.com/yourusername/scurry/issues).
