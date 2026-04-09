# NotebookLM Skill - API Reference

Detailed API documentation for all scripts in the NotebookLM skill.

## Authentication Manager (`auth_manager.py`)

### Class: `AuthManager`

Main class for managing Google authentication and browser state.

#### Methods

##### `__init__()`
Initialize the authentication manager. Creates necessary directories.

##### `is_authenticated() -> bool`
Check if valid authentication exists.

**Returns:** `True` if authenticated, `False` otherwise

##### `get_auth_info() -> Dict[str, Any]`
Get detailed authentication information.

**Returns:** Dictionary with:
- `authenticated`: bool
- `state_file`: str (path)
- `state_exists`: bool
- `state_age_hours`: float (if exists)
- `authenticated_at_iso`: str (if exists)

##### `setup_auth(headless: bool = False, timeout_minutes: int = 10) -> bool`
Perform interactive authentication setup.

**Parameters:**
- `headless`: Run browser in headless mode (False for login)
- `timeout_minutes`: Maximum time to wait for login

**Returns:** `True` if authentication successful

##### `clear_auth() -> bool`
Clear all authentication data.

**Returns:** `True` if cleared successfully

##### `re_auth(headless: bool = False, timeout_minutes: int = 10) -> bool`
Perform re-authentication (clear + setup).

**Parameters:**
- `headless`: Run browser in headless mode
- `timeout_minutes`: Login timeout in minutes

**Returns:** `True` if successful

##### `validate_auth() -> bool`
Validate that stored authentication works.

**Returns:** `True` if authentication is valid

---

## Notebook Library (`notebook_manager.py`)

### Class: `NotebookLibrary`

Manages a collection of NotebookLM notebooks with metadata.

#### Methods

##### `__init__()`
Initialize the notebook library. Loads existing library from disk.

##### `add_notebook(url: str, name: str, description: str, topics: List[str], ...) -> Dict[str, Any]`
Add a new notebook to the library.

**Parameters:**
- `url`: NotebookLM notebook URL
- `name`: Display name for the notebook
- `description`: What's in this notebook
- `topics`: List of topics covered
- `content_types`: Optional list of content types
- `use_cases`: Optional list of use cases
- `tags`: Optional list of additional tags

**Returns:** The created notebook object

**Raises:** `ValueError` if notebook ID already exists

##### `remove_notebook(notebook_id: str) -> bool`
Remove a notebook from the library.

**Parameters:**
- `notebook_id`: ID of notebook to remove

**Returns:** `True` if removed, `False` if not found

##### `update_notebook(notebook_id: str, **kwargs) -> Dict[str, Any]`
Update notebook metadata.

**Parameters:**
- `notebook_id`: ID of notebook to update
- `name`: Optional new name
- `description`: Optional new description
- `topics`: Optional new topics list
- etc.

**Returns:** Updated notebook object

**Raises:** `ValueError` if notebook not found

##### `get_notebook(notebook_id: str) -> Optional[Dict[str, Any]]`
Get a specific notebook by ID.

**Returns:** Notebook object or `None` if not found

##### `list_notebooks() -> List[Dict[str, Any]]`
List all notebooks in the library.

**Returns:** List of all notebook objects

##### `search_notebooks(query: str) -> List[Dict[str, Any]]`
Search notebooks by query.

**Parameters:**
- `query`: Search query (searches name, description, topics, tags)

**Returns:** List of matching notebooks

##### `select_notebook(notebook_id: str) -> Dict[str, Any]`
Set a notebook as active.

**Parameters:**
- `notebook_id`: ID of notebook to activate

**Returns:** The activated notebook

##### `get_active_notebook() -> Optional[Dict[str, Any]]`
Get the currently active notebook.

**Returns:** Active notebook object or `None`

##### `get_stats() -> Dict[str, Any]`
Get library statistics.

**Returns:** Dictionary with:
- `total_notebooks`: int
- `total_topics`: int
- `total_use_count`: int
- `active_notebook`: Notebook or None
- `most_used_notebook`: Notebook or None
- `library_path`: str

---

## Question Interface (`ask_question.py`)

### Function: `ask_notebooklm(question: str, notebook_url: str, headless: bool = True) -> Optional[str]`

Ask a question to NotebookLM.

**Parameters:**
- `question`: Question to ask
- `notebook_url`: NotebookLM notebook URL
- `headless`: Run browser in headless mode

**Returns:** Answer text from NotebookLM or `None` if failed

---

## Browser Utilities (`browser_utils.py`)

### Class: `BrowserFactory`

Factory for creating configured browser contexts.

#### Methods

##### `launch_persistent_context(playwright: Playwright, headless: bool = True, user_data_dir: str = ...) -> BrowserContext`

Launch a persistent browser context with anti-detection features.

**Parameters:**
- `playwright`: Playwright instance
- `headless`: Run in headless mode
- `user_data_dir`: Path to user data directory

**Returns:** Configured BrowserContext

### Class: `StealthUtils`

Human-like interaction utilities.

#### Methods

##### `random_delay(min_ms: int = 100, max_ms: int = 500)`
Add random delay.

##### `human_type(page: Page, selector: str, text: str, wpm_min: int = 320, wpm_max: int = 480)`
Type with human-like speed.

##### `realistic_click(page: Page, selector: str)`
Click with realistic movement.

---

## Configuration (`config.py`)

### Paths
- `SKILL_DIR`: Path to skill directory
- `DATA_DIR`: Path to data directory
- `BROWSER_STATE_DIR`: Path to browser state directory
- `STATE_FILE`: Path to state.json
- `AUTH_INFO_FILE`: Path to auth_info.json
- `LIBRARY_FILE`: Path to library.json

### Selectors
- `QUERY_INPUT_SELECTORS`: List of selectors for query input
- `RESPONSE_SELECTORS`: List of selectors for response

### Browser Configuration
- `BROWSER_ARGS`: Browser arguments for anti-detection
- `USER_AGENT`: User agent string

### Timeouts
- `LOGIN_TIMEOUT_MINUTES`: Login timeout (10)
- `QUERY_TIMEOUT_SECONDS`: Query timeout (120)
- `PAGE_LOAD_TIMEOUT`: Page load timeout (30000)

---

## Cleanup Manager (`cleanup_manager.py`)

### Class: `CleanupManager`

Manages cleanup of NotebookLM skill data.

#### Methods

##### `__init__()`
Initialize the cleanup manager.

##### `get_cleanup_paths(preserve_library: bool = False) -> Dict[str, Any]`
Get paths that would be cleaned up.

**Parameters:**
- `preserve_library`: Keep library.json if True

**Returns:** Dict with categories and total size

##### `perform_cleanup(preserve_library: bool = False, dry_run: bool = False) -> Dict[str, Any]`
Perform the actual cleanup.

**Parameters:**
- `preserve_library`: Keep library.json if True
- `dry_run`: Preview only, don't delete

**Returns:** Dict with cleanup results

##### `print_cleanup_preview(preserve_library: bool = False)`
Print a preview of what will be cleaned.

---

## Environment Setup (`setup_environment.py`)

### Class: `SkillEnvironment`

Manages skill-specific virtual environment.

#### Methods

##### `__init__()`
Initialize the environment manager.

##### `ensure_venv() -> bool`
Ensure virtual environment exists and is set up.

**Returns:** `True` if successful

##### `is_in_skill_venv() -> bool`
Check if we're already running in the skill's venv.

##### `get_python_executable() -> str`
Get the correct Python executable to use.

##### `run_script(script_name: str, args: list = None) -> int`
Run a script with the virtual environment.

**Parameters:**
- `script_name`: Name of script to run
- `args`: Optional list of arguments

**Returns:** Exit code
