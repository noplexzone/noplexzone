# No Plex Zone

Public landing page for [noplexzone.com](https://noplexzone.com).

No Plex Zone is a private, invite-only media hub. This site explains the hub, links users to allowed services, documents the invite flow, and provides donation links.

## Services linked

- Seerr — <https://request.noplexzone.com>
- Monitarr download queue — <https://monitarr.noplexzone.com>
- UptimeRobot public uptime — <https://stats.uptimerobot.com/YKTwO6RG4p>
- Wrapped — <https://wrapped.noplexzone.com>
- Komga — <https://comics.noplexzone.com>
- Invite redemption — <https://invite.noplexzone.com>

## Donations

- PayPal: <https://paypal.me/calebw999>
- Cash App: <https://cash.app/$CalebW317>

## Development

This is a static HTML/CSS/JS site. No build step is required.

```bash
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173>.

## Deployment recommendation

Cloudflare Pages is recommended for production because it keeps the custom domain independent of GitHub Pages repo ownership and provides simple deployment rollbacks on the free tier.
