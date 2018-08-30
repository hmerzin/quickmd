#! /usr/bin/env node
const path = require('path');
const chalk = require('chalk');
const ip = require('ip');
const rl = require('readline-sync');
const rimraf = require('rimraf');
const fs = require('fs');
var hljs = require('highlightjs');
const chokidar = require('chokidar');
const WebSocketServer = require('ws').Server;
let sockets = [];
const express = require('express');
const argv = require('yargs').command('$0 [file]', 'run qmd', yargs => {
  yargs
    .positional('file', { type: 'string', description: 'file to transpile' })
    .option('watch', {
      alias: 'w',
      description: 'watch files',
      type: 'string'
    });
}).argv;
const fileToRead = argv.file;
const fileToWrite = './index.html';
const quickmdPath = path.join('./', path.basename(fileToRead, '.md'));
var md = require('markdown-it')({
  highlight: function(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return '';
  }
});

var reloadCode = `var ws = new WebSocket('ws://localhost:8080');
ws.onclose = () => {
  location.reload();
};`;

const ghcssHead = `<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="stylesheet.css">
${argv.watch !== null ? `<script>${reloadCode}</script>` : ''}
<style>
  .markdown-body {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 980px;
    margin: 0 auto;
    padding: 45px;
  }

  @media (max-width: 767px) {
    .markdown-body {
      padding: 15px;
    }
  }
</style>
<article class="markdown-body">`;
const addProgress = progress => {
  console.log(chalk.blue(`✅  ${progress}`));
};

const handleFileReplacementAnswer = answer => {
  if (answer.toUpperCase() === 'N' || answer.toUpperCase() === 'NO') {
    process.exit();
  } else if (answer.toUpperCase() === 'Y' || answer.toUpperCase() === 'YES') {
    rimraf.sync(quickmdPath);
    addProgress('Folder Cleared');
  } else {
    handleInvalidFileReplacementAnswer();
  }
};

if (fs.existsSync(quickmdPath) && fs.lstatSync(quickmdPath).isDirectory()) {
  const ans = rl.question(
    chalk.blue(
      `❓ The directory ${quickmdPath} already exists,\n❓ Would you like to replace it? (Y/N) => `
    )
  );
  handleFileReplacementAnswer(ans);
}

const handleInvalidFileReplacementAnswer = () => {
  handleFileReplacementAnswer(
    rl.question(
      chalk.blue('❓ Please answer Y | Yes for Yes or N | No for No ')
    )
  );
};

const writeHTML = (() => {
  fs.mkdirSync(quickmdPath);
  const ws = fs.createWriteStream(path.join(quickmdPath, fileToWrite));
  addProgress('Writing CSS head');
  ws.write(ghcssHead);
  fs.readFile(path.join('./', fileToRead), 'utf8', (err, data) => {
    addProgress('Rendering Markdown');
    const rendered = md.render(data);
    addProgress('Writing Markdown');
    ws.write(rendered);
    ws.write('</article>');
    server.listen(8080, () => {
      console.log(
        chalk.green(
          `✅  Enjoy your HTML at: http://${ip.address()}:${app.get('port')}/`
        )
      );
    });
  });

  const cssReadStream = fs.createReadStream(path.join(__dirname, 'ghmd.css'));
  const cssWriteStream = fs.createWriteStream(
    path.join(quickmdPath, 'stylesheet.css')
  );
  addProgress('Creating Stylesheet');
  cssReadStream.pipe(cssWriteStream);
  // if (argv.watch !== null) {
  //   const reloadReadStream = fs.createReadStream(
  //     path.join(__dirname, 'reload.js')
  //   );
  //   const reloadWriteStream = fs.createWriteStream(
  //     path.join(quickmdPath, 'reload.js')
  //   );
  //   reloadReadStream.pipe(reloadWriteStream);
  //   addProgress('Adding Reload Client Script');
  // }
})();

const writeHtmlAndReload = () => {
  const ws = fs.createWriteStream(path.join(quickmdPath, fileToWrite));
  addProgress('Writing CSS head');
  ws.write(ghcssHead);
  fs.readFile(path.join('./', fileToRead), 'utf8', (err, data) => {
    addProgress('Rendering Markdown');
    const rendered = md.render(data);
    addProgress('Writing Markdown');
    ws.write(rendered);
    ws.write('</article>');
    addProgress('App Refreshed');
    reload();
  });
};
if (argv.watch !== null) {
  const fileWatcher = chokidar.watch(path.join('./', fileToRead));
  fileWatcher.on('change', () => {
    writeHtmlAndReload();
  });
}

const handler = require('serve-handler');
const http = require('http');

const app = express();
app.set('port', 8080);
const server = http.createServer(app);
app.use('/', express.static(quickmdPath));
const wss = new WebSocketServer({ server: server });

const reload = () => {
  wss.clients.forEach(client => {
    client.terminate();
  });
};
