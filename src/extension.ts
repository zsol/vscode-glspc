/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { type ChildProcess, spawn } from "child_process"
import type { ExtensionContext } from "vscode"
import { commands, window, workspace } from "vscode"
import type { LanguageClientOptions } from "vscode-languageclient/node"
import { LanguageClient } from "vscode-languageclient/node"

let client: LanguageClient | undefined
let server: ChildProcess | undefined
const SERVER_CONFIG_NAMESPACE = "glspc.server"

async function startServer() {
  const config = workspace.getConfiguration(SERVER_CONFIG_NAMESPACE)
  const serverCommand: string = config.get("command") ?? ""
  const outputChannel = window.createOutputChannel("Generic LSP Client")
  const languageId: string[] = config.get("languageId") ?? []

  if (!serverCommand) {
    outputChannel.appendLine(
      "No server command, not starting glspc. Configure this in the settings.",
    )
    return
  }

  const serverCommandArguments: string[] = config.get("commandArguments") ?? []
  const initializationOptions: object =
    config.get("initializationOptions") ?? {}
  const environmentVariables: Record<string, string> =
    config.get("environmentVariables") ?? {}

  const serverOptions = async () => {
    const env = { ...process.env }
    const cwd = workspace.workspaceFolders?.[0]?.uri.fsPath
    for (const [key, value] of Object.entries(environmentVariables)) {
      if (typeof value !== "string") continue
      env[key] = value.replace(
        /\$(\w+)/g,
        (_, varName: string) => env[varName] ?? "",
      )
    }
    outputChannel.appendLine(
      `starting glspc: ${serverCommand} ${serverCommandArguments.join(" ")}`,
    )
    outputChannel.appendLine(`in directory: ${cwd}`)
    server = spawn(serverCommand, serverCommandArguments, { env, cwd })

    server.on("error", error => {
      outputChannel.appendLine(`Failed to start server: ${error.message}`)
      void window.showErrorMessage(
        `Failed to start language server: ${error.name}. Details: ${error.message}`,
      )
    })

    server.on("exit", (code, signal) => {
      outputChannel.appendLine(
        `Server process exited with code ${code} and signal ${signal}`,
      )
    })

    server.on("spawn", () => {
      void window.setStatusBarMessage(
        `Started language server: ${serverCommand}`,
        5000,
      )
    })

    return await server
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: languageId,
    diagnosticCollectionName: "glspc",
    outputChannel,
    traceOutputChannel: outputChannel,
    initializationOptions,
  }

  client = new LanguageClient(
    "glspc",
    "Generic LSP Client",
    serverOptions,
    clientOptions,
  )

  await client.start()
  outputChannel.appendLine("started glspc.")
}

async function killServer(): Promise<void> {
  try {
    await client?.stop()
  } catch (error) {}
  server?.kill()
}

async function _restartServer() {
  await killServer()
  await startServer()
}

async function restartServer() {
  let serverCommand: string =
    workspace.getConfiguration(SERVER_CONFIG_NAMESPACE).get("command") ?? ""
  let restartFuture = _restartServer()
  window.setStatusBarMessage(
    `Restarting language server: ${serverCommand}`,
    restartFuture,
  )
  await restartFuture
}

export async function activate(context: ExtensionContext) {
  await startServer()
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async event => {
      if (event.affectsConfiguration(SERVER_CONFIG_NAMESPACE)) {
        await restartServer()
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand("glspc.restartServer", async () => {
      await restartServer()
    }),
  )
}

export async function deactivate() {
  return await killServer()
}
