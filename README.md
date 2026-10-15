# Questions aNd Answers (OnMind-QNA)

> Simple WebApp that uses Markdown files as content database for quiz or trivia.

**OnMind-QNA** is a Web Application that allows creating interactive quizzes from the `Quiz.md` file, automatically extracting questions and answers and presenting a random quiz to the user. So, you can practice topics or prepare simulation tests. In functional terms, you can get:

- Automatic question extraction from Markdown
- Random question selection
- Configurable question file (`Quiz.md` by default)
- Configurable number of questions (10 by default)
- Detailed scoring and results
- Multiple answer support

## Question File Format

A quiz is a Markdown file (e.g. `Quiz.md`). Each question follows this structure:

```markdown
## Pregunta 001

Question text here (statements may span several lines).

A. First option
B. Second option
C. Third option
D. Fourth option

<as-button message="B"></as-button>
```

- **Questions** start with `## Pregunta NNN` (or `## Question NNN`). The title may go on the same line: `## Pregunta 1. Question text?`.
- **Options** start with a capital letter followed by a dot (`A.` … `H.`), one per line, at least two per question. Bold is optional.
- **Answers** can be declared in 3 modalities (first match wins, evaluated in this order):

  1. `<as-button message="B">` — primary. Supports multiple answers (`message="AB"`) and extra doubt flags (`inquire="C"`). This tag is kept for compatibility with the [**OnMind-CUI**](https://github.com/kaesar/onmind-cui) library and the [**OnMind-PUB**](https://github.com/kaesar/onmind-pub) blog manager: the same file can be published as an article, and that article can also feed the quiz in **OnMind-QNA**.
  2. `<!-- R: B -->` — single-line HTML comment fallback. Invisible when the Markdown is rendered.
  3. `> R: B` — legacy blockquote fallback.

  Multiple answers are written as `AB` or `A, C`.

- Questions with formatting errors (missing options, unknown answer, too-short content) are skipped at load and can be reviewed with the **Ver omitidas** button on the configuration screen.

## Project Structure

```
  ______
./ qna /
├── index.html              # Main page
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── app.js              # Main entry point
│   ├── markdown-parser.js  # Markdown parser
│   ├── quiz-engine.js      # Quiz engine
│   ├── ui-controller.js    # UI controller
│   └── file-handler.js     # File handler
├── Quiz.md                 # Data file
└── README.md               # This file
```

## How to Start the Service for OnMind-QNA

To avoid **CORS** issues when loading files, avoid opening the `index.html` file directly. It's recommended to use a local web server. Here are some alternatives to expose the web page as a local service...

### Python (if you have Python installed)

It's common for **macOS** systems to have **Python** installed (and some **Linux** distributions too).

```bash
python3 -m http.server 8000
```

> For **Python 2.7** version use: `python -m SimpleHTTPServer 8000`

### Bun (if you don't have Python installed)

A good alternative is to install **Bun** (from command line or terminal) and then a module that acts as a web server (based on **Javascript** environment).

```bash
# Install Bun
curl -fsSL https://bun.com/install | bash  # for macOS, Linux, and WSL
powershell -c "irm bun.sh/install.ps1|iex" # for Windows

# Install global server
bun install -g http-server

# Run server
bunx http-server -p 8000
```

### PHP (if you have PHP installed):

```bash
php -S localhost:8000
```

### Docker (Recommended for production)

The application is containerized using Docker for easy deployment. The container uses Nginx to serve the static files with optimized performance and security settings. To buid consider next sentences:

```bash
docker build -t onmind-qna:latest .
docker run -d -p 8080:80 --name onmind-qna onmind-qna:latest
```

> For **Linux**, it's possible check file priviledge with command: `chmod 775 Quiz.md`

To use a custom `Quiz.md` file without rebuilding the container, mount it as a volume:

```bash
docker run -d -p 8080:80 \
  -v $(pwd)/Quiz.md:/usr/share/nginx/html/Quiz.md:ro \
  --name onmind-qna \
  onmind-qna:latest
```

Or using a different quiz file:

```bash
docker run -d -p 8080:80 \
  -v $(pwd)/Trivia.md:/usr/share/nginx/html/Quiz.md:ro \
  --name onmind-qna \
  onmind-qna:latest
```

> **Note:** The container expects the file to be named `Quiz.md` at the path `/usr/share/nginx/html/Quiz.md`. The volume mount replaces the default file with your custom file. The `:ro` flag makes it read-only for security.

### Open OnMind-QNA web application

Just open a browser and use the address: `http://localhost:8080`

## Application Usage

1. **Configure**: 
   - Pick a quiz from the catalog dropdown (`quizzes.json`) or type a local path / URL (S3 included)
   - Each catalog entry may suggest a default question count via `"questions"` (applied to the count input, clamped to available)
   - Deep link with `?quiz=` (e.g. `index.html?quiz=Trivia-SAA.md` or `?quiz=https://bucket.s3.amazonaws.com/Quiz.md`)
   - Select the desired number of questions (1-50)
2. **Start**: Click "Start Quiz"
3. **Answer**: Select an option for each question
4. **Navigate**: Use "Next Question" to advance
5. **Results**: Review your score and detailed answers
6. **Repeat**: Start a new quiz with different questions

## Development

This project is implemented in vanilla **JavaScript** without external dependencies. It considers the following technologies and aspects:

- Classic HTML5, CSS3 with responsive design
- JavaScript / ES6+ with native modules
- File API for local file reading
- Optimized regular expressions for parsing
- Complete automated test suite
- Monitoring and optimization way

### Code Structure

The main **javascript** files are the following:

- `app.js` - Main orchestrator and event handling
- `markdown-parser.js` - Question extraction and validation
- `quiz-engine.js` - Quiz logic and scoring
- `ui-controller.js` - Interface management and navigation
- `file-handler.js` - File loading and validation
- `performance-monitor.js` - Performance monitoring
- `responsive-tester.js` - Responsiveness testing

## Testing

### Running Tests

The project includes complete testing tools:

#### Main Test Suite
```bash
# Open test runner
open test-runner.html
# or navigate to http://localhost:8000/test-runner.html
```

#### Integration Tests
```bash
# Open complete integration tests
open integration-test.html
# or navigate to http://localhost:8000/integration-test.html
```

### Testing Structure

Test files are in `test-data/` and there is a test suite:

```
test-data/
├── test-questions.md       # Test questions
├── malformed-questions.md  # Edge cases and errors
test-runner.html            # Automated test suite
integration-test.html       # E2E integration tests
```

<!--
## Requirements

### Minimum
- Modern web browser with ES6+ support
- Markdown file with questions in root directory (`Quiz.md` by default)

### Recommended
- Local web server to avoid CORS restrictions
- Minimum resolution: 375px (mobile)
- JavaScript enabled

### Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
-->
## Troubleshooting

### Error: "Cannot load file"
- Use a local server instead of opening the file directly
- Verify that the specified question file exists in the root directory
- Check that the filename is correct in the configuration

### Error: "No questions found"
- Check the Markdown file format
- Make sure questions follow the expected format:
  ```markdown
  ## Question XXX
  
  Question content
  
  A. Option A
  B. Option B
  
  <as-button message="A"></as-button>
  ```
- Verify the correct filename is configured in the application

### Error: answer not identified / questions skipped ("Ver omitidas")
- Each question needs an answer marker in one of the 3 modalities: `<as-button message="B">`, `<!-- R: B -->`, or `> R: B`. Without any of them the question is skipped.
- Check that the answer letter exists among the options (e.g. `message="E"` with only A–D is skipped).
- For multiple answers use `AB` or `A, C` (no other separators).
- Click **Ver omitidas** on the configuration screen to see exactly which questions were skipped and why.

### Performance Issues
- Open `integration-test.html` for diagnostics
- Check browser console for warnings
- Consider reducing the number of questions for very large files
