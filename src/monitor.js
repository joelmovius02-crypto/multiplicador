const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SiteMonitor {
    constructor() {
        this.configPath = path.join(__dirname, 'sites-config.json');
        this.statePath = path.join(__dirname, '..', 'data', 'monitor-state.json');
        this.ensureDataDirectory();
        this.sites = this.loadConfig();
        this.state = this.loadState();
    }

    ensureDataDirectory() {
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('Error loading config:', error.message);
            return [];
        }
    }

    loadState() {
        try {
            if (fs.existsSync(this.statePath)) {
                const stateData = fs.readFileSync(this.statePath, 'utf8');
                return JSON.parse(stateData);
            }
        } catch (error) {
            console.error('Error loading state:', error.message);
        }
        return { sites: [], lastCheck: null };
    }

    saveState() {
        try {
            fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
        } catch (error) {
            console.error('Error saving state:', error.message);
        }
    }

    async checkSite(site) {
        const startTime = Date.now();
        let result = {
            url: site.url,
            name: site.name,
            checkTime: new Date().toISOString(),
            success: false,
            responseTime: null,
            status: null,
            error: null
        };

        try {
            const response = await axios.get(site.url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'SiteMonitor/1.0 (Render Background Worker)'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 600; // Resuelve para todos los códigos de estado
                }
            });

            result.responseTime = Date.now() - startTime;
            result.status = response.status;
            result.success = response.status >= 200 && response.status < 400;
            
            console.log(`${result.success ? '✅' : '❌'} ${site.name} (${site.url}) - ${response.status} - ${result.responseTime}ms`);

        } catch (error) {
            result.error = error.code || error.message;
            result.success = false;
            console.log(`❌ ${site.name} (${site.url}) - Error: ${result.error}`);
        }

        return result;
    }

    async checkAllSites() {
        console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking ${this.sites.length} sites...`);
        
        const results = [];
        for (const site of this.sites) {
            const result = await this.checkSite(site);
            results.push(result);
            
            // Pequeña pausa entre verificaciones para no saturar
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Actualizar estado
        this.state = {
            lastCheck: new Date().toISOString(),
            sites: results
        };
        
        this.saveState();
        console.log(`✓ Completed check at ${new Date().toLocaleTimeString()}`);
        
        return results;
    }

    start(intervalMinutes = 1) {
        console.log('🚀 Starting Site Monitor Background Worker');
        console.log(`⏰ Will check ${this.sites.length} sites every ${intervalMinutes} minutes`);
        console.log('─────────────────────────────────────────────');

        // Ejecutar inmediatamente
        this.checkAllSites();

        // Programar ejecuciones periódicas
        setInterval(() => {
            this.checkAllSites();
        }, intervalMinutes * 60 * 1000);
    }
}

// Iniciar el monitor si este archivo es ejecutado directamente
if (require.main === module) {
    const monitor = new SiteMonitor();
    monitor.start(5); // Verificar cada 5 minutos
}

module.exports = SiteMonitor;
