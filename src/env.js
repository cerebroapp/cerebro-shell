const fs = require('fs')
const { memoize, shellCommand } = require('cerebro-tools')
const uniq = require('lodash.uniq')
const { spawn } = require('child_process')

/**
 * Regular expression for matching ANSI escape codes
 * @return {Regex}
 */
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

/**
 * Parse result of /bin/bash -ilc env; output to key => value object
 *
 * @param  {String} env
 * @return {Object}
 */
const parseEnv = (env) => (
  env.replace(ANSI_REGEX, '').split('\n').reduce((acc, line) => {
    const [key, ...parts] = line.split('=');
    return Object.assign(acc, {
      [key]: parts.join('=')
    });
  }, {})
)

const parseHistory = (str) => {
  const reBashHistory = /^: \d+:0;/;

  const history = str.trim().split('\n').map(x => {
    if (reBashHistory.test(x)) {
      return x.split(';').slice(1).join(';');
    }

    // ZSH just places one command on each line
    return x;
  }).reverse();
  return uniq(history)
}

/**
 * Get default user shell
 *
 * @return {Promise<String>}
 */
module.exports.defaultShell = () => (
  shellCommand('echo $SHELL').then(output => output.trim())
)

/**
 * Promise-wrapper for async reading of user env
 *
 * @param  {String} shell
 * @return {Promise<Object>}
 */
const getEnvPromise = (shell) => {
  return new Promise((resolve, reject) => {
    let output = ''
    const child = spawn(shell, ['-ilc', 'env'])
    child.stderr.on('data', reject);

    child.stdout.on('data', (data) => {
      output += data
    });

    child.on('close', (code) => {
      resolve(output)
    });
  })
}

/**
 * Get default user ENV.
 * process.env is not enough, so we are getting real env
 *
 * @return {Promise<Object>}
 */
module.exports.getEnv = shell => {
  if (process.platform === 'win32') {
    return Promise.resolve(process.env);
  }
  return getEnvPromise(shell)
    .then(parseEnv)
    .catch(err => {
      if (shell) {
        throw err;
      } else {
        return process.env;
      }
    });
}

module.exports.getHistory = shell => {
  const regex = /^\/bin\//;
  if (!shell.match(regex)) {
    // Unknown shell
    return Promise.resolve([]);
  }
  const filename = [
    `/Users/${process.env.USER}/`,
    '.',
    shell.replace(regex, ''),
    '_history'
  ].join('')


  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, content) => {
      err ? reject(err) : resolve(content)
    })
  }).then(parseHistory)
}
