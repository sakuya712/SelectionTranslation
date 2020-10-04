
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	//My language => Translation language
	let command1 = vscode.commands.registerCommand('selection-translation.fromMyToTranslation', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor == undefined){return undefined}
		const sourceLangString = vscode.workspace.getConfiguration("selection-translation").get("My language");
		const translationLang = vscode.workspace.getConfiguration("selection-translation").get("Translation language");
		let gasTranslation = new GasTranslation(editor, sourceLangString, translationLang)
	});
	//Translation language => My language
	let command2 = vscode.commands.registerCommand('selection-translation.fromTranslationToMy', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor == undefined){return undefined}
		const sourceLangString = vscode.workspace.getConfiguration("selection-translation").get("Translation language");
		const translationLang = vscode.workspace.getConfiguration("selection-translation").get("My language");
		let gasTranslation = new GasTranslation(editor, sourceLangString, translationLang)
	});
	context.subscriptions.push(command1);
	context.subscriptions.push(command2);
}

class GasTranslation{
	private editor: vscode.TextEditor;
	private selectRange: vscode.Range;
	private sourceLanguage: string;
	private translationLanguage: string;
	constructor(editor:vscode.TextEditor, sourceLang: unknown, translationLang: unknown) {
		this.editor = editor;
		this.selectRange = new vscode.Range(this.editor.selection.start, this.editor.selection.end);
		if (typeof sourceLang === 'string') {
			this.sourceLanguage = sourceLang;
		} else {
			this.sourceLanguage = "";
		}
		if (typeof translationLang === 'string') {
			this.translationLanguage = translationLang;
		} else {
			this.translationLanguage = "";
		}
		//Examine the current selected character
		const startSelectLine: number = this.selectRange.start.line;
		const EndSelectLine: number = this.selectRange.end.line;
		let selectString = "";
		let replaceRange: vscode.Range;
		if (startSelectLine == EndSelectLine) {
			// one line
			selectString = this.editor.document.lineAt(startSelectLine).text.slice(this.selectRange.start.character, this.selectRange.end.character);
			this.ReplaceTranslation(selectString, this.selectRange);
		} else {
			//multi lines
			selectString = editor.document.lineAt(startSelectLine).text.slice(this.selectRange.start.character);
			replaceRange = new vscode.Range(this.editor.selection.start, editor.document.lineAt(startSelectLine).range.end);
			this.ReplaceTranslation(selectString, replaceRange);
			for (let line = startSelectLine + 1; line < EndSelectLine; line++) {
				selectString = editor.document.lineAt(line).text;
				replaceRange = editor.document.lineAt(line).range;
				this.ReplaceTranslation(selectString, replaceRange);
			}
			selectString = editor.document.lineAt(EndSelectLine).text.slice(0, this.selectRange.end.character);
			replaceRange = new vscode.Range(editor.document.lineAt(EndSelectLine).range.start, this.editor.selection.end);
			this.ReplaceTranslation(selectString, replaceRange);
		}
	}
	ReplaceTranslation(SelectString: string, ReplaceRange : vscode.Range) {
		const myScriptUrl = vscode.workspace.getConfiguration("selection-translation").get("GAS setting");
		const url = `${myScriptUrl}?text=${SelectString}&source=${this.sourceLanguage}&target=${this.translationLanguage}`;
		const https = require('https');
		https.get(url, (res: any) => {
			//Get the redirect URL
			let reUrl = res.headers['location']
			https.get(reUrl, (res: any) => {
				res.on('data', (chunk: any) => {
					let outputText = `${chunk}`;
					this.editor.edit((textEditorEdit) => {
						textEditorEdit.replace(ReplaceRange, outputText);
					});
				});
			});
		});
	}
}