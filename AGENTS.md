# Engineering guide

Web Service Template provides a modular backend runtime. Its business modules follow hexagonal-inspired conventions. This guide applies across the repository to maintainers, contributors and coding agents. The [README](README.md) describes the running application and shows how to add a business module.

Apply the business conventions to new or explicitly refactored flows. Full DDD adoption, bulk renaming, workspace migration and downstream rollout each need their own scope. Choose domain modeling according to the business behavior.

**MUST** marks a verifiable requirement. **SHOULD** marks a default that permits a reasoned exception. **MAY** marks a choice. Examples illustrate the rules.

## Implementing a change

- **MUST** read this guide, the issue's accepted specification and the affected source and tests. In implementation and review prompts, explicitly ask the agent to read this guide. Check the base ref, scope, public behavior and assumptions about callers.
- **MAY** choose internal names, file layout and implementation details within the approved contracts. For a justified departure from a **SHOULD**, proceed and explain the trade-off in the PR.
- **MUST** raise **Decision Required** when a security requirement, fixed architecture constraint, explicitly promised public behavior or other **MUST** has an unresolved conflict. Pause only the affected work. Give the maintainer the requirement, source evidence, impact, smallest alternative and recommendation. Continue independent work. Once the maintainer resolves the conflict, record the decision in the canonical spec and resume.
- **MUST** obtain explicit scope for changes to public APIs, package boundaries, lifetimes, resource ownership, migrations or security behavior. An accepted spec can supply that authorization. Use the base branch to establish what runs today and the approved spec to establish what may change.

## Engineering principles

| ID | Principle | How to apply it |
| --- | --- | --- |
| AP01 | Template First | **MUST** identify the reusable scenario for a proposed shared capability. Keep product policy, deployment conventions and downstream test thresholds with their owner. |
| AP02 | Separation of Concerns | **SHOULD** group code by its reason to change. URL validation and query-log formatting, for example, serve different callers and have different failure modes. |
| AP03 | Explicit Composition | **MUST** make module and resource selection traceable to the composition root. Imports, constructors and registration declarations must leave external I/O and startup to explicit lifecycle calls. |
| AP04 | Dependency Injection | **MUST** identify the owner and lifetime of managed dependencies. Resolve or bind them at the composition boundary and pass them to business consumers explicitly. Pure functions and constants **MAY** be imported directly. |
| AP05 | Minimal Abstraction | **SHOULD** use an existing language, Node or library API when it meets the contract. For a new dependency, wrapper, factory or registry, give the concrete isolation or reuse need and the version and maintenance implications. |
| AP06 | Single Source of Truth | **MUST** give each configuration value, schema, type and resource one owner. Read tool versions and commands from the repository files that select or run them. |
| AP07 | Explicit Lifecycle | **MUST** distinguish declaration, construction, initialization, readiness, start and shutdown. Verify required resources before reporting readiness. Give each resource one cleanup owner, preserve the original startup error, and provide a cleanup trigger for every supported process type. |
| AP08 | Readability over Cleverness | **SHOULD** use names and direct control flow that expose the business decision. Follow the existing conventions for kebab-case files, PascalCase types and classes, and camelCase functions and members. Document public contracts, lifecycle constraints and non-obvious failures with JSDoc. |
| AP09 | Evolution over Accumulation | **MUST** preserve promised behavior until its change is authorized. For a transition, document the reason, affected consumers, exit condition and tracking issue. |
| AP10 | Architectural Integrity | **MUST** review observable behavior, dependencies, readability, compatibility and security. Support findings with a file or symbol, its impact and a feasible correction. |

## Architecture and business modules

- **MUST** keep the target import directions explicit. Application composition selects Core, shared Infrastructure and Business Modules. Core owns runtime and framework contracts. Infrastructure may depend on Core. A business module's wiring may use Core. Its adapters may use shared infrastructure and implement module-owned ports. Keep concrete infrastructure and business modules out of Core, and business modules out of shared infrastructure. Cross-module callers use the other module's public entry point.
- **MUST** apply the following boundary to new or explicitly refactored business flows. A use case that needs an external capability depends on a port owned by the consumer. The source dependencies are `Use case → Port ← Adapter`. At runtime the use case calls the injected implementation. Use cases and domain code must be independent of concrete adapters, ORM types and HTTP types.
- **MUST** express business outcomes in business terms. The HTTP boundary maps them to status codes and responses, in a controller or a shared HTTP error handler. `WebError` belongs there. A use case **MAY** use several ports. If required atomicity or consistency cannot be guaranteed through the existing contracts, raise **Decision Required** for that operation.
- **SHOULD** name modules after business capabilities and use cases after actions. Keep each port close to its consumer and persistence or integration code in the module's adapter. Introduce domain types and behavior when there is a business rule to express. Pure calculations **MAY** call domain functions directly. Create directories as their responsibilities appear. Framework services, ORM models and domain services may keep their established names.
- **MUST** respect the current one-process, one-active-application contract and deterministic `BaseModule` collection. Preserve the readonly snapshots, failure retry and process-wide route-token behavior when touching registration. Keep planned architecture separate from current runtime behavior. See the [module guide](README.md#dependency-collection-lifecycle) and [startup guide](src/core/types/README.md).
- **MUST** load application configuration through its canonical schema, typed transformation and injection path. A resource **MAY** validate its own options when selected, so a build or test without that resource can run. CLI tools may have their own explicit configuration entry point.
- **MUST** confirm the initial build and required code generation succeed before treating local startup as successful. Use a compiled entry point for production.

## Verification and review

- **MUST** exercise changed behavior through its public contract, including material failure and cleanup paths. Pure logic can use unit tests. Use integration or smoke tests when the claim concerns wiring or an external resource, and identify anything a test double leaves unverified.
- **MUST** choose checks from [package.json](package.json) and [CI](.github/workflows/ci.yaml). For code, run focused tests, needed code generation, source and spec type checks, formatting, lint and the applicable full test/build checks. Validate dependency and toolchain changes with a clean, frozen install. Preserve existing quality gates. For documentation, check the diff scope, links, commands and examples against the stated base.
- **MUST** use synthetic or local test inputs and keep real credentials out of the work. Production deployments, destructive migration/reset/seed operations, force pushes and merges require explicit authorization.
- **MUST** describe scope, issue, design decision, public API and migration impact, actual checks and results, exclusions and follow-up in the PR. Review functional correctness and architectural integrity. Cite the relevant AP ID and file or symbol for a finding. Distinguish an existing limitation, a regression introduced by the change, and an authorized transition.
