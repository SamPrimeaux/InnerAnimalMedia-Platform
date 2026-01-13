# Auto-Sync Update Checker

## ✅ Setup Complete

Auto-sync update checking scripts have been created to monitor for package/dependency updates.

## Scripts

### 1. `scripts/check-updates.sh`
Bash script for quick update checking:
```bash
./scripts/check-updates.sh
```

Checks:
- Node.js packages (npm)
- Cloudflare Workers (Wrangler)
- Blender version
- Python packages (if requirements.txt exists)

### 2. `scripts/auto-check-updates.js`
Node.js script for automated update checking:
```bash
node scripts/auto-check-updates.js
```

Features:
- JSON parsing of npm outdated
- Detailed update report
- Exit code 1 if updates are needed (for CI/CD)

## Usage

### Manual Check
```bash
# Quick check
./scripts/check-updates.sh

# Detailed check
node scripts/auto-check-updates.js
```

### Automated (Cron/Scheduled)
Add to crontab for daily checks:
```bash
# Daily at 9 AM
0 9 * * * cd /path/to/project && node scripts/auto-check-updates.js
```

### CI/CD Integration
The `auto-check-updates.js` script exits with code 1 if updates are needed, making it perfect for CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Check for updates
  run: node scripts/auto-check-updates.js
```

## Output

The scripts will report:
- 📦 Outdated NPM packages (with versions)
- ☁️  Cloudflare Workers version
- 🎨 Blender version
- ⚠️  Any errors encountered

## Recommendations

- Run `check-updates.sh` weekly to stay updated
- Integrate `auto-check-updates.js` into your CI/CD pipeline
- Review updates before applying in production
