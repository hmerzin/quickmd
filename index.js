const path = require('path');
const chalk = require('chalk');
const ip = require('ip');
const fileToRead = process.argv[2];
const folderName = process.argv[3];
const fileToWrite = path.basename(fileToRead) + '.html';
const fs = require('fs');
const quickmdPath = path.join('./', folderName);
var hljs = require('highlightjs');
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
const ghcssHead = `<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="ghmd.css">
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
  server.listen(3000, () => {
    console.log(
      chalk.green(
        `✅  Enjoy your HTML at: http://${ip.address()}:3000/${fileToWrite}`
      )
    );
  });
});

const cssReadStream = fs.createReadStream(path.join(__dirname, 'ghmd.css'));
const cssWriteStream = fs.createWriteStream(path.join(quickmdPath, 'ghmd.css'));
addProgress('Creating Stylesheet');
cssReadStream.pipe(cssWriteStream);

const handler = require('serve-handler');
const http = require('http');

const server = http.createServer((request, response) => {
  return handler(request, response, { public: quickmdPath });
});
