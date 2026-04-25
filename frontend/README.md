# Getting Started with Create React App

## Security and Reliability Requirements (2026)

Project-wide implementation and verification notes for the 2026 requirements are documented in:

- `docs/master-project-spec-2026-compliance.md`

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## AI H5P Feature

This project includes an AI-powered enrichment editor that reads subtitle transcripts (`.vtt` or `.srt`) and proposes timestamped H5P interactions.

### Setup

1. Install dependencies in all project scopes:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Add required environment variables in `backend/.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. Start the full stack from the repository root:

```bash
npm run dev
```

### Usage

1. Open a video edit page and navigate to the AI enrichment screen (`/videos/:id/ai-enrich`).
2. Upload a transcript file (`.vtt` or `.srt`).
3. Click **Run AI Analysis** to stream suggestions in real time.
4. Review suggestions in the right panel, then accept/reject/edit each one.
5. Click **Apply Changes** to inject accepted interactions into the video.
6. Re-run analysis after transcript edits to see a diff (`new`, `modified`, `unchanged`, `removed`).
