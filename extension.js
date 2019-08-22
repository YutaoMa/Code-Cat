const vscode = require('vscode');
const axios = require('axios');

let enabled = false;
let panel = null;
let mode = "Count";
let documentChangeListenerDisposer = null;
let count = 0;
let countThreshold = 200;
let timeThreshold = 30;
let timer = null;

function activate() {
	vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration);
	onDidChangeConfiguration();
}

function deactivate() {
	count = 0;

	if (panel) {
		panel.dispose();
	}

	if (documentChangeListenerDisposer) {
		documentChangeListenerDisposer.dispose();
		documentChangeListenerDisposer = null;
	}

	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}

function onDidChangeConfiguration() {
	const config = vscode.workspace.getConfiguration('codecat');
	enabled = config.get('enabled', false);
	mode = config.get('mode', "Count");
	countThreshold = config.get('countThreshold', 200);
	timeThreshold = config.get('timeThreshold', 30);

	if (enabled) {
		init();
	} else {
		deactivate();
	}
}

function init() {
	deactivate();
	count = 0;
	initPanel();
	if (mode === "Count") {
		documentChangeListenerDisposer = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
	} else if (mode === "Time") {
		timer = setInterval(() => {
			onTimer();
		}, timeThreshold * 60 * 1000);
	}
}

function initPanel() {
	panel = vscode.window.createWebviewPanel('codecat', 'Code? Cat!', vscode.ViewColumn.Beside, {});
	panel.onDidDispose(() => { panel = null; });
	panel.webview.html = `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Code? Cat!</title>
			</head>
			<body>
				<h1>Keep Coding!</h1>
			</body>
		</html>
	`
}

function updateWebview() {
	if (!panel) {
		initPanel();
	}
	panel.webview.html = `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Code? Cat!</title>
			</head>
			<body>
				<h1>Loading Cats...</h1>
			</body>
		</html>
	`;
	axios.get('https://api.thecatapi.com/v1/images/search', {
		headers: {'x-api-key': 'b327b964-1f11-4080-a32a-fe8c265237e9'}
	})
		.then((res) => {
			panel.webview.html = `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Code? Cat!</title>
				</head>
				<body>
					<img src="${res.data[0].url}" />
				</body>
			</html>
			`;
			panel.reveal();
		})
		.catch(console.log);
}

function onDidChangeTextDocument() {
	count++;
	if (count >= countThreshold) {
		count = 0;
		updateWebview();
	}
}

function onTimer() {
	updateWebview();
}

module.exports = {
	activate,
	deactivate
}
