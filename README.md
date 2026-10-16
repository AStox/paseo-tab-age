# tab-age

Paseo plugin that colours agent tabs by how long since you last talked to them.

- green: running, or touched in the last 2 hours
- yellow: under 16 hours
- orange: under 48 hours
- red: older than that

The daemon side prefixes each agent title with a coloured square. On web, the client side hides the square and draws a coloured underline on the tab instead.

## install

```bash
paseo plugin add AStox/paseo-tab-age
```

From a checkout:

```bash
paseo plugin install /absolute/path/to/paseo-tab-age
```

Needs Paseo 0.8 or later with plugins turned on for the daemon.
