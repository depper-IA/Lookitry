# NotebookLM Skill - Troubleshooting

Common issues and solutions for the NotebookLM skill.

## Installation Issues

### "Script not found" error

**Problem:** Running a script fails with "Script not found" error.

**Solution:** Always use the `run.py` wrapper:
```bash
# ✅ Correct
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py status

# ❌ Wrong
python .opencode/skills/notebooklm/scripts/auth_manager.py status
```

### Virtual environment creation fails

**Problem:** First run fails to create virtual environment.

**Solution:** Create manually:
```bash
cd .opencode/skills/notebooklm
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m patchright install chrome
```

---

## Authentication Issues

### "Not authenticated" error

**Problem:** `ask_question.py` returns "Not authenticated".

**Solution:**
```bash
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py setup
```

### Browser window doesn't open for login

**Problem:** Authentication setup doesn't open browser window.

**Solution:** Make sure `HEADLESS=false` or use `--show-browser`:
```bash
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py setup
```
The browser must be visible for manual Google login.

### Login times out

**Problem:** Authentication setup times out before login completes.

**Solution:** Increase timeout:
```bash
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py setup --timeout 15
```

### Authentication expires frequently

**Problem:** Need to re-authenticate often.

**Solution:** The browser state expires after 7 days. This is normal. Re-authenticate when needed:
```bash
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py reauth
```

---

## Browser Issues

### Browser crashes during question

**Problem:** Browser crashes when asking questions.

**Solution:**
```bash
# Clean up browser data but keep library
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm --preserve-library

# If that doesn't work, full cleanup
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm
```

### "Could not find query input" error

**Problem:** Script can't find NotebookLM's input field.

**Solution:**
1. Verify the notebook URL is correct
2. Check if NotebookLM interface has changed
3. Try with `--show-browser` to see what's happening:
   ```bash
   python .opencode/skills/notebooklm/scripts/run.py ask_question.py --question "test" --show-browser
   ```

### Questions return empty answer

**Problem:** Question returns but answer is empty or incomplete.

**Solution:**
1. Wait longer - complex questions take more time
2. Check if NotebookLM is still processing (shows thinking indicator)
3. Try with `--show-browser` to debug

---

## Library Issues

### "Notebook not found" error

**Problem:** Can't find notebook by ID.

**Solution:** List your notebooks first:
```bash
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py list
```

### Duplicate notebook ID

**Problem:** Can't add notebook - "ID already exists" error.

**Solution:** Use a different name or remove the existing notebook:
```bash
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py remove --id <notebook-id>
```

### Library data corrupted

**Problem:** Library file is corrupted or unreadable.

**Solution:**
```bash
# Backup and reset
cd .opencode/skills/notebooklm/data
mv library.json library.json.backup
# Then rebuild library by adding notebooks again
```

---

## Performance Issues

### Slow question response

**Problem:** Questions take very long to return.

**Possible causes:**
1. Large notebook with many documents
2. Network latency
3. NotebookLM rate limiting

**Solutions:**
- Wait and retry (rate limits reset daily)
- Try simpler, more focused questions
- Check NotebookLM directly at notebooklm.google.com

### High CPU/memory usage

**Problem:** Skill uses too many resources.

**Solution:** Close other browser tabs and applications while using the skill.

---

## Platform-Specific Issues

### Windows: "Scripts" directory not found

**Problem:** On some Windows systems, the venv path resolution fails.

**Solution:** Create venv explicitly:
```bash
cd .opencode/skills/notebooklm
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m patchright install chrome
```

### Windows: Chrome installation fails

**Problem:** Patchright can't install Chrome on Windows.

**Solution:**
1. Install Chrome manually from https://www.google.com/chrome/
2. Run: `python -m patchright install chrome`

---

## Rate Limiting

### "Rate limit exceeded" error

**Problem:** NotebookLM returns rate limit error.

**Solution:**
1. Wait 24 hours (daily limit resets)
2. Use a different Google account for authentication
3. Reduce number of questions

**Note:** Free tier typically allows ~50 queries per day.

---

## Getting Help

If you continue to have issues:

1. Check the main [README.md](../README.md)
2. Review [usage_patterns.md](./usage_patterns.md) for best practices
3. Open an issue at: https://github.com/PleasePrompto/notebooklm-skill/issues

---

## Recovery Commands

Quick recovery from common issues:

```bash
# Full reset (keeps library)
python .opencode/skills/notebooklm/scripts/run.py cleanup_manager.py --confirm --preserve-library
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py reauth

# Check status
python .opencode/skills/notebooklm/scripts/run.py auth_manager.py status
python .opencode/skills/notebooklm/scripts/run.py notebook_manager.py list

# Verify environment
python .opencode/skills/notebooklm/scripts/setup_environment.py --check
```
