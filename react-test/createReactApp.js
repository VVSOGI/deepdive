const https = require('https')
const path = require('path')
const chalk = require('chalk')
const commander = require('commander')
const envinfo = require('envinfo')
const packageJson = require('./package.json')
const semver = require('semver')
const validateProjectName = require('validate-npm-package-name')

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

    if (program.info) {
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
                console.log(projectName, program.verbose, program.scriptsVersion, program.template, useYarn, program.usePnp)
                createApp(projectName, program.verbose, program.scriptsVersion, program.template, useYarn, program.usePnp)
            }
        })
}

function checkForLatestVersion() {
    return new Promise((resolve, reject) => {
        https
            .get('https://registry.npmjs.org/-/package/create-react-app/dist-tags', (res) => {
                if (res.statusCode === 200) {
                    let body = ''
                    res.on('data', (data) => (body += data))
                    res.on('end', () => {
                        resolve(JSON.parse(body).latest)
                    })
                } else {
                    reject()
                }
            })
            .on('error', () => {
                reject()
            })
    })
}

function createApp(name, verbose, version, template, useYarn, usePnp) {
    const unsupportedNodeVersion = !semver.satisfies(
        // Coerce strings with metadata (i.e. `15.0.0-nightly`).
        semver.coerce(process.version),
        '>=14'
    )

    if (unsupportedNodeVersion) {
        console.log(
            chalk.yellow(
                `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
                    `Please update to Node 14 or higher for a better, fully supported experience.\n`
            )
        )
        // Fall back to latest supported react-scripts on Node 4
        version = 'react-scripts@0.9.x'
    }

    const root = path.resolve(name)
    const appName = path.basename(root)

    console.log(root, appName)
    checkAppName(appName)
    // fs.ensureDirSync(name)
    // if (!isSafeToCreateProjectIn(root, name)) {
    //     process.exit(1)
    // }
    // console.log()

    // console.log(`Creating a new React app in ${chalk.green(root)}.`)
    // console.log()

    // const packageJson = {
    //     name: appName,
    //     version: '0.1.0',
    //     private: true
    // }
    // fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 2) + os.EOL)

    // const originalDirectory = process.cwd()
    // process.chdir(root)
    // if (!useYarn && !checkThatNpmCanReadCwd()) {
    //     process.exit(1)
    // }

    // if (!useYarn) {
    //     const npmInfo = checkNpmVersion()
    //     if (!npmInfo.hasMinNpm) {
    //         if (npmInfo.npmVersion) {
    //             console.log(
    //                 chalk.yellow(
    //                     `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
    //                         `Please update to npm 6 or higher for a better, fully supported experience.\n`
    //                 )
    //             )
    //         }
    //         // Fall back to latest supported react-scripts for npm 3
    //         version = 'react-scripts@0.9.x'
    //     }
    // } else if (usePnp) {
    //     const yarnInfo = checkYarnVersion()
    //     if (yarnInfo.yarnVersion) {
    //         if (!yarnInfo.hasMinYarnPnp) {
    //             console.log(
    //                 chalk.yellow(
    //                     `You are using Yarn ${yarnInfo.yarnVersion} together with the --use-pnp flag, but Plug'n'Play is only supported starting from the 1.12 release.\n\n` +
    //                         `Please update to Yarn 1.12 or higher for a better, fully supported experience.\n`
    //                 )
    //             )
    //             // 1.11 had an issue with webpack-dev-middleware, so better not use PnP with it (never reached stable, but still)
    //             usePnp = false
    //         }
    //         if (!yarnInfo.hasMaxYarnPnp) {
    //             console.log(
    //                 chalk.yellow(
    //                     'The --use-pnp flag is no longer necessary with yarn 2 and will be deprecated and removed in a future release.\n'
    //                 )
    //             )
    //             // 2 supports PnP by default and breaks when trying to use the flag
    //             usePnp = false
    //         }
    //     }
    // }

    // run(root, appName, version, verbose, originalDirectory, template, useYarn, usePnp)
}

function checkAppName(appName) {
    const validationResult = validateProjectName(appName)
    if (!validationResult.validForNewPackages) {
        console.error(chalk.red(`Cannot create a project named ${chalk.green(`"${appName}"`)} because of npm naming restrictions:\n`))
        ;[...(validationResult.errors || []), ...(validationResult.warnings || [])].forEach((error) => {
            console.error(chalk.red(`  * ${error}`))
        })
        console.error(chalk.red('\nPlease choose a different project name.'))
        process.exit(1)
    }

    // TODO: there should be a single place that holds the dependencies
    const dependencies = ['react', 'react-dom', 'react-scripts'].sort()
    if (dependencies.includes(appName)) {
        console.error(
            chalk.red(
                `Cannot create a project named ${chalk.green(`"${appName}"`)} because a dependency with the same name exists.\n` +
                    `Due to the way npm works, the following names are not allowed:\n\n`
            ) +
                chalk.cyan(dependencies.map((depName) => `  ${depName}`).join('\n')) +
                chalk.red('\n\nPlease choose a different project name.')
        )
        process.exit(1)
    }
}

init()
