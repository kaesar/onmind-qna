# Questions aNd Answers (OnMind-QNA)

Interactive and simple web application that uses Markdown files as content database for quiz or trivia.

## Description

This application allows creating interactive quizzes from the `Quiz.md` file, automatically extracting questions and answers and presenting a random quiz to the user.

## Features

- Responsive web interface
- Automatic question extraction from Markdown
- Random question selection
- Configurable question file (`Quiz.md` by default)
- Configurable number of questions (10 by default)
- Detailed scoring and results
- Multiple answer support

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
   - Set the question file name (default: `Quiz.md`)
   - Select the desired number of questions (1-50)
2. **Start**: Click "Start Quiz"
3. **Answer**: Select an option for each question
4. **Navigate**: Use "Next Question" to advance
5. **Results**: Review your score and detailed answers
6. **Repeat**: Start a new quiz with different questions

## Testing and Development

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

### Development Tools

- **Performance Monitor**: Real-time performance monitoring
- **Responsive Tester**: Automated responsiveness testing
- **Error Handling**: Robust error handling and edge cases
- **Test Data**: Test files in `test-data/`

### Testing Structure
```
test-data/
├── test-questions.md       # Test questions
├── malformed-questions.md  # Edge cases and errors
test-runner.html           # Automated test suite
integration-test.html      # E2E integration tests
```

## Development

This project is implemented in vanilla **JavaScript** without external dependencies. It considers the following technologies and aspects:

- Semantic HTML5, CSS3 with responsive design
- JavaScript / ES6+ with native modules
- File API for local file reading
- Optimized regular expressions for parsing
- Complete automated test suite
- Monitoring and optimization way

### Architecture

- `app.js` - Main orchestrator and event handling
- `markdown-parser.js` - Question extraction and validation
- `quiz-engine.js` - Quiz logic and scoring
- `ui-controller.js` - Interface management and navigation
- `file-handler.js` - File loading and validation
- `performance-monitor.js` - Performance monitoring
- `responsive-tester.js` - Responsiveness testing

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

## Responsive Features

- **Mobile**: ≤ 768px - Touch-optimized interface
- **Tablet**: 769px - 1024px - Hybrid design
- **Desktop**: > 1024px - Complete experience

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

### Performance Issues
- Open `integration-test.html` for diagnostics
- Check browser console for warnings
- Consider reducing the number of questions for very large files
