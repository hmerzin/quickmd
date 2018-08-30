const argv = require('yargs').command('$0 <file>', 'run qmd', yargs => {
  yargs
    .positional('file', { type: 'string', description: 'file to transpile' })
    .option('watch', {
      alias: 'w',
      description: 'watch files',
      type: 'string'
    });
}).argv;

console.log(argv);
