import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCache } from './scout-service.js';
import { TOOLKITS_DIR, TOOLS_DIR } from './toolkit-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function shouldRun(config) {
  const lastAudit = config?.maintenance?.last_audit;
  if (!lastAudit) return true;
  const days = config?.maintenance?.auto_trigger_days || 30;
  const lastDate = new Date(lastAudit);
  const now = new Date();
  const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  return diffDays >= days;
}

export function audit() {
  const today = new Date().toISOString().split('T')[0];
  const cache = loadCache();
  const actionRequired = [];
  const allClear = [];
  const staleThresholdDays = 180;

  for (const [name, entry] of cache) {
    const issues = [];
    if (entry.last_evaluated) {
      const evalDate = new Date(entry.last_evaluated);
      const daysSinceEval = Math.floor((new Date() - evalDate) / (1000 * 60 * 60 * 24));
      if (daysSinceEval > staleThresholdDays) {
        issues.push(`Evaluation is ${daysSinceEval} days old, needs re-evaluation`);
      }
    }
    if (entry.vulnerabilities && parseInt(entry.vulnerabilities) > 0) {
      issues.push(`${entry.vulnerabilities} known vulnerabilities`);
    }
    if (typeof entry.rating === 'number' && entry.rating <= 2) {
      issues.push(`Low rating (${entry.rating}/5) — consider alternatives`);
    }
    if (issues.length > 0) {
      actionRequired.push({
        package: name,
        issue: issues.join('; '),
        severity: entry.vulnerabilities > 0 ? 'HIGH' : 'MEDIUM',
        recommendation: entry.vulnerabilities > 0 ? 'Upgrade or replace immediately' : 'Re-evaluate',
      });
    } else {
      allClear.push(name);
    }
  }

  // Check toolkit files exist and flag stale tools
  if (fs.existsSync(TOOLKITS_DIR)) {
    const indexFiles = fs.readdirSync(TOOLKITS_DIR).filter(f => f.endsWith('.index.yml'));
    for (const indexFile of indexFiles) {
      const content = fs.readFileSync(path.join(TOOLKITS_DIR, indexFile), 'utf-8');

      // Check for stale verified_date
      const dateMatch = content.match(/verified_date:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
      if (dateMatch) {
        const verifiedDate = new Date(dateMatch[1]);
        const daysSinceVerified = Math.floor((new Date() - verifiedDate) / (1000 * 60 * 60 * 24));
        if (daysSinceVerified > staleThresholdDays) {
          const agentMatch = indexFile.match(/^(\d{2}-.+)\.index\.yml$/);
          const agentName = agentMatch ? agentMatch[1] : indexFile;
          actionRequired.push({
            package: `toolkit:${agentName}`,
            issue: `Toolkit verified ${daysSinceVerified} days ago (${dateMatch[1]}), needs review`,
            severity: 'MEDIUM',
            recommendation: 'Re-evaluate tools: check for newer alternatives, deprecated tools, or security issues',
          });
        }
      } else {
        // No verified_date — flag as needing one
        actionRequired.push({
          package: `toolkit:${indexFile}`,
          issue: 'Missing verified_date field',
          severity: 'LOW',
          recommendation: 'Add verified_date to track toolkit freshness',
        });
      }

      // Check tool definition files exist
      const toolMatches = content.match(/id:\s*(.+)/g) || [];
      for (const match of toolMatches) {
        const toolId = match.replace('id:', '').trim();
        const toolPath = path.join(TOOLS_DIR, `${toolId}.tool.yml`);
        if (!fs.existsSync(toolPath)) {
          actionRequired.push({
            package: `toolkit:${toolId}`,
            issue: `Tool definition file missing: ${toolId}.tool.yml`,
            severity: 'LOW',
            recommendation: `Create ${toolPath}`,
          });
        }
      }
    }
  }

  const reportLines = [
    `# Maintenance Report — ${today}`,
    '',
  ];
  if (actionRequired.length > 0) {
    reportLines.push('## Action Required');
    for (const item of actionRequired) {
      reportLines.push(`- **${item.package}** [${item.severity}]: ${item.issue}. ${item.recommendation}`);
    }
    reportLines.push('');
  }
  if (allClear.length > 0) {
    reportLines.push('## All Clear');
    reportLines.push(`- ${allClear.join(', ')}: healthy, no issues.`);
    reportLines.push('');
  }
  reportLines.push('## Stats');
  reportLines.push(`- ${cache.size} packages tracked`);
  reportLines.push(`- ${actionRequired.length} need action`);
  reportLines.push(`- Last full audit: ${today}`);

  return {
    report: reportLines.join('\n'),
    actionRequired,
    allClear,
    stats: { tracked: cache.size, needsAction: actionRequired.length, lastAudit: today },
  };
}

// CLI interface — guarded
const _cliArg = process.argv[1] || '';
const _moduleUrl = fileURLToPath(import.meta.url);
if (_cliArg.replace(/\\/g, '/') === _moduleUrl.replace(/\\/g, '/')) {
  const [,, command] = process.argv;
  if (command === 'audit') {
    const result = audit();
    console.log(result.report);
  } else if (command === 'check') {
    const configPath = path.join(__dirname, '..', 'config.yml');
    let config = {};
    if (fs.existsSync(configPath)) {
      const { default: yamlLib } = await import('js-yaml');
      config = yamlLib.load(fs.readFileSync(configPath, 'utf-8'));
    }
    console.log(shouldRun(config) ? 'AUDIT_NEEDED' : 'OK');
  }
}
