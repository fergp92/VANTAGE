import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadIndex, loadTool, listTools } from '../toolkit-loader.js';

describe('toolkit-loader', () => {
  describe('loadIndex()', () => {
    it('returns YAML string for existing agent toolkit', () => {
      const result = loadIndex('08-security-architect');
      assert.ok(result.includes('stride-analysis'));
      assert.ok(result.includes('npm-audit-check'));
    });

    it('returns empty string for non-existent agent', () => {
      const result = loadIndex('99-nonexistent');
      assert.equal(result, '');
    });
  });

  describe('loadTool()', () => {
    it('returns full tool definition YAML', () => {
      const result = loadTool('stride-analysis');
      assert.ok(result.includes('STRIDE'));
      assert.ok(result.includes('Spoofing'));
      assert.ok(result.includes('component_name'));
    });

    it('returns empty string for non-existent tool', () => {
      const result = loadTool('nonexistent-tool');
      assert.equal(result, '');
    });
  });

  describe('listTools()', () => {
    it('returns array of tool summaries for an agent', () => {
      const tools = listTools('08-security-architect');
      assert.ok(Array.isArray(tools));
      assert.equal(tools.length, 5);
      assert.equal(tools[0].id, 'stride-analysis');
      assert.ok(tools[0].description.length > 0);
    });

    it('returns empty array for non-existent agent', () => {
      const tools = listTools('99-nonexistent');
      assert.deepEqual(tools, []);
    });
  });

  // Task 6 tests — will fail until all toolkit files created
  describe('all agent toolkits', () => {
    const expectedToolkits = [
      { agent: '02-requirements-architect', toolCount: 3 },
      { agent: '05-data-architect', toolCount: 3 },
      { agent: '06-integration-architect', toolCount: 3 },
      { agent: '15-frontend-architect', toolCount: 3 },
      { agent: '17-test-architect', toolCount: 3 },
      { agent: '25-innovation-scout', toolCount: 4 },
    ];

    for (const { agent, toolCount } of expectedToolkits) {
      it(`${agent} has ${toolCount} tools in index`, () => {
        const tools = listTools(agent);
        assert.equal(tools.length, toolCount, `${agent} should have ${toolCount} tools`);
      });
    }

    it('every tool referenced in an index has a corresponding .tool.yml file', () => {
      const agents = ['02-requirements-architect', '05-data-architect', '06-integration-architect', '08-security-architect', '15-frontend-architect', '17-test-architect', '25-innovation-scout'];
      for (const agent of agents) {
        const tools = listTools(agent);
        for (const tool of tools) {
          const def = loadTool(tool.id);
          assert.ok(def.length > 0, `Tool ${tool.id} (from ${agent}) should have a definition file`);
          assert.ok(def.includes(`id: ${tool.id}`), `Tool ${tool.id} definition should contain its own id`);
        }
      }
    });
  });
});
