# Generic [LSP](https://microsoft.github.io/language-server-protocol/) Client for VSCode

A VSCode extension providing barebones language services for any language that has a LSP server available.

## Marketplace Link

[Generic LSP Client](https://marketplace.visualstudio.com/items?itemName=zsol.vscode-glspc)

## Setup

Once the extension is installed, open the settings pane, search for `glspc` and configure:

- `glspc.server.command`: the executable to your lsp server. It should speak JSON-RPC over stdin/stdout.
- `glspc.server.commandArguments`: any arguments the executable needs.
- `glspc.server.languageId`: the server will be spawned for languages in this list only.

Other options to tweak:

- `glspc.server.environmentVariables`: a name -> value mapping of environment variables to be set when the language server process is spawned.
- `glspc.server.initializationOptions`: an arbitrary JSON object to be sent to the server along with the initialization LSP message.

## Troubleshooting

All output from the server process goes to the output tab called "Generic LSP Client".
You can toggle tracing of the LSP protocol messages in the "Extension Settings" page,
all of which gets logged in the above tab, too.

### "Failed to start server: spawn {command} ENOENT"

If there is a $PATH issue, you have a few options:

1. Run `code .` from a terminal in which the command is available in $PATH.
2. Set PATH in `glspc.server.environmentVariables` under "Extension Settings".

### Multiple LSP Servers

This extension is currently only able to register one language server. If necessary, you can to build multiple copies of this extension:

```sh
vi package.json  # change the "name", "displayName", and "description" fields
                 # also find/replace "Generic LSP Client"
npm install
npm run package
```

Then you can load it into VSCode under Extensions > ... > Install from VSIX...

## See Also

- [mattn/efm-langserver](https://github.com/mattn/efm-langserver) - Adapter for any command-line tool to LSP.
- [llllvvuu/efm-tool-definitions.yaml](https://github.com/llllvvuu/efm-tool-definitions.yaml) - Configuration presets for the above.

## Credits

- [llllvvuu/vscode-glspc](https://gitlab.com/llllvvuu/vscode-glspc) - where this is forked from
