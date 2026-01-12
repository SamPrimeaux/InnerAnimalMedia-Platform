-- Seed: Modern Tech Foundations for Builders
-- Complete course with modules, lessons, and quizzes
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-modern-tech-foundations.sql --remote

-- ============================================
-- 1. CREATE ORG (if doesn't exist)
-- ============================================

INSERT OR IGNORE INTO orgs (
  id, name, slug, plan_type, is_active, created_at, updated_at
) VALUES (
  'org-meauxtech',
  'MeauxTech',
  'meauxtech',
  'pro',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 2. CREATE INSTRUCTOR USER (if doesn't exist)
-- ============================================

INSERT OR IGNORE INTO course_users (
  id, email, name, is_active, created_at, updated_at
) VALUES (
  'user-instructor-001',
  'instructor@meauxtech.com',
  'MeauxTech Instructor',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR IGNORE INTO org_users (
  id, org_id, user_id, role, joined_at, created_at, updated_at
) VALUES (
  'org_user_001',
  'org-meauxtech',
  'user-instructor-001',
  'admin',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 3. CREATE COURSE: Modern Tech Foundations
-- ============================================

INSERT OR REPLACE INTO courses (
  id, org_id, title, slug, description, long_description,
  category, level, duration_hours, price_cents, is_public,
  is_featured, status, instructor_id, created_at, updated_at, published_at
) VALUES (
  'course-modern-tech-foundations',
  'org-meauxtech',
  'Modern Tech Foundations for Builders',
  'modern-tech-foundations',
  'Master CLI, Git, IDEs, APIs, Cloud, CI/CD, and AI workflows. Build real skills with hands-on projects.',
  'A comprehensive course designed to give you the foundational skills needed to build modern applications. Learn the tools and workflows that professional developers use every day. From command-line basics to deploying production applications, this course covers everything you need to start building with confidence.',
  'foundations',
  'beginner',
  40,
  0,
  1,
  1,
  'published',
  'user-instructor-001',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 4. MODULE 1: CLI & Git
-- ============================================

INSERT OR REPLACE INTO course_modules (
  id, course_id, title, description, order_index, is_required, estimated_minutes, created_at, updated_at
) VALUES (
  'module-cli-git',
  'course-modern-tech-foundations',
  'CLI & Git',
  'Master the command line and version control. Learn to navigate, create files, run scripts, and manage code changes with Git.',
  1,
  1,
  120,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 1.1: What is a CLI?
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-cli-intro',
  'module-cli-git',
  'course-modern-tech-foundations',
  'What is a CLI?',
  'what-is-cli',
  'Learn what a Command Line Interface is and why developers use it.',
  'text',
  '# What is a CLI?

CLI = Command Line Interface

It is a text-based way to talk to your computer (or a server) by typing commands instead of clicking buttons.

## Why Use CLI?

- Faster: Execute complex operations in seconds
- Automated: Script repetitive tasks
- Professional: How most dev workflows work
- Powerful: Access to system-level tools

## Common CLIs You Will See

- git - Version control
- wrangler - Cloudflare deployment
- node, npm, pnpm - JavaScript tooling
- psql - Postgres database
- sqlite3 - SQLite database

## Example Uses

- Create files and folders
- Run scripts and migrations
- Deploy applications
- View logs and debug
- Manage databases

## Next Steps

In the next lesson, we will learn basic CLI commands and start using the terminal.',
  1,
  15,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 1.2: CLI Basics
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-cli-basics',
  'module-cli-git',
  'course-modern-tech-foundations',
  'CLI Basics: Folders, Files, Commands',
  'cli-basics',
  'Learn essential CLI commands for navigating and managing files.',
  'text',
  '# CLI Basics: Essential Commands

## Navigation

```bash

# See where you are
pwd

# List files and folders
ls
ls -la  # Detailed list

# Change directory
cd folder-name
cd ..   # Go up one level
cd ~    # Go to home directory
```

## File Operations

```bash

# Create a file
touch filename.txt

# Create a folder
mkdir folder-name

# Copy a file
cp source.txt destination.txt

# Move/rename a file
mv old-name.txt new-name.txt

# Delete a file
rm filename.txt

# Delete a folder (careful!)
rm -rf folder-name
```

## Viewing Files

```bash

# View file contents
cat filename.txt

# View with pagination
less filename.txt
# Press q to quit

# View first 10 lines
head filename.txt

# View last 10 lines
tail filename.txt
```

## Practice Exercise

1. Create a folder called `my-project`
2. Navigate into it
3. Create a file called `README.md`
4. View the file contents',
  2,
  20,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 1.3: Git Basics
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-git-basics',
  'module-cli-git',
  'course-modern-tech-foundations',
  'Git Basics: Version Control',
  'git-basics',
  'Learn Git fundamentals: commit, branch, push, and pull requests.',
  'text',
  '# Git Basics: Version Control

## What is Git?

Git is a **version control system** that tracks changes to your code over time.

## Why Git Matters

- **History**: See what changed and when
- **Collaboration**: Multiple people can work on the same code
- **Safety**: Revert to previous versions if something breaks
- **Branching**: Work on features without breaking main code

## Essential Git Commands

```bash

# Initialize a repository
git init

# Check status
git status

# Stage changes
git add filename.txt
git add .  # Stage all changes

# Commit changes
git commit -m "Add new feature"

# View history
git log

# Create a branch
git branch feature-name

# Switch branches
git checkout feature-name

# Push to remote (GitHub)
git push origin main

# Pull latest changes
git pull origin main
```

## Workflow Example

```bash

# 1. Make changes to files
# 2. Check what changed
git status

# 3. Stage changes
git add .

# 4. Commit
git commit -m "Fix bug in login"

# 5. Push to GitHub
git push origin main
```',
  3,
  25,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Quiz for Module 1
INSERT OR REPLACE INTO quizzes (
  id, lesson_id, course_id, title, description, passing_score, time_limit_minutes, max_attempts, is_required, order_index, created_at, updated_at
) VALUES (
  'quiz-cli-git',
  NULL,
  'course-modern-tech-foundations',
  'CLI & Git Knowledge Check',
  'Test your understanding of CLI commands and Git basics.',
  70,
  15,
  3,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Quiz Questions
INSERT OR REPLACE INTO quiz_questions (
  id, quiz_id, question_text, question_type, options, correct_answer, explanation, points, order_index, created_at, updated_at
) VALUES 
  ('q1', 'quiz-cli-git', 'What does CLI stand for?', 'multiple_choice', json_array('Command Line Interface', 'Computer Language Interface', 'Code Line Interface', 'Control Line Interface'), 'Command Line Interface', 'CLI stands for Command Line Interface - a text-based way to interact with your computer.', 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('q2', 'quiz-cli-git', 'Which command creates a new folder?', 'multiple_choice', json_array('mkdir', 'mkfile', 'newdir', 'create'), 'mkdir', 'The mkdir command creates a new directory (folder).', 1, 2, strftime('%s', 'now'), strftime('%s', 'now')),
  ('q3', 'quiz-cli-git', 'What does git commit do?', 'multiple_choice', json_array('Saves changes to GitHub', 'Stages files for commit', 'Records changes to the repository', 'Creates a new branch'), 'Records changes to the repository', 'git commit records your staged changes to the local repository with a message describing what changed.', 1, 3, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================
-- 5. MODULE 2: IDE & Debugging
-- ============================================

INSERT OR REPLACE INTO course_modules (
  id, course_id, title, description, order_index, is_required, estimated_minutes, created_at, updated_at
) VALUES (
  'module-ide-debugging',
  'course-modern-tech-foundations',
  'IDE & Debugging',
  'Set up your development environment. Learn to use VS Code/Cursor effectively and debug like a pro.',
  2,
  1,
  90,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 2.1: What is an IDE?
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-ide-intro',
  'module-ide-debugging',
  'course-modern-tech-foundations',
  'What is an IDE?',
  'what-is-ide',
  'Learn what an Integrated Development Environment is and why it matters.',
  'text',
  '# What is an IDE?

IDE = Integrated Development Environment

It is your workshop for building software: editor + debugger + terminal + extensions + project tools all in one.

## Why IDEs Matter

- **Autocomplete**: Suggests code as you type
- **Linting**: Catches errors before you run code
- **Debugging**: Step through code to find bugs
- **Extensions**: Add superpowers (AI, themes, tools)
- **Integration**: Git, terminal, and tools in one place

## Popular IDEs

- **VS Code** - Most common, free, extensible
- **Cursor** - VS Code + AI workflow superpowers
- **WebStorm** - JetBrains IDE for web development
- **Sublime Text** - Fast, lightweight editor

## What Makes a Good IDE Setup?

1. **Syntax highlighting** - Code is color-coded
2. **Auto-formatting** - Code stays consistent
3. **IntelliSense** - Smart code completion
4. **Integrated terminal** - Run commands without leaving
5. **Git integration** - See changes, commit, push
6. **Extensions** - Customize for your workflow',
  1,
  15,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 2.2: VS Code/Cursor Setup
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-ide-setup',
  'module-ide-debugging',
  'course-modern-tech-foundations',
  'IDE Setup: Extensions & Configuration',
  'ide-setup',
  'Configure your IDE with essential extensions and settings.',
  'text',
  '# IDE Setup: Essential Extensions

## Must-Have Extensions

### For VS Code/Cursor

1. **Prettier** - Code formatter
2. **ESLint** - JavaScript linter
3. **GitLens** - Enhanced Git features
4. **Thunder Client** - API testing
5. **Error Lens** - Inline error highlighting

### For AI-Powered Workflows (Cursor)

- Built-in AI chat
- Code generation
- Context-aware suggestions

## Configuration

### settings.json

```json

{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "terminal.integrated.defaultProfile.osx": "zsh"
}
```

## Keyboard Shortcuts

- `Cmd/Ctrl + P` - Quick file open
- `Cmd/Ctrl + Shift + P` - Command palette
- `Cmd/Ctrl + B` - Toggle sidebar
- `Cmd/Ctrl + \` - Split editor
- `F5` - Start debugging',
  2,
  20,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 6. MODULE 3: APIs & Web Basics
-- ============================================

INSERT OR REPLACE INTO course_modules (
  id, course_id, title, description, order_index, is_required, estimated_minutes, created_at, updated_at
) VALUES (
  'module-apis-web',
  'course-modern-tech-foundations',
  'APIs & Web Basics',
  'Understand how APIs work. Learn REST, JSON, endpoints, and how to build and consume APIs.',
  3,
  1,
  120,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 3.1: What is an API?
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-api-intro',
  'module-apis-web',
  'course-modern-tech-foundations',
  'What is an API?',
  'what-is-api',
  'Learn what APIs are and how they enable software to communicate.',
  'text',
  '# What is an API?

API = Application Programming Interface

It is a structured way for software to talk to software.

## How APIs Work

Your app exposes API endpoints like:

- `GET /courses` - Get list of courses
- `POST /enroll` - Enroll in a course
- `PATCH /progress` - Update progress
- `DELETE /enrollment/:id` - Cancel enrollment

Other systems (or your frontend) call those endpoints.

## Why APIs Matter

APIs let you connect everything:

- Website ↔ Database
- Frontend ↔ Backend
- Your app ↔ Payment systems
- Your app ↔ Email services
- Your app ↔ AI services
- Your app ↔ Analytics

## REST API Basics

- **GET** - Read data
- **POST** - Create new data
- **PATCH/PUT** - Update data
- **DELETE** - Remove data

## Example Request

```javascript

// GET request
fetch('https://api.example.com/courses')
  .then(res => res.json())
  .then(data => console.log(data));

// POST request
fetch('https://api.example.com/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ courseId: '123' })
});
```',
  1,
  20,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 7. MODULE 4: Cloud (Cloudflare + GCP)
-- ============================================

INSERT OR REPLACE INTO course_modules (
  id, course_id, title, description, order_index, is_required, estimated_minutes, created_at, updated_at
) VALUES (
  'module-cloud',
  'course-modern-tech-foundations',
  'Cloud Platforms: Cloudflare + GCP',
  'Understand cloud platforms. Learn when to use Cloudflare vs GCP and how they work together.',
  4,
  1,
  90,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 4.1: What is GCP?
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-gcp-intro',
  'module-cloud',
  'course-modern-tech-foundations',
  'What is Google Cloud Platform (GCP)?',
  'what-is-gcp',
  'Learn about GCP and when to use it vs Cloudflare.',
  'text',
  '# What is Google Cloud Platform (GCP)?

GCP = Google cloud services (like Cloudflare, AWS, Azure).

## GCP Provides

- **Storage** - Cloud Storage (like R2)
- **Databases** - Cloud SQL, Firestore
- **Compute** - Cloud Run, Compute Engine
- **Identity/Auth** - Authentication services
- **Networking** - VPCs, load balancers
- **ML/AI** - Vertex AI, BigQuery

## When to Use GCP vs Cloudflare

### Use Cloudflare For:
- Edge apps (global performance)
- Static sites + Workers APIs
- Global caching (CDN)
- R2/D1/KV storage
- Fast, low-latency responses

### Use GCP For:
- Big data processing
- Heavy compute workloads
- Enterprise services
- ML/AI pipelines
- Google ecosystem integration

## You Can Use Both!

- **Cloudflare** at the edge (fast, global)
- **GCP** for heavy backend tasks (compute, ML)

Example: Cloudflare Workers handle API requests → GCP processes data → Results cached in Cloudflare',
  1,
  20,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 8. MODULE 5: CI/CD
-- ============================================

INSERT OR REPLACE INTO course_modules (
  id, course_id, title, description, order_index, is_required, estimated_minutes, created_at, updated_at
) VALUES (
  'module-cicd',
  'course-modern-tech-foundations',
  'CI/CD & Shipping Reliably',
  'Learn Continuous Integration and Deployment. Automate testing and deployments.',
  5,
  1,
  90,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 5.1: What is CI/CD?
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-cicd-intro',
  'module-cicd',
  'course-modern-tech-foundations',
  'What is CI/CD?',
  'what-is-cicd',
  'Learn Continuous Integration and Continuous Deployment.',
  'text',
  '# What is CI/CD?

## CI = Continuous Integration

Automatically runs checks/tests **every time code changes** (like when you push to GitHub).

## CD = Continuous Delivery/Deployment

Automatically **ships those changes to production** (or staging) after checks pass.

## Why CI/CD Matters

- **Prevents broken deploys** - Tests catch issues before production
- **Keeps quality high** - Automated checks ensure standards
- **Makes shipping predictable** - Deploy with confidence
- **Saves time** - No manual deployment steps

## Example Workflow

```
1. Push code to GitHub
   ↓
2. CI runs automatically:
   - Run tests
   - Check code style
   - Type checking
   ↓
3. If all checks pass:
   - CD deploys to Cloudflare Pages/Workers
   ↓
4. Your app is live!
```

## Common CI/CD Tools

- **GitHub Actions** - Built into GitHub
- **Cloudflare Pages** - Automatic deployments
- **Vercel** - Zero-config deployments
- **CircleCI, Travis CI** - External CI services',
  1,
  20,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 9. MODULE 6: AI Workflows
-- ============================================

INSERT OR REPLACE INTO course_modules (
  id, course_id, title, description, order_index, is_required, estimated_minutes, created_at, updated_at
) VALUES (
  'module-ai-workflows',
  'course-modern-tech-foundations',
  'AI Workflows: Use Tools Without Chaos',
  'Learn to effectively use AI tools in your development workflow without losing control.',
  6,
  1,
  90,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Lesson 6.1: AI in Development
INSERT OR REPLACE INTO lessons (
  id, module_id, course_id, title, slug, description, content_type, content_text,
  order_index, estimated_minutes, is_required, is_published, published_at, created_at, updated_at
) VALUES (
  'lesson-ai-workflows',
  'module-ai-workflows',
  'course-modern-tech-foundations',
  'AI Workflows: Best Practices',
  'ai-workflows',
  'Learn how to use AI tools effectively in your development process.',
  'text',
  '# AI Workflows: Use Tools Without Chaos

## The 4-Layer Stack Mindset

### Layer A: Build Layer (IDE + CLI)
- Cursor/VS Code - Write code + prompt AI in context
- CLI - Run, test, deploy, migrate DB

### Layer B: Source + Quality (Git + CI/CD)
- GitHub - Code history + collaboration
- CI - Automated checks (tests, lint, type-check)
- CD - Auto-deploy to Cloudflare

### Layer C: Data + Business (D1/R2 + Auth)
- D1 - Structured data (courses, lessons, enrollments)
- R2 - Files (videos, PDFs, thumbnails)
- Auth - Users, roles, orgs

### Layer D: Intelligence (AI Tools)
- Content generation - Lesson drafts, quizzes
- Tutoring - Chat-based course assistant
- Automation - Tagging, QA checks
- Personalization - Recommend next lesson

## The Golden Rule

AI can draft and assist - your platform database is the source of truth.

Always:
1. Review AI-generated content
2. Store in your database
3. Version control everything
4. Test before deploying',
  1,
  20,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- ============================================
-- 10. FINAL QUIZ
-- ============================================

INSERT OR REPLACE INTO quizzes (
  id, lesson_id, course_id, title, description, passing_score, time_limit_minutes, max_attempts, is_required, order_index, created_at, updated_at
) VALUES (
  'quiz-final',
  NULL,
  'course-modern-tech-foundations',
  'Final Assessment: Modern Tech Foundations',
  'Comprehensive quiz covering all modules.',
  75,
  30,
  2,
  1,
  2,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR REPLACE INTO quiz_questions (
  id, quiz_id, question_text, question_type, options, correct_answer, explanation, points, order_index, created_at, updated_at
) VALUES 
  ('qf1', 'quiz-final', 'What is the primary purpose of CI/CD?', 'multiple_choice', json_array('Manual deployment', 'Automated testing and deployment', 'Code storage', 'Version control'), 'Automated testing and deployment', 'CI/CD automates the process of testing code and deploying it to production, ensuring quality and reliability.', 2, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('qf2', 'quiz-final', 'Which cloud platform is best for edge applications?', 'multiple_choice', json_array('GCP', 'Cloudflare', 'AWS', 'Azure'), 'Cloudflare', 'Cloudflare excels at edge computing with global CDN, Workers, and low-latency responses.', 2, 2, strftime('%s', 'now'), strftime('%s', 'now'));
