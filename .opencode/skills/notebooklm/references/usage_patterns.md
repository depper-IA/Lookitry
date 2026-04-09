# NotebookLM Skill - Usage Patterns

Best practices and workflow examples for the NotebookLM skill.

## Basic Workflows

### First-Time Setup

```bash
# 1. Check authentication status
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py status

# 2. If not authenticated, set up (browser will open for login)
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py setup

# 3. Add your first notebook
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "https://notebooklm.google.com/notebook/..." \
  --name "My Documentation" \
  --description "Technical documentation for the project" \
  --topics "api,docs,reference"

# 4. List notebooks to verify
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py list
```

### Daily Research Workflow

```bash
# 1. Check which notebook is active
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py list

# 2. Ask your question
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "How do I implement authentication?"

# 3. If needed, ask follow-up questions
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What about token refresh flow?"
```

### Multi-Notebook Workflow

```bash
# 1. List all notebooks
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py list

# 2. Search for specific notebook
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py search --query "react"

# 3. Activate the notebook you need
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py activate --id react-docs

# 4. Ask question (uses active notebook)
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "How do React hooks work?"

# 5. Or query a specific notebook directly
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "..." \
  --notebook-url "https://notebooklm.google.com/notebook/..."
```

## Advanced Patterns

### Smart Notebook Discovery

When adding a notebook without knowing its contents:

```bash
# Step 1: Query to discover content
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What is the content of this notebook? What topics are covered?" \
  --notebook-url "https://notebooklm.google.com/notebook/..."

# Step 2: Add with discovered metadata
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "https://notebooklm.google.com/notebook/..." \
  --name "Project X Docs" \
  --description "Technical documentation covering API, deployment, and troubleshooting" \
  --topics "api,deployment,troubleshooting"
```

### Comprehensive Research

For thorough research on a topic:

```bash
# Start with broad question
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Give me a comprehensive overview of authentication patterns"

# Follow up with specifics
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Focus on JWT token implementation"

# Get edge cases
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What are common security pitfalls with JWT?"

# Ask about error handling
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "How should token refresh failures be handled?"
```

### Comparative Analysis

Compare information across notebooks:

```bash
# Query first notebook
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What is the recommended deployment strategy?" \
  --notebook-id vps-docs

# Query second notebook
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What is the recommended deployment strategy?" \
  --notebook-id docker-docs

# Synthesize findings manually based on both answers
```

## Notebook Organization

### Topic-Based Organization

```bash
# API documentation
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "..." --name "API Reference" \
  --description "Complete API documentation" \
  --topics "api,rest,endpoints" \
  --tags "reference,backend"

# Frontend documentation
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "..." --name "Frontend Guide" \
  --description "React and UI components" \
  --topics "react,components,ui" \
  --tags "frontend,web"

# DevOps documentation
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "..." --name "Infrastructure" \
  --description "Deployment and infrastructure" \
  --topics "docker,deployment,ci-cd" \
  --tags "devops,infrastructure"
```

### Project-Based Organization

```bash
# Main project documentation
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "..." --name "Main Project" \
  --description "Core project documentation" \
  --topics "architecture,features,roadmap"

# Search when needed
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py search --query "authentication"
```

## Maintenance Patterns

### Regular Cleanup

```bash
# Preview cleanup (what would be deleted)
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py

# Full cleanup (keep library)
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm --preserve-library

# Full cleanup (including library - fresh start)
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm
```

### Periodic Authentication Refresh

```bash
# Check auth status
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py status

# Re-authenticate if needed
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py reauth
```

### Library Auditing

```bash
# View statistics
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py stats

# List all notebooks
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py list

# Remove unused notebooks
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py remove --id unused-notebook
```

## Error Recovery

### Authentication Issues

```bash
# Clear and re-authenticate
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py clear
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py setup
```

### Browser Issues

```bash
# Clean browser state (preserves library and auth)
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm --preserve-library

# If still issues, full reset
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py setup
```

### Library Corruption

```bash
# Backup corrupted library
cd .opencode/skills/notebooklm/data
mv library.json library_backup_$(date +%Y%m%d).json

# Add notebooks again using list of URLs you should maintain
```

## Integration with OpenCode Workflow

### Before Writing Code

```bash
# Research relevant documentation
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What are the best practices for error handling in this API?"

# Get implementation details
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Show me examples of proper validation logic"
```

### During Code Review

```bash
# Check security considerations
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What security measures are documented for this endpoint?"

# Verify compliance
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Are there any compliance requirements documented?"
```

### For Documentation

```bash
# Get accurate technical details
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Summarize the authentication flow for the docs"

# Get usage examples
python .opencode/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What are the most common usage patterns?"
```

## Tips and Tricks

### Faster Questions

- Use `--notebook-id` instead of `--notebook-url` to avoid URL parsing
- Set a default notebook with `activate` so you don't need to specify it each time

### Better Answers

- Ask specific questions rather than broad ones
- Use follow-up questions to get complete information
- Include context about what you're trying to achieve

### Organization

- Use descriptive notebook names (easy to identify)
- Add comprehensive topics and descriptions
- Regularly review and clean up unused notebooks

### Debugging

- Use `--show-browser` to see what's happening visually
- Check `auth_manager.py status` before asking questions
- Verify notebook URL is correct and notebook is shared publicly
