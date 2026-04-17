import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import path from 'node:path';

const VAULT_ROOT = process.env.VAULT_ROOT || '';

/** Vite plugin that watches the vault for .md changes and triggers a full reload. */
function vaultWatcher() {
  return {
    name: 'vault-watcher',
    configureServer(server) {
      if (!VAULT_ROOT) return;
      const notesDir = path.join(VAULT_ROOT, 'notes');
      const journalDir = path.join(VAULT_ROOT, 'journal');

      // Tell Vite's chokidar instance to watch the vault directories
      server.watcher.add([notesDir, journalDir]);

      server.watcher.on('all', (event, filePath) => {
        if (!filePath.endsWith('.md')) return;
        if (!filePath.startsWith(VAULT_ROOT)) return;

        // Invalidate the vault module so it re-reads on next request
        const vaultMod = server.moduleGraph.getModulesByFile(
          path.resolve('src/lib/vault.ts')
        );
        if (vaultMod) {
          for (const mod of vaultMod) {
            server.moduleGraph.invalidateModule(mod);
          }
        }

        console.log(`[vault-watcher] ${event}: ${path.relative(VAULT_ROOT, filePath)} — reloading`);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  integrations: [tailwind({ applyBaseStyles: false })],
  server: { host: '127.0.0.1', port: 4321 },
  vite: {
    plugins: [vaultWatcher()],
    server: { fs: { allow: ['..', VAULT_ROOT || '.'] } },
    resolve: { preserveSymlinks: true },
  },
});
