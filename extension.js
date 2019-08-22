const vscode = require('vscode');
const axios = require('axios');

let enabled = false;
let count = 0;
let panel = null;
let documentChangeListenerDisposer = null;

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
}

function onDidChangeConfiguration() {
	const config = vscode.workspace.getConfiguration('codecat');
	const oldEnabled = enabled;
	enabled = config.get('enabled', false);

	if (!oldEnabled && enabled) {
		init();
		return;
	}

	if (oldEnabled && !enabled) {
		deactivate();
		return;
	}

	if (!enabled) {
		return;
	}
}

function init() {
	deactivate();
	count = 0;
	initPanel();
	documentChangeListenerDisposer = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
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

function onDidChangeTextDocument() {
	count++;
	if (count >= 100) {
		count = 0;
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
						<img src="${res.data[0].url}" width=${res.data[0].width} height=${res.data[0].height} />
					</body>
				</html>
				`;
				panel.reveal();
			})
			.catch(console.log);
	}
}

module.exports = {
	activate,
	deactivate
}
