# Release Process
## MARO Business Platform - Versioning & Tagging Workflow

### 1. Semantic Versioning Protocol
Version numbers follow `MAJOR.MINOR.PATCH` format:
- **MAJOR**: Structural architectural changes or major platform milestones.
- **MINOR**: Sprint releases introducing new enterprise modules or features (e.g. `0.7.0` -> `0.8.0`).
- **PATCH**: Emergency hotfixes or performance patches (`0.7.1`).

---

### 2. Release Gate Checklist
Prior to tagging a release:
1. **Verification**: `npm run lint` and `npm run build` must pass with zero warnings/errors.
2. **Documentation**: `CHANGELOG.md`, `PROJECT_STATUS.md`, and `FINAL_CHECKPOINT_X.md` must be updated.
3. **Git Tagging**: Create an annotated git tag:
   ```bash
   git tag -a v0.8.0 -m "MARO Enterprise Release v0.8.0 - Sprint 8"
   ```
4. **State Freeze**: Main release branch `release/sprint-X` frozen for deployment.
