# Reporting Rule

To ensure project integrity and maintain an audit trail of architectural boundaries, the following rules are mandatory for every future task (ITEM):

1. **Artifact Creation**: Every future ITEM run must create a documentation file named `docs/item-XX-final-report.md` (where XX is the item number).
2. **Commit Coupling**: Reports must be committed in the same commit (or update set) as the code changes they describe.
3. **Change Tracking**: Reports must include a list of changed files. This list should be derived from `git diff --name-only` or an equivalent command.
4. **Boundary Verification**: Reports must explicitly confirm that locked Studio Core files (as defined in `README.md`) remain unchanged.
5. **Report Format**: The report must follow the standardized `---BEGIN FINAL REPORT---` template.
