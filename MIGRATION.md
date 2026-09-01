# Migration Guide

This guide helps existing Scurry users upgrade to versions that use the new `config/` folder structure.

## What Changed?

Starting with this version, Scurry introduces a **`config/`** directory for persistent application settings:

- **`secrets/`** - Contains actual secrets (MAM API token, mousehole state) — unchanged
- **`config/`** - **New**: Contains application settings (qBittorrent connection, tags, categories)

`config/settings.json` is a **new file** created by this version. There is no prior `secrets/settings.json` to migrate from. On a fresh upgrade you only need to add the volume mount; the settings file will be created automatically when you configure settings via the UI.

### PUID/PGID Support

This version also adds runtime user/group ID configuration to prevent permission issues with mounted volumes:

- **Default UID/GID:** The container now runs as UID `1000` and GID `1000` by default
- **Customizable:** Set `PUID` and `PGID` environment variables to match your host user
- **Automatic ownership:** The entrypoint script attempts to adjust file ownership on startup

If you experience permission issues after upgrading, verify your UID/GID matches the container's runtime user (check startup logs) or explicitly set `PUID` and `PGID` environment variables.

## Who Needs to Migrate?

**You need to update your setup if:**
- You're using Docker or Docker Compose (you need to add the `config/` volume mount)

**You DON'T need to do anything if:**
- You're doing a fresh installation (just follow the normal setup)

## Migration Steps

### For Docker Compose Users

1. **Stop your container:**
   ```bash
   docker-compose down
   ```

2. **Create the config directory:**
   ```bash
   mkdir config
   ```

3. **Update your `docker-compose.yml`:**
   
   Add the config volume mount:
   ```yaml
   volumes:
     - ./secrets:/app/secrets
     - ./config:/app/config  # ADD THIS LINE
   ```

4. **Start your container:**
   ```bash
   docker-compose up -d
   ```

   The app will create `config/settings.json` automatically when you configure settings via the UI (`/settings`).

### For Docker Run Users

1. **Stop and remove your existing container:**
   ```bash
   docker stop scurry
   docker rm scurry
   ```

2. **Create the config directory on your host:**
   ```bash
   mkdir -p /VOLUME/scurry/config
   ```

3. **Start the container with the new volume mount:**
   ```bash
   docker run -d \
     --name scurry \
     --pull=always \
     -p 3000:3000 \
     -e APP_PASSWORD=PASSWORD \
     -e APP_QB_URL=URL \
     -e APP_QB_USERNAME=admin \
     -e APP_QB_PASSWORD=PASSWORD \
     -v /VOLUME/scurry/secrets:/app/secrets \
     -v /VOLUME/scurry/config:/app/config \
     --restart always \
     ghcr.io/masonfox/scurry:latest
   ```

   The app will create `config/settings.json` automatically when you configure settings via the UI.

### For Mousehole Integration Users

**Good news:** The mousehole integration is fully backward compatible! No changes needed to your mousehole setup.

The `secrets/` folder structure for MAM tokens and state files remains unchanged:
- `secrets/mam_api_token` - Still in the same location
- `secrets/state.json` - Still in the same location

Just add the `config/` volume mount as described above.

## Verification

After migration, verify everything works:

1. **Check the container logs:**
   ```bash
   docker-compose logs -f scurry
   # or
   docker logs -f scurry
   ```

2. **Access the web interface:**
   - Navigate to `http://your-server:3000`
   - Go to Settings page (`/settings`)
   - Verify your qBittorrent connection and settings are preserved

3. **Test a search:**
   - Perform a test search to ensure MAM integration works
   - Try downloading a torrent to verify qBittorrent connection

## Troubleshooting

### "Settings not loading" or "Connection failed"

**Cause:** Settings file wasn't moved or config volume isn't mounted.

**Solution:**
1. Check if `config/settings.json` exists
2. Verify the config volume mount in your docker-compose.yml or docker run command
3. Check container logs for file permission errors

### "MAM token not found"

**Cause:** The secrets volume mount is missing or incorrect.

**Solution:**
1. Verify `secrets/mam_api_token` exists on your host
2. Check the secrets volume mount in your docker configuration
3. For mousehole users, ensure the shared volume is correctly mounted

### "Permission denied" errors

**Cause:** Docker user doesn't have access to the config directory, or UID/GID mismatch between host and container.

**Solution:**
1. Check your host user's UID/GID: `id`
2. Set PUID/PGID environment variables to match:
   ```yaml
   environment:
     PUID: 1001  # Replace with your UID
     PGID: 1001  # Replace with your GID
   ```
3. Alternatively, fix permissions on the host:
   ```bash
   # Fix permissions (use your container's UID/GID, default 1000:1000)
   sudo chown -R 1000:1000 config secrets
   ```

## Rollback

If you need to rollback to the previous version:

1. Stop the container
2. Move settings back: `mv config/settings.json secrets/settings.json`
3. Remove the config volume mount from docker-compose.yml
4. Start the container with the previous image version

## Need Help?

If you encounter issues during migration:
- Check the [GitHub Issues](https://github.com/masonfox/scurry/issues)
- Review the [README.md](README.md) for updated documentation
- Create a new issue with your error logs and setup details
