/**
 * ModuleLoader - Dependency Injection with Topological Sort
 *
 * Automatically resolves module dependencies and initializes modules
 * in the correct order using topological sorting.
 *
 * Usage:
 *   const loader = new ModuleLoader();
 *   loader.register('stateManager', StateManagerModule, []);
 *   loader.register('eventsRepo', EventsRepositoryModule, ['firebaseService']);
 *   await loader.initializeAll();
 *   const eventsRepo = loader.get('eventsRepo');
 */

export class ModuleLoader {
  constructor() {
    // Module registry: Map<moduleName, { factory, deps, instance }>
    this.modules = new Map();

    // Initialization state
    this.initialized = new Set();
    this.initializing = new Set();

    // Debug mode
    this.debug = false;
  }

  /**
   * Register a module with its dependencies
   * @param {string} name - Module name (unique identifier)
   * @param {Function|Class} factory - Module factory function or class constructor
   * @param {string[]} dependencies - Array of dependency module names
   * @param {Object} options - Optional configuration
   * @param {boolean} options.singleton - Create singleton instance (default: true)
   */
  register(name, factory, dependencies = [], options = {}) {
    if (this.modules.has(name)) {
      console.warn(`[ModuleLoader] Module "${name}" already registered. Overwriting.`);
    }

    this.modules.set(name, {
      name,
      factory,
      dependencies,
      instance: null,
      singleton: options.singleton !== false
    });

    if (this.debug) {
      console.log(`[ModuleLoader] Registered module "${name}" with deps:`, dependencies);
    }
  }

  /**
   * Get a module instance (initializes if needed)
   * @param {string} name - Module name
   * @returns {*} Module instance
   */
  async get(name) {
    if (!this.modules.has(name)) {
      throw new Error(`[ModuleLoader] Module "${name}" not registered`);
    }

    const module = this.modules.get(name);

    // Return existing singleton instance
    if (module.singleton && module.instance) {
      return module.instance;
    }

    // Initialize module
    return await this._initialize(name);
  }

  /**
   * Initialize a specific module
   * @param {string} name - Module name
   * @returns {*} Module instance
   */
  async _initialize(name) {
    if (this.initialized.has(name)) {
      return this.modules.get(name).instance;
    }

    if (this.initializing.has(name)) {
      throw new Error(`[ModuleLoader] Circular dependency detected for module "${name}"`);
    }

    const module = this.modules.get(name);

    if (!module) {
      throw new Error(`[ModuleLoader] Module "${name}" not found`);
    }

    this.initializing.add(name);

    try {
      if (this.debug) {
        console.log(`[ModuleLoader] Initializing module "${name}"...`);
      }

      // Resolve dependencies first
      const resolvedDeps = await Promise.all(
        module.dependencies.map(depName => this.get(depName))
      );

      // Create instance
      let instance;
      if (typeof module.factory === 'function') {
        // Check if it's a class or factory function
        if (module.factory.prototype && module.factory.prototype.constructor === module.factory) {
          // It's a class
          instance = new module.factory(...resolvedDeps);
        } else {
          // It's a factory function
          instance = await module.factory(...resolvedDeps);
        }
      } else {
        instance = module.factory;
      }

      // Store singleton instance
      if (module.singleton) {
        module.instance = instance;
      }

      this.initialized.add(name);
      this.initializing.delete(name);

      if (this.debug) {
        console.log(`[ModuleLoader] Module "${name}" initialized`);
      }

      return instance;
    } catch (error) {
      this.initializing.delete(name);
      console.error(`[ModuleLoader] Error initializing module "${name}":`, error);
      throw error;
    }
  }

  /**
   * Initialize all modules in dependency order (topological sort)
   * @returns {Promise<Map>} Map of all initialized modules
   */
  async initializeAll() {
    const sortedNames = this._topologicalSort();

    if (this.debug) {
      console.log('[ModuleLoader] Initialization order:', sortedNames);
    }

    const results = new Map();

    for (const name of sortedNames) {
      try {
        const instance = await this.get(name);
        results.set(name, instance);
      } catch (error) {
        console.error(`[ModuleLoader] Failed to initialize "${name}":`, error);
        throw error;
      }
    }

    if (this.debug) {
      console.log('[ModuleLoader] All modules initialized successfully');
    }

    return results;
  }

  /**
   * Topological sort of modules based on dependencies
   * @returns {string[]} Sorted module names
   */
  _topologicalSort() {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (name) => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        throw new Error(`[ModuleLoader] Circular dependency detected involving "${name}"`);
      }

      visiting.add(name);

      const module = this.modules.get(name);
      if (module) {
        for (const depName of module.dependencies) {
          if (!this.modules.has(depName)) {
            throw new Error(`[ModuleLoader] Missing dependency "${depName}" for module "${name}"`);
          }
          visit(depName);
        }
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    // Visit all modules
    for (const name of this.modules.keys()) {
      visit(name);
    }

    return sorted;
  }

  /**
   * Check if a module is registered
   * @param {string} name - Module name
   * @returns {boolean} True if registered
   */
  has(name) {
    return this.modules.has(name);
  }

  /**
   * Unregister a module
   * @param {string} name - Module name
   */
  unregister(name) {
    this.modules.delete(name);
    this.initialized.delete(name);

    if (this.debug) {
      console.log(`[ModuleLoader] Unregistered module "${name}"`);
    }
  }

  /**
   * Clear all modules and reset state
   */
  clear() {
    this.modules.clear();
    this.initialized.clear();
    this.initializing.clear();

    if (this.debug) {
      console.log('[ModuleLoader] All modules cleared');
    }
  }

  /**
   * Get list of all registered module names
   * @returns {string[]} Array of module names
   */
  getModuleNames() {
    return Array.from(this.modules.keys());
  }

  /**
   * Get dependency graph as object
   * @returns {Object} Dependency graph { moduleName: [deps] }
   */
  getDependencyGraph() {
    const graph = {};
    for (const [name, module] of this.modules) {
      graph[name] = [...module.dependencies];
    }
    return graph;
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug mode enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[ModuleLoader] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get initialization status
   * @returns {Object} Status object with counts and lists
   */
  getStatus() {
    return {
      total: this.modules.size,
      initialized: this.initialized.size,
      pending: this.modules.size - this.initialized.size,
      initializedModules: Array.from(this.initialized),
      pendingModules: Array.from(this.modules.keys()).filter(
        name => !this.initialized.has(name)
      )
    };
  }
}

// Export singleton instance
export const moduleLoader = new ModuleLoader();
