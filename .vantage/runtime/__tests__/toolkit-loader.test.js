import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadIndex, loadGeneralIndex, loadTool, listTools, listGeneralTools, listMergedTools, loadMergedIndex } from '../toolkit-loader.js';

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

  describe('loadGeneralIndex()', () => {
    it('returns YAML string for general toolkit', () => {
      const result = loadGeneralIndex();
      assert.ok(result.length > 0);
      assert.ok(result.includes('general'));
    });

    it('contains shared cross-cutting tools', () => {
      const result = loadGeneralIndex();
      assert.ok(result.includes('gate-validator'));
      assert.ok(result.includes('dependency-direction-validator'));
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

  describe('listGeneralTools()', () => {
    it('returns array of general tool summaries', () => {
      const tools = listGeneralTools();
      assert.ok(Array.isArray(tools));
      assert.ok(tools.length > 0);
      const ids = tools.map(t => t.id);
      assert.ok(ids.includes('gate-validator'));
    });
  });

  describe('listMergedTools()', () => {
    it('returns object with general and specialized arrays', () => {
      const result = listMergedTools('08-security-architect');
      assert.ok(result.general);
      assert.ok(result.specialized);
      assert.ok(Array.isArray(result.general));
      assert.ok(Array.isArray(result.specialized));
    });

    it('specialized tools take precedence on ID collision', () => {
      // gate-validator is in general toolkit — agents that DON'T have it specialized
      // should still see it in general
      const result = listMergedTools('08-security-architect');
      const generalIds = result.general.map(t => t.id);
      const specializedIds = result.specialized.map(t => t.id);
      // No ID should appear in both
      for (const id of generalIds) {
        assert.ok(!specializedIds.includes(id), `${id} should not appear in both general and specialized`);
      }
    });

    it('returns general tools for agent with no specialized toolkit', () => {
      const result = listMergedTools('99-nonexistent');
      assert.ok(result.general.length > 0);
      assert.deepEqual(result.specialized, []);
    });
  });

  describe('loadMergedIndex()', () => {
    it('returns combined YAML with general_tools and specialized_tools sections', () => {
      const result = loadMergedIndex('08-security-architect');
      assert.ok(result.includes('general_tools:'));
      assert.ok(result.includes('specialized_tools:'));
    });

    it('returns empty string when no tools exist', () => {
      // An agent with no index and no general toolkit would return empty
      // but since general toolkit exists, it should have content
      const result = loadMergedIndex('99-nonexistent');
      assert.ok(result.includes('general_tools:'));
    });

    it('includes source field for external toolkit repos', () => {
      const result = loadMergedIndex('16-ui-builder');
      assert.ok(result.includes('ui-ux-pro-max-skill'));
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
      it(`${agent} has ${toolCount} tools in specialized index`, () => {
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

    it('merged toolkit always includes general tools', () => {
      const agents = ['08-security-architect', '16-ui-builder', '00-orchestrator'];
      for (const agent of agents) {
        const merged = listMergedTools(agent);
        const allIds = [...merged.general.map(t => t.id), ...merged.specialized.map(t => t.id)];
        // Every general tool should appear somewhere (either in general or overridden in specialized)
        const generalTools = listGeneralTools();
        for (const gt of generalTools) {
          assert.ok(allIds.includes(gt.id), `General tool ${gt.id} should be available to ${agent}`);
        }
      }
    });
  });
});
