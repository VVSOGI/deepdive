const chalk = require('chalk')
const commander = require('commander')
const envinfo = require('envinfo')
const packageJson = require('./package.json')
const semver = require('semver')

const { checkForLatestVersion, createApp } = require('./utils')

let projectName

function isUsingYarn() {
    return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0
}

function init() {
    const program = new commander.Command(packageJson.name)
        .version(packageJson.version)
        .arguments('<project-directory>')
        .usage(`${chalk.green('<project-directory>')} [options]`)
        .action((name) => {
            projectName = name
        })
        .option('--verbose', 'print additional logs')
        .option('--info', 'print environment debug info')
        .option('--scripts-version <alternative-package>', 'use a non-standard version of react-scripts')
        .option('--template <path-to-template>', 'specify a template for the created project')
        .option('--use-pnp')
        .allowUnknownOption()
        .on('--help', () => {
            console.log(`    Only ${chalk.green('<project-directory>')} is required.`)
            console.log()
            console.log(`    A custom ${chalk.cyan('--scripts-version')} can be one of:`)
            console.log(`      - a specific npm version: ${chalk.green('0.8.2')}`)
            console.log(`      - a specific npm tag: ${chalk.green('@next')}`)
            console.log(`      - a custom fork published on npm: ${chalk.green('my-react-scripts')}`)
            console.log(`      - a local path relative to the current working directory: ${chalk.green('file:../my-react-scripts')}`)
            console.log(`      - a .tgz archive: ${chalk.green('https://mysite.com/my-react-scripts-0.8.2.tgz')}`)
            console.log(`      - a .tar.gz archive: ${chalk.green('https://mysite.com/my-react-scripts-0.8.2.tar.gz')}`)
            console.log(`    It is not needed unless you specifically want to use a fork.`)
            console.log()
            console.log(`    A custom ${chalk.cyan('--template')} can be one of:`)
            console.log(`      - a custom template published on npm: ${chalk.green('cra-template-typescript')}`)
            console.log(`      - a local path relative to the current working directory: ${chalk.green('file:../my-custom-template')}`)
            console.log(`      - a .tgz archive: ${chalk.green('https://mysite.com/my-custom-template-0.8.2.tgz')}`)
            console.log(`      - a .tar.gz archive: ${chalk.green('https://mysite.com/my-custom-template-0.8.2.tar.gz')}`)
            console.log()
            console.log(`    If you have any problems, do not hesitate to file an issue:`)
            console.log(`      ${chalk.cyan('https://github.com/facebook/create-react-app/issues/new')}`)
            console.log()
        })
        .parse(process.argv)

    if (program.opts().info) {
        console.log(chalk.bold('\nEnvironment Info:'))
        console.log(`\n  current version of ${packageJson.name}: ${packageJson.version}`)
        console.log(`  running from ${__dirname}`)
        return envinfo
            .run(
                {
                    System: ['OS', 'CPU'],
                    Binaries: ['Node', 'npm', 'Yarn'],
                    Browsers: ['Chrome', 'Edge', 'Internet Explorer', 'Firefox', 'Safari'],
                    npmPackages: ['react', 'react-dom', 'react-scripts'],
                    npmGlobalPackages: ['create-react-app']
                },
                {
                    duplicates: true,
                    showNotFound: true
                }
            )
            .then(console.log)
    }

    if (typeof projectName === 'undefined') {
        console.error('Please specify the project directory:')
        console.log(`  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`)
        console.log()
        console.log('For example:')
        console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`)
        console.log()
        console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`)
        process.exit(1)
    }

    checkForLatestVersion()
        .catch(() => {
            try {
                return execSync('npm view create-react-app version').toString().trim()
            } catch (e) {
                return null
            }
        })
        .then((latest) => {
            console.log(semver.lt(packageJson.version, '5.0.1'))

            if (latest && semver.lt('5.0.1', latest)) {
                console.error(
                    chalk.yellow(
                        `You are running \`create-react-app\` ${packageJson.version}, which is behind the latest release (${latest}).\n\n` +
                            'We recommend always using the latest version of create-react-app if possible.'
                    )
                )
                console.log(
                    'The latest instructions for creating a new app can be found here:\n' +
                        'https://create-react-app.dev/docs/getting-started/'
                )
            } else {
                const useYarn = isUsingYarn()
                const { verbose, template, scriptsVersion, usePnp } = program.opts()
                createApp(projectName, verbose, scriptsVersion, template, useYarn, usePnp)
            }
        })
}

init()
